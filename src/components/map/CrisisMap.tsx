import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Marker,
  useMap,
} from 'react-leaflet'
import { Maximize2, Minimize2, Search } from 'lucide-react'
import { useCrisis } from '@/context/CrisisContext'
import {
  geocodeSearch,
  TYPE_TO_LAYER,
  typeColor,
  typeEmoji,
  typeLabel,
} from '@/services/mapService'
import {
  INFRA_KIND_TO_LAYER,
  INFRA_LABELS,
  infrastructureIcon,
  layerLegendGlyph,
} from '@/services/mapIcons'
import { Button } from '@/components/ui/Button'
import { formatTime } from '@/lib/format'

function MapController({
  focus,
}: {
  focus: { lat: number; lon: number; zoom?: number } | null
}) {
  const map = useMap()
  useEffect(() => {
    if (!focus) return
    map.flyTo([focus.lat, focus.lon], focus.zoom ?? map.getZoom(), {
      duration: 0.8,
    })
  }, [focus, map])
  return null
}

/** Leaflet must recalculate tiles after the container size changes. */
function MapResizeOnExpand({ expanded }: { expanded: boolean }) {
  const map = useMap()
  useEffect(() => {
    const id = window.setTimeout(() => {
      map.invalidateSize({ animate: false })
    }, 80)
    return () => window.clearTimeout(id)
  }, [expanded, map])

  useEffect(() => {
    const el = map.getContainer()
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      map.invalidateSize({ animate: false })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [map])

  return null
}

async function enterBrowserFullscreen(el: HTMLElement) {
  const anyEl = el as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void
    msRequestFullscreen?: () => Promise<void> | void
  }
  if (el.requestFullscreen) {
    await el.requestFullscreen()
    return true
  }
  if (anyEl.webkitRequestFullscreen) {
    await anyEl.webkitRequestFullscreen()
    return true
  }
  if (anyEl.msRequestFullscreen) {
    await anyEl.msRequestFullscreen()
    return true
  }
  return false
}

async function exitBrowserFullscreen() {
  const doc = document as Document & {
    webkitExitFullscreen?: () => Promise<void> | void
    msExitFullscreen?: () => Promise<void> | void
  }
  if (document.fullscreenElement && document.exitFullscreen) {
    await document.exitFullscreen()
    return
  }
  if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen()
  if (doc.msExitFullscreen) await doc.msExitFullscreen()
}

function isBrowserFullscreen(el: HTMLElement | null) {
  const doc = document as Document & { webkitFullscreenElement?: Element }
  const active = document.fullscreenElement ?? doc.webkitFullscreenElement
  return Boolean(el && active === el)
}

export function CrisisMap({ className = '' }: { className?: string }) {
  const {
    filtered,
    layers,
    toggleLayer,
    selectIncident,
    selectedId,
    mapFocus,
    setMapFocus,
    mapPois: pois,
    mapPoisAreDemo,
  } = useCrisis()
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const enlarged = isFullscreen || isExpanded

  const enabledLayers = useMemo(
    () => new Set(layers.filter((l) => l.enabled).map((l) => l.id)),
    [layers],
  )

  const visibleIncidents = filtered.filter((i) =>
    enabledLayers.has(TYPE_TO_LAYER[i.type]),
  )

  const syncFullscreenState = useCallback(() => {
    setIsFullscreen(isBrowserFullscreen(container))
  }, [container])

  useEffect(() => {
    document.addEventListener('fullscreenchange', syncFullscreenState)
    document.addEventListener('webkitfullscreenchange', syncFullscreenState)
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreenState)
      document.removeEventListener('webkitfullscreenchange', syncFullscreenState)
    }
  }, [syncFullscreenState])

  useEffect(() => {
    if (!isExpanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExpanded(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [isExpanded])

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault()
    setSearching(true)
    try {
      const hit = await geocodeSearch(query)
      if (hit) setMapFocus({ lat: hit.lat, lon: hit.lon, zoom: 8 })

      const byId = filtered.find(
        (i) => i.id.toLowerCase() === query.trim().toLowerCase(),
      )
      if (byId) {
        selectIncident(byId.id)
        setMapFocus({ lat: byId.latitude, lon: byId.longitude, zoom: 8 })
      }
    } finally {
      setSearching(false)
    }
  }

  const toggleEnlarge = async () => {
    if (enlarged) {
      if (isBrowserFullscreen(container)) {
        await exitBrowserFullscreen()
      }
      setIsExpanded(false)
      setIsFullscreen(false)
      return
    }

    if (!container) {
      setIsExpanded(true)
      return
    }

    try {
      const ok = await enterBrowserFullscreen(container)
      if (ok) {
        setIsFullscreen(true)
      } else {
        setIsExpanded(true)
      }
    } catch {
      // Browser blocked fullscreen (permissions / iframe) — use overlay expand.
      setIsExpanded(true)
    }
  }

  return (
    <div
      ref={setContainer}
      className={`crisis-map relative overflow-hidden rounded-xl border border-white/10 bg-surface-900 ${
        isExpanded ? 'is-expanded' : ''
      } ${className}`}
    >
      <div className="absolute left-3 right-3 top-3 z-[1000] flex flex-wrap items-start gap-2">
        <form
          onSubmit={(e) => void handleSearch(e)}
          className="flex min-w-[220px] flex-1 gap-2"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city, country, coords, ID…"
              className="w-full rounded-lg border border-white/10 bg-surface-900/95 py-2 pl-9 pr-3 text-xs text-white backdrop-blur"
              aria-label="Map search"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary" disabled={searching}>
            Go
          </Button>
        </form>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => void toggleEnlarge()}
          aria-label={enlarged ? 'Exit enlarged map' : 'Enlarge map'}
          title={enlarged ? 'Exit enlarged map' : 'Enlarge map'}
        >
          {enlarged ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      <div className="absolute bottom-3 left-3 z-[1000] max-w-[260px] rounded-xl border border-white/10 bg-surface-900/95 p-3 backdrop-blur">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-surface-500">
          Layers
        </p>
        <ul className="max-h-56 space-y-1.5 overflow-y-auto text-xs">
          {layers.map((layer) => (
            <li key={layer.id}>
              <label className="flex cursor-pointer items-center gap-2 text-surface-300">
                <input
                  type="checkbox"
                  checked={layer.enabled}
                  onChange={() => toggleLayer(layer.id)}
                  className="rounded border-white/20 bg-surface-800 text-accent focus:ring-accent"
                />
                <span
                  className="inline-flex shrink-0"
                  aria-hidden
                  dangerouslySetInnerHTML={{
                    __html: layerLegendGlyph(layer.id),
                  }}
                />
                {layer.label}
              </label>
            </li>
          ))}
        </ul>
        <p className="mt-2 border-t border-white/8 pt-2 text-[10px] leading-snug text-surface-500">
          {mapPoisAreDemo ? (
            <span className="text-warning">
              Demo placeholders only — live OpenStreetMap query unavailable.
              Pins are not verified OSM features.
            </span>
          ) : (
            <>
              Live OpenStreetMap: {pois.length} facilities nearby. Zoom to a
              city for denser coverage. Mapped locations, not unit status.
            </>
          )}
        </p>
      </div>

      <MapContainer
        center={[42.5, 12.5]}
        zoom={4}
        className="h-full w-full"
        scrollWheelZoom
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapController focus={mapFocus} />
        <MapResizeOnExpand expanded={enlarged} />

        {visibleIncidents.map((incident) => {
          const color = typeColor(incident.type)
          const selected = selectedId === incident.id
          return (
            <CircleMarker
              key={incident.id}
              center={[incident.latitude, incident.longitude]}
              radius={selected ? 11 : 7}
              pathOptions={{
                color: selected ? '#ffffff' : color,
                fillColor: color,
                fillOpacity: selected ? 0.95 : 0.78,
                weight: selected ? 3 : 2,
                opacity: 1,
              }}
              eventHandlers={{
                click: () => selectIncident(incident.id),
              }}
            >
              <Popup>
                <div className="text-sm text-surface-900">
                  <p className="font-semibold">
                    <span
                      className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle"
                      style={{ backgroundColor: color }}
                      aria-hidden
                    />
                    {typeEmoji(incident.type)} {typeLabel(incident.type)}
                  </p>
                  <p>{incident.title}</p>
                  <p className="text-xs opacity-70">
                    {incident.country} · {formatTime(incident.timestamp)} ·{' '}
                    {incident.severity}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}

        {pois.map((p) => {
          const layerId = INFRA_KIND_TO_LAYER[p.kind]
          if (!enabledLayers.has(layerId)) return null
          return (
            <Marker
              key={p.id}
              position={[p.latitude, p.longitude]}
              icon={infrastructureIcon(p.kind, p.name)}
            >
              <Popup>
                <strong>{p.name}</strong>
                <br />
                {INFRA_LABELS[p.kind]}
                <br />
                <span className="text-xs">
                  {p.isDemo || mapPoisAreDemo
                    ? 'Demo placeholder'
                    : 'OpenStreetMap'}
                </span>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
