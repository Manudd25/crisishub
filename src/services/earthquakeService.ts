import type { Incident } from '@/types/incident'

const CACHE_KEY = 'crisishub:earthquakes:v1'

/** USGS Earthquake API — free GeoJSON feed. */
export async function fetchEarthquakes(): Promise<Incident[]> {
  try {
    const url =
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson'
    const res = await fetch(url)
    if (!res.ok) throw new Error(`USGS ${res.status}`)
    const data = await res.json()

    const incidents: Incident[] = (data.features as Array<{
      id: string
      properties: {
        mag: number
        place: string
        time: number
        url: string
        title: string
        status: string
      }
      geometry: { coordinates: [number, number, number] }
    }>)
      .slice(0, 25)
      .map((f) => {
        const mag = f.properties.mag ?? 0
        const [longitude, latitude] = f.geometry.coordinates
        const place = f.properties.place ?? 'Unknown location'
        const country = inferCountry(place)

        return {
          id: `EQ-${f.id}`,
          type: 'earthquake' as const,
          title: f.properties.title || `M${mag} Earthquake — ${place}`,
          severity: magSeverity(mag),
          status: 'monitoring' as const,
          latitude,
          longitude,
          country,
          description: `USGS-reported earthquake (M${mag}) near ${place}. Impact is not verified by CrisisHub. Aftershock potential remains uncertain.`,
          timestamp: new Date(f.properties.time).toISOString(),
          startTime: new Date(f.properties.time).toISOString(),
          source: 'USGS Earthquakes',
          magnitude: mag,
          externalSources: [{ label: 'USGS Event', url: f.properties.url }],
        }
      })

    localStorage.setItem(CACHE_KEY, JSON.stringify(incidents))
    return incidents
  } catch {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) return JSON.parse(cached) as Incident[]
    return []
  }
}

function magSeverity(mag: number): Incident['severity'] {
  if (mag >= 6.5) return 'critical'
  if (mag >= 5.5) return 'high'
  if (mag >= 4.5) return 'moderate'
  if (mag >= 3.5) return 'low'
  return 'info'
}

function inferCountry(place: string): string {
  const parts = place.split(',').map((p) => p.trim())
  return parts[parts.length - 1] || 'Unknown'
}
