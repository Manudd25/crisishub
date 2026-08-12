import { Brain, Loader2, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useCrisis } from '@/context/CrisisContext'
import { Button } from '@/components/ui/Button'
import { ProvenanceBadge } from '@/components/ui/Badge'
import { formatDateTime } from '@/lib/format'
import { typeColor } from '@/services/mapService'
import type { AiSummarySection, IncidentType } from '@/types/incident'

function aiProvenance(provider?: string) {
  const p = (provider ?? '').toLowerCase()
  if (p.includes('cloudflare') || p.includes('workers')) {
    return { kind: 'live' as const, label: 'Live · Cloudflare AI' }
  }
  if (p.includes('local')) {
    return { kind: 'local' as const, label: 'Local summarizer' }
  }
  return { kind: 'mixed' as const, label: 'Provider varies' }
}

export function AiSummaryPanel() {
  const { summary, summaryLoading, generateSummary, filtered } = useCrisis()
  const hasSections = !!summary?.sections?.length
  const provenance = aiProvenance(summary?.provider)

  return (
    <section className="panel p-4 md:p-5" aria-labelledby="ai-summary-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id="ai-summary-heading"
              className="flex items-center gap-2 text-sm font-semibold text-white"
            >
              <Brain className="h-4 w-4 text-accent" aria-hidden />
              AI Situation Summary
            </h2>
            {summary && !summaryLoading && (
              <ProvenanceBadge kind={provenance.kind} label={provenance.label} />
            )}
          </div>
          <p className="mt-1 text-xs text-surface-400">
            Organized by category — structured incident data only, summarized
            with Cloudflare Workers AI.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => void generateSummary()}
          disabled={summaryLoading}
          aria-label="Generate situation summary"
        >
          {summaryLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          Generate
        </Button>
      </div>

      <div className="mt-4">
        {summaryLoading && (
          <div className="space-y-2" role="status" aria-label="Generating summary">
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-4/5" />
            <div className="skeleton mt-3 h-20 w-full" />
          </div>
        )}

        {!summaryLoading && summary && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <p className="max-w-4xl text-sm leading-relaxed text-surface-200">
              {summary.summary}
            </p>

            {hasSections && (
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {summary.sections.map((section) => (
                  <CategoryBlock
                    key={`${section.category}-${section.title}`}
                    section={section}
                  />
                ))}
              </ul>
            )}

            <p className="text-xs text-surface-500">{summary.uncertaintyNote}</p>
            <div className="flex flex-wrap gap-3 text-[11px] text-surface-500">
              <span>{summary.incidentCount} in input</span>
              <span>{summary.provider}</span>
              <span>{formatDateTime(summary.generatedAt)}</span>
              <span>{filtered.length} filtered</span>
            </div>
          </motion.div>
        )}

        {!summaryLoading && !summary && (
          <p className="text-sm text-surface-400">
            Generate a category-organized summary from the current filtered set.
          </p>
        )}
      </div>
    </section>
  )
}

function CategoryBlock({ section }: { section: AiSummarySection }) {
  const color =
    section.category !== 'overview' && section.category !== 'other'
      ? typeColor(section.category as IncidentType)
      : '#FF8C42'

  return (
    <li className="rounded-lg border border-white/8 bg-surface-850/70 px-3 py-3">
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <p className="text-xs font-semibold text-white">{section.title}</p>
        <span className="ml-auto font-mono text-[10px] text-surface-500">
          {section.count}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-surface-300">{section.text}</p>
    </li>
  )
}
