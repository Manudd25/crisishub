import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'

/** Sample public-hazard style points for the landing preview (illustrative). */
const PREVIEW_POINTS = [
  {
    id: 'wf',
    lat: 37.2,
    lon: -8.1,
    color: '#FF5C33',
    label: 'Wildfire signal',
    place: 'Southern Portugal',
  },
  {
    id: 'eq',
    lat: 38.1,
    lon: 23.7,
    color: '#C4A35A',
    label: 'Earthquake',
    place: 'Near Athens',
  },
  {
    id: 'fl',
    lat: 45.4,
    lon: 9.2,
    color: '#3B82F6',
    label: 'Flood watch',
    place: 'Northern Italy',
  },
  {
    id: 'st',
    lat: 48.8,
    lon: 2.3,
    color: '#7C9CBF',
    label: 'Storm system',
    place: 'France',
  },
  {
    id: 'aq',
    lat: 41.4,
    lon: 2.2,
    color: '#14B8A6',
    label: 'Air quality',
    place: 'Barcelona',
  },
  {
    id: 'vo',
    lat: 37.7,
    lon: 15.0,
    color: '#E11D48',
    label: 'Volcano alert',
    place: 'Sicily',
  },
] as const

export function LandingMapPreview() {
  return (
    <div
      className="relative h-full min-h-[280px] w-full overflow-hidden rounded-2xl border border-white/10 bg-surface-900 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
      role="img"
      aria-label="Preview map of Europe with sample hazard markers"
    >
      <MapContainer
        center={[42.5, 12]}
        zoom={4}
        className="h-full w-full"
        scrollWheelZoom={false}
        dragging
        doubleClickZoom={false}
        zoomControl
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {PREVIEW_POINTS.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lon]}
            radius={8}
            pathOptions={{
              color: '#ffffff',
              fillColor: p.color,
              fillOpacity: 0.9,
              weight: 2,
            }}
          >
            <Popup>
              <p className="text-sm font-semibold text-surface-900">{p.label}</p>
              <p className="text-xs text-surface-700">{p.place}</p>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      <p className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-surface-950/80 px-2.5 py-1 text-[11px] text-surface-300 backdrop-blur">
        Live map in the Operation Center
      </p>
    </div>
  )
}
