import type { MapPoi, ResourcePool } from '@/types/incident'
import { queryOverpass } from './overpassClient'

const CACHE_PREFIX = 'crisishub:osm-resources:v3:'

export interface FetchResourcesOptions {
  latitude: number
  longitude: number
  label: string
  /** Search radius in km — tighter for cities, wider for country focus. */
  radiusKm: number
  scopeLevel: ResourcePool['scopeLevel']
}

/**
 * Live OpenStreetMap amenity counts via Overpass (not operational deployments).
 * Counts mapped hospitals, clinics, fire stations, police, pharmacies,
 * emergency services, and social / assembly facilities near the selected focus.
 */
export async function fetchAreaResources(
  options: FetchResourcesOptions,
): Promise<ResourcePool> {
  const { latitude, longitude, label, radiusKm, scopeLevel } = options
  const cacheKey = `${CACHE_PREFIX}${latitude.toFixed(2)},${longitude.toFixed(2)},${radiusKm}`

  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const parsed = JSON.parse(cached) as ResourcePool & { cachedAt?: number }
      if (parsed.cachedAt && Date.now() - parsed.cachedAt < 6 * 60 * 60 * 1000) {
        return { ...parsed, scopeLabel: label, scopeLevel }
      }
    }
  } catch {
    /* ignore cache parse errors */
  }

  const meters = Math.round(radiusKm * 1000)
  const query = `
[out:json][timeout:28];
(
  node["amenity"="hospital"](around:${meters},${latitude},${longitude});
  way["amenity"="hospital"](around:${meters},${latitude},${longitude});
  node["amenity"="clinic"](around:${meters},${latitude},${longitude});
  way["amenity"="clinic"](around:${meters},${latitude},${longitude});
  node["amenity"="fire_station"](around:${meters},${latitude},${longitude});
  way["amenity"="fire_station"](around:${meters},${latitude},${longitude});
  node["amenity"="police"](around:${meters},${latitude},${longitude});
  way["amenity"="police"](around:${meters},${latitude},${longitude});
  node["amenity"="pharmacy"](around:${meters},${latitude},${longitude});
  way["amenity"="pharmacy"](around:${meters},${latitude},${longitude});
  node["emergency"="ambulance_station"](around:${meters},${latitude},${longitude});
  way["emergency"="ambulance_station"](around:${meters},${latitude},${longitude});
  node["emergency"="disaster_response"](around:${meters},${latitude},${longitude});
  way["emergency"="disaster_response"](around:${meters},${latitude},${longitude});
  node["amenity"="social_facility"](around:${meters},${latitude},${longitude});
  way["amenity"="social_facility"](around:${meters},${latitude},${longitude});
  node["emergency"="assembly_point"](around:${meters},${latitude},${longitude});
  way["emergency"="assembly_point"](around:${meters},${latitude},${longitude});
);
out tags center;
`.trim()

  try {
    const data = await queryOverpass(query)
    const elements = data.elements

    let hospitals = 0
    let clinics = 0
    let fireStations = 0
    let policeStations = 0
    let pharmacies = 0
    let emergencyServices = 0
    let socialFacilities = 0

    for (const el of elements) {
      const amenity = el.tags?.amenity
      const emergency = el.tags?.emergency
      if (amenity === 'hospital') hospitals += 1
      else if (amenity === 'clinic') clinics += 1
      else if (amenity === 'fire_station') fireStations += 1
      else if (amenity === 'police') policeStations += 1
      else if (amenity === 'pharmacy') pharmacies += 1
      else if (
        emergency === 'ambulance_station' ||
        emergency === 'disaster_response'
      ) {
        emergencyServices += 1
      } else if (
        amenity === 'social_facility' ||
        emergency === 'assembly_point'
      ) {
        socialFacilities += 1
      }
    }

    const pool: ResourcePool = {
      hospitals,
      clinics,
      fireStations,
      policeStations,
      pharmacies,
      emergencyServices,
      socialFacilities,
      lastUpdated: new Date().toISOString(),
      scopeLabel: label,
      scopeLevel,
      radiusKm,
      isDemo: false,
      source: 'OpenStreetMap',
    }

    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ ...pool, cachedAt: Date.now() }),
      )
    } catch {
      /* quota */
    }

    return pool
  } catch {
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const parsed = JSON.parse(cached) as ResourcePool
        return {
          ...parsed,
          scopeLabel: label,
          scopeLevel,
          isDemo: false,
          source: 'OpenStreetMap (cache)',
        }
      }
    } catch {
      /* ignore */
    }

    return emptyResources(label, scopeLevel, radiusKm, true)
  }
}

export function emptyResources(
  label: string,
  scopeLevel: ResourcePool['scopeLevel'] = 'region',
  radiusKm = 15,
  failed = false,
): ResourcePool {
  return {
    hospitals: 0,
    clinics: 0,
    fireStations: 0,
    policeStations: 0,
    pharmacies: 0,
    emergencyServices: 0,
    socialFacilities: 0,
    lastUpdated: new Date().toISOString(),
    scopeLabel: label,
    scopeLevel,
    radiusKm,
    isDemo: failed,
    source: failed ? 'OpenStreetMap (unavailable)' : 'OpenStreetMap',
  }
}

/** Derive facility counts from already-fetched map POIs (avoids a second Overpass call). */
export function countResourcesFromPois(options: {
  pois: MapPoi[]
  label: string
  radiusKm: number
  scopeLevel: ResourcePool['scopeLevel']
  isDemo?: boolean
}): ResourcePool {
  const { pois, label, radiusKm, scopeLevel, isDemo = false } = options
  let hospitals = 0
  let clinics = 0
  let fireStations = 0
  let policeStations = 0
  let pharmacies = 0
  let emergencyServices = 0
  let socialFacilities = 0

  for (const p of pois) {
    switch (p.kind) {
      case 'hospital':
        hospitals += 1
        break
      case 'clinic':
        clinics += 1
        break
      case 'fire_station':
        fireStations += 1
        break
      case 'police':
        policeStations += 1
        break
      case 'pharmacy':
        pharmacies += 1
        break
      case 'emergency':
        emergencyServices += 1
        break
      case 'shelter':
        socialFacilities += 1
        break
    }
  }

  return {
    hospitals,
    clinics,
    fireStations,
    policeStations,
    pharmacies,
    emergencyServices,
    socialFacilities,
    lastUpdated: new Date().toISOString(),
    scopeLabel: label,
    scopeLevel,
    radiusKm,
    isDemo,
    source: 'OpenStreetMap',
  }
}

export function resourcesRadiusKm(scopeLevel: ResourcePool['scopeLevel']): number {
  if (scopeLevel === 'city') return 12
  if (scopeLevel === 'country') return 35
  return 20
}
