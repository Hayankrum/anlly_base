import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { NavigationContext, type NavTarget } from './useNavigation'

/**
 * Each browser/WebView history entry carries the stack it belongs to, so the
 * system back gesture and the in-app back buttons do exactly the same thing.
 */
interface StackHistoryState {
  anllyStack: NavTarget[]
}

const HOME_STACK: NavTarget[] = [{ area: 'home' }]

function restoredStack(state: unknown): NavTarget[] | null {
  const stack = (state as Partial<StackHistoryState> | null)?.anllyStack
  return Array.isArray(stack) && stack.length > 0 ? stack : null
}

function sameStack(a: NavTarget[], b: NavTarget[]): boolean {
  return a.length === b.length && a.every((target, index) => sameTarget(target, b[index]))
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<NavTarget[]>(HOME_STACK)
  const stackRef = useRef<NavTarget[]>(HOME_STACK)

  const commit = useCallback((next: NavTarget[]) => {
    stackRef.current = next
    setStack(next)
    window.history.pushState({ anllyStack: next } satisfies StackHistoryState, '')
  }, [])

  // Home is the first history entry: going back past it leaves the app.
  useEffect(() => {
    window.history.replaceState({ anllyStack: HOME_STACK } satisfies StackHistoryState, '')
  }, [])

  // The system back gesture pops one history entry — the stack follows it.
  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const next = restoredStack(event.state)
      if (!next || sameStack(stackRef.current, next)) return
      stackRef.current = next
      setStack(next)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const selectArea = useCallback(
    (target: NavTarget) => {
      const current = stackRef.current
      if (current.length === 1 && sameTarget(current[0], target)) return
      commit([target])
    },
    [commit],
  )

  const push = useCallback(
    (target: NavTarget) => {
      const current = stackRef.current
      if (sameTarget(current[current.length - 1], target)) return
      commit([...current, target])
    },
    [commit],
  )

  const back = useCallback(() => {
    // Let history undo it, so buttons and the system gesture stay in sync.
    if (stackRef.current.length > 1) window.history.back()
  }, [])

  const value = useMemo(() => {
    const current = stack[stack.length - 1]
    return {
      active: current.area,
      stack,
      current,
      canGoBack: stack.length > 1,
      selectArea,
      push,
      back,
    }
  }, [stack, selectArea, push, back])

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
}

function sameTarget(a: NavTarget, b: NavTarget): boolean {
  return (
    a.area === b.area &&
    a.date === b.date &&
    a.eventId === b.eventId &&
    a.occurrenceId === b.occurrenceId
  )
}
