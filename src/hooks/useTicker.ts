import { useEffect, useState } from 'react'

/**
 * Re-renders the caller every `intervalMs` while `active` is true, returning
 * the current epoch time. Used by the running stopwatch so the label ticks
 * without forcing the whole app to update.
 */
export function useTicker(intervalMs = 1000, active = true): number {
  const [tick, setTick] = useState(() => Date.now())

  useEffect(() => {
    if (!active) return
    const refresh = () => setTick(Date.now())
    // Refresh right away (async, so the effect itself stays free of renders).
    const first = window.setTimeout(refresh, 0)
    const id = window.setInterval(refresh, intervalMs)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(id)
    }
  }, [intervalMs, active])

  return tick
}
