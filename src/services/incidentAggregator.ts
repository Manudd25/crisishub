import type { Incident, IncidentFilters, OverviewStats } from '@/types/incident'
import { fetchEarthquakes } from './earthquakeService'
import { fetchWildfires } from './wildfireService'
import { fetchAirQualityAlerts } from './airQualityService'
import { fetchGdacsIncidents } from './gdacsService'
import { fetchWeatherHazards } from './weatherHazardService'
import { fetchUsgsVolcanoes } from './volcanoService'
import { fetchFloodDischargeSignals } from './floodService'
import { FOCUS_CITIES } from './locationFocus'

const AGG_CACHE = 'crisishub:incidents:v4'

/**
 * Central aggregator — live public feeds only (no curated demo padding).
 */
export async function aggregateIncidents(options?: {
  preferLive?: boolean
}): Promise<Incident[]> {
  const preferLive = options?.preferLive ?? true

  if (!preferLive) {
    const cached = localStorage.getItem(AGG_CACHE)
    if (cached) {
      try {
        return JSON.parse(cached) as Incident[]
      } catch {
        /* ignore */
      }
    }
    return []
  }

  try {
    const [quakes, fires, air, gdacs, hazards, usgsVolcanoes, floodSignals] =
      await Promise.all([
        fetchEarthquakes(),
        fetchWildfires(),
        fetchAirQualityAlerts(),
        fetchGdacsIncidents(),
        fetchWeatherHazards(),
        fetchUsgsVolcanoes(),
        fetchFloodDischargeSignals(),
      ])

    const live = dedupeById([
      ...quakes,
      ...fires,
      ...air,
      ...gdacs,
      ...hazards,
      ...usgsVolcanoes,
      ...floodSignals,
    ])

    const sorted = sortByNewest(live)
    localStorage.setItem(AGG_CACHE, JSON.stringify(sorted))
    return sorted
  } catch {
    const cached = localStorage.getItem(AGG_CACHE)
    if (cached) return JSON.parse(cached) as Incident[]
    return []
  }
}

export function filterIncidents(
  incidents: Incident[],
  filters: IncidentFilters,
): Incident[] {
  const q = filters.query.trim().toLowerCase()

  return incidents.filter((inc) => {
    if (filters.country !== 'all' && inc.country !== filters.country) return false
    if (filters.city !== 'all') {
      const cityMatch =
        (inc.city ?? '').toLowerCase() === filters.city.toLowerCase()
      const focus = FOCUS_CITIES.find(
        (c) =>
          c.city === filters.city &&
          (filters.country === 'all' || c.country === filters.country),
      )
      const nearCity =
        focus != null &&
        haversineKm(inc.latitude, inc.longitude, focus.latitude, focus.longitude) <=
          80
      if (!cityMatch && !nearCity) return false
    }
    if (filters.severity !== 'all' && inc.severity !== filters.severity) return false
    if (filters.status !== 'all' && inc.status !== filters.status) return false
    if (filters.category !== 'all' && inc.type !== filters.category) return false

    if (filters.dateFrom) {
      if (new Date(inc.timestamp) < new Date(filters.dateFrom)) return false
    }
    if (filters.dateTo) {
      const end = new Date(filters.dateTo)
      end.setHours(23, 59, 59, 999)
      if (new Date(inc.timestamp) > end) return false
    }

    if (q) {
      const hay = [
        inc.id,
        inc.title,
        inc.country,
        inc.city ?? '',
        inc.type,
        inc.description,
        `${inc.latitude}`,
        `${inc.longitude}`,
      ]
        .join(' ')
        .toLowerCase()
      if (!hay.includes(q)) return false
    }

    return true
  })
}

export function computeOverview(incidents: Incident[]): OverviewStats {
  const active = (t?: Incident['type']) =>
    incidents.filter(
      (i) =>
        (i.status === 'active' || i.status === 'monitoring') &&
        (t ? i.type === t : true),
    ).length

  const dayAgo = Date.now() - 24 * 60 * 60 * 1000

  return {
    activeIncidents: incidents.filter(
      (i) => i.status === 'active' || i.status === 'monitoring',
    ).length,
    weatherAlerts: active('weather_alert') + active('storm') + active('heatwave'),
    wildfires: active('wildfire'),
    earthquakes: active('earthquake'),
    floodWarnings: active('flood'),
    airQualityAlerts: active('air_quality'),
    volcanoAlerts: active('volcano'),
    recentUpdates: incidents.filter((i) => new Date(i.timestamp).getTime() > dayAgo)
      .length,
  }
}

export function getCountries(incidents: Incident[]): string[] {
  return [...new Set(incidents.map((i) => i.country))].sort()
}

function dedupeById(items: Incident[]): Incident[] {
  const map = new Map<string, Incident>()
  for (const item of items) {
    if (!map.has(item.id)) map.set(item.id, item)
  }
  return [...map.values()]
}

function sortByNewest(items: Incident[]): Incident[] {
  return [...items].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const r = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * r * Math.asin(Math.sqrt(a))
}

export const DEFAULT_FILTERS: IncidentFilters = {
  query: '',
  country: 'all',
  city: 'all',
  severity: 'all',
  status: 'all',
  category: 'all',
  dateFrom: '',
  dateTo: '',
}
