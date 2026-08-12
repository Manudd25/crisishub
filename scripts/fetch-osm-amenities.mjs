/**
 * Build-time fetch of real OSM amenities for FOCUS cities.
 * Runs in Node (no CORS). Writes public/data/osm-amenities.json.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../public/data/osm-amenities.json')

const ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
]

const CITIES = [
  { city: 'Paris', country: 'France', latitude: 48.86, longitude: 2.35 },
  { city: 'Rome', country: 'Italy', latitude: 41.9, longitude: 12.5 },
  { city: 'Milan', country: 'Italy', latitude: 45.46, longitude: 9.19 },
  { city: 'Madrid', country: 'Spain', latitude: 40.42, longitude: -3.7 },
  { city: 'Barcelona', country: 'Spain', latitude: 41.39, longitude: 2.17 },
  { city: 'Lisbon', country: 'Portugal', latitude: 38.72, longitude: -9.14 },
  { city: 'Athens', country: 'Greece', latitude: 37.98, longitude: 23.73 },
  { city: 'Berlin', country: 'Germany', latitude: 52.52, longitude: 13.41 },
  { city: 'London', country: 'United Kingdom', latitude: 51.51, longitude: -0.13 },
  { city: 'Amsterdam', country: 'Netherlands', latitude: 52.37, longitude: 4.9 },
]

const PER_KIND = 12
const RADIUS_M = 5500
const UA = 'CrisisHub/1.0 (educational situational awareness; amenity snapshot)'

function classify(tags = {}) {
  const a = tags.amenity
  const e = tags.emergency
  if (a === 'hospital') return 'hospital'
  if (a === 'clinic') return 'clinic'
  if (a === 'fire_station') return 'fire_station'
  if (a === 'police') return 'police'
  if (a === 'pharmacy') return 'pharmacy'
  if (e === 'ambulance_station' || e === 'disaster_response') return 'emergency'
  if (a === 'social_facility' || e === 'assembly_point') return 'shelter'
  return null
}

function prefix(kind) {
  return (
    {
      hospital: 'H',
      clinic: 'C',
      fire_station: 'F',
      police: 'P',
      pharmacy: 'Rx',
      emergency: 'E',
      shelter: 'S',
    }[kind] ?? 'X'
  )
}

async function overpass(query) {
  let lastErr
  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'User-Agent': UA,
        },
        body: `data=${encodeURIComponent(query)}`,
      })
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status} @ ${endpoint}`)
        continue
      }
      return await res.json()
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr ?? new Error('All Overpass endpoints failed')
}

async function fetchCity(city) {
  const q = `
[out:json][timeout:45];
(
  node["amenity"="hospital"](around:${RADIUS_M},${city.latitude},${city.longitude});
  way["amenity"="hospital"](around:${RADIUS_M},${city.latitude},${city.longitude});
  node["amenity"="clinic"](around:${RADIUS_M},${city.latitude},${city.longitude});
  way["amenity"="clinic"](around:${RADIUS_M},${city.latitude},${city.longitude});
  node["amenity"="fire_station"](around:${RADIUS_M},${city.latitude},${city.longitude});
  way["amenity"="fire_station"](around:${RADIUS_M},${city.latitude},${city.longitude});
  node["amenity"="police"](around:${RADIUS_M},${city.latitude},${city.longitude});
  way["amenity"="police"](around:${RADIUS_M},${city.latitude},${city.longitude});
  node["amenity"="pharmacy"](around:${RADIUS_M},${city.latitude},${city.longitude});
  way["amenity"="pharmacy"](around:${RADIUS_M},${city.latitude},${city.longitude});
  node["emergency"="ambulance_station"](around:${RADIUS_M},${city.latitude},${city.longitude});
  way["emergency"="ambulance_station"](around:${RADIUS_M},${city.latitude},${city.longitude});
  node["emergency"="assembly_point"](around:${RADIUS_M},${city.latitude},${city.longitude});
);
out tags center 80;
`.trim()

  const data = await overpass(q)
  const counts = {}
  const pois = []

  for (const el of data.elements ?? []) {
    const lat = el.lat ?? el.center?.lat
    const lon = el.lon ?? el.center?.lon
    if (lat == null || lon == null) continue
    const kind = classify(el.tags)
    if (!kind) continue
    counts[kind] = (counts[kind] ?? 0) + 1
    if (counts[kind] > PER_KIND) continue
    pois.push({
      id: `OSM-${prefix(kind)}-${el.type}-${el.id}`,
      kind,
      name: el.tags?.name || el.tags?.['name:en'] || 'Unnamed facility',
      latitude: lat,
      longitude: lon,
      status: 'OpenStreetMap',
      city: city.city,
      country: city.country,
      isDemo: false,
    })
  }
  return pois
}

async function main() {
  const all = []
  for (const city of CITIES) {
    process.stdout.write(`Fetching ${city.city}… `)
    try {
      const pois = await fetchCity(city)
      console.log(`${pois.length} amenities`)
      all.push(...pois)
      await new Promise((r) => setTimeout(r, 2500))
    } catch (err) {
      console.log(`FAILED (${err.message})`)
      await new Promise((r) => setTimeout(r, 3000))
    }
  }

  const byId = new Map()
  for (const p of all) byId.set(p.id, p)
  const pois = [...byId.values()]

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(
    OUT,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: 'OpenStreetMap Overpass',
        note: 'Mapped amenities snapshot for CrisisHub. Not live unit deployments.',
        count: pois.length,
        pois,
      },
      null,
      2,
    ),
  )
  console.log(`\nWrote ${pois.length} amenities → ${OUT}`)
  if (pois.length < 20) {
    console.error('Too few amenities fetched — aborting.')
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
