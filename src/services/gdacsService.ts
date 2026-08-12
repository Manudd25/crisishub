import type { Incident, Severity } from '@/types/incident'

const CACHE_KEY = 'crisishub:gdacs:v1'

type GdacsType = 'FL' | 'TC' | 'VO' | 'WF'

interface GdacsFeature {
  geometry?: { coordinates?: [number, number] | number[] }
  properties?: {
    eventtype?: string
    eventid?: number
    episodeid?: number
    name?: string
    description?: string
    htmldescription?: string
    alertlevel?: string
    country?: string
    fromdate?: string
    todate?: string
    datemodified?: string
    url?: { report?: string; details?: string }
    severitydata?: {
      severity?: number
      severitytext?: string
      severityunit?: string
    }
  }
}

/**
 * GDACS multi-hazard feed (UN/JRC) — floods, tropical cyclones, volcanoes, wildfires.
 * Public GeoJSON with CORS enabled.
 */
export async function fetchGdacsIncidents(): Promise<Incident[]> {
  const to = new Date()
  const from = new Date(to)
  from.setUTCDate(from.getUTCDate() - 45)
  const fromDate = from.toISOString().slice(0, 10)
  const toDate = to.toISOString().slice(0, 10)

  const eventlist = 'FL,TC,VO,WF'
  const url =
    `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH` +
    `?eventlist=${encodeURIComponent(eventlist)}` +
    `&fromDate=${fromDate}&toDate=${toDate}` +
    `&alertlevel=${encodeURIComponent('Green;Orange;Red')}`

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`GDACS ${res.status}`)
    const data = (await res.json()) as { features?: GdacsFeature[] }
    const incidents = (data.features ?? [])
      .map(mapFeature)
      .filter((x): x is Incident => x != null)
      .slice(0, 80)

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

function mapFeature(f: GdacsFeature): Incident | null {
  const p = f.properties
  const coords = f.geometry?.coordinates
  if (!p?.eventtype || !coords || coords.length < 2) return null

  const eventType = p.eventtype as GdacsType
  const type = toIncidentType(eventType)
  if (!type) return null

  const lon = Number(coords[0])
  const lat = Number(coords[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null

  const country = (p.country ?? 'Unknown').split(',')[0]?.trim() || 'Unknown'
  const when = p.datemodified || p.todate || p.fromdate || new Date().toISOString()
  const start = p.fromdate || when
  const severityText = p.severitydata?.severitytext
  const reportUrl = p.url?.report

  return {
    id: `GDACS-${eventType}-${p.eventid}-${p.episodeid ?? 0}`,
    type,
    title: p.name || p.description || `${eventType} event`,
    severity: alertSeverity(p.alertlevel),
    status: 'monitoring',
    latitude: lat,
    longitude: lon,
    country,
    description: [
      p.htmldescription?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() ||
        p.description ||
        p.name,
      severityText ? `Severity context: ${severityText}.` : null,
      'Source: GDACS (UN/JRC). Impact details are not verified by CrisisHub.',
    ]
      .filter(Boolean)
      .join(' '),
    timestamp: new Date(when).toISOString(),
    startTime: new Date(start).toISOString(),
    source: 'GDACS',
    externalSources: reportUrl
      ? [{ label: 'GDACS report', url: reportUrl }]
      : [{ label: 'GDACS', url: 'https://www.gdacs.org/' }],
  }
}

function toIncidentType(
  eventType: string,
): Incident['type'] | null {
  switch (eventType) {
    case 'FL':
      return 'flood'
    case 'TC':
      return 'storm'
    case 'VO':
      return 'volcano'
    case 'WF':
      return 'wildfire'
    default:
      return null
  }
}

function alertSeverity(level?: string): Severity {
  const l = (level ?? '').toLowerCase()
  if (l === 'red') return 'critical'
  if (l === 'orange') return 'high'
  if (l === 'green') return 'moderate'
  return 'info'
}
