/**
 * Optional Cloudflare Worker proxy for Workers AI.
 *
 * Secrets (set via `wrangler secret put`, never VITE_* client env):
 * - CF_ACCOUNT_ID
 * - CF_API_TOKEN  (Workers AI permission)
 *
 * Deploy separately and route `/api/ai/summary` to this worker,
 * or merge into your Pages Functions / Worker routes.
 */

export interface Env {
  CF_ACCOUNT_ID: string
  CF_API_TOKEN: string
  AI?: Ai
}

interface Ai {
  run: (
    model: string,
    input: { messages: Array<{ role: string; content: string }> },
  ) => Promise<{ response?: string }>
}

const SYSTEM = `You summarize emergency information.

Never provide evacuation instructions.
Never speculate.
Never recommend operational actions.
Only summarize provided structured information.
Always mention uncertainty.`

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() })
    }

    const url = new URL(request.url)
    if (url.pathname !== '/api/ai/summary' || request.method !== 'POST') {
      return json({ error: 'Not found' }, 404)
    }

    try {
      const body = (await request.json()) as {
        incidents?: unknown[]
        system?: string
      }

      if (!Array.isArray(body.incidents)) {
        return json({ error: 'incidents array required' }, 400)
      }

      const userContent = JSON.stringify(
        {
          instruction:
            'Summarize only the following incidents. Do not invent events. Mention uncertainty.',
          incidents: body.incidents,
        },
        null,
        2,
      )

      let summary: string | undefined

      if (env.AI) {
        const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
          messages: [
            { role: 'system', content: body.system || SYSTEM },
            { role: 'user', content: userContent },
          ],
        })
        summary = result.response
      } else if (env.CF_ACCOUNT_ID && env.CF_API_TOKEN) {
        const res = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${env.CF_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [
                { role: 'system', content: body.system || SYSTEM },
                { role: 'user', content: userContent },
              ],
            }),
          },
        )
        const data = (await res.json()) as {
          result?: { response?: string }
        }
        summary = data.result?.response
      }

      if (!summary) {
        return json({ error: 'AI unavailable' }, 503)
      }

      return json({ summary })
    } catch {
      return json({ error: 'Summary failed' }, 500)
    }
  },
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  })
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}
