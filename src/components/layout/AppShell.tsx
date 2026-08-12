import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Database,
  Globe2,
  LayoutDashboard,
  Radio,
  X,
} from 'lucide-react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

const mobileLinks = [
  { to: '/app', end: true, label: 'Operation Center', icon: LayoutDashboard },
  { to: '/app/regions', label: 'Regional Overview', icon: Globe2 },
  { to: '/app/feed', label: 'Incident Feed', icon: Radio },
  { to: '/app/statistics', label: 'Statistics', icon: BarChart3 },
  { to: '/app/sources', label: 'Data Sources', icon: Database },
]

export function AppShell() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-surface-950">
      <Sidebar />

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              aria-label="Close navigation overlay"
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-white/6 bg-surface-900 p-4 lg:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              aria-label="Mobile navigation"
            >
              <div className="mb-6 flex items-center justify-between">
                <Link
                  to="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2"
                  aria-label="Back to CrisisHub landing page"
                >
                  <Activity className="h-5 w-5 text-accent" />
                  <span className="font-semibold">CrisisHub</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 hover:bg-white/5"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="space-y-1">
                {mobileLinks.map(({ to, end, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                        isActive
                          ? 'bg-accent/15 text-white'
                          : 'text-surface-300 hover:bg-white/5'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </NavLink>
                ))}
              </nav>
              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="mt-6 flex items-center gap-2 px-3 text-xs text-surface-300 hover:text-accent"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                Back to landing
              </Link>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenuClick={() => setOpen(true)} />
        <main className="app-main flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
