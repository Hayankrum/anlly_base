import {
  openExactAlarmSettings,
  openFullScreenIntentSettings,
  requestNotificationPermission,
} from '../../services/alarm/alarmService'
import { useAlarmPermission, type MissingPermissions } from '../../hooks/useAlarmPermission'

interface ActionsProps {
  missing: MissingPermissions
  refresh: () => Promise<void>
}

/** The buttons that open each Android permission screen. */
export function PermissionActions({ missing, refresh }: ActionsProps) {
  return (
    <div className="notice-actions">
      {missing.notifications && (
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
      {missing.exactAlarms && (
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
      {missing.fullScreen && (
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
      <button
        type="button"
        className="button button-small button-ghost"
        onClick={() => void refresh()}
      >
        Verificar novamente
      </button>
    </div>
  )
}

/** Bullet list of everything that is missing right now. */
export function PermissionList({ missing }: { missing: MissingPermissions }) {
  return (
    <ul className="notice-list">
      {missing.notifications && <li>Permita que o Anlly mostre notificações.</li>}
      {missing.exactAlarms && <li>Permita alarmes exatos para o despertador não atrasar.</li>}
      {missing.fullScreen && (
        <li>Permita a tela de alarme sobre a tela bloqueada (tela cheia).</li>
      )}
      {missing.fallback && (
        <li>Sem alarmes exatos, o Android pode disparar o alarme com atraso.</li>
      )}
    </ul>
  )
}

/** Inline warning used by Configurações and the Dashboard. */
export function AlarmPermissionNotice() {
  const { missing, refresh } = useAlarmPermission()

  if (!missing?.any) return null

  return (
    <aside className="permission-notice" role="status">
      <p className="notice-title">Alarmes precisam de permissão</p>
      <PermissionList missing={missing} />
      <PermissionActions missing={missing} refresh={refresh} />
    </aside>
  )
}
