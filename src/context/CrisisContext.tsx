import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type {
  AiSummaryResult,
  Incident,
  IncidentFilters,
  MapLayerId,
  MapPoi,
  OverviewStats,
  ResourcePool,
  WeatherSnapshot,
} from '@/types/incident'
import {
  aggregateIncidents,
  computeOverview,
  DEFAULT_FILTERS,
  filterIncidents,
  getCountries,
} from '@/services/incidentAggregator'
import { DEFAULT_LAYERS } from '@/services/mapService'
import { fetchWeather } from '@/services/weatherService'
import {
  generateSituationSummary,
  loadCachedSummary,
} from '@/services/aiSummaryProvider'
import {
  countResourcesFromPois,
  emptyResources,
  fetchAreaResources,
  resourcesRadiusKm,
} from '@/services/resourceService'
import { fetchAreaPois, fetchRegionalPois } from '@/services/poiService'
import {
  listCitiesForCountry,
  resolveLocationFocus,
} from '@/services/locationFocus'

interface CrisisContextValue {
  incidents: Incident[]
  filtered: Incident[]
  filters: IncidentFilters
  setFilters: (next: Partial<IncidentFilters>) => void
  resetFilters: () => void
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  selectedId: string | null
  selected: Incident | null
  selectIncident: (id: string | null) => void
  layers: MapLayerId[]
  toggleLayer: (id: MapLayerId['id']) => void
  weather: WeatherSnapshot | null
  weatherLoading: boolean
  resources: ResourcePool
  resourcesLoading: boolean
  mapPois: MapPoi[]
  /** True when map facilities are demo placeholders, not live OSM. */
  mapPoisAreDemo: boolean
  stats: OverviewStats
  countries: string[]
  cities: string[]
  summary: AiSummaryResult | null
  summaryLoading: boolean
  generateSummary: () => Promise<void>
  mapFocus: { lat: number; lon: number; zoom?: number } | null
  setMapFocus: (focus: { lat: number; lon: number; zoom?: number } | null) => void
}

const CrisisContext = createContext<CrisisContextValue | null>(null)

export function CrisisProvider({ children }: { children: ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [filters, setFiltersState] = useState<IncidentFilters>(DEFAULT_FILTERS)
  const [loading, setLoading] = useState(true)
  const hasLoadedOnce = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [layers, setLayers] = useState<MapLayerId[]>(DEFAULT_LAYERS)
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [resources, setResources] = useState<ResourcePool>(() =>
    emptyResources('Resolving focus…'),
  )
  const [resourcesLoading, setResourcesLoading] = useState(true)
  const [mapPois, setMapPois] = useState<MapPoi[]>([])
  const [mapPoisAreDemo, setMapPoisAreDemo] = useState(false)
  const [summary, setSummary] = useState<AiSummaryResult | null>(() =>
    loadCachedSummary(),
  )
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [mapFocus, setMapFocus] = useState<{
    lat: number
    lon: number
    zoom?: number
  } | null>(null)
  const weatherRequestId = useRef(0)
  const resourcesRequestId = useRef(0)
  const incidentsRef = useRef(incidents)
  incidentsRef.current = incidents

  const refresh = useCallback(async () => {
    if (!hasLoadedOnce.current) setLoading(true)
    setError(null)
    try {
      const data = await aggregateIncidents({ preferLive: true })
      setIncidents(data)
    } catch {
      setError('Unable to refresh incident sources. Showing cached or mock data.')
      const fallback = await aggregateIncidents({ preferLive: false })
      setIncidents(fallback)
    } finally {
      hasLoadedOnce.current = true
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const filtered = useMemo(
    () => filterIncidents(incidents, filters),
    [incidents, filters],
  )

  const stats = useMemo(() => computeOverview(filtered), [filtered])
  const countries = useMemo(() => getCountries(incidents), [incidents])
  const cities = useMemo(
    () => listCitiesForCountry(filters.country, incidents),
    [filters.country, incidents],
  )

  const selected = useMemo(
    () => incidents.find((i) => i.id === selectedId) ?? null,
    [incidents, selectedId],
  )

  // Weather, OSM facilities, and map focus follow country/city selection
  useEffect(() => {
    let cancelled = false
    const weatherId = ++weatherRequestId.current
    const resourcesId = ++resourcesRequestId.current
    setWeatherLoading(true)
    setResourcesLoading(true)

    void (async () => {
      const focus = await resolveLocationFocus({
        country: filters.country,
        city: filters.city,
        incidents: incidentsRef.current,
      })
      if (cancelled) return

      if (filters.country !== 'all' || filters.city !== 'all') {
        setMapFocus({
          lat: focus.latitude,
          lon: focus.longitude,
          zoom: filters.city !== 'all' ? 8 : 6,
        })
      }

      const scopeLevel =
        filters.city !== 'all'
          ? 'city'
          : filters.country !== 'all'
            ? 'country'
            : 'region'
      const radiusKm = resourcesRadiusKm(scopeLevel)

      const poisPromise =
        scopeLevel === 'region' ||
        (scopeLevel === 'country' && filters.city === 'all')
          ? fetchRegionalPois({
              country:
                filters.country !== 'all' ? filters.country : undefined,
            })
          : fetchAreaPois({
              latitude: focus.latitude,
              longitude: focus.longitude,
              radiusKm,
            })

      // Fetch weather + POIs first. Derive facility counts from live POIs so the
      // Nearby Facilities panel stays in sync (and avoids a second Overpass call).
      const [snapshot, poiResult] = await Promise.all([
        fetchWeather(focus.latitude, focus.longitude, focus.label),
        poisPromise,
      ])

      let areaResources = countResourcesFromPois({
        pois: poiResult.pois,
        label: focus.label,
        radiusKm,
        scopeLevel,
        isDemo: poiResult.isDemo,
      })

      // If POIs failed entirely, try the dedicated count query as a last resort.
      if (poiResult.isDemo || !poiResult.pois.length) {
        areaResources = await fetchAreaResources({
          latitude: focus.latitude,
          longitude: focus.longitude,
          label: focus.label,
          radiusKm,
          scopeLevel,
        })
      }

      if (!cancelled && weatherId === weatherRequestId.current) {
        setWeather(snapshot)
        setWeatherLoading(false)
      }
      if (!cancelled && resourcesId === resourcesRequestId.current) {
        setResources(areaResources)
        setResourcesLoading(false)
        setMapPois(poiResult.pois)
        setMapPoisAreDemo(poiResult.isDemo)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [filters.country, filters.city])

  const setFilters = useCallback((next: Partial<IncidentFilters>) => {
    setFiltersState((prev) => {
      const merged = { ...prev, ...next }
      // Reset city when country changes to a value that doesn't include it
      if (next.country != null && next.country !== prev.country) {
        if (next.city == null) merged.city = 'all'
      }
      return merged
    })
  }, [])

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS)
  }, [])

  const toggleLayer = useCallback((id: MapLayerId['id']) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === id ? { ...layer, enabled: !layer.enabled } : layer,
      ),
    )
  }, [])

  const generateSummary = useCallback(async () => {
    setSummaryLoading(true)
    try {
      const result = await generateSituationSummary(filtered)
      setSummary(result)
    } finally {
      setSummaryLoading(false)
    }
  }, [filtered])

  const value = useMemo<CrisisContextValue>(
    () => ({
      incidents,
      filtered,
      filters,
      setFilters,
      resetFilters,
      loading,
      error,
      refresh,
      selectedId,
      selected,
      selectIncident: setSelectedId,
      layers,
      toggleLayer,
      weather,
      weatherLoading,
      resources,
      resourcesLoading,
      mapPois,
      mapPoisAreDemo,
      stats,
      countries,
      cities,
      summary,
      summaryLoading,
      generateSummary,
      mapFocus,
      setMapFocus,
    }),
    [
      incidents,
      filtered,
      filters,
      setFilters,
      resetFilters,
      loading,
      error,
      refresh,
      selectedId,
      selected,
      layers,
      toggleLayer,
      weather,
      weatherLoading,
      resources,
      resourcesLoading,
      mapPois,
      mapPoisAreDemo,
      stats,
      countries,
      cities,
      summary,
      summaryLoading,
      generateSummary,
      mapFocus,
    ],
  )

  return <CrisisContext.Provider value={value}>{children}</CrisisContext.Provider>
}

export function useCrisis() {
  const ctx = useContext(CrisisContext)
  if (!ctx) throw new Error('useCrisis must be used within CrisisProvider')
  return ctx
}
