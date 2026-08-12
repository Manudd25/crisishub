import { useCrisis } from '@/context/CrisisContext'
import { ProvenanceBadge, SeverityBadge, StatusBadge } from '@/components/ui/Badge'
import { FeedSkeleton } from '@/components/ui/Skeleton'
import { isDemoSource } from '@/lib/provenance'
import { typeEmoji, typeLabel } from '@/services/mapService'
import { formatRelative, formatTime } from '@/lib/format'

interface IncidentFeedProps {
  compact?: boolean
  limit?: number
}

export function IncidentFeed({ compact = false, limit }: IncidentFeedProps) {
  const { filtered, loading, selectedId, selectIncident, setMapFocus } = useCrisis()
  const items = limit ? filtered.slice(0, limit) : filtered

  if (loading && !filtered.length) return <FeedSkeleton />

  if (!items.length) {
    return (
      <div className="panel p-6 text-center text-sm text-surface-400">
        No incidents match the current filters.
      </div>
    )
  }

  return (
    <ul className="space-y-2" aria-label="Incident feed timeline">
      {items.map((incident) => {
        const active = selectedId === incident.id
        return (
          <li key={incident.id}>
            <button
              type="button"
              onClick={() => {
                selectIncident(incident.id)
                setMapFocus({
                  lat: incident.latitude,
                  lon: incident.longitude,
                  zoom: 7,
                })
              }}
              className={`w-full rounded-xl border p-3 text-left transition-colors ${
                active
                  ? 'border-accent/40 bg-accent/10'
                  : 'border-white/10 bg-surface-900 hover:border-white/16 hover:bg-surface-850'
              }`}
              aria-current={active ? 'true' : undefined}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg leading-none" aria-hidden>
                  {typeEmoji(incident.type)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-surface-300">
                      {typeLabel(incident.type)}
                    </span>
                    <span className="font-mono text-[11px] text-surface-500">
                      {formatTime(incident.timestamp)}
                    </span>
                    {!compact && (
                      <span className="text-[11px] text-surface-500">
                        {formatRelative(incident.timestamp)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm font-medium text-white">
                    {incident.title}
                  </p>
                  <p className="mt-0.5 text-xs text-surface-400">
                    {incident.city ? `${incident.city}, ` : ''}
                    {incident.country}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <SeverityBadge severity={incident.severity} />
                    <StatusBadge status={incident.status} />
                    <ProvenanceBadge
                      kind={isDemoSource(incident.source) ? 'demo' : 'live'}
                    />
                  </div>
                  <p className="mt-1.5 truncate text-[11px] text-surface-400">
                    {incident.source}
                  </p>
                </div>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
