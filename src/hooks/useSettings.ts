import { createContext, useContext } from 'react'

export interface AppSettings {
  /** true = 12h (02:00 PM), false = 24h (14:00) */
  timeFormat12h: boolean
  /** vibration on alarm fire */
  vibrationEnabled: boolean
  /** custom ringtone uri, '' = system default */
  ringtoneUri: string
  /** display name for ringtoneUri, '' = "Padrão do sistema" */
  ringtoneName: string
  /** 'mon' = week starts Monday (pt-BR), 'sun' = week starts Sunday */
  weekStartsOn: 'mon' | 'sun'
}

export const DEFAULT_SETTINGS: AppSettings = {
  timeFormat12h: false,
  vibrationEnabled: true,
  ringtoneUri: '',
  ringtoneName: '',
  weekStartsOn: 'mon',
}

export interface SettingsContextValue {
  settings: AppSettings
  ready: boolean
  update: (patch: Partial<AppSettings>) => Promise<void>
}

export const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  ready: false,
  update: async () => {},
})

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext)
}
