import { useCallback, useEffect, useState } from 'react'
import { getAlarmStatus } from '../services/alarm/alarmService'
import type { AlarmStatus } from '../types/event'

export interface MissingPermissions {
  notifications: boolean
  exactAlarms: boolean
  fullScreen: boolean
  fallback: boolean
  any: boolean
  /** stable signature of what is missing (used to key dismissals) */
  signature: string
}

/** Reads the native permission status, live (re-checks whenever the app returns). */
export function useAlarmPermission(): {
  status: AlarmStatus | null
  missing: MissingPermissions | null
  refresh: () => Promise<void>
} {
  const [status, setStatus] = useState<AlarmStatus | null>(null)

  const refresh = useCallback(async () => {
    setStatus(await getAlarmStatus())
  }, [])

  useEffect(() => {
    queueMicrotask(() => void refresh())
    const onFocus = () => void refresh()
    document.addEventListener('visibilitychange', onFocus)
    window.addEventListener('focus', onFocus)
    return () => {
      document.removeEventListener('visibilitychange', onFocus)
      window.removeEventListener('focus', onFocus)
    }
  }, [refresh])

  if (!status || !status.isAndroid) return { status, missing: null, refresh }

  const missing: MissingPermissions = {
    notifications: !status.notificationsGranted,
    exactAlarms: !status.canScheduleExactAlarms,
    fullScreen: !status.canUseFullScreenIntent,
    fallback: status.exactAlarmFallback,
    any: false,
    signature: '',
  }
  missing.any =
    missing.notifications || missing.exactAlarms || missing.fullScreen || missing.fallback
  missing.signature = [
    missing.notifications ? 'notifications' : '',
    missing.exactAlarms ? 'exact' : '',
    missing.fullScreen ? 'fullscreen' : '',
    missing.fallback ? 'fallback' : '',
  ]
    .filter(Boolean)
    .join('+')

  return { status, missing, refresh }
}
