export type IncidentType =
  | 'wildfire'
  | 'flood'
  | 'earthquake'
  | 'storm'
  | 'heatwave'
  | 'air_quality'
  | 'volcano'
  | 'weather_alert'

export type Severity = 'critical' | 'high' | 'moderate' | 'low' | 'info'
export type IncidentStatus = 'active' | 'monitoring' | 'contained' | 'resolved'

export interface Incident {
  id: string
  type: IncidentType
  title: string
  severity: Severity
  status: IncidentStatus
  latitude: number
  longitude: number
  country: string
  city?: string
  description: string
  timestamp: string
  startTime: string
  source: string
  affectedArea?: string
  weatherContext?: string
  externalSources?: { label: string; url: string }[]
  relatedEventIds?: string[]
  magnitude?: number
  aqi?: number
}

export interface WeatherSnapshot {
  location: string
  latitude: number
  longitude: number
  temperature: number
  humidity: number
  windSpeed: number
  windDirection: number
  precipitation: number
  condition: string
  updatedAt: string
  forecast: WeatherDay[]
  /** False when values came from Open-Meteo; true for hard-coded fallback. */
  isDemo?: boolean
}

export interface WeatherDay {
  date: string
  tempMax: number
  tempMin: number
  precipitation: number
  windSpeed: number
  condition: string
}

/** Mapped public facilities near a focus (OSM), not operational unit status. */
export interface ResourcePool {
  hospitals: number
  clinics: number
  fireStations: number
  policeStations: number
  pharmacies: number
  emergencyServices: number
  socialFacilities: number
  lastUpdated: string
  scopeLabel?: string
  scopeLevel?: 'city' | 'country' | 'region'
  radiusKm?: number
  /** True only when Overpass failed and no cache was available. */
  isDemo?: boolean
  source?: string
}

export interface MapLayerId {
  id:
    | 'wildfires'
    | 'floods'
    | 'earthquakes'
    | 'storms'
    | 'heatwaves'
    | 'air_quality'
    | 'volcanoes'
    | 'hospitals'
    | 'clinics'
    | 'fire_stations'
    | 'police'
    | 'pharmacies'
    | 'emergency'
    | 'shelters'
    | 'weather'
  label: string
  enabled: boolean
}

export interface MapPoi {
  id: string
  kind:
    | 'hospital'
    | 'clinic'
    | 'fire_station'
    | 'police'
    | 'pharmacy'
    | 'emergency'
    | 'shelter'
  name: string
  latitude: number
  longitude: number
  status?: string
  city?: string
  country?: string
  /** True for offline placeholders — not confirmed from OSM data. */
  isDemo?: boolean
}

export interface IncidentFilters {
  query: string
  country: string
  city: string
  severity: Severity | 'all'
  status: IncidentStatus | 'all'
  category: IncidentType | 'all'
  dateFrom: string
  dateTo: string
}

export interface OverviewStats {
  activeIncidents: number
  weatherAlerts: number
  wildfires: number
  earthquakes: number
  floodWarnings: number
  airQualityAlerts: number
  volcanoAlerts: number
  recentUpdates: number
}

export interface AiSummarySection {
  category: IncidentType | 'overview' | 'other'
  title: string
  text: string
  count: number
}

export interface AiSummaryResult {
  summary: string
  sections: AiSummarySection[]
  generatedAt: string
  incidentCount: number
  uncertaintyNote: string
  provider: 'cloudflare' | 'local'
}
