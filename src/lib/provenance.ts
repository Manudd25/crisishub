/** True when an incident/source string is curated demo data, not a live feed row. */
export function isDemoSource(source: string): boolean {
  const s = source.toLowerCase()
  return s.includes('(mock)') || s.includes('(demo)') || s.includes('demo only')
}

export type ProvenanceKind = 'live' | 'demo' | 'mixed' | 'local'

export function provenanceLabel(kind: ProvenanceKind): string {
  switch (kind) {
    case 'live':
      return 'Live'
    case 'demo':
      return 'Demo'
    case 'mixed':
      return 'Mixed'
    case 'local':
      return 'Local'
  }
}
