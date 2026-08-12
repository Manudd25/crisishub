import { lazy, Suspense, useMemo } from 'react'
import { useCrisis } from '@/context/CrisisContext'
import { typeLabel } from '@/services/mapService'
import { Skeleton } from '@/components/ui/Skeleton'

const ChartsInner = lazy(() => import('./StatisticsChartsInner'))

export function StatisticsCharts() {
  const { filtered, loading } = useCrisis()

  const dataReady = useMemo(() => filtered.length > 0, [filtered])

  if (loading && !dataReady) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-xl" />
          ))}
        </div>
      }
    >
      <ChartsInner incidents={filtered} typeLabel={typeLabel} />
    </Suspense>
  )
}
