import { Cloud, Droplets, Thermometer, Wind } from 'lucide-react'
import { useCrisis } from '@/context/CrisisContext'
import { ProvenanceBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDateTime } from '@/lib/format'

export function WeatherPanel() {
  const { weather, weatherLoading } = useCrisis()
  const isDemo = weather?.isDemo === true

  return (
    <section className="panel p-4" aria-labelledby="weather-heading">
      <div className="flex items-start justify-between gap-2">
        <h2 id="weather-heading" className="text-sm font-semibold text-white">
          Weather
        </h2>
        {!weatherLoading && weather && (
          <ProvenanceBadge
            kind={isDemo ? 'demo' : 'live'}
            label={isDemo ? 'Demo fallback' : 'Live · Open-Meteo'}
          />
        )}
      </div>
      <p className="mt-1 text-xs text-surface-400">
        Follows the selected city or country filter.
        {isDemo
          ? ' Showing hard-coded demo values because the live request failed.'
          : ' Values from the Open-Meteo forecast API.'}
      </p>

      {weatherLoading || !weather ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <>
          <p className="mt-3 text-xs font-medium text-accent">{weather.location}</p>
          <div className="mt-4 flex items-end gap-3">
            <p className="text-4xl font-semibold tracking-tight text-white">
              {Math.round(weather.temperature)}°
            </p>
            <p className="mb-1 text-sm text-surface-300">{weather.condition}</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Metric icon={Droplets} label="Humidity" value={`${weather.humidity}%`} />
            <Metric
              icon={Wind}
              label="Wind"
              value={`${Math.round(weather.windSpeed)} km/h`}
            />
            <Metric
              icon={Cloud}
              label="Rain"
              value={`${weather.precipitation} mm`}
            />
            <Metric
              icon={Thermometer}
              label="Updated"
              value={formatDateTime(weather.updatedAt).split('·')[1]?.trim() ?? '—'}
            />
          </div>

          <h3 className="mt-5 mb-2 text-xs font-medium uppercase tracking-wide text-surface-500">
            Forecast
          </h3>
          <ul className="space-y-2">
            {weather.forecast.map((day) => (
              <li
                key={day.date}
                className="flex items-center justify-between rounded-lg bg-surface-850/80 px-3 py-2 text-xs"
              >
                <span className="text-surface-300">
                  {new Date(day.date).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span className="text-surface-400">{day.condition}</span>
                <span className="font-mono text-surface-200">
                  {Math.round(day.tempMin)}° / {Math.round(day.tempMax)}°
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wind
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg bg-surface-850/80 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[11px] text-surface-500">
        <Icon className="h-3 w-3" aria-hidden />
        {label}
      </div>
      <p className="mt-1 text-surface-100">{value}</p>
    </div>
  )
}
