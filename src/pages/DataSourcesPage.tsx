import { Link } from 'react-router-dom'
import { ProvenanceBadge } from '@/components/ui/Badge'
import type { ProvenanceKind } from '@/lib/provenance'

type SourceRow = {
  name: string
  role: string
  kind: ProvenanceKind
  statusLabel: string
  detail: string
}

const sources: SourceRow[] = [
  {
    name: 'USGS Earthquakes',
    role: 'Seismic events',
    kind: 'live',
    statusLabel: 'Live',
    detail: 'M4.5+ GeoJSON feed from USGS.',
  },
  {
    name: 'NASA FIRMS (+ GDACS WF)',
    role: 'Wildfire / thermal hotspots',
    kind: 'live',
    statusLabel: 'Live',
    detail:
      'FIRMS via server key when configured, plus GDACS wildfire events.',
  },
  {
    name: 'GDACS (UN/JRC)',
    role: 'Floods, cyclones, volcanoes, wildfires',
    kind: 'live',
    statusLabel: 'Live',
    detail: 'Public multi-hazard GeoJSON search API (last ~45 days).',
  },
  {
    name: 'Open-Meteo Flood (GloFAS)',
    role: 'River discharge signals',
    kind: 'live',
    statusLabel: 'Live',
    detail:
      'Modelled discharge near selected European river cities — complements GDACS flood events.',
  },
  {
    name: 'Open-Meteo Forecast',
    role: 'Weather panel, heatwaves, wind/rain alerts',
    kind: 'live',
    statusLabel: 'Live',
    detail:
      'Current weather + threshold-based heat/wind/rain signals from the forecast model (not official met warnings).',
  },
  {
    name: 'Open-Meteo Air Quality',
    role: 'European AQI probes',
    kind: 'live',
    statusLabel: 'Live',
    detail: 'Live AQI samples; alerts only when AQI ≥ 50.',
  },
  {
    name: 'USGS Volcano Hazards',
    role: 'Elevated US volcano status',
    kind: 'live',
    statusLabel: 'Live',
    detail: 'Elevated-alert list; global volcano coverage also comes from GDACS.',
  },
  {
    name: 'OpenStreetMap / Overpass',
    role: 'Essential infrastructure (hospitals, clinics, fire, police, pharmacies, emergency)',
    kind: 'live',
    statusLabel: 'Live',
    detail:
      'OSM amenity tags: hospital, clinic, fire_station, police, pharmacy; emergency=ambulance_station / disaster_response / assembly_point. Mapped locations only — not live unit deployments.',
  },
  {
    name: 'OpenStreetMap / Carto',
    role: 'Basemap & geocoding',
    kind: 'live',
    statusLabel: 'Live',
    detail: 'Live tiles and Nominatim place search.',
  },
  {
    name: 'Cloudflare Workers AI',
    role: 'Situation summaries',
    kind: 'live',
    statusLabel: 'Live',
    detail: 'Situation summaries via Cloudflare Workers AI (Llama) through the server proxy.',
  },
]

export function DataSourcesPage() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Data Sources</h1>
        <p className="mt-1 max-w-3xl text-sm text-surface-300">
          CrisisHub uses live public feeds for hazards, weather, facilities, and
          AI summaries. The incident feed is not padded with curated demo rows.
        </p>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Provenance legend">
        <ProvenanceBadge kind="live" />
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-900 text-xs uppercase tracking-wide text-white">
            <tr>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">
                What you see
              </th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr
                key={s.name}
                className="border-t border-white/8 bg-surface-950/40 align-top"
              >
                <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                <td className="px-4 py-3 text-surface-300">{s.role}</td>
                <td className="px-4 py-3">
                  <ProvenanceBadge kind={s.kind} label={s.statusLabel} />
                </td>
                <td className="hidden px-4 py-3 text-surface-300 md:table-cell">
                  {s.detail}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-surface-400">
        Panel badges and per-incident Live/Demo tags also appear in the{' '}
        <Link to="/app" className="text-accent hover:underline">
          Operation Center
        </Link>
        .
      </p>
    </div>
  )
}
