import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe2 } from 'lucide-react'
import { useCrisis } from '@/context/CrisisContext'
import { IncidentFilters } from '@/components/incidents/IncidentFilters'
import { typeColor, typeLabel } from '@/services/mapService'
import type { Incident, IncidentType, Severity } from '@/types/incident'
import { SeverityBadge, StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatRelative } from '@/lib/format'

interface CountryRow {
  country: string
  total: number
  active: number
  criticalHigh: number
  byType: Partial<Record<IncidentType, number>>
  topSeverity: Severity
  latest: Incident | null
}

const severityRank: Record<Severity, number> = {
  critical: 5,
  high: 4,
  moderate: 3,
  low: 2,
  info: 1,
}

function buildRows(incidents: Incident[]): CountryRow[] {
  const map = new Map<string, Incident[]>()
  for (const inc of incidents) {
    const list = map.get(inc.country) ?? []
    list.push(inc)
    map.set(inc.country, list)
  }

  return [...map.entries()]
    .map(([country, list]) => {
      const byType: Partial<Record<IncidentType, number>> = {}
      let topSeverity: Severity = 'info'
      for (const inc of list) {
        byType[inc.type] = (byType[inc.type] ?? 0) + 1
        if (severityRank[inc.severity] > severityRank[topSeverity]) {
          topSeverity = inc.severity
        }
      }
      const sorted = [...list].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      return {
        country,
        total: list.length,
        active: list.filter(
          (i) => i.status === 'active' || i.status === 'monitoring',
        ).length,
        criticalHigh: list.filter(
          (i) => i.severity === 'critical' || i.severity === 'high',
        ).length,
        byType,
        topSeverity,
        latest: sorted[0] ?? null,
      }
    })
    .sort((a, b) => b.active - a.active || b.total - a.total)
}

export function RegionalOverviewPage() {
  const { filtered, setFilters, selectIncident, setMapFocus } = useCrisis()
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const navigate = useNavigate()

  const rows = useMemo(() => buildRows(filtered), [filtered])
  const maxActive = Math.max(1, ...rows.map((r) => r.active))

  const countryIncidents = useMemo(() => {
    if (!selectedCountry) return []
    return filtered
      .filter((i) => i.country === selectedCountry)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
  }, [filtered, selectedCountry])

  const focusCountry = (country: string) => {
    setSelectedCountry(country)
    setFilters({ country, city: 'all' })
  }

  const openOnMap = (incident: Incident) => {
    selectIncident(incident.id)
    setMapFocus({
      lat: incident.latitude,
      lon: incident.longitude,
      zoom: 7,
    })
    void navigate('/app')
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-white">
            <Globe2 className="h-5 w-5 text-accent" aria-hidden />
            Regional Overview
          </h1>
          <p className="text-sm text-surface-400">
            Compare active incident load by country — distinct from the map
            workspace
          </p>
        </div>
        <p className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-surface-300">
          {rows.length} countries in view
        </p>
      </div>

      <IncidentFilters />

      <div className="grid gap-4 lg:grid-cols-12">
        <section className="panel overflow-hidden lg:col-span-7" aria-label="Countries">
          <div className="border-b border-white/8 px-4 py-3">
            <h2 className="text-sm font-semibold text-white">Countries</h2>
            <p className="text-xs text-surface-500">
              Sorted by active / monitored incidents
            </p>
          </div>
          <ul className="divide-y divide-white/6">
            {rows.map((row) => {
              const active = selectedCountry === row.country
              const width = `${Math.max(8, (row.active / maxActive) * 100)}%`
              const typeEntries = Object.entries(row.byType).sort(
                (a, b) => (b[1] ?? 0) - (a[1] ?? 0),
              )
              return (
                <li key={row.country}>
                  <button
                    type="button"
                    onClick={() => focusCountry(row.country)}
                    className={`w-full px-4 py-3 text-left transition-colors ${
                      active
                        ? 'bg-accent/10'
                        : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {row.country}
                        </p>
                        <p className="mt-0.5 text-[11px] text-surface-500">
                          {row.active} active · {row.total} total
                          {row.criticalHigh > 0
                            ? ` · ${row.criticalHigh} high/critical`
                            : ''}
                        </p>
                      </div>
                      <SeverityBadge severity={row.topSeverity} />
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-800">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width }}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {typeEntries.slice(0, 5).map(([type, count]) => (
                        <span
                          key={type}
                          className="inline-flex items-center gap-1 rounded-md border border-white/8 bg-surface-850 px-1.5 py-0.5 text-[10px] text-surface-300"
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{
                              backgroundColor: typeColor(type as IncidentType),
                            }}
                          />
                          {typeLabel(type as IncidentType)} {count}
                        </span>
                      ))}
                    </div>
                  </button>
                </li>
              )
            })}
            {!rows.length && (
              <li className="px-4 py-8 text-center text-sm text-surface-500">
                No countries match the current filters.
              </li>
            )}
          </ul>
        </section>

        <section className="panel flex min-h-[420px] flex-col lg:col-span-5">
          <div className="border-b border-white/8 px-4 py-3">
            <h2 className="text-sm font-semibold text-white">
              {selectedCountry
                ? `Incidents in ${selectedCountry}`
                : 'Country detail'}
            </h2>
            <p className="text-xs text-surface-500">
              {selectedCountry
                ? 'Select an incident to open it on the Operation Center map'
                : 'Select a country to inspect its incident list'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {!selectedCountry && (
              <p className="px-1 py-6 text-sm text-surface-500">
                Choose a country on the left to review local incidents and jump
                to the map.
              </p>
            )}
            {selectedCountry && (
              <ul className="space-y-2">
                {countryIncidents.map((inc) => (
                  <li key={inc.id}>
                    <button
                      type="button"
                      onClick={() => openOnMap(inc)}
                      className="w-full rounded-xl border border-white/8 bg-surface-850/80 p-3 text-left transition-colors hover:border-accent/30 hover:bg-surface-800"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: typeColor(inc.type) }}
                          aria-hidden
                        />
                        <span className="text-xs text-surface-400">
                          {typeLabel(inc.type)}
                        </span>
                        <span className="text-[11px] text-surface-500">
                          {formatRelative(inc.timestamp)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-white">
                        {inc.title}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <SeverityBadge severity={inc.severity} />
                        <StatusBadge status={inc.status} />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedCountry && (
            <div className="border-t border-white/8 p-3">
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => {
                  setFilters({ country: 'all' })
                  setSelectedCountry(null)
                }}
              >
                Clear country focus
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
