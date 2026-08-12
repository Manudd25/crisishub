import { Link, NavLink } from 'react-router-dom'
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Database,
  Globe2,
  LayoutDashboard,
  Radio,
} from 'lucide-react'

const links = [
  { to: '/app', end: true, label: 'Operation Center', icon: LayoutDashboard },
  { to: '/app/regions', label: 'Regional Overview', icon: Globe2 },
  { to: '/app/feed', label: 'Incident Feed', icon: Radio },
  { to: '/app/statistics', label: 'Statistics', icon: BarChart3 },
  { to: '/app/sources', label: 'Data Sources', icon: Database },
]

export function Sidebar() {
  return (
    <aside
      className="hidden lg:flex w-60 shrink-0 flex-col border-r border-white/10 bg-[#1a1a1a]"
      aria-label="Primary navigation"
    >
      <Link
        to="/"
        className="flex items-center gap-3 border-b border-white/10 px-5 py-5 transition-colors hover:bg-white/[0.04]"
        aria-label="Back to CrisisHub landing page"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 border border-accent/30">
          <Activity className="h-4 w-4 text-accent" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-white">CrisisHub</p>
          <p className="text-[11px] text-surface-400">Situational Awareness</p>
        </div>
      </Link>

      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ to, end, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'border border-accent/35 bg-accent/20 text-white shadow-[inset_0_0_0_1px_rgba(255,140,66,0.08)]'
                  : 'border border-transparent text-surface-300 hover:bg-white/[0.06] hover:text-white'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-3 border-t border-white/10 p-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-xs text-surface-300 transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to Homepage
        </Link>
        <p className="text-[10px] leading-relaxed text-surface-500">
          Monitor · Understand · Visualize · Summarize. Not an emergency command system.
        </p>
      </div>
    </aside>
  )
}
