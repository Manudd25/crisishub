import type { Incident, Severity } from '@/types/incident'

const CACHE_KEY = 'crisishub:usgs-volcanoes:v1'

interface UsgsElevated {
  vName?: string
  vnum?: string
  lat?: number
  long?: number
  alertLevel?: string
  colorCode?: string
  noticeSynopsis?: string
  noticeUrl?: string
  sentUtc?: string
  alertDate?: string
  obs?: string
}

/**
 * USGS Volcano Hazards elevated-status list (primarily US territories).
 * Complements GDACS volcano events for global coverage.
 */
export async function fetchUsgsVolcanoes(): Promise<Incident[]> {
  try {
    const res = await fetch(
      'https://volcanoes.usgs.gov/vsc/api/volcanoApi/elevated',
    )
    if (!res.ok) throw new Error(`USGS volcanoes ${res.status}`)
    const data = (await res.json()) as UsgsElevated[]
    if (!Array.isArray(data)) return []

    const incidents = data
      .filter(
        (v) =>
          v.lat != null &&
          v.long != null &&
          v.alertLevel &&
          v.alertLevel !== 'NORMAL' &&
          v.alertLevel !== 'UNASSIGNED',
      )
      .map((v): Incident => {
        const when = v.sentUtc || v.alertDate || new Date().toISOString()
        return {
          id: `USGS-VO-${v.vnum ?? v.vName}`,
          type: 'volcano',
          title: `${v.vName ?? 'Volcano'} — ${v.alertLevel}/${v.colorCode}`,
          severity: volcanoSeverity(v.alertLevel, v.colorCode),
          status: 'monitoring',
          latitude: v.lat!,
          longitude: v.long!,
          country: 'United States',
          description:
            (v.noticeSynopsis ??
              `USGS volcano alert level ${v.alertLevel} (${v.colorCode}).`) +
            ' Impact is not verified by CrisisHub.',
          timestamp: parseUsgsDate(when),
          startTime: parseUsgsDate(when),
          source: 'USGS Volcano Hazards',
          externalSources: v.noticeUrl
            ? [{ label: 'USGS notice', url: v.noticeUrl }]
            : [
                {
                  label: 'USGS Volcanoes',
                  url: 'https://volcanoes.usgs.gov/',
                },
              ],
        }
      })

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

function parseUsgsDate(value: string): string {
  const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`
  const ms = Date.parse(normalized)
  return Number.isFinite(ms) ? new Date(ms).toISOString() : new Date().toISOString()
}

function volcanoSeverity(level?: string, color?: string): Severity {
  const c = (color ?? '').toUpperCase()
  const l = (level ?? '').toUpperCase()
  if (c === 'RED' || l === 'WARNING') return 'critical'
  if (c === 'ORANGE' || l === 'WATCH') return 'high'
  if (c === 'YELLOW' || l === 'ADVISORY') return 'moderate'
  return 'info'
}
