const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

export function isValidTime(time: string): boolean {
  return TIME_RE.test(time)
}

/** Display formatting per user preference: "14:53" or "2:53 PM". */
export function formatTimeDisplay(time: string, use12h: boolean): string {
  if (!isValidTime(time)) return time
  if (!use12h) return time
  const hour = Number(time.slice(0, 2))
  const minute = time.slice(3, 5)
  const period = hour < 12 ? 'AM' : 'PM'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${minute} ${period}`
}

/** Stopwatch style: "25:07" or "1:05:09". */
export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(rest).padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}

/** 90 -> "1h 30min", 45 -> "45min", 3600 -> "1h". */
export function formatDurationLabel(totalSeconds: number): string {
  const minutes = Math.max(0, Math.round(totalSeconds / 60))
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}min`
  if (rest === 0) return `${hours}h`
  return `${hours}h ${rest}min`
}
