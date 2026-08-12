import type { Incident } from '@/types/incident'

const CACHE_KEY = 'crisishub:airquality:v1'

interface CityProbe {
  city: string
  country: string
  latitude: number
  longitude: number
}

const PROBES: CityProbe[] = [
  { city: 'Milan', country: 'Italy', latitude: 45.46, longitude: 9.19 },
  { city: 'Madrid', country: 'Spain', latitude: 40.42, longitude: -3.7 },
  { city: 'Athens', country: 'Greece', latitude: 37.98, longitude: 23.73 },
  { city: 'Paris', country: 'France', latitude: 48.86, longitude: 2.35 },
  { city: 'Lisbon', country: 'Portugal', latitude: 38.72, longitude: -9.14 },
  { city: 'Berlin', country: 'Germany', latitude: 52.52, longitude: 13.41 },
  { city: 'Warsaw', country: 'Poland', latitude: 52.23, longitude: 21.01 },
  { city: 'Bucharest', country: 'Romania', latitude: 44.43, longitude: 26.1 },
  { city: 'London', country: 'United Kingdom', latitude: 51.51, longitude: -0.13 },
  { city: 'Istanbul', country: 'Turkey', latitude: 41.01, longitude: 28.98 },
]

/** Open-Meteo Air Quality API — free. Emits alerts when AQI exceeds thresholds. */
export async function fetchAirQualityAlerts(): Promise<Incident[]> {
  try {
    const results = await Promise.all(
      PROBES.map(async (probe): Promise<Incident | null> => {
        const url =
          `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${probe.latitude}` +
          `&longitude=${probe.longitude}&current=european_aqi,pm2_5,pm10`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`AQ ${res.status}`)
        const data = await res.json()
        const aqi = data.current?.european_aqi as number | undefined
        if (aqi == null || aqi < 50) return null

        return {
          id: `AQ-${probe.city.replace(/\s/g, '')}-${data.current.time}`,
          type: 'air_quality',
          title: `Air quality alert — ${probe.city}`,
          severity: aqiSeverity(aqi),
          status: aqi >= 100 ? 'active' : 'monitoring',
          latitude: probe.latitude,
          longitude: probe.longitude,
          country: probe.country,
          city: probe.city,
          description: `European AQI ${aqi} reported via Open-Meteo for ${probe.city}. Local conditions can change quickly; sensor coverage may be incomplete.`,
          timestamp: new Date(data.current.time).toISOString(),
          startTime: new Date(data.current.time).toISOString(),
          source: 'Open-Meteo Air Quality',
          aqi,
          externalSources: [{ label: 'Open-Meteo', url: 'https://open-meteo.com/' }],
        }
      }),
    )

    const incidents = results.filter((x): x is Incident => x !== null)
    localStorage.setItem(CACHE_KEY, JSON.stringify(incidents))
    return incidents
  } catch {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) return JSON.parse(cached) as Incident[]
    return []
  }
}

function aqiSeverity(aqi: number): Incident['severity'] {
  if (aqi >= 150) return 'critical'
  if (aqi >= 100) return 'high'
  if (aqi >= 75) return 'moderate'
  return 'low'
}
