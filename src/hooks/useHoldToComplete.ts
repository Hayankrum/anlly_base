import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'

/** Movement (px) that turns a press into a scroll/pan and cancels the hold. */
const CANCEL_DISTANCE = 14

interface HoldToCompleteOptions {
  /** Fired once the hold reaches 100%. */
  onComplete: () => void
  /** Fired on a normal (short) tap or on Enter/Space. */
  onTap?: (event: ReactMouseEvent) => void
  /** How long the user must keep pressing. */
  durationMs?: number
  disabled?: boolean
}

interface HoldToComplete {
  /** 0..1 fill of the confirmation animation. */
  progress: number
  holding: boolean
  /** Spread onto the interactive element (pointer + click handling). */
  holdProps: {
    onPointerDown: (event: ReactPointerEvent) => void
    onClick: (event: ReactMouseEvent) => void
  }
}

interface HoldState {
  start: number
  originX: number
  originY: number
  raf: number
  done: boolean
  suppressClick: boolean
  move: ((event: PointerEvent) => void) | null
  up: (() => void) | null
}

/**
 * Press-and-hold gesture shared by the trail and the details page.
 *
 * A short tap never completes anything — it only fires `onTap`. The hold must
 * run for `durationMs` without the finger/mouse sliding away, otherwise it
 * resets. Touch, pen and mouse all work because the gesture is driven by
 * pointer events plus window-level move/up listeners.
 */
export function useHoldToComplete({
  onComplete,
  onTap,
  durationMs = 700,
  disabled = false,
}: HoldToCompleteOptions): HoldToComplete {
  const [progress, setProgress] = useState(0)
  const [holding, setHolding] = useState(false)

  const optionsRef = useRef({ onComplete, onTap, durationMs, disabled })

  useEffect(() => {
    optionsRef.current = { onComplete, onTap, durationMs, disabled }
  })

  const stateRef = useRef<HoldState>({
    start: 0,
    originX: 0,
    originY: 0,
    raf: 0,
    done: false,
    suppressClick: false,
    move: null,
    up: null,
  })

  const end = useCallback(() => {
    const state = stateRef.current
    if (state.raf) cancelAnimationFrame(state.raf)
    state.raf = 0
    if (state.move) window.removeEventListener('pointermove', state.move)
    if (state.up) {
      window.removeEventListener('pointerup', state.up)
      window.removeEventListener('pointercancel', state.up)
    }
    state.move = null
    state.up = null
    setHolding(false)
    setProgress(0)
  }, [])

  const complete = useCallback(() => {
    const state = stateRef.current
    state.done = true
    state.suppressClick = true
    end()
    optionsRef.current.onComplete()
  }, [end])

  const onPointerDown = useCallback(
    (event: ReactPointerEvent) => {
      const state = stateRef.current
      state.suppressClick = false
      if (optionsRef.current.disabled || holding) return
      if (!event.isPrimary || (event.button !== undefined && event.button !== 0)) return

      state.done = false
      state.originX = event.clientX
      state.originY = event.clientY
      state.start = performance.now()

      const move = (pointer: PointerEvent) => {
        const dx = pointer.clientX - state.originX
        const dy = pointer.clientY - state.originY
        if (Math.hypot(dx, dy) > CANCEL_DISTANCE) end()
      }
      const up = () => {
        if (!state.done) end()
      }
      state.move = move
      state.up = up
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
      window.addEventListener('pointercancel', up)

      const tick = () => {
        const elapsed = performance.now() - state.start
        const next = Math.min(1, elapsed / optionsRef.current.durationMs)
        setProgress(next)
        if (next >= 1) {
          complete()
          return
        }
        state.raf = requestAnimationFrame(tick)
      }
      state.raf = requestAnimationFrame(tick)
      setHolding(true)
    },
    [holding, end, complete],
  )

  const onClick = useCallback((event: ReactMouseEvent) => {
    const state = stateRef.current
    if (state.suppressClick) {
      state.suppressClick = false
      event.preventDefault()
      event.stopPropagation()
      return
    }
    optionsRef.current.onTap?.(event)
  }, [])

  useEffect(() => {
    const state = stateRef.current
    return () => {
      if (state.raf) cancelAnimationFrame(state.raf)
      if (state.move) window.removeEventListener('pointermove', state.move)
      if (state.up) {
        window.removeEventListener('pointerup', state.up)
        window.removeEventListener('pointercancel', state.up)
      }
    }
  }, [])

  return {
    progress,
    holding,
    holdProps: { onPointerDown, onClick },
  }
}
