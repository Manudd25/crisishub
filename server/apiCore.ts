export const AI_SYSTEM_PROMPT = `You summarize emergency information.

Never provide evacuation instructions.
Never speculate.
Never recommend operational actions.
Only summarize provided structured information.
Always mention uncertainty.

Organize the response by incident category.
Return valid JSON only, with this shape:
{
  "overview": "1-2 sentence overview of the full set",
  "sections": [
    { "category": "wildfire", "title": "Wildfires", "text": "Facts from that category only", "count": 3 }
  ],
  "uncertainty": "Brief uncertainty note"
}
Only include categories that appear in the input. Do not invent incidents.`

interface FirmsPoint {
  lat: number
  lon: number
  bright: number
  date: string
  time: string
  confidence: string
  frp: number
}

/** Approximate country from coordinates for European FIRMS coverage. */
export function inferCountry(lat: number, lon: number): string {
  if (lat >= 36.9 && lat <= 43.9 && lon >= -9.6 && lon <= -6.1) return 'Portugal'
  if (lat >= 36 && lat <= 43.9 && lon >= -9.5 && lon <= 3.4) return 'Spain'
  if (lat >= 41.3 && lat <= 51.2 && lon >= -5.2 && lon <= 9.6) return 'France'
  if (lat >= 36.6 && lat <= 47.2 && lon >= 6.6 && lon <= 18.6) return 'Italy'
  if (lat >= 34.7 && lat <= 41.8 && lon >= 19.3 && lon <= 29.7) return 'Greece'
  if (lat >= 50.5 && lat <= 55.1 && lon >= 3.2 && lon <= 7.3) return 'Netherlands'
  if (lat >= 49.4 && lat <= 53.6 && lon >= 2.5 && lon <= 6.5) return 'Belgium'
  if (lat >= 47.2 && lat <= 55.1 && lon >= 5.8 && lon <= 15.1) return 'Germany'
  if (lat >= 46.3 && lat <= 49.1 && lon >= 9.4 && lon <= 17.3) return 'Austria'
  if (lat >= 45.7 && lat <= 47.9 && lon >= 5.9 && lon <= 10.6) return 'Switzerland'
  if (lat >= 49 && lat <= 54.9 && lon >= 14 && lon <= 24.2) return 'Poland'
  if (lat >= 43.5 && lat <= 48.3 && lon >= 16 && lon <= 23) return 'Hungary'
  if (lat >= 42 && lat <= 45.3 && lon >= 13.3 && lon <= 19.5) return 'Croatia'
  if (lat >= 41.1 && lat <= 44.3 && lon >= 22.3 && lon <= 29.8) return 'Bulgaria'
  if (lat >= 43.5 && lat <= 48.3 && lon >= 20.2 && lon <= 30) return 'Romania'
  if (lat >= 36 && lat <= 42.2 && lon >= 26 && lon <= 45) return 'Turkey'
  if (lat >= 44 && lat <= 52.5 && lon >= 22 && lon <= 40.3) return 'Ukraine'
  if (lat >= 41 && lat <= 82 && lon >= 19 && lon <= 60) return 'Russia'
  if (lat >= 51.2 && lat <= 59.6 && lon >= -8.7 && lon <= 1.8) return 'United Kingdom'
  if (lat >= 55 && lat <= 71.2 && lon >= 4.5 && lon <= 31.5) return 'Sweden'
  if (lat >= 57.9 && lat <= 71.2 && lon >= 4.5 && lon <= 31.5) return 'Norway'
  if (lat >= 59.5 && lat <= 70.1 && lon >= 19 && lon <= 32) return 'Finland'
  return 'Europe'
}

/**
 * Spatially diversify FIRMS detections.
 * Raw feeds can return thousands of points clustered in one region;
 * taking only the first N rows starves Spain/Italy of markers.
 */
function sampleGeographically(points: FirmsPoint[], maxPoints = 280): FirmsPoint[] {
  if (points.length <= maxPoints) {
    return [...points].sort((a, b) => b.bright - a.bright)
  }

  // ~1° grid cells across Europe — keep the brightest detections per cell
  const cells = new Map<string, FirmsPoint[]>()
  for (const p of points) {
    const key = `${Math.floor(p.lat)}:${Math.floor(p.lon)}`
    const list = cells.get(key) ?? []
    list.push(p)
    cells.set(key, list)
  }

  for (const list of cells.values()) {
    list.sort((a, b) => b.bright - a.bright || b.frp - a.frp)
  }

  const selected: FirmsPoint[] = []
  const cellKeys = [...cells.keys()]

  // Round-robin: one (then more) from each cell so Southern Europe isn't dropped
  let round = 0
  while (selected.length < maxPoints) {
    let added = false
    for (const key of cellKeys) {
      const list = cells.get(key)!
      if (round < list.length) {
        selected.push(list[round])
        added = true
        if (selected.length >= maxPoints) break
      }
    }
    if (!added) break
    round += 1
  }

  return selected.sort((a, b) => b.bright - a.bright)
}

export function parseFirmsCsv(csv: string) {
  const lines = csv.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',')
  const latIdx = headers.indexOf('latitude')
  const lonIdx = headers.indexOf('longitude')
  const brightIdx = headers.indexOf('bright_ti4')
  const dateIdx = headers.indexOf('acq_date')
  const timeIdx = headers.indexOf('acq_time')
  const confIdx = headers.indexOf('confidence')
  const frpIdx = headers.indexOf('frp')

  const parsed: FirmsPoint[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',')
    const lat = Number(cols[latIdx])
    const lon = Number(cols[lonIdx])
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
    parsed.push({
      lat,
      lon,
      bright: Number(cols[brightIdx] || 0),
      date: cols[dateIdx],
      time: (cols[timeIdx] || '0000').padStart(4, '0'),
      confidence: cols[confIdx] || 'n/a',
      frp: Number(cols[frpIdx] || 0),
    })
  }

  const sampled = sampleGeographically(parsed, 280)

  return sampled.map((p, idx) => {
    const country = inferCountry(p.lat, p.lon)
    const time = p.time
    const ts = new Date(
      `${p.date}T${time.slice(0, 2)}:${time.slice(2)}:00Z`,
    ).toISOString()

    return {
      id: `FIRMS-${p.date}-${p.lat.toFixed(3)}-${p.lon.toFixed(3)}-${idx}`,
      type: 'wildfire' as const,
      title: `Thermal anomaly — ${country}`,
      severity:
        p.bright > 340 || p.frp > 30
          ? ('high' as const)
          : p.bright > 320
            ? ('moderate' as const)
            : ('low' as const),
      status: 'active' as const,
      latitude: p.lat,
      longitude: p.lon,
      country,
      description: `NASA FIRMS VIIRS thermal anomaly at ${p.lat.toFixed(4)}°, ${p.lon.toFixed(4)}° (confidence: ${p.confidence}${p.frp ? `, FRP ${p.frp}` : ''}). Coordinates come from the satellite detection product. May represent wildfire, agricultural burn, or other heat source — not a confirmed emergency incident.`,
      timestamp: ts,
      startTime: ts,
      source: 'NASA FIRMS',
      externalSources: [
        { label: 'NASA FIRMS', url: 'https://firms.modaps.eosdis.nasa.gov/' },
      ],
    }
  })
}

export async function fetchFirmsIncidents(mapKey: string) {
  // Europe bbox (west,south,east,north), last 2 days of VIIRS NRT
  const area = '-10,35,40,60'
  const firmsUrl = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/VIIRS_SNPP_NRT/${area}/2`
  const firmsRes = await fetch(firmsUrl)
  if (!firmsRes.ok) {
    return {
      ok: false as const,
      status: firmsRes.status,
      error: `FIRMS upstream ${firmsRes.status}`,
    }
  }
  const text = await firmsRes.text()
  if (text.startsWith('Invalid') || text.toLowerCase().includes('error')) {
    return { ok: false as const, status: 502, error: 'FIRMS rejected the request' }
  }
  return { ok: true as const, incidents: parseFirmsCsv(text) }
}

export async function runCloudflareSummary(options: {
  accountId: string
  token: string
  incidents: unknown[]
  system?: string
}) {
  const userContent = JSON.stringify(
    {
      instruction:
        'Summarize only the following incidents by category. Return JSON with overview, sections[], and uncertainty. Do not invent events.',
      incidents: options.incidents,
    },
    null,
    2,
  )

  const cfRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${options.accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${options.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: options.system || AI_SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
      }),
    },
  )

  const data = (await cfRes.json()) as {
    success?: boolean
    result?: { response?: string }
    errors?: Array<{ message?: string }>
  }

  if (!cfRes.ok || !data.result?.response) {
    return {
      ok: false as const,
      status: cfRes.status || 502,
      error:
        data.errors?.[0]?.message || 'Cloudflare Workers AI request failed',
    }
  }

  return { ok: true as const, summary: data.result.response }
}
