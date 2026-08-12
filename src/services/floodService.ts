import type { Incident } from '@/types/incident'
import { FOCUS_CITIES } from './locationFocus'

const CACHE_KEY = 'crisishub:flood-discharge:v1'

/** River-proximate cities for GloFAS discharge probes via Open-Meteo Flood API. */
const RIVER_PROBES = [
  FOCUS_CITIES.find((c) => c.city === 'Paris')!,
  FOCUS_CITIES.find((c) => c.city === 'Vienna')!,
  FOCUS_CITIES.find((c) => c.city === 'Budapest')!,
  FOCUS_CITIES.find((c) => c.city === 'Warsaw')!,
  FOCUS_CITIES.find((c) => c.city === 'Rome')!,
  FOCUS_CITIES.find((c) => c.city === 'London')!,
  FOCUS_CITIES.find((c) => c.city === 'Amsterdam')!,
  FOCUS_CITIES.find((c) => c.city === 'Bucharest')!,
].filter(Boolean)

/**
 * Open-Meteo / GloFAS river discharge — flags elevated discharge forecasts.
 * Complements GDACS flood alerts (which are event-based).
 */
export async function fetchFloodDischargeSignals(): Promise<Incident[]> {
  try {
    const results = await Promise.all(
      RIVER_PROBES.map(async (probe): Promise<Incident | null> => {
        const url =
          `https://flood-api.open-meteo.com/v1/flood?latitude=${probe.latitude}` +
          `&longitude=${probe.longitude}` +
          `&daily=river_discharge,river_discharge_max&forecast_days=7`

        const res = await fetch(url)
        if (!res.ok) throw new Error(`Flood API ${res.status}`)
        const data = await res.json()
        const times = (data.daily?.time as string[]) ?? []
        const mean = (data.daily?.river_discharge as number[]) ?? []
        const max = (data.daily?.river_discharge_max as number[]) ?? mean

        let peak = 0
        let peakDay = times[0] ?? new Date().toISOString().slice(0, 10)
        let baseline = 0
        for (let i = 0; i < times.length; i++) {
          const m = max[i] ?? mean[i] ?? 0
          if (m > peak) {
            peak = m
            peakDay = times[i]
          }
          if (i < 2) baseline += mean[i] ?? m
        }
        baseline = baseline / Math.min(2, times.length || 1)

        // Elevated vs near-term baseline, or absolute large river signal
        const elevated =
          (baseline > 0 && peak >= baseline * 2.5 && peak >= 80) || peak >= 800
        if (!elevated) return null

        return {
          id: `GLOFAS-${probe.city.replace(/\s/g, '')}-${peakDay}`,
          type: 'flood',
          title: `Elevated river discharge — ${probe.city}`,
          severity: peak >= 1500 || peak >= baseline * 4 ? 'high' : 'moderate',
          status: 'monitoring',
          latitude: probe.latitude,
          longitude: probe.longitude,
          country: probe.country,
          city: probe.city,
          description: `GloFAS / Open-Meteo Flood API: peak modelled discharge ~${Math.round(peak)} m³/s near ${probe.city} (forecast day ${peakDay}). Hydrological model signal only — not an official flood warning.`,
          timestamp: new Date(`${peakDay}T12:00:00`).toISOString(),
          startTime: new Date(`${peakDay}T00:00:00`).toISOString(),
          source: 'Open-Meteo Flood (GloFAS)',
          externalSources: [
            {
              label: 'Open-Meteo Flood API',
              url: 'https://open-meteo.com/en/docs/flood-api',
            },
          ],
        }
      }),
    )

    const incidents = results.filter((x): x is Incident => x != null)
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
