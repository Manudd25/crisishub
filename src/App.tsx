import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CrisisProvider } from '@/context/CrisisContext'
import { AppShell } from '@/components/layout/AppShell'
import { LandingPage } from '@/pages/LandingPage'
import { Skeleton } from '@/components/ui/Skeleton'

const OperationCenter = lazy(() =>
  import('@/pages/OperationCenter').then((m) => ({ default: m.OperationCenter })),
)
const RegionalOverviewPage = lazy(() =>
  import('@/pages/RegionalOverviewPage').then((m) => ({
    default: m.RegionalOverviewPage,
  })),
)
const FeedPage = lazy(() =>
  import('@/pages/FeedPage').then((m) => ({ default: m.FeedPage })),
)
const StatisticsPage = lazy(() =>
  import('@/pages/StatisticsPage').then((m) => ({ default: m.StatisticsPage })),
)
const DataSourcesPage = lazy(() =>
  import('@/pages/DataSourcesPage').then((m) => ({ default: m.DataSourcesPage })),
)

function PageFallback() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <CrisisProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<AppShell />}>
            <Route
              index
              element={
                <Suspense fallback={<PageFallback />}>
                  <OperationCenter />
                </Suspense>
              }
            />
            <Route
              path="regions"
              element={
                <Suspense fallback={<PageFallback />}>
                  <RegionalOverviewPage />
                </Suspense>
              }
            />
            <Route path="map" element={<Navigate to="/app/regions" replace />} />
            <Route
              path="feed"
              element={
                <Suspense fallback={<PageFallback />}>
                  <FeedPage />
                </Suspense>
              }
            />
            <Route
              path="statistics"
              element={
                <Suspense fallback={<PageFallback />}>
                  <StatisticsPage />
                </Suspense>
              }
            />
            <Route path="ai" element={<Navigate to="/app" replace />} />
            <Route
              path="sources"
              element={
                <Suspense fallback={<PageFallback />}>
                  <DataSourcesPage />
                </Suspense>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CrisisProvider>
    </BrowserRouter>
  )
}
