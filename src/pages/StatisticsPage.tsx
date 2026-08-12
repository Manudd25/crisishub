import { IncidentFilters } from '@/components/incidents/IncidentFilters'
import { StatisticsCharts } from '@/components/stats/StatisticsCharts'
import { OverviewCards } from '@/components/dashboard/OverviewCards'

export function StatisticsPage() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Statistics</h1>
        <p className="text-sm text-white">
          Charts use the current filtered incident set from live public feeds.
        </p>
      </div>
      <OverviewCards />
      <IncidentFilters />
      <StatisticsCharts />
    </div>
  )
}
