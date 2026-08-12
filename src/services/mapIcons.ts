import L from 'leaflet'
import type { MapLayerId, MapPoi } from '@/types/incident'
import { LAYER_COLORS, typeEmoji, TYPE_TO_LAYER } from './mapService'
import type { IncidentType } from '@/types/incident'

export type InfraKind = MapPoi['kind']

const INFRA_SVGS: Record<InfraKind, string> = {
  hospital: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 6v12M6 12h12"/><rect x="3" y="3" width="18" height="18" rx="3" stroke-width="1.8"/></svg>`,
  clinic: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V8l8-4 8 4v12"/><path d="M9 20v-6h6v6"/><path d="M12 8v3M10.5 9.5h3"/></svg>`,
  fire_station: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c2 3 1 5 1 7a3 3 0 1 1-6 0c0-2 2-4 3-5 0 2-1 3-1 5a2 2 0 1 0 4 0c0-1.5-.5-3-1-4z"/><path d="M8 20h8M9 20c0-2 1.5-3 3-3s3 1 3 3"/></svg>`,
  police: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4 6v5c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-3z"/><path d="M9.5 12.5 11 14l3.5-3.5"/></svg>`,
  pharmacy: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 3h6v4H9z"/><rect x="6" y="7" width="12" height="14" rx="2"/><path d="M12 11v6M9 14h6"/></svg>`,
  emergency: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="10" rx="2"/><path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/><path d="M12 11v4M10 13h4"/><circle cx="7.5" cy="18" r="1.5"/><circle cx="16.5" cy="18" r="1.5"/></svg>`,
  shelter: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>`,
}

export const INFRA_LABELS: Record<InfraKind, string> = {
  hospital: 'Hospital',
  clinic: 'Clinic',
  fire_station: 'Fire station',
  police: 'Police',
  pharmacy: 'Pharmacy',
  emergency: 'Emergency service',
  shelter: 'Shelter / assembly',
}

export const INFRA_LAYER_TO_KIND: Partial<Record<MapLayerId['id'], InfraKind>> = {
  hospitals: 'hospital',
  clinics: 'clinic',
  fire_stations: 'fire_station',
  police: 'police',
  pharmacies: 'pharmacy',
  emergency: 'emergency',
  shelters: 'shelter',
}

export const INFRA_KIND_TO_LAYER: Record<InfraKind, MapLayerId['id']> = {
  hospital: 'hospitals',
  clinic: 'clinics',
  fire_station: 'fire_stations',
  police: 'police',
  pharmacy: 'pharmacies',
  emergency: 'emergency',
  shelter: 'shelters',
}

/** Leaflet marker with a colored pin + white infrastructure glyph. */
export function infrastructureIcon(kind: InfraKind, title: string): L.DivIcon {
  const color = LAYER_COLORS[INFRA_KIND_TO_LAYER[kind]]
  const glyph = INFRA_SVGS[kind]

  return L.divIcon({
    className: 'infra-marker',
    html: `<div class="infra-marker__pin" style="--infra-color:${color};--infra-fg:#fff" title="${escapeAttr(title)}">${glyph}</div>`,
    iconSize: [30, 36],
    iconAnchor: [15, 34],
    popupAnchor: [0, -30],
  })
}

/** Small legend chip: infra glyph or hazard emoji. */
export function layerLegendGlyph(layerId: MapLayerId['id']): string {
  const infra = INFRA_LAYER_TO_KIND[layerId]
  if (infra) {
    return `<span class="layer-legend-infra" style="background:${LAYER_COLORS[layerId]}">${INFRA_SVGS[infra]}</span>`
  }

  const type = (Object.entries(TYPE_TO_LAYER) as [IncidentType, MapLayerId['id']][])
    .find(([, id]) => id === layerId)?.[0]
  if (type) {
    return `<span class="layer-legend-emoji" aria-hidden="true">${typeEmoji(type)}</span>`
  }

  return `<span class="layer-legend-dot" style="background:${LAYER_COLORS[layerId]}"></span>`
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
