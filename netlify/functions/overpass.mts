import type { Context } from '@netlify/functions'

const OVERPASS_ENDPOINTS = [
  'https://overpass.openstreetmap.fr/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass-api.de/api/interpreter',
]

/**
 * Same-origin Overpass proxy.
 * Browsers (and some ad-blockers) often fail calling Overpass mirrors directly
 * from the production domain; the function retries mirrors server-side.
 */
export default async function handler(req: Request, _context: Context) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    })
  }

  if (req.method !== 'POST') {
    return Response.json(
      { error: 'POST a JSON body: { query: string }' },
      { status: 405, headers: corsHeaders() },
    )
  }

  let query = ''
  try {
    const body = (await req.json()) as { query?: string; data?: string }
    query = (body.query ?? body.data ?? '').trim()
  } catch {
    return Response.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: corsHeaders() },
    )
  }

  if (!query || query.length > 20_000) {
    return Response.json(
      { error: 'Missing or oversized Overpass query' },
      { status: 400, headers: corsHeaders() },
    )
  }

  let lastError = 'All Overpass mirrors unavailable'

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body: `data=${encodeURIComponent(query)}`,
      })

      if (!res.ok) {
        lastError = `Overpass ${res.status} @ ${endpoint}`
        continue
      }

      const data = await res.json()
      return Response.json(data, {
        status: 200,
        headers: {
          ...corsHeaders(),
          'Cache-Control': 'public, max-age=300',
          'X-Overpass-Upstream': endpoint,
        },
      })
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
    }
  }

  return Response.json(
    { error: lastError },
    { status: 502, headers: corsHeaders() },
  )
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}
