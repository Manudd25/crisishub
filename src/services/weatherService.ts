import type { WeatherSnapshot } from '@/types/incident'

function cacheKey(latitude: number, longitude: number) {
  return `crisishub:weather:v2:${latitude.toFixed(2)},${longitude.toFixed(2)}`
}

/** Open-Meteo free weather API — falls back to mock on failure. */
export async function fetchWeather(
  latitude = 48.8566,
  longitude = 2.3522,
  location = 'Paris (demo focus)',
): Promise<WeatherSnapshot> {
  const key = cacheKey(latitude, longitude)
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,weather_code` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code` +
      `&timezone=auto&forecast_days=5`

    const res = await fetch(url)
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`)
    const data = await res.json()

    const snapshot: WeatherSnapshot = {
      location,
      latitude,
      longitude,
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      windDirection: data.current.wind_direction_10m,
      precipitation: data.current.precipitation,
      condition: weatherCodeToLabel(data.current.weather_code),
      updatedAt: new Date().toISOString(),
      isDemo: false,
      forecast: (data.daily.time as string[]).map((date: string, i: number) => ({
        date,
        tempMax: data.daily.temperature_2m_max[i],
        tempMin: data.daily.temperature_2m_min[i],
        precipitation: data.daily.precipitation_sum[i],
        windSpeed: data.daily.wind_speed_10m_max[i],
        condition: weatherCodeToLabel(data.daily.weather_code[i]),
      })),
    }

    localStorage.setItem(key, JSON.stringify(snapshot))
    return snapshot
  } catch {
    const cached = localStorage.getItem(key)
    if (cached) return JSON.parse(cached) as WeatherSnapshot
    return getMockWeather(latitude, longitude, location)
  }
}

function weatherCodeToLabel(code: number): string {
  if (code === 0) return 'Clear'
  if (code <= 3) return 'Partly cloudy'
  if (code <= 48) return 'Fog'
  if (code <= 67) return 'Rain'
  if (code <= 77) return 'Snow'
  if (code <= 82) return 'Showers'
  if (code <= 99) return 'Thunderstorm'
  return 'Unknown'
}

function getMockWeather(
  latitude: number,
  longitude: number,
  location: string,
): WeatherSnapshot {
  const today = new Date()
  return {
    location,
    latitude,
    longitude,
    temperature: 28.4,
    humidity: 42,
    windSpeed: 18,
    windDirection: 220,
    precipitation: 0.2,
    condition: 'Partly cloudy',
    updatedAt: new Date().toISOString(),
    isDemo: true,
    forecast: Array.from({ length: 5 }, (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      return {
        date: d.toISOString().slice(0, 10),
        tempMax: 30 - i,
        tempMin: 18 - i * 0.5,
        precipitation: i === 2 ? 4.2 : 0.1 * i,
        windSpeed: 14 + i * 2,
        condition: i === 2 ? 'Rain' : 'Partly cloudy',
      }
    }),
  }
}
