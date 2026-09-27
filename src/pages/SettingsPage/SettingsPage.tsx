import { useEffect, useState } from 'react'
import { getName, getVersion } from '@tauri-apps/api/app'
import { AlarmPermissionNotice } from '../../components/Alarm/AlarmPermissionNotice'
import { useSettings } from '../../hooks/useSettings'
import { listRingtones, previewRingtone, type RingtoneInfo } from '../../services/alarm/alarmService'
import { resyncAllAlarms } from '../../services/alarm/alarmSync'
import { formatTimeDisplay } from '../../utils/time'

export function SettingsPage() {
  const { settings, update } = useSettings()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [ringtones, setRingtones] = useState<RingtoneInfo[] | null>(null)
  const [loadingList, setLoadingList] = useState(false)
  const [appInfo, setAppInfo] = useState<{ name: string; version: string } | null>(null)
  const [resyncing, setResyncing] = useState(false)
  const [resyncMessage, setResyncMessage] = useState<string | null>(null)

  // Stop any ringtone preview when leaving the screen or collapsing the list.
  useEffect(() => {
    return () => {
      void previewRingtone(null)
    }
  }, [])

  useEffect(() => {
    if (!pickerOpen) void previewRingtone(null)
  }, [pickerOpen])

  useEffect(() => {
    let active = true
    void Promise.all([getName(), getVersion()])
      .then(([name, version]) => {
        if (active) setAppInfo({ name, version })
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  const handleResync = async () => {
    setResyncing(true)
    setResyncMessage(null)
    try {
      await resyncAllAlarms()
      setResyncMessage('Alarmes reagendados no sistema.')
    } catch {
      setResyncMessage('Não foi possível reagendar os alarmes.')
    } finally {
      setResyncing(false)
    }
  }

  const togglePicker = async () => {
    const next = !pickerOpen
    setPickerOpen(next)
    if (next && ringtones === null && !loadingList) {
      setLoadingList(true)
      try {
        setRingtones(await listRingtones())
      } finally {
        setLoadingList(false)
      }
    }
  }

  const chooseRingtone = async (uri: string, name: string) => {
    await previewRingtone(uri || null)
    await update({ ringtoneUri: uri, ringtoneName: name })
  }

  const sampleTime = formatTimeDisplay('14:53', settings.timeFormat12h)

  return (
    <div className="app-shell settings-shell">
      <h1 className="settings-title">Configurações</h1>

      <section className="settings-section">
        <h2 className="settings-heading">Exibição</h2>

        <div className="settings-row">
          <span className="settings-label">
            Formato de hora
            <span className="settings-note">Ex.: {sampleTime}</span>
          </span>
          <div className="segmented" role="radiogroup" aria-label="formato de hora">
            <button
              type="button"
              role="radio"
              aria-checked={!settings.timeFormat12h}
              className={`segment${!settings.timeFormat12h ? ' is-active' : ''}`}
              onClick={() => void update({ timeFormat12h: false })}
            >
              24 h
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={settings.timeFormat12h}
              className={`segment${settings.timeFormat12h ? ' is-active' : ''}`}
              onClick={() => void update({ timeFormat12h: true })}
            >
              12 h
            </button>
          </div>
        </div>

        <div className="settings-row">
          <span className="settings-label">
            Início da semana
            <span className="settings-note">Usado no calendário.</span>
          </span>
          <div className="segmented" role="radiogroup" aria-label="início da semana">
            <button
              type="button"
              role="radio"
              aria-checked={settings.weekStartsOn === 'mon'}
              className={`segment${settings.weekStartsOn === 'mon' ? ' is-active' : ''}`}
              onClick={() => void update({ weekStartsOn: 'mon' })}
            >
              Segunda
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={settings.weekStartsOn === 'sun'}
              className={`segment${settings.weekStartsOn === 'sun' ? ' is-active' : ''}`}
              onClick={() => void update({ weekStartsOn: 'sun' })}
            >
              Domingo
            </button>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-heading">Alarme</h2>

        <label className="settings-row">
          <span className="settings-label">Vibração</span>
          <span className="toggle">
            <input
              type="checkbox"
              checked={settings.vibrationEnabled}
              onChange={(e) => void update({ vibrationEnabled: e.target.checked })}
            />
            <span className="toggle-track" aria-hidden="true" />
          </span>
        </label>

        <div className="settings-row settings-row-column">
          <button
            type="button"
            className="settings-value-button"
            onClick={() => void togglePicker()}
            aria-expanded={pickerOpen}
          >
            <span className="settings-label">
              Toque do alarme
              <span className="settings-note">
                {settings.ringtoneName || 'Padrão do sistema'}
              </span>
            </span>
            <span className={`settings-chevron${pickerOpen ? ' is-open' : ''}`} aria-hidden="true">
              ›
            </span>
          </button>

          {pickerOpen && (
            <ul className="ringtone-list">
              <li>
                <button
                  type="button"
                  className={`ringtone-item${settings.ringtoneUri === '' ? ' is-selected' : ''}`}
                  onClick={() => void chooseRingtone('', '')}
                >
                  <span>Padrão do sistema</span>
                  {settings.ringtoneUri === '' && <span className="ringtone-check">✓</span>}
                </button>
              </li>
              {loadingList && <li className="ringtone-empty">Carregando toques…</li>}
              {ringtones && ringtones.length === 0 && (
                <li className="ringtone-empty">Nenhum toque encontrado.</li>
              )}
              {ringtones?.map((ring) => (
                <li key={ring.uri}>
                  <button
                    type="button"
                    className={`ringtone-item${settings.ringtoneUri === ring.uri ? ' is-selected' : ''}`}
                    onClick={() => void chooseRingtone(ring.uri, ring.title)}
                  >
                    <span>{ring.title}</span>
                    {settings.ringtoneUri === ring.uri && (
                      <span className="ringtone-check">✓</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="settings-row">
          <span className="settings-label">
            Reagendar alarmes
            <span className="settings-note">Recria os alarmes pendentes no sistema.</span>
          </span>
          <button
            type="button"
            className="button button-ghost"
            onClick={() => void handleResync()}
            disabled={resyncing}
          >
            {resyncing ? 'Reagendando…' : 'Reagendar'}
          </button>
        </div>
        {resyncMessage && <p className="settings-note settings-message">{resyncMessage}</p>}
      </section>

      <AlarmPermissionNotice />

      <section className="settings-section">
        <h2 className="settings-heading">Sobre</h2>
        <div className="settings-row">
          <span className="settings-label">
            {appInfo?.name ?? 'Anlly'}
            <span className="settings-note">
              {appInfo?.version ? `Versão ${appInfo.version}` : 'Carregando versão…'}
            </span>
          </span>
        </div>
        <div className="settings-row">
          <span className="settings-label">
            Armazenamento
            <span className="settings-note">
              Banco SQLite local (anlly.db) — os dados ficam no aparelho.
            </span>
          </span>
        </div>
      </section>
    </div>
  )
}
