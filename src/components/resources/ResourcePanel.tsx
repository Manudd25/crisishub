import {
  Ambulance,
  Building2,
  Flame,
  Hospital,
  Pill,
  Shield,
  Stethoscope,
} from 'lucide-react'
import { useCrisis } from '@/context/CrisisContext'
import { ProvenanceBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatRelative } from '@/lib/format'

const items = [
  { key: 'hospitals', label: 'Hospitals', icon: Hospital },
  { key: 'clinics', label: 'Clinics', icon: Stethoscope },
  { key: 'fireStations', label: 'Fire stations', icon: Flame },
  { key: 'policeStations', label: 'Police stations', icon: Shield },
  { key: 'pharmacies', label: 'Pharmacies', icon: Pill },
  { key: 'emergencyServices', label: 'Ambulance / emergency', icon: Ambulance },
  { key: 'socialFacilities', label: 'Social / assembly points', icon: Building2 },
] as const

export function ResourcePanel() {
  const { resources, resourcesLoading } = useCrisis()
  const scope = resources.scopeLabel ?? 'Selected area'
  const failed = resources.isDemo === true
  const radius =
    resources.radiusKm != null ? ` · ${resources.radiusKm} km radius` : ''

  return (
    <section className="panel p-4" aria-labelledby="resources-heading">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 id="resources-heading" className="text-sm font-semibold text-white">
          Nearby Facilities
        </h2>
        <ProvenanceBadge
          kind={failed ? 'demo' : 'live'}
          label={
            failed
              ? 'Demo placeholders'
              : 'OpenStreetMap'
          }
        />
      </div>
      <p className="mb-1 text-xs font-medium text-surface-200">
        {scope}
        {radius}
      </p>
      <p className="mb-4 text-xs text-surface-400">
        Counts of mapped OSM amenities near the selected focus. These are
        public map features — not live fire-unit or volunteer deployment status
        (agencies do not publish that openly).
      </p>

      {resourcesLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map(({ key, label, icon: Icon }) => (
            <li key={key} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-surface-300">
                <Icon className="h-4 w-4 text-surface-500" aria-hidden />
                {label}
              </div>
              <span className="font-mono text-sm text-white">
                {resources[key]}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-[11px] text-surface-500">
        {resources.source ?? 'OpenStreetMap'} · Updated{' '}
        {formatRelative(resources.lastUpdated)}
      </p>
    </section>
  )
}
