import { IncidentDetails } from '@/components/incidents/IncidentDetails'
import { IncidentFeed } from '@/components/incidents/IncidentFeed'
import { IncidentFilters } from '@/components/incidents/IncidentFilters'
import { ProvenanceBadge } from '@/components/ui/Badge'
import { useCrisis } from '@/context/CrisisContext'

export function FeedPage() {
  const { selected, filtered } = useCrisis()

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-white">Incident Feed</h1>
          <ProvenanceBadge kind="live" label="Live feeds" />
        </div>
        <p className="mt-1 text-sm text-surface-300">
          Aggregated public incident records · {filtered.length} shown.
        </p>
      </div>
      <IncidentFilters />
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <IncidentFeed />
        </div>
        <div className="lg:col-span-5">
          {selected ? (
            <div className="sticky top-20 h-[70vh]">
              <IncidentDetails />
            </div>
          ) : (
            <div className="panel p-6 text-sm text-surface-400">
              Select an incident to inspect location, severity, sources, and related
              events.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
