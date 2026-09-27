import { useCallback, useEffect, useState } from 'react'
import {
  getAlarmStatus,
  openExactAlarmSettings,
  openFullScreenIntentSettings,
  requestNotificationPermission,
} from '../../services/alarm/alarmService'
import type { AlarmStatus } from '../../types/event'

export function AlarmPermissionNotice() {
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

  if (!status || !status.isAndroid) return null

  const missingNotifications = !status.notificationsGranted
  const missingExactAlarms = !status.canScheduleExactAlarms
  const missingFullScreen = !status.canUseFullScreenIntent
  if (!missingNotifications && !missingExactAlarms && !missingFullScreen && !status.exactAlarmFallback) {
    return null
  }

  return (
    <aside className="permission-notice" role="status">
      <p className="notice-title">Alarmes precisam de permissão</p>
      <ul className="notice-list">
        {missingNotifications && <li>Permita que o Anlly mostre notificações.</li>}
        {missingExactAlarms && <li>Permita alarmes exatos para o despertador não atrasar.</li>}
        {missingFullScreen && (
          <li>Permita a tela de alarme sobre a tela bloqueada (tela cheia).</li>
        )}
        {status.exactAlarmFallback && (
          <li>Sem alarmes exatos, o Android pode disparar o alarme com atraso.</li>
        )}
      </ul>
      <div className="notice-actions">
        {missingNotifications && (
          <button
            type="button"
            className="button button-small"
            onClick={async () => {
              await requestNotificationPermission()
              await refresh()
            }}
          >
            Ativar notificações
          </button>
        )}
        {missingExactAlarms && (
          <button
            type="button"
            className="button button-small"
            onClick={async () => {
              await openExactAlarmSettings()
              await refresh()
            }}
          >
            Permitir alarmes exatos
          </button>
        )}
        {missingFullScreen && (
          <button
            type="button"
            className="button button-small"
            onClick={async () => {
              await openFullScreenIntentSettings()
              await refresh()
            }}
          >
            Permitir tela cheia
          </button>
        )}
        <button type="button" className="button button-small button-ghost" onClick={refresh}>
          Verificar novamente
        </button>
      </div>
    </aside>
  )
}
