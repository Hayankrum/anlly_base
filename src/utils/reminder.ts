/** Values are the `alarmEnabled` + `alarmMinutesBefore` pair, encoded. */
export const REMINDER_OPTIONS: { value: string; label: string }[] = [
  { value: 'off', label: 'Sem lembrete' },
  { value: '0', label: 'No horário' },
  { value: '5', label: '5 minutos antes' },
  { value: '10', label: '10 minutos antes' },
  { value: '15', label: '15 minutos antes' },
  { value: '30', label: '30 minutos antes' },
]

/** Encodes the two stored columns into a single <select> value. */
export function reminderValue(alarmEnabled: boolean, alarmMinutesBefore: number): string {
  return alarmEnabled ? String(alarmMinutesBefore) : 'off'
}

/** Human label of a reminder, for read-only screens. */
export function reminderLabel(alarmEnabled: boolean, alarmMinutesBefore: number): string {
  if (!alarmEnabled) return 'Sem lembrete'
  if (alarmMinutesBefore === 0) return 'No horário'
  return `${alarmMinutesBefore} minutos antes`
}

/** Inverse of `reminderValue`. */
export function reminderFromValue(value: string): { enabled: boolean; minutes: number } {
  if (value === 'off') return { enabled: false, minutes: 0 }
  const minutes = Number(value)
  return Number.isFinite(minutes) ? { enabled: true, minutes } : { enabled: false, minutes: 0 }
}
