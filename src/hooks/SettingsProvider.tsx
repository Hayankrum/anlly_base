import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { readSettings, writeSetting } from '../services/storage/settings'
import { setAlarmPrefs } from '../services/alarm/alarmService'
import { resyncAllAlarms } from '../services/alarm/alarmSync'
import {
  DEFAULT_SETTINGS,
  SettingsContext,
  type AppSettings,
  type SettingsContextValue,
} from './useSettings'

function toSettings(raw: Record<string, string>): AppSettings {
  return {
    timeFormat12h: raw.time_format === '12h',
    vibrationEnabled: raw.vibration_enabled !== '0',
    ringtoneUri: raw.ringtone_uri ?? '',
    ringtoneName: raw.ringtone_name ?? '',
    weekStartsOn: raw.week_starts_on === 'sun' ? 'sun' : 'mon',
  }
}

const STORAGE_KEYS: Record<keyof AppSettings, string> = {
  timeFormat12h: 'time_format',
  vibrationEnabled: 'vibration_enabled',
  ringtoneUri: 'ringtone_uri',
  ringtoneName: 'ringtone_name',
  weekStartsOn: 'week_starts_on',
}

function toStorageValue(key: keyof AppSettings, value: AppSettings[keyof AppSettings]): string {
  if (key === 'timeFormat12h') return value ? '12h' : '24h'
  if (key === 'vibrationEnabled') return value ? '1' : '0'
  return String(value)
}

/** Keeps native alarm prefs (sound/vibration/12h) in sync with the DB. */
function pushNative(settings: AppSettings): void {
  void setAlarmPrefs({
    vibrationEnabled: settings.vibrationEnabled,
    ringtoneUri: settings.ringtoneUri || null,
    use12h: settings.timeFormat12h,
  })
}

/** Rebuilds the native alarm list from the DB (fire and forget). */
function pushAlarms(): void {
  void resyncAllAlarms().catch((err) => {
    console.warn('[settings] falha ao reagendar alarmes:', err)
  })
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [ready, setReady] = useState(false)
  const didInit = useRef(false)
  const settingsRef = useRef<AppSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    queueMicrotask(async () => {
      try {
        const raw = await readSettings()
        const loaded = toSettings(raw)
        settingsRef.current = loaded
        setSettings(loaded)
        pushNative(loaded)
        // Native alarms live outside the app process: rebuild them from the DB.
        pushAlarms()
      } catch (err) {
        console.warn('[settings] falha ao carregar:', err)
      } finally {
        setReady(true)
      }
    })
  }, [])

  const update = useCallback(async (patch: Partial<AppSettings>) => {
    const next = { ...settingsRef.current, ...patch }
    settingsRef.current = next
    setSettings(next)
    try {
      for (const key of Object.keys(patch) as (keyof AppSettings)[]) {
        await writeSetting(STORAGE_KEYS[key], toStorageValue(key, next[key]))
      }
      pushNative(next)
    } catch (err) {
      console.warn('[settings] falha ao salvar:', err)
    }
  }, [])

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, ready, update }),
    [settings, ready, update],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
