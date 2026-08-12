import type { MapPoi } from '@/types/incident'
import { FOCUS_CITIES } from './locationFocus'
import { queryOverpass } from './overpassClient'

const CACHE_PREFIX = 'crisishub:osm-pois:v7:'
const PER_KIND_LIMIT = 28
const SNAPSHOT_URL = '/data/osm-amenities.json'

export interface PoiFetchResult {
  pois: MapPoi[]
  /**
   * True only for tiny hand-written placeholders when even the bundled
   * OSM snapshot is missing. Bundled snapshot = real OSM, not demo.
   */
  isDemo: boolean
}

type SnapshotFile = {
  generatedAt?: string
  pois: MapPoi[]
}

let snapshotPromise: Promise<MapPoi[]> | null = null

async function loadBundledSnapshot(): Promise<MapPoi[]> {
  if (!snapshotPromise) {
    snapshotPromise = (async () => {
      try {
        const res = await fetch(SNAPSHOT_URL, { cache: 'force-cache' })
        if (!res.ok) return []
        const data = (await res.json()) as SnapshotFile
        return (data.pois ?? []).map((p) => ({
          ...p,
          status: 'OpenStreetMap',
          isDemo: false,
        }))
      } catch {
        return []
      }
    })()
  }
  return snapshotPromise
}

function poisNear(
  pois: MapPoi[],
  latitude: number,
  longitude: number,
  radiusKm: number,
): MapPoi[] {
  return pois.filter((p) => {
    const dLat = (p.latitude - latitude) * 111
    const dLon =
      (p.longitude - longitude) * 111 * Math.cos((latitude * Math.PI) / 180)
    return Math.hypot(dLat, dLon) <= radiusKm
  })
}

/**
 * Essential infrastructure near a focus.
 * Primary: same-origin bundled OSM snapshot (works on Netlify).
 * Optional: live French Overpass (CORS-safe) to refresh when available.
 */
export async function fetchAreaPois(options: {
  latitude: number
  longitude: number
  radiusKm?: number
}): Promise<PoiFetchResult> {
  const { latitude, longitude, radiusKm = 15 } = options
  const cacheKey = `${CACHE_PREFIX}${latitude.toFixed(2)},${longitude.toFixed(2)},${radiusKm}`

  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const parsed = JSON.parse(cached) as {
        at: number
        pois: MapPoi[]
        isDemo?: boolean
      }
      if (
        Date.now() - parsed.at < 6 * 60 * 60 * 1000 &&
        parsed.pois?.length &&
        !parsed.isDemo
      ) {
        return { pois: parsed.pois, isDemo: false }
      }
    }
  } catch {
    /* ignore */
  }

  // 1) Bundled snapshot — same-origin, works on Netlify (no CORS)
  const bundled = await loadBundledSnapshot()
  const fromSnapshot = poisNear(
    bundled,
    latitude,
    longitude,
    Math.max(radiusKm, 25),
  )
  if (fromSnapshot.length) {
    return { pois: fromSnapshot, isDemo: false }
  }

  // 2) Live CORS-safe Overpass only if snapshot has nothing nearby
  try {
    const live = await fetchLiveArea(latitude, longitude, radiusKm)
    if (live.length) {
      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ at: Date.now(), pois: live, isDemo: false }),
        )
      } catch {
        /* quota */
      }
      return { pois: live, isDemo: false }
    }
  } catch {
    /* live Overpass unavailable */
  }

  return {
    pois: fallbackPoisNear(latitude, longitude, radiusKm),
    isDemo: true,
  }
}

async function fetchLiveArea(
  latitude: number,
  longitude: number,
  radiusKm: number,
): Promise<MapPoi[]> {
  const meters = Math.round(radiusKm * 1000)
  const query = `
[out:json][timeout:18];
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
  node["emergency"="assembly_point"](around:${meters},${latitude},${longitude});
);
out tags center 100;
`.trim()

  const data = await queryOverpass(query)
  return parseOverpassElements(data.elements)
}

function parseOverpassElements(
  elements: Array<{
    id: number
    type: string
    lat?: number
    lon?: number
    center?: { lat: number; lon: number }
    tags?: Record<string, string>
  }>,
): MapPoi[] {
  const counts: Record<string, number> = {}
  const pois: MapPoi[] = []

  for (const el of elements) {
    const lat = el.lat ?? el.center?.lat
    const lon = el.lon ?? el.center?.lon
    if (lat == null || lon == null) continue

    const name = el.tags?.name || el.tags?.['name:en'] || 'Unnamed facility'
    const kind = classifyOsmTags(el.tags)
    if (!kind) continue

    counts[kind] = (counts[kind] ?? 0) + 1
    if (counts[kind] > PER_KIND_LIMIT) continue

    pois.push({
      id: `OSM-${kindPrefix(kind)}-${el.type}-${el.id}`,
      kind,
      name,
      latitude: lat,
      longitude: lon,
      status: 'OpenStreetMap',
      isDemo: false,
    })
  }

  return pois
}

function classifyOsmTags(
  tags?: Record<string, string>,
): MapPoi['kind'] | null {
  if (!tags) return null
  const amenity = tags.amenity
  const emergency = tags.emergency

  if (amenity === 'hospital') return 'hospital'
  if (amenity === 'clinic') return 'clinic'
  if (amenity === 'fire_station') return 'fire_station'
  if (amenity === 'police') return 'police'
  if (amenity === 'pharmacy') return 'pharmacy'
  if (
    emergency === 'ambulance_station' ||
    emergency === 'disaster_response'
  ) {
    return 'emergency'
  }
  if (amenity === 'social_facility' || emergency === 'assembly_point') {
    return 'shelter'
  }
  return null
}

function kindPrefix(kind: MapPoi['kind']): string {
  switch (kind) {
    case 'hospital':
      return 'H'
    case 'clinic':
      return 'C'
    case 'fire_station':
      return 'F'
    case 'police':
      return 'P'
    case 'pharmacy':
      return 'Rx'
    case 'emergency':
      return 'E'
    case 'shelter':
      return 'S'
  }
}

const FALLBACK_POIS: MapPoi[] = [
  {
    id: 'FB-H-PAR-1',
    kind: 'hospital',
    name: 'Hôpital Pitié-Salpêtrière',
    latitude: 48.837,
    longitude: 2.363,
    status: 'Demo placeholder — snapshot missing',
    isDemo: true,
  },
  {
    id: 'FB-H-ROM-1',
    kind: 'hospital',
    name: 'Policlinico Umberto I',
    latitude: 41.906,
    longitude: 12.511,
    status: 'Demo placeholder — snapshot missing',
    isDemo: true,
  },
]

function fallbackPoisNear(
  latitude: number,
  longitude: number,
  radiusKm: number,
): MapPoi[] {
  const r = Math.max(radiusKm, 80)
  return FALLBACK_POIS.filter((p) => {
    const dLat = (p.latitude - latitude) * 111
    const dLon =
      (p.longitude - longitude) * 111 * Math.cos((latitude * Math.PI) / 180)
    return Math.hypot(dLat, dLon) <= r
  })
}

/**
 * Regional view: use the full bundled snapshot (filtered by country when set).
 * Optionally enrich the default focus with live Overpass.
 */
export async function fetchRegionalPois(options?: {
  country?: string
}): Promise<PoiFetchResult> {
  const country = options?.country
  const bundled = await loadBundledSnapshot()

  let pois = bundled
  if (country && country !== 'all') {
    const tagged = bundled.filter((p) => p.country === country)
    if (tagged.length) {
      pois = tagged
    } else {
      const cities = FOCUS_CITIES.filter((c) => c.country === country)
      pois = bundled.filter((p) =>
        cities.some((c) => {
          const dLat = (p.latitude - c.latitude) * 111
          const dLon =
            (p.longitude - c.longitude) *
            111 *
            Math.cos((c.latitude * Math.PI) / 180)
          return Math.hypot(dLat, dLon) <= 40
        }),
      )
    }
  }

  if (pois.length) {
    return { pois, isDemo: false }
  }

  // Snapshot empty — try one live city via CORS-safe mirror
  const focus =
    FOCUS_CITIES.find((c) => !country || c.country === country) ??
    FOCUS_CITIES[0]
  return fetchAreaPois({
    latitude: focus.latitude,
    longitude: focus.longitude,
    radiusKm: 10,
  })
}
