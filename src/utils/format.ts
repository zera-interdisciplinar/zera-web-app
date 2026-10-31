export const NOT_AVAILABLE = '—'

const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
const dateOnly = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'UTC' })

export function formatRelativeTime(iso: string, now = Date.now()): string {
  const minutes = Math.round((Date.parse(iso) - now) / 60_000)
  if (!Number.isFinite(minutes)) return NOT_AVAILABLE
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute')
  if (Math.abs(minutes) < 60 * 24) return rtf.format(Math.round(minutes / 60), 'hour')
  return rtf.format(Math.round(minutes / (60 * 24)), 'day')
}

export function formatDateTime(iso: string): string {
  const time = Date.parse(iso)
  return Number.isFinite(time) ? dateTime.format(time) : NOT_AVAILABLE
}

/** A `YYYY-MM-DD` calendar date, printed as is: no timezone shifts it by a day. */
export function formatDate(iso: string): string {
  const time = Date.parse(`${iso}T00:00:00Z`)
  return Number.isFinite(time) ? dateOnly.format(time) : NOT_AVAILABLE
}
