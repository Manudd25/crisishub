import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { OverviewCards } from '@/components/dashboard/OverviewCards'
import { IncidentFeed } from '@/components/incidents/IncidentFeed'
import { IncidentFilters } from '@/components/incidents/IncidentFilters'
import { IncidentDetails } from '@/components/incidents/IncidentDetails'
import { WeatherPanel } from '@/components/weather/WeatherPanel'
import { ResourcePanel } from '@/components/resources/ResourcePanel'
import { AiSummaryPanel } from '@/components/ai/AiSummaryPanel'
import { ProvenanceBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useCrisis } from '@/context/CrisisContext'
import { formatRelative } from '@/lib/format'

const CrisisMap = lazy(() =>
  import('@/components/map/CrisisMap').then((m) => ({ default: m.CrisisMap })),
)

export function OperationCenter() {
  const { filtered, error, selected } = useCrisis()

  return (
    <div className="flex flex-col">
      {/* Fills the viewport so the map can grow into leftover space */}
      <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col gap-4 p-4 md:p-6">
        <div className="flex shrink-0 flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white">
              Operation Center
            </h1>
            <p className="text-sm text-surface-300">
              Situational overview of public emergency information
            </p>
          </div>
          <p className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-surface-300">
            {filtered.length} incidents in view
          </p>
        </div>

        {error && (
          <div
            className="shrink-0 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="shrink-0 space-y-4">
          <OverviewCards />
          <IncidentFilters />
        </div>

        <div className="grid min-h-[360px] flex-1 items-stretch gap-4 xl:grid-cols-12">
          <div className="min-h-[360px] xl:col-span-8">
            <Suspense
              fallback={
                <Skeleton className="h-full min-h-[360px] w-full rounded-xl" />
              }
            >
              <CrisisMap className="h-full min-h-[360px]" />
            </Suspense>
          </div>

          <aside className="flex min-h-[360px] xl:col-span-4">
            {selected ? (
              <div className="h-full w-full overflow-y-auto">
                <IncidentDetails />
              </div>
            ) : (
              <section
                className="panel flex h-full min-h-0 w-full flex-col p-4"
                aria-labelledby="feed-heading"
              >
                <div className="mb-2 flex shrink-0 items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2
                        id="feed-heading"
                        className="text-sm font-semibold text-white"
                      >
                        Incident Feed
                      </h2>
                      <ProvenanceBadge kind="live" label="Live feeds" />
                    </div>
                    <p className="mt-1 text-[11px] text-surface-400">
                      Public API rows only. See{' '}
                      <Link
                        to="/app/sources"
                        className="text-accent hover:underline"
                      >
                        Data Sources
                      </Link>
                      .
                    </p>
                  </div>
                  <Link
                    to="/app/feed"
                    className="shrink-0 text-xs text-accent hover:underline"
                  >
                    View all
                  </Link>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                  <IncidentFeed compact limit={8} />
                </div>
                <div className="shrink-0">
                  <LatestReportsCompact />
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>

      <div className="space-y-4 px-4 pb-4 md:px-6 md:pb-6">
        <AiSummaryPanel />

        <div className="grid items-start gap-4 md:grid-cols-2">
          <WeatherPanel />
          <ResourcePanel />
        </div>
      </div>
    </div>
  )
}

function LatestReportsCompact() {
  const { filtered } = useCrisis()
  const latest = filtered.slice(0, 3)

  if (!latest.length) return null

  return (
    <div className="mt-3 border-t border-white/8 pt-3">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-surface-500">
        Latest reports
      </p>
      <ul className="space-y-2">
        {latest.map((inc) => (
          <li key={inc.id}>
            <p className="truncate text-xs text-surface-300">{inc.title}</p>
            <p className="text-[10px] text-surface-500">
              {inc.source} · {formatRelative(inc.timestamp)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
