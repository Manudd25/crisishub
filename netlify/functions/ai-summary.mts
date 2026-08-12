import type { Context } from '@netlify/functions'
import { runCloudflareSummary } from '../../server/apiCore'

export default async function handler(req: Request, _context: Context) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const accountId = process.env.CF_ACCOUNT_ID
  const token = process.env.CF_API_TOKEN
  if (!accountId || !token) {
    return Response.json(
      { error: 'Cloudflare AI credentials not configured' },
      { status: 503 },
    )
  }

  try {
    const body = (await req.json()) as {
      incidents?: unknown[]
      system?: string
    }

    if (!Array.isArray(body.incidents)) {
      return Response.json({ error: 'incidents array required' }, { status: 400 })
    }

    const result = await runCloudflareSummary({
      accountId,
      token,
      incidents: body.incidents,
      system: body.system,
    })

    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status })
    }

    return Response.json({ summary: result.summary })
  } catch {
    return Response.json({ error: 'AI summary proxy failed' }, { status: 500 })
  }
}
