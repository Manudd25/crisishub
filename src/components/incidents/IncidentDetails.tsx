import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink, X } from 'lucide-react'
import { useCrisis } from '@/context/CrisisContext'
import { ProvenanceBadge, SeverityBadge, StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { isDemoSource } from '@/lib/provenance'
import { typeEmoji, typeLabel } from '@/services/mapService'
import { formatCoords, formatDateTime } from '@/lib/format'

export function IncidentDetails() {
  const { selected, selectIncident, incidents } = useCrisis()

  const related = selected?.relatedEventIds
    ?.map((id) => incidents.find((i) => i.id === id))
    .filter(Boolean)

  return (
    <AnimatePresence>
      {selected && (
        <motion.aside
          key={selected.id}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          className="panel flex max-h-[420px] flex-col overflow-hidden"
          aria-label="Incident details"
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/6 p-4">
            <div>
              <p className="text-xs text-surface-400">
                {typeEmoji(selected.type)} {typeLabel(selected.type)} · {selected.id}
              </p>
              <h2 className="mt-1 text-base font-semibold text-white">
                {selected.title}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectIncident(null)}
              aria-label="Close details panel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <SeverityBadge severity={selected.severity} />
              <StatusBadge status={selected.status} />
              <ProvenanceBadge
                kind={isDemoSource(selected.source) ? 'demo' : 'live'}
              />
            </div>

            <dl className="grid grid-cols-1 gap-3">
              <Detail label="Location">
                {selected.city ? `${selected.city}, ` : ''}
                {selected.country}
              </Detail>
              <Detail label="Coordinates">
                <span className="font-mono">
                  {formatCoords(selected.latitude, selected.longitude)}
                </span>
              </Detail>
              <Detail label="Start time">{formatDateTime(selected.startTime)}</Detail>
              <Detail label="Last update">{formatDateTime(selected.timestamp)}</Detail>
              <Detail label="Source">{selected.source}</Detail>
              {selected.affectedArea && (
                <Detail label="Affected area">{selected.affectedArea}</Detail>
              )}
              {selected.magnitude != null && (
                <Detail label="Magnitude">M{selected.magnitude}</Detail>
              )}
              {selected.aqi != null && <Detail label="AQI">{selected.aqi}</Detail>}
            </dl>

            <section>
              <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-surface-500">
                Description
              </h3>
              <p className="leading-relaxed text-surface-300">{selected.description}</p>
            </section>

            {selected.weatherContext && (
              <section>
                <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-surface-500">
                  Weather context
                </h3>
                <p className="text-surface-300">{selected.weatherContext}</p>
              </section>
            )}

            {!!selected.externalSources?.length && (
              <section>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-surface-500">
                  External sources
                </h3>
                <ul className="space-y-1.5">
                  {selected.externalSources.map((src) => (
                    <li key={src.url}>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-accent hover:underline"
                      >
                        {src.label}
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {!!related?.length && (
              <section>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-surface-500">
                  Related events
                </h3>
                <ul className="space-y-2">
                  {related.map(
                    (r) =>
                      r && (
                        <li key={r.id}>
                          <button
                            type="button"
                            className="text-left text-surface-300 hover:text-white"
                            onClick={() => selectIncident(r.id)}
                          >
                            {typeEmoji(r.type)} {r.title}
                          </button>
                        </li>
                      ),
                  )}
                </ul>
              </section>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function Detail({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-surface-500">{label}</dt>
      <dd className="mt-0.5 text-surface-200">{children}</dd>
    </div>
  )
}
