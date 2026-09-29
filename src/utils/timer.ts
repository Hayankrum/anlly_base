interface TimerState {
  /** ISO timestamp of the run in progress, null = paused/stopped. */
  timerStartedAt: string | null
  /** milliseconds banked while the stopwatch was paused. */
  timerElapsedMs: number
}

/** Total stopwatch time in ms, including the run that is happening right now. */
export function elapsedMsOf(state: TimerState, now = Date.now()): number {
  const banked = Number.isFinite(state.timerElapsedMs) ? Math.max(0, state.timerElapsedMs) : 0
  if (!state.timerStartedAt) return banked
  const started = Date.parse(state.timerStartedAt)
  if (Number.isNaN(started)) return banked
  return banked + Math.max(0, now - started)
}

/** True while the stopwatch is ticking. */
export function isTimerRunning(state: TimerState): boolean {
  return Boolean(state.timerStartedAt)
}

/** Stopwatch label: `12:34` under an hour, `1:02:03` beyond it. */
export function formatStopwatch(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor(totalSeconds / 60) % 60
  const seconds = totalSeconds % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}
