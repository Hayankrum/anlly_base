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

const MERIDIEM_RE = /\s*(a\.?m\.?|p\.?m\.?)\s*$/

/** "1720" -> 17:20, "930" -> 09:30, "17" -> 17:00, "17:20:00" -> 17:20. */
function timeFromDigits(digits: string): { hour: number; minute: number } | null {
  const core = digits.slice(0, 4)
  if (core.length === 4) return { hour: Number(core.slice(0, 2)), minute: Number(core.slice(2)) }
  if (core.length === 3) {
    const twoDigitHour = Number(core.slice(0, 2))
    if (twoDigitHour <= 23) return { hour: twoDigitHour, minute: Number(core.slice(2)) * 10 }
    return { hour: Number(core.slice(0, 1)), minute: Number(core.slice(1)) }
  }
  const hour = Number(core)
  if (hour > 23) return null
  return { hour, minute: 0 }
}

/**
 * Understands whatever the user types ("17", "1705", "17:20", "17h20",
 * "17:20:00", "5pm") and returns "HH:mm", or null when it makes no sense.
 */
export function normalizeTimeInput(raw: string): string | null {
  const value = raw.trim().toLowerCase()
  if (!value) return null

  const meridiemMatch = value.match(MERIDIEM_RE)
  const meridiem = meridiemMatch?.[1]?.[0] ?? ''
  const core = meridiemMatch ? value.slice(0, meridiemMatch.index ?? 0) : value

  const digits = core.replace(/\D/g, '')
  if (digits.length === 0 || digits.length > 6) return null

  const parts = timeFromDigits(digits)
  if (!parts) return null
  let { hour } = parts
  const { minute } = parts

  if (meridiem) {
    if (hour < 1 || hour > 12) return null
    if (meridiem === 'p' && hour < 12) hour += 12
    if (meridiem === 'a' && hour === 12) hour = 0
  }

  if (hour > 23 || minute > 59) return null
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
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

/** Adds HH:mm (wraps past 24h): "13:00" + 240 -> "17:00". */
export function addMinutesToTime(time: string, minutes: number): string {
  if (!isValidTime(time)) return time
  const total = Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5)) + minutes
  const wrapped = ((total % 1440) + 1440) % 1440
  const hh = String(Math.floor(wrapped / 60)).padStart(2, '0')
  const mm = String(wrapped % 60).padStart(2, '0')
  return `${hh}:${mm}`
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
