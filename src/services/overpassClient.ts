/**
 * Browser-safe Overpass client.
 *
 * Only use mirrors that return Access-Control-Allow-Origin for web apps.
 * overpass-api.de / lz4.overpass-api.de often respond 406 WITHOUT CORS headers
 * → browsers block them (exactly the Netlify console errors).
 */
const CORS_SAFE_OVERPASS = 'https://overpass.openstreetmap.fr/api/interpreter'

export type OverpassElement = {
  id: number
  type: string
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

export async function queryOverpass(query: string): Promise<{
  elements: OverpassElement[]
}> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 20000)

  try {
    const res = await fetch(CORS_SAFE_OVERPASS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    })

    if (!res.ok) {
      throw new Error(`Overpass ${res.status}`)
    }

    const data = (await res.json()) as { elements?: OverpassElement[] }
    return { elements: data.elements ?? [] }
  } finally {
    window.clearTimeout(timer)
  }
}
