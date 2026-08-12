import type { ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Incident, IncidentType } from '@/types/incident'
import { format } from 'date-fns'

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  moderate: '#5b9fd4',
  low: '#6b6b6b',
  info: '#5b9fd4',
}

interface Props {
  incidents: Incident[]
  typeLabel: (type: IncidentType) => string
}

export default function StatisticsChartsInner({ incidents, typeLabel }: Props) {
  const byCategory = Object.entries(
    incidents.reduce<Record<string, number>>((acc, i) => {
      const key = typeLabel(i.type)
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {}),
  ).map(([name, value]) => ({ name, value }))

  const byCountry = Object.entries(
    incidents.reduce<Record<string, number>>((acc, i) => {
      acc[i.country] = (acc[i.country] ?? 0) + 1
      return acc
    }, {}),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const bySeverity = Object.entries(
    incidents.reduce<Record<string, number>>((acc, i) => {
      acc[i.severity] = (acc[i.severity] ?? 0) + 1
      return acc
    }, {}),
  ).map(([name, value]) => ({ name, value }))

  const timelineMap = new Map<string, number>()
  for (const i of incidents) {
    const day = format(new Date(i.timestamp), 'MMM d')
    timelineMap.set(day, (timelineMap.get(day) ?? 0) + 1)
  }
  const timeline = [...timelineMap.entries()].map(([day, count]) => ({
    day,
    count,
  }))

  const tickStyle = { fill: '#ffffff', fontSize: 11 }
  const legendStyle = { fontSize: 12, color: '#ffffff' }
  const tooltipStyle = {
    background: '#1e1e1e',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    color: '#ffffff',
    fontSize: 12,
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Incidents by category">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={byCategory}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="name" tick={tickStyle} />
            <YAxis tick={tickStyle} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill="#ff8c42" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Incidents by country">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={byCountry} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
            <XAxis type="number" tick={tickStyle} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={80}
              tick={tickStyle}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill="#ff9d5c" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Timeline">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={timeline}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="day" tick={tickStyle} />
            <YAxis tick={tickStyle} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#ff8c42"
              strokeWidth={2}
              dot={{ r: 3, fill: '#ff8c42' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Severity distribution">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={bySeverity}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
            >
              {bySeverity.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={SEVERITY_COLORS[entry.name] ?? '#64748b'}
                />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend
              wrapperStyle={legendStyle}
              formatter={(value) => (
                <span className="text-white">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

    </div>
  )
}

function ChartCard({
  title,
  children,
  className = '',
  titleId,
}: {
  title: string
  children: ReactNode
  className?: string
  titleId?: string
}) {
  return (
    <section className={`panel p-4 ${className}`} aria-labelledby={titleId}>
      <h3
        id={titleId}
        className="mb-3 text-sm font-semibold text-white"
      >
        {title}
      </h3>
      {children}
    </section>
  )
}
