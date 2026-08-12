import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  AI_SYSTEM_PROMPT,
  fetchFirmsIncidents,
  runCloudflareSummary,
} from './apiCore.ts'

export interface DevApiEnv {
  CF_ACCOUNT_ID?: string
  CF_API_TOKEN?: string
  NASA_FIRMS_MAP_KEY?: string
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(Buffer.from(c)))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

/** Vite middleware: keeps secrets on the server, never in the client bundle. */
export function crisishubDevApi(env: DevApiEnv): Plugin {
  return {
    name: 'crisishub-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''

        if (url === '/api/wildfires' && req.method === 'GET') {
          try {
            const key = env.NASA_FIRMS_MAP_KEY
            if (!key) {
              sendJson(res, 503, { error: 'NASA_FIRMS_MAP_KEY not configured' })
              return
            }
            const result = await fetchFirmsIncidents(key)
            if (!result.ok) {
              sendJson(res, result.status, { error: result.error })
              return
            }
            sendJson(res, 200, result.incidents)
          } catch {
            sendJson(res, 500, { error: 'Wildfire proxy failed' })
          }
          return
        }

        if (url === '/api/ai/summary' && req.method === 'POST') {
          try {
            const accountId = env.CF_ACCOUNT_ID
            const token = env.CF_API_TOKEN
            if (!accountId || !token) {
              sendJson(res, 503, {
                error: 'Cloudflare AI credentials not configured',
              })
              return
            }

            const raw = await readBody(req)
            const body = JSON.parse(raw || '{}') as {
              incidents?: unknown[]
              system?: string
            }

            if (!Array.isArray(body.incidents)) {
              sendJson(res, 400, { error: 'incidents array required' })
              return
            }

            const result = await runCloudflareSummary({
              accountId,
              token,
              incidents: body.incidents,
              system: body.system || AI_SYSTEM_PROMPT,
            })

            if (!result.ok) {
              sendJson(res, result.status, { error: result.error })
              return
            }

            sendJson(res, 200, { summary: result.summary })
          } catch {
            sendJson(res, 500, { error: 'AI summary proxy failed' })
          }
          return
        }

        next()
      })
    },
  }
}
