import type {
  AiSummaryResult,
  AiSummarySection,
  Incident,
  IncidentType,
} from '@/types/incident'
import { typeLabel } from './mapService'

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

const CATEGORY_ORDER: IncidentType[] = [
  'wildfire',
  'flood',
  'earthquake',
  'storm',
  'heatwave',
  'air_quality',
  'volcano',
  'weather_alert',
]

/**
 * AI Situation Summary provider.
 * Prefers Cloudflare via same-origin proxy; falls back to local categorized summary.
 */
export async function generateSituationSummary(
  incidents: Incident[],
): Promise<AiSummaryResult> {
  const payload = buildStructuredPayload(incidents)
  const local = localSummarize(incidents)

  try {
    const res = await fetch('/api/ai/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: AI_SYSTEM_PROMPT,
        incidents: payload,
        grouped: groupByCategory(incidents),
      }),
    })
    if (res.ok) {
      const data = (await res.json()) as {
        summary?: string
        sections?: AiSummarySection[]
        uncertainty?: string
      }

      const parsed = parseModelSummary(data.summary, incidents)
      if (parsed) {
        const result: AiSummaryResult = {
          ...parsed,
          provider: 'cloudflare',
          generatedAt: new Date().toISOString(),
          incidentCount: incidents.length,
        }
        persistSummary(result)
        return result
      }

      if (data.sections?.length) {
        const result: AiSummaryResult = {
          summary: data.summary?.trim() || local.summary,
          sections: data.sections,
          generatedAt: new Date().toISOString(),
          incidentCount: incidents.length,
          uncertaintyNote:
            data.uncertainty?.trim() || local.uncertaintyNote,
          provider: 'cloudflare',
        }
        persistSummary(result)
        return result
      }
    }
  } catch {
    // Proxy unavailable — use local categorised summarizer.
  }

  persistSummary(local)
  return local
}

function buildStructuredPayload(incidents: Incident[]) {
  return incidents.map((i) => ({
    id: i.id,
    type: i.type,
    title: i.title,
    severity: i.severity,
    status: i.status,
    country: i.country,
    city: i.city,
    timestamp: i.timestamp,
    source: i.source,
  }))
}

function groupByCategory(incidents: Incident[]) {
  const groups: Record<string, ReturnType<typeof buildStructuredPayload>> = {}
  for (const inc of incidents) {
    const key = inc.type
    if (!groups[key]) groups[key] = []
    groups[key].push({
      id: inc.id,
      type: inc.type,
      title: inc.title,
      severity: inc.severity,
      status: inc.status,
      country: inc.country,
      city: inc.city,
      timestamp: inc.timestamp,
      source: inc.source,
    })
  }
  return groups
}

function parseModelSummary(
  raw: string | undefined,
  incidents: Incident[],
): AiSummaryResult | null {
  if (!raw?.trim()) return null

  const json = extractJson(raw)
  if (!json) return null

  try {
    const data = JSON.parse(json) as {
      overview?: string
      sections?: Array<{
        category?: string
        title?: string
        text?: string
        count?: number
      }>
      uncertainty?: string
    }

    const sections: AiSummarySection[] = (data.sections ?? [])
      .filter((s) => s.text?.trim())
      .map((s) => {
        const category = normalizeCategory(s.category)
        const count =
          s.count ??
          incidents.filter((i) =>
            category === 'other' || category === 'overview'
              ? false
              : i.type === category,
          ).length
        return {
          category,
          title: s.title?.trim() || sectionTitle(category),
          text: s.text!.trim(),
          count,
        }
      })

    if (!data.overview && !sections.length) return null

    return {
      summary: data.overview?.trim() || sections.map((s) => s.text).join(' '),
      sections:
        sections.length > 0
          ? sections
          : localSummarize(incidents).sections,
      generatedAt: new Date().toISOString(),
      incidentCount: incidents.length,
      uncertaintyNote:
        data.uncertainty?.trim() ||
        'Source coverage and latency introduce uncertainty.',
      provider: 'cloudflare',
    }
  } catch {
    return null
  }
}

function extractJson(raw: string): string | null {
  const trimmed = raw.trim()
  if (trimmed.startsWith('{')) return trimmed
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) return fenced[1].trim()
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1)
  return null
}

function normalizeCategory(value?: string): AiSummarySection['category'] {
  if (!value) return 'other'
  const key = value.toLowerCase().replace(/\s+/g, '_')
  if (key === 'overview') return 'overview'
  if ((CATEGORY_ORDER as string[]).includes(key)) return key as IncidentType
  if (key.includes('fire')) return 'wildfire'
  if (key.includes('flood')) return 'flood'
  if (key.includes('quake') || key.includes('seismic')) return 'earthquake'
  if (key.includes('storm')) return 'storm'
  if (key.includes('heat')) return 'heatwave'
  if (key.includes('air')) return 'air_quality'
  if (key.includes('volcano')) return 'volcano'
  if (key.includes('weather')) return 'weather_alert'
  return 'other'
}

function sectionTitle(category: AiSummarySection['category']): string {
  if (category === 'overview') return 'Overview'
  if (category === 'other') return 'Other'
  return typeLabel(category)
}

/** Deterministic categorised summarizer — never invents incidents. */
function localSummarize(incidents: Incident[]): AiSummaryResult {
  if (!incidents.length) {
    return {
      summary:
        'No incidents are present in the current filtered dataset. This may reflect filters, data latency, or incomplete source coverage — not necessarily the absence of events.',
      sections: [],
      generatedAt: new Date().toISOString(),
      incidentCount: 0,
      uncertaintyNote:
        'Empty input set. Summary cannot assert conditions beyond the provided data.',
      provider: 'local',
    }
  }

  const active = incidents.filter(
    (i) => i.status === 'active' || i.status === 'monitoring',
  )
  const sections: AiSummarySection[] = []

  for (const type of CATEGORY_ORDER) {
    const items = active.filter((i) => i.type === type)
    if (!items.length) continue

    const byCountry = countBy(items, (i) => i.country)
    const topCountries = Object.entries(byCountry)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([c, n]) => `${c} (${n})`)

    const high = items.filter(
      (i) => i.severity === 'critical' || i.severity === 'high',
    ).length
    const samples = items
      .slice(0, 2)
      .map((i) => `${i.title}${i.city ? ` · ${i.city}` : ''}`)

    const bits = [
      `${items.length} active or monitored ${typeLabel(type).toLowerCase()} record${items.length === 1 ? '' : 's'} in the current set.`,
    ]
    if (topCountries.length) {
      bits.push(`Locations in the data include ${joinList(topCountries)}.`)
    }
    if (high) {
      bits.push(
        `${high} marked high or critical severity.`,
      )
    }
    if (samples.length) {
      bits.push(`Examples from the input: ${joinList(samples)}.`)
    }

    sections.push({
      category: type,
      title: typeLabel(type),
      text: bits.join(' '),
      count: items.length,
    })
  }

  const resolved = incidents.filter(
    (i) => i.status === 'resolved' || i.status === 'contained',
  )
  const overviewParts = [
    `Dataset contains ${incidents.length} incident${incidents.length === 1 ? '' : 's'} (${active.length} active or monitored) across ${sections.length} categor${sections.length === 1 ? 'y' : 'ies'}.`,
  ]
  if (resolved.length) {
    overviewParts.push(
      `${resolved.length} marked contained or resolved.`,
    )
  }

  return {
    summary: overviewParts.join(' '),
    sections,
    generatedAt: new Date().toISOString(),
    incidentCount: incidents.length,
    uncertaintyNote:
      'Figures reflect only the structured incidents supplied. Coverage gaps and reporting delays mean the picture may be incomplete.',
    provider: 'local',
  }
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

function countBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const k = key(item)
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})
}

const SUMMARY_CACHE = 'crisishub:ai-summary:v2'

function persistSummary(result: AiSummaryResult) {
  localStorage.setItem(SUMMARY_CACHE, JSON.stringify(result))
}

export function loadCachedSummary(): AiSummaryResult | null {
  const raw = localStorage.getItem(SUMMARY_CACHE)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as AiSummaryResult
    if (!parsed.sections) parsed.sections = []
    return parsed
  } catch {
    return null
  }
}
