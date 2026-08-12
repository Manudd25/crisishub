import type { Incident } from '@/types/incident'
import { FOCUS_CITIES } from './locationFocus'

const CACHE_KEY = 'crisishub:weather-hazards:v1'

/** Subset of focus cities to stay within Open-Meteo rate limits. */
const PROBES = FOCUS_CITIES.filter((_, i) => i % 2 === 0).slice(0, 14)

/**
 * Live Open-Meteo extremes → heatwave / weather_alert incidents.
 * Not official meteorological warnings — model-based thresholds only.
 */
export async function fetchWeatherHazards(): Promise<Incident[]> {
  try {
    const results = await Promise.all(
      PROBES.map(async (probe): Promise<Incident[]> => {
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${probe.latitude}` +
          `&longitude=${probe.longitude}` +
          `&daily=temperature_2m_max,wind_speed_10m_max,precipitation_sum` +
          `&forecast_days=3&timezone=auto`

        const res = await fetch(url)
        if (!res.ok) throw new Error(`Open-Meteo ${res.status}`)
        const data = await res.json()
        const times = (data.daily?.time as string[]) ?? []
        const tmax = (data.daily?.temperature_2m_max as number[]) ?? []
        const wind = (data.daily?.wind_speed_10m_max as number[]) ?? []
        const rain = (data.daily?.precipitation_sum as number[]) ?? []

        const out: Incident[] = []
        for (let i = 0; i < times.length; i++) {
          const day = times[i]
          const t = tmax[i]
          const w = wind[i]
          const r = rain[i]
          if (t != null && t >= 35) {
            out.push({
              id: `HEAT-${probe.city.replace(/\s/g, '')}-${day}`,
              type: 'heatwave',
              title: `Heatwave conditions — ${probe.city}`,
              severity: t >= 40 ? 'high' : 'moderate',
              status: 'monitoring',
              latitude: probe.latitude,
              longitude: probe.longitude,
              country: probe.country,
              city: probe.city,
              description: `Open-Meteo forecast daily max ${t.toFixed(1)}°C for ${probe.city} on ${day}. Model-based threshold (≥35°C), not an official heat warning.`,
              timestamp: new Date(`${day}T12:00:00`).toISOString(),
              startTime: new Date(`${day}T00:00:00`).toISOString(),
              source: 'Open-Meteo',
              weatherContext: `Max ${t.toFixed(1)}°C`,
              externalSources: [
                { label: 'Open-Meteo', url: 'https://open-meteo.com/' },
              ],
            })
          }
          if (w != null && w >= 75) {
            out.push({
              id: `WIND-${probe.city.replace(/\s/g, '')}-${day}`,
              type: 'weather_alert',
              title: `High wind forecast — ${probe.city}`,
              severity: w >= 100 ? 'high' : 'moderate',
              status: 'monitoring',
              latitude: probe.latitude,
              longitude: probe.longitude,
              country: probe.country,
              city: probe.city,
              description: `Open-Meteo forecast peak wind ${Math.round(w)} km/h for ${probe.city} on ${day}. Model-based threshold (≥75 km/h), not an official wind warning.`,
              timestamp: new Date(`${day}T12:00:00`).toISOString(),
              startTime: new Date(`${day}T00:00:00`).toISOString(),
              source: 'Open-Meteo',
              weatherContext: `Wind ${Math.round(w)} km/h`,
              externalSources: [
                { label: 'Open-Meteo', url: 'https://open-meteo.com/' },
              ],
            })
          }
          if (r != null && r >= 40 && (t == null || t < 35)) {
            out.push({
              id: `RAIN-${probe.city.replace(/\s/g, '')}-${day}`,
              type: 'weather_alert',
              title: `Heavy rain forecast — ${probe.city}`,
              severity: r >= 70 ? 'high' : 'moderate',
              status: 'monitoring',
              latitude: probe.latitude,
              longitude: probe.longitude,
              country: probe.country,
              city: probe.city,
              description: `Open-Meteo forecast precipitation ${r.toFixed(1)} mm for ${probe.city} on ${day}. Model-based threshold (≥40 mm), not an official flood/rain warning.`,
              timestamp: new Date(`${day}T12:00:00`).toISOString(),
              startTime: new Date(`${day}T00:00:00`).toISOString(),
              source: 'Open-Meteo',
              weatherContext: `Rain ${r.toFixed(1)} mm`,
              externalSources: [
                { label: 'Open-Meteo', url: 'https://open-meteo.com/' },
              ],
            })
          }
        }
        return out
      }),
    )

    const incidents = results.flat()
    localStorage.setItem(CACHE_KEY, JSON.stringify(incidents))
    return incidents
  } catch {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      try {
        return JSON.parse(cached) as Incident[]
      } catch {
        /* ignore */
      }
    }
    return []
  }
}
