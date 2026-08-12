import type { Incident } from '@/types/incident'
import { geocodeSearch } from './mapService'

export interface LocationFocus {
  latitude: number
  longitude: number
  label: string
  city?: string
  country?: string
}

/** Curated cities for weather/resource focus even when FIRMS points lack city names. */
export const FOCUS_CITIES: Array<{
  city: string
  country: string
  latitude: number
  longitude: number
}> = [
  { city: 'Lisbon', country: 'Portugal', latitude: 38.72, longitude: -9.14 },
  { city: 'Porto', country: 'Portugal', latitude: 41.15, longitude: -8.61 },
  { city: 'Faro', country: 'Portugal', latitude: 37.02, longitude: -7.93 },
  { city: 'Madrid', country: 'Spain', latitude: 40.42, longitude: -3.7 },
  { city: 'Barcelona', country: 'Spain', latitude: 41.39, longitude: 2.17 },
  { city: 'Seville', country: 'Spain', latitude: 37.39, longitude: -5.99 },
  { city: 'Valencia', country: 'Spain', latitude: 39.47, longitude: -0.38 },
  { city: 'Rome', country: 'Italy', latitude: 41.9, longitude: 12.5 },
  { city: 'Milan', country: 'Italy', latitude: 45.46, longitude: 9.19 },
  { city: 'Naples', country: 'Italy', latitude: 40.85, longitude: 14.27 },
  { city: 'Palermo', country: 'Italy', latitude: 38.12, longitude: 13.36 },
  { city: 'Athens', country: 'Greece', latitude: 37.98, longitude: 23.73 },
  { city: 'Thessaloniki', country: 'Greece', latitude: 40.64, longitude: 22.94 },
  { city: 'Paris', country: 'France', latitude: 48.86, longitude: 2.35 },
  { city: 'Marseille', country: 'France', latitude: 43.3, longitude: 5.37 },
  { city: 'Lyon', country: 'France', latitude: 45.76, longitude: 4.84 },
  { city: 'Berlin', country: 'Germany', latitude: 52.52, longitude: 13.41 },
  { city: 'Munich', country: 'Germany', latitude: 48.14, longitude: 11.58 },
  { city: 'Vienna', country: 'Austria', latitude: 48.21, longitude: 16.37 },
  { city: 'Warsaw', country: 'Poland', latitude: 52.23, longitude: 21.01 },
  { city: 'Budapest', country: 'Hungary', latitude: 47.5, longitude: 19.04 },
  { city: 'Bucharest', country: 'Romania', latitude: 44.43, longitude: 26.1 },
  { city: 'Istanbul', country: 'Turkey', latitude: 41.01, longitude: 28.98 },
  { city: 'Kyiv', country: 'Ukraine', latitude: 50.45, longitude: 30.52 },
  { city: 'London', country: 'United Kingdom', latitude: 51.51, longitude: -0.13 },
  { city: 'Amsterdam', country: 'Netherlands', latitude: 52.37, longitude: 4.9 },
]

export function listCitiesForCountry(
  country: string,
  incidents: Incident[],
): string[] {
  const fromIncidents = incidents
    .filter((i) => (country === 'all' ? true : i.country === country) && i.city)
    .map((i) => i.city!)

  const fromDirectory = FOCUS_CITIES.filter((c) =>
    country === 'all' ? true : c.country === country,
  ).map((c) => c.city)

  return [...new Set([...fromDirectory, ...fromIncidents])].sort((a, b) =>
    a.localeCompare(b),
  )
}

export async function resolveLocationFocus(options: {
  country: string
  city: string
  incidents: Incident[]
}): Promise<LocationFocus> {
  const { country, city, incidents } = options

  if (city !== 'all') {
    const known = FOCUS_CITIES.find(
      (c) =>
        c.city === city && (country === 'all' || c.country === country),
    )
    if (known) {
      return {
        latitude: known.latitude,
        longitude: known.longitude,
        label: `${known.city}, ${known.country}`,
        city: known.city,
        country: known.country,
      }
    }

    const matches = incidents.filter(
      (i) =>
        i.city === city && (country === 'all' || i.country === country),
    )
    if (matches.length) {
      const avg = averageCoords(matches)
      return {
        ...avg,
        label: `${city}${matches[0].country ? `, ${matches[0].country}` : ''}`,
        city,
        country: matches[0].country,
      }
    }

    const query = country !== 'all' ? `${city}, ${country}` : city
    const geo = await geocodeSearch(query)
    if (geo) {
      return {
        latitude: geo.lat,
        longitude: geo.lon,
        label: geo.label.split(',').slice(0, 2).join(',').trim() || query,
        city,
        country: country !== 'all' ? country : undefined,
      }
    }
  }

  if (country !== 'all') {
    const inCountry = incidents.filter((i) => i.country === country)
    if (inCountry.length) {
      const avg = averageCoords(inCountry)
      return {
        ...avg,
        label: country,
        country,
      }
    }

    const capital = FOCUS_CITIES.find((c) => c.country === country)
    if (capital) {
      return {
        latitude: capital.latitude,
        longitude: capital.longitude,
        label: `${capital.city}, ${country}`,
        city: capital.city,
        country,
      }
    }

    const geo = await geocodeSearch(country)
    if (geo) {
      return {
        latitude: geo.lat,
        longitude: geo.lon,
        label: country,
        country,
      }
    }
  }

  return {
    latitude: 48.8566,
    longitude: 2.3522,
    label: 'Paris (default focus)',
    city: 'Paris',
    country: 'France',
  }
}

function averageCoords(items: Incident[]) {
  const latitude =
    items.reduce((sum, i) => sum + i.latitude, 0) / Math.max(items.length, 1)
  const longitude =
    items.reduce((sum, i) => sum + i.longitude, 0) / Math.max(items.length, 1)
  return { latitude, longitude }
}
