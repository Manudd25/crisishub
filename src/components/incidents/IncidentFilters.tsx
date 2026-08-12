import { useCrisis } from '@/context/CrisisContext'
import { Button } from '@/components/ui/Button'
import type { IncidentStatus, IncidentType, Severity } from '@/types/incident'

const severities: Array<Severity | 'all'> = [
  'all',
  'critical',
  'high',
  'moderate',
  'low',
  'info',
]
const statuses: Array<IncidentStatus | 'all'> = [
  'all',
  'active',
  'monitoring',
  'contained',
  'resolved',
]
const categories: Array<IncidentType | 'all'> = [
  'all',
  'wildfire',
  'flood',
  'earthquake',
  'storm',
  'heatwave',
  'air_quality',
  'volcano',
  'weather_alert',
]

export function IncidentFilters() {
  const { filters, setFilters, resetFilters, countries, cities } = useCrisis()

  return (
    <section className="panel p-4" aria-labelledby="filters-heading">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="filters-heading" className="text-sm font-semibold text-white">
          Filters
        </h2>
        <Button variant="ghost" size="sm" onClick={resetFilters}>
          Reset
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <label className="block text-xs text-surface-400">
          Country
          <select
            className="mt-1 w-full rounded-lg border border-white/8 bg-surface-850 px-3 py-2 text-sm text-surface-100"
            value={filters.country}
            onChange={(e) =>
              setFilters({ country: e.target.value, city: 'all' })
            }
          >
            <option value="all">All countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs text-surface-400">
          City
          <select
            className="mt-1 w-full rounded-lg border border-white/8 bg-surface-850 px-3 py-2 text-sm text-surface-100"
            value={filters.city}
            onChange={(e) => setFilters({ city: e.target.value })}
          >
            <option value="all">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs text-surface-400">
          Severity
          <select
            className="mt-1 w-full rounded-lg border border-white/8 bg-surface-850 px-3 py-2 text-sm text-surface-100"
            value={filters.severity}
            onChange={(e) =>
              setFilters({ severity: e.target.value as Severity | 'all' })
            }
          >
            {severities.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All severities' : s}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs text-surface-400">
          Status
          <select
            className="mt-1 w-full rounded-lg border border-white/8 bg-surface-850 px-3 py-2 text-sm text-surface-100"
            value={filters.status}
            onChange={(e) =>
              setFilters({ status: e.target.value as IncidentStatus | 'all' })
            }
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All statuses' : s}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs text-surface-400">
          Category
          <select
            className="mt-1 w-full rounded-lg border border-white/8 bg-surface-850 px-3 py-2 text-sm text-surface-100"
            value={filters.category}
            onChange={(e) =>
              setFilters({ category: e.target.value as IncidentType | 'all' })
            }
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All categories' : c.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs text-surface-400">
            From
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-white/8 bg-surface-850 px-2 py-2 text-sm text-surface-100"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ dateFrom: e.target.value })}
            />
          </label>
          <label className="block text-xs text-surface-400">
            To
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-white/8 bg-surface-850 px-2 py-2 text-sm text-surface-100"
              value={filters.dateTo}
              onChange={(e) => setFilters({ dateTo: e.target.value })}
            />
          </label>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-surface-500">
        City / country focus updates weather and nearby facilities for that
        location.
      </p>
    </section>
  )
}
