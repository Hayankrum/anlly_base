import { useState } from 'react'
import { useAlarmPermission } from '../../hooks/useAlarmPermission'
import { PermissionActions, PermissionList } from './AlarmPermissionNotice'

/**
 * Popup shown on any screen while an alarm permission is missing, so the
 * warning cannot be missed. Dismissing it hides it for the rest of the
 * session, unless a *different* permission goes missing afterwards — and it
 * closes by itself as soon as everything is granted.
 */
export function AlarmPermissionDialog() {
  const { missing, refresh } = useAlarmPermission()
  const [dismissed, setDismissed] = useState<string | null>(null)

  if (!missing?.any) return null
  if (dismissed === missing.signature) return null

  const dismiss = () => setDismissed(missing.signature)

  return (
    <div
      className="permission-overlay"
      role="presentation"
      onClick={dismiss}
      onKeyDown={(event) => {
        if (event.key === 'Escape') dismiss()
      }}
    >
      <div
        className="permission-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="permission-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="notice-title" id="permission-modal-title">
          Falta permissão para os lembretes
        </p>
        <p className="permission-modal-lead">
          Sem estas permissões o Anlly não avisa no horário certo.
        </p>
        <PermissionList missing={missing} />
        <PermissionActions missing={missing} refresh={refresh} />
        <button
          type="button"
          className="button button-ghost permission-modal-dismiss"
          onClick={dismiss}
        >
          Entendi
        </button>
      </div>
    </div>
  )
}
