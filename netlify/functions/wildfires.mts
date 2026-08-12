import type { Context } from '@netlify/functions'
import { fetchFirmsIncidents } from '../../server/apiCore'

export default async function handler(_req: Request, _context: Context) {
  const key = process.env.NASA_FIRMS_MAP_KEY
  if (!key) {
    return Response.json(
      { error: 'NASA_FIRMS_MAP_KEY not configured' },
      { status: 503 },
    )
  }

  try {
    const result = await fetchFirmsIncidents(key)
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status })
    }
    return Response.json(result.incidents)
  } catch {
    return Response.json({ error: 'Wildfire proxy failed' }, { status: 500 })
  }
}
