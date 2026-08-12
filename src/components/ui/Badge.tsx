import type { Severity, IncidentStatus } from '@/types/incident'
import {
  provenanceLabel,
  type ProvenanceKind,
} from '@/lib/provenance'

const severityStyles: Record<Severity, string> = {
  critical: 'bg-critical/15 text-critical border-critical/30',
  high: 'bg-warning/15 text-warning border-warning/30',
  moderate: 'bg-info/15 text-info border-info/30',
  low: 'bg-surface-600/40 text-surface-300 border-surface-500/40',
  info: 'bg-info/15 text-info border-info/30',
}

const statusStyles: Record<IncidentStatus, string> = {
  active: 'bg-critical/15 text-critical border-critical/30',
  monitoring: 'bg-warning/15 text-warning border-warning/30',
  contained: 'bg-info/15 text-info border-info/30',
  resolved: 'bg-resolved/15 text-resolved border-resolved/30',
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${severityStyles[severity]}`}
    >
      {severity}
    </span>
  )
}

export function StatusBadge({ status }: { status: IncidentStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${statusStyles[status]}`}
    >
      {status}
    </span>
  )
}

const provenanceStyles: Record<ProvenanceKind, string> = {
  live: 'border-resolved/35 bg-resolved/10 text-resolved',
  demo: 'border-warning/30 bg-warning/10 text-warning',
  mixed: 'border-info/35 bg-info/10 text-info',
  local: 'border-white/15 bg-white/[0.06] text-surface-200',
}

export function ProvenanceBadge({
  kind,
  label,
}: {
  kind: ProvenanceKind
  /** Override default Live / Demo / Mixed / Local text */
  label?: string
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${provenanceStyles[kind]}`}
    >
      {label ?? provenanceLabel(kind)}
    </span>
  )
}
