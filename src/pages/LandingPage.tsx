import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  Brain,
  ChevronDown,
  Layers,
  Map,
  Radio,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'

const LandingMapPreview = lazy(() =>
  import('@/components/map/LandingMapPreview').then((m) => ({
    default: m.LandingMapPreview,
  })),
)

const features = [
  {
    icon: Map,
    title: 'Interactive Dashboard',
    body: 'A command-center layout for monitoring public hazard signals across regions.',
  },
  {
    icon: Layers,
    title: 'Map Preview',
    body: 'Leaflet layers for wildfires, floods, earthquakes, storms, air quality, and more.',
  },
  {
    icon: Radio,
    title: 'Incident Feed',
    body: 'Newest-first timeline with severity, status, and clear Live vs Demo tags.',
  },
  {
    icon: Brain,
    title: 'AI Situation Summary',
    body: 'Structured-data summaries only — no speculation, no operational advice.',
  },
]

const sources = [
  { name: 'USGS Earthquakes', status: 'Live' },
  { name: 'GDACS hazards', status: 'Live' },
  { name: 'Open-Meteo weather / AQ / flood', status: 'Live' },
  { name: 'USGS Volcanoes', status: 'Live' },
  { name: 'NASA FIRMS / GDACS wildfires', status: 'Live' },
  { name: 'OpenStreetMap facilities', status: 'Live' },
]

/** Abstract Europe-facing situation map for the hero right plane. */
function HeroSituationVisual() {
  const signals = [
    { x: 28, y: 42, color: '#FF5C33', delay: 0, r: 5 },
    { x: 46, y: 58, color: '#3B82F6', delay: 0.4, r: 4 },
    { x: 62, y: 36, color: '#C4A35A', delay: 0.8, r: 4.5 },
    { x: 54, y: 48, color: '#FF8C42', delay: 1.1, r: 3.5 },
    { x: 38, y: 28, color: '#E11D48', delay: 0.55, r: 4 },
    { x: 70, y: 52, color: '#14B8A6', delay: 1.35, r: 3.5 },
    { x: 22, y: 55, color: '#7C9CBF', delay: 0.95, r: 3 },
  ] as const

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Soft vignette so it reads as one composition with the hero */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_55%_45%,rgba(30,30,30,0.55)_0%,transparent_72%)]" />

      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="heroMapGlow" cx="55%" cy="45%" r="55%">
            <stop offset="0%" stopColor="rgba(255,140,66,0.12)" />
            <stop offset="55%" stopColor="rgba(91,159,212,0.06)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <linearGradient id="heroCoast" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
          </linearGradient>
        </defs>

        <rect width="100" height="100" fill="url(#heroMapGlow)" />

        {/* Stylized landmass silhouette (not a real basemap) */}
        <path
          d="M18 22 C28 18, 38 20, 48 17 C58 14, 68 16, 78 22 C86 28, 90 38, 88 48 C86 60, 80 70, 70 76 C58 84, 44 86, 32 80 C22 74, 14 62, 12 48 C10 36, 12 26, 18 22 Z"
          fill="rgba(255,255,255,0.03)"
          stroke="url(#heroCoast)"
          strokeWidth="0.35"
        />
        <path
          d="M52 30 C60 28, 68 32, 72 40 C76 50, 74 60, 66 66 C58 72, 48 70, 44 62 C40 54, 44 34, 52 30 Z"
          fill="rgba(255,255,255,0.025)"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.25"
        />

        {/* Meridian / latitude hints */}
        {[30, 45, 60, 75].map((y) => (
          <line
            key={`lat-${y}`}
            x1="8"
            y1={y}
            x2="92"
            y2={y}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="0.2"
          />
        ))}
        {[25, 45, 65, 85].map((x) => (
          <line
            key={`lon-${x}`}
            x1={x}
            y1="12"
            x2={x}
            y2="88"
            stroke="rgba(255,255,255,0.035)"
            strokeWidth="0.2"
          />
        ))}

        {/* Sweep arc */}
        <motion.circle
          cx="50"
          cy="50"
          r="34"
          fill="none"
          stroke="rgba(255,140,66,0.18)"
          strokeWidth="0.35"
          strokeDasharray="4 10"
          animate={{ rotate: 360 }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '50px 50px' }}
        />

        {signals.map((s) => (
          <g key={`${s.x}-${s.y}-${s.color}`}>
            <motion.circle
              cx={s.x}
              cy={s.y}
              r={s.r * 2.8}
              fill={s.color}
              initial={{ opacity: 0.08, scale: 0.7 }}
              animate={{ opacity: [0.08, 0.22, 0.08], scale: [0.75, 1.15, 0.75] }}
              transition={{
                duration: 3.2,
                delay: s.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ transformOrigin: `${s.x}px ${s.y}px` }}
            />
            <motion.circle
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill={s.color}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.75, 1, 0.75] }}
              transition={{
                duration: 2.4,
                delay: s.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </g>
        ))}
      </svg>

      {/* Soft edge blend into page background */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-surface-950/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-surface-950 to-transparent" />
    </div>
  )
}

export function LandingPage() {
  return (
    <div className="bg-surface-950">
      {/* Full-viewport hero — owns the entire first screen */}
      <section className="relative flex h-dvh min-h-[640px] w-full flex-col overflow-hidden">
        {/* Full-bleed visual plane */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(160deg, #121212 0%, #161616 45%, #0d0d0d 100%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.55]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
              backgroundSize: '72px 72px',
              maskImage:
                'radial-gradient(ellipse 85% 70% at 60% 45%, black 20%, transparent 75%)',
            }}
          />
          <motion.div
            className="absolute -left-[10%] top-[15%] h-[55vh] w-[55vh] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(255,140,66,0.22) 0%, transparent 68%)',
            }}
            animate={{ opacity: [0.55, 0.85, 0.55], scale: [1, 1.06, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute right-[-5%] top-[10%] h-[40vh] w-[40vh] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(239,68,68,0.14) 0%, transparent 70%)',
            }}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-[8%] left-[35%] h-[35vh] w-[45vh] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(91,159,212,0.12) 0%, transparent 70%)',
            }}
            animate={{ opacity: [0.35, 0.65, 0.35] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Horizon fade */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-surface-950 to-transparent" />
        </div>

        <nav className="relative z-10 flex w-full items-center justify-between px-6 py-5 md:px-10 lg:px-14">
          <div className="flex items-center gap-2.5">
            <Activity className="h-5 w-5 text-accent" aria-hidden />
            <span className="text-base font-semibold tracking-tight text-white md:text-lg">
              CrisisHub
            </span>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <a
              href="#features"
              className="hidden text-sm text-surface-300 transition-colors hover:text-white sm:inline"
            >
              Features
            </a>
            <a
              href="#sources"
              className="hidden text-sm text-surface-300 transition-colors hover:text-white sm:inline"
            >
              Data Sources
            </a>
            <Link to="/app">
              <Button size="sm">Explore Demo</Button>
            </Link>
          </div>
        </nav>

        <div className="relative z-10 mx-auto grid w-full max-w-[1400px] flex-1 items-center gap-10 px-6 md:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.95fr)] lg:gap-6 lg:px-14 xl:gap-10">
          <div className="max-w-2xl lg:max-w-none">
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-display text-[clamp(3.25rem,10vw,8rem)] leading-[0.92] tracking-tight text-white"
            >
              CrisisHub
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-8 max-w-xl text-[clamp(1.35rem,2.6vw,2.1rem)] font-medium leading-snug text-surface-100"
            >
              When every minute matters, clarity matters.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18 }}
              className="mt-5 max-w-lg text-base leading-relaxed text-surface-300 md:text-lg"
            >
              Monitor public emergency information through interactive maps, live
              feeds and AI-powered summaries.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.26 }}
              className="mt-10 flex flex-wrap gap-3"
            >
              <Link to="/app">
                <Button size="lg">
                  Explore Demo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="secondary">
                  Learn More
                </Button>
              </a>
            </motion.div>
          </div>

          {/* Dominant right visual — situational map plane, not a card */}
          <motion.div
            initial={{ opacity: 0, x: 36 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto hidden h-[min(58vh,520px)] w-full max-w-xl lg:mx-0 lg:block xl:max-w-none"
            aria-hidden
          >
            <HeroSituationVisual />
          </motion.div>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-4 px-6 pb-6 md:px-10 lg:px-14">
          <p className="flex items-center gap-2 text-center text-xs text-surface-500">
            <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Informational awareness only — not an emergency operations system.
          </p>
          <motion.a
            href="#features"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: [0, 6, 0] }}
            transition={{
              opacity: { delay: 0.55, duration: 0.4 },
              y: { delay: 0.9, duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="inline-flex rounded-full p-2 text-surface-400 transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-label="Scroll to features"
          >
            <ChevronDown className="h-6 w-6" aria-hidden />
          </motion.a>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 py-24 md:px-10">
        <h2 className="text-display text-4xl text-white sm:text-5xl">Features</h2>
        <p className="mt-3 max-w-2xl text-surface-400">
          Built for civil protection analysts, municipalities, journalists, and
          researchers who need a clear picture — not a dispatch console.
        </p>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {features.map((feature, i) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.06 }}
              className="border-t border-white/10 pt-6"
            >
              <feature.icon className="h-5 w-5 text-accent" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-surface-400">
                {feature.body}
              </p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/6 bg-surface-900/50">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-24 md:px-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-display text-4xl text-white">See the bigger picture</h2>
            <p className="mt-3 max-w-md text-surface-300">
              Spot what is happening across Europe on one map. Tap a marker to
              learn more, turn layers on or off, and jump straight into the full
              Operation Center when you are ready.
            </p>
            <Link to="/app" className="mt-6 inline-block">
              <Button variant="secondary">
                Open Operation Center
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="aspect-[16/10] w-full min-h-[280px]">
            <Suspense
              fallback={<Skeleton className="h-full min-h-[280px] w-full rounded-2xl" />}
            >
              <LandingMapPreview />
            </Suspense>
          </div>
        </div>
      </section>

      <section id="sources" className="mx-auto max-w-6xl px-6 py-24 md:px-10">
        <h2 className="text-display text-4xl text-white">Data Sources</h2>
        <p className="mt-3 max-w-2xl text-surface-400">
          Hazard layers, weather, facilities, and AI summaries use live public
          APIs (USGS, GDACS, Open-Meteo, OSM, Cloudflare).
        </p>
        <ul className="mt-10 flex flex-wrap gap-3">
          {sources.map((source) => (
            <li
              key={source.name}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-surface-900 px-4 py-2 text-sm text-surface-200"
            >
              <span>{source.name}</span>
              <span
                className={`rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
                  source.status === 'Live'
                    ? 'border-resolved/35 text-resolved'
                    : source.status === 'Mixed'
                      ? 'border-info/35 text-info'
                      : 'border-warning/30 text-warning'
                }`}
              >
                {source.status}
              </span>
            </li>
          ))}
        </ul>
        <Link
          to="/app/sources"
          className="mt-6 inline-block text-sm text-accent hover:underline"
        >
          Full data sources breakdown →
        </Link>
      </section>

      <footer className="border-t border-white/6 px-6 py-10 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-surface-500">
            © {new Date().getFullYear()} CrisisHub — Monitor. Understand.
            Visualize. Summarize.
          </p>
          <Link to="/app" className="text-sm text-accent hover:underline">
            Enter Operation Center
          </Link>
        </div>
      </footer>
    </div>
  )
}
