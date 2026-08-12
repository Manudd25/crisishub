import { format, formatDistanceToNow } from 'date-fns'

export function formatTime(iso: string): string {
  return format(new Date(iso), 'HH:mm')
}

export function formatDateTime(iso: string): string {
  return format(new Date(iso), 'dd MMM yyyy · HH:mm')
}

export function formatRelative(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true })
}

export function formatCoords(lat: number, lon: number): string {
  return `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`
}
