import type { Incident } from '@/types/incident'

const CACHE_KEY = 'crisishub:wildfires:v1'

/**
 * NASA FIRMS requires a MAP_KEY that must never be embedded in the client bundle.
 * Live FIRMS access belongs behind a server/Worker proxy (no VITE_* secrets).
 * Empty result lets the aggregator use live GDACS wildfires only (no demo fill).
 */
export async function fetchWildfires(): Promise<Incident[]> {
  try {
    const res = await fetch('/api/wildfires', { method: 'GET' })
    if (res.ok) {
      const data = (await res.json()) as Incident[]
      if (Array.isArray(data) && data.length) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data))
        return data
      }
    }
  } catch {
    // Proxy unavailable — expected without NASA_FIRMS_MAP_KEY.
  }

  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    try {
      return JSON.parse(cached) as Incident[]
    } catch {
      // ignore corrupt cache
    }
  }

  return []
}
