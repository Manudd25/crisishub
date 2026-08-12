import type { IncidentType, MapLayerId, Severity } from '@/types/incident'

export const DEFAULT_LAYERS: MapLayerId[] = [
  { id: 'wildfires', label: 'Wildfires (live)', enabled: true },
  { id: 'floods', label: 'Floods (live)', enabled: true },
  { id: 'earthquakes', label: 'Earthquakes (live)', enabled: true },
  { id: 'storms', label: 'Storms (live)', enabled: true },
  { id: 'heatwaves', label: 'Heatwaves (live)', enabled: true },
  { id: 'air_quality', label: 'Air Quality (live)', enabled: true },
  { id: 'volcanoes', label: 'Volcanoes (live)', enabled: true },
  { id: 'hospitals', label: 'Hospitals (OSM)', enabled: true },
  { id: 'clinics', label: 'Clinics (OSM)', enabled: true },
  { id: 'fire_stations', label: 'Fire stations (OSM)', enabled: true },
  { id: 'police', label: 'Police (OSM)', enabled: true },
  { id: 'pharmacies', label: 'Pharmacies (OSM)', enabled: true },
  { id: 'emergency', label: 'Emergency services (OSM)', enabled: true },
  { id: 'shelters', label: 'Shelters / assembly (OSM)', enabled: true },
  { id: 'weather', label: 'Weather alerts (live)', enabled: true },
]

export const TYPE_TO_LAYER: Record<IncidentType, MapLayerId['id']> = {
  wildfire: 'wildfires',
  flood: 'floods',
  earthquake: 'earthquakes',
  storm: 'storms',
  heatwave: 'heatwaves',
  air_quality: 'air_quality',
  volcano: 'volcanoes',
  weather_alert: 'weather',
}

export function severityColor(severity: Severity): string {
  switch (severity) {
    case 'critical':
      return '#ef4444'
    case 'high':
      return '#f59e0b'
    case 'moderate':
      return '#5b9fd4'
    case 'low':
      return '#6b6b6b'
    case 'info':
      return '#5b9fd4'
  }
}

/** Distinct map marker color per incident type (not severity). */
export function typeColor(type: IncidentType): string {
  switch (type) {
    case 'wildfire':
      return '#FF5C33'
    case 'flood':
      return '#3B82F6'
    case 'earthquake':
      return '#C4A35A'
    case 'storm':
      return '#7C9CBF'
    case 'heatwave':
      return '#F59E0B'
    case 'air_quality':
      return '#14B8A6'
    case 'volcano':
      return '#E11D48'
    case 'weather_alert':
      return '#38BDF8'
  }
}

export const LAYER_COLORS: Record<MapLayerId['id'], string> = {
  wildfires: '#FF5C33',
  floods: '#3B82F6',
  earthquakes: '#C4A35A',
  storms: '#7C9CBF',
  heatwaves: '#F59E0B',
  air_quality: '#14B8A6',
  volcanoes: '#E11D48',
  hospitals: '#16A34A',
  clinics: '#65A30D',
  fire_stations: '#DC2626',
  police: '#2563EB',
  pharmacies: '#0D9488',
  emergency: '#EA580C',
  shelters: '#FF8C42',
  weather: '#38BDF8',
}

export function typeEmoji(type: IncidentType): string {
  switch (type) {
    case 'wildfire':
      return '🔥'
    case 'flood':
      return '🌊'
    case 'earthquake':
      return '🌍'
    case 'storm':
      return '⛈️'
    case 'heatwave':
      return '🌡️'
    case 'air_quality':
      return '💨'
    case 'volcano':
      return '🌋'
    case 'weather_alert':
      return '🌬️'
  }
}

export function typeLabel(type: IncidentType): string {
  switch (type) {
    case 'wildfire':
      return 'Wildfire'
    case 'flood':
      return 'Flood'
    case 'earthquake':
      return 'Earthquake'
    case 'storm':
      return 'Storm'
    case 'heatwave':
      return 'Heatwave'
    case 'air_quality':
      return 'Air Quality'
    case 'volcano':
      return 'Volcano'
    case 'weather_alert':
      return 'Weather Alert'
  }
}

export async function geocodeSearch(query: string): Promise<{
  lat: number
  lon: number
  label: string
} | null> {
  const q = query.trim()
  if (!q) return null

  // Coordinate pair: "lat, lon"
  const coordMatch = q.match(/^(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)$/)
  if (coordMatch) {
    return {
      lat: Number(coordMatch[1]),
      lon: Number(coordMatch[3]),
      label: `${coordMatch[1]}, ${coordMatch[3]}`,
    }
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>
    if (!data[0]) return null
    return {
      lat: Number(data[0].lat),
      lon: Number(data[0].lon),
      label: data[0].display_name,
    }
  } catch {
    return null
  }
}
