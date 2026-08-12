import {
  Activity,
  CloudRain,
  Earth,
  Flame,
  Mountain,
  Wind,
  Waves,
  Clock,
} from 'lucide-react'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { Skeleton } from '@/components/ui/Skeleton'
import { useCrisis } from '@/context/CrisisContext'

const cards = [
  { key: 'activeIncidents', label: 'Active Incidents', icon: Activity, tone: 'text-accent' },
  { key: 'weatherAlerts', label: 'Weather Alerts', icon: CloudRain, tone: 'text-info' },
  { key: 'wildfires', label: 'Wildfires', icon: Flame, tone: 'text-warning' },
  { key: 'earthquakes', label: 'Earthquakes', icon: Earth, tone: 'text-surface-200' },
  { key: 'floodWarnings', label: 'Flood Warnings', icon: Waves, tone: 'text-info' },
  { key: 'airQualityAlerts', label: 'Air Quality Alerts', icon: Wind, tone: 'text-warning' },
  { key: 'volcanoAlerts', label: 'Volcano Alerts', icon: Mountain, tone: 'text-critical' },
  { key: 'recentUpdates', label: 'Recent Updates', icon: Clock, tone: 'text-resolved' },
] as const

export function OverviewCards() {
  const { stats, loading, incidents } = useCrisis()
  const showSkeleton = loading && incidents.length === 0

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-4">
      {cards.map(({ key, label, icon: Icon, tone }) => (
        <article
          key={key}
          className="panel group p-4 transition-colors hover:border-accent/25"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-surface-300">{label}</p>
            <Icon className={`h-4 w-4 ${tone}`} aria-hidden />
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
            {showSkeleton ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <AnimatedCounter value={stats[key]} />
            )}
          </p>
        </article>
      ))}
    </div>
  )
}
