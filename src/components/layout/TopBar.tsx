import { Link } from 'react-router-dom'
import { FileDown, Menu, RefreshCw, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useCrisis } from '@/context/CrisisContext'
import { generatePdfReport } from '@/services/reportService'

interface TopBarProps {
  onMenuClick?: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const {
    filters,
    setFilters,
    refresh,
    loading,
    filtered,
    stats,
    summary,
  } = useCrisis()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/10 bg-[#181818cc] px-4 backdrop-blur-xl">
      <button
        type="button"
        className="lg:hidden rounded-lg p-2 text-surface-300 hover:bg-white/5"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <Link to="/" className="lg:hidden text-sm font-semibold text-white">
        CrisisHub
      </Link>

      <div className="relative flex-1 max-w-xl">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500"
          aria-hidden
        />
        <input
          type="search"
          value={filters.query}
          onChange={(e) => setFilters({ query: e.target.value })}
          placeholder="Search city, country, coordinates, incident ID…"
          className="w-full rounded-lg border border-white/12 bg-surface-850 py-2 pl-10 pr-3 text-sm text-surface-100 placeholder:text-surface-400 focus:border-accent/60"
          aria-label="Search incidents"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void refresh()}
          disabled={loading}
          aria-label="Refresh data"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            generatePdfReport({ incidents: filtered, stats, summary })
          }
          aria-label="Export PDF report"
        >
          <FileDown className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">PDF</span>
        </Button>
      </div>
    </header>
  )
}
