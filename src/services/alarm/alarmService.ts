import { invoke } from '@tauri-apps/api/core'
import type { AlarmRequest, AlarmStatus } from '../../types/event'

const DESKTOP_STATUS: AlarmStatus = {
  isAndroid: false,
  notificationsGranted: false,
  canScheduleExactAlarms: false,
  canUseFullScreenIntent: false,
  exactAlarmFallback: false,
}

function isTauriContext(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/**
 * Thin bridge to the native alarm layer.
 * The real scheduling happens in Android (AlarmManager); on desktop/web this
 * is a safe no-op — JavaScript timers are never used as alarms.
 */
async function call<T>(cmd: string, args?: Record<string, unknown>): Promise<T | null> {
  if (!isTauriContext()) return null
  try {
    return await invoke<T>(cmd, args)
  } catch (err) {
    console.warn(`[alarm] comando "${cmd}" falhou:`, err)
    return null
  }
}

export function buildAlarmRequest(occ: {
  id: string
  eventId: string
  date: string
  time: string
  alarmMinutesBefore: number
}, title: string): AlarmRequest {
  return {
    occurrenceId: occ.id,
    eventId: occ.eventId,
    title,
    date: occ.date,
    time: occ.time,
    minutesBefore: occ.alarmMinutesBefore,
  }
}

export async function scheduleAlarm(payload: AlarmRequest): Promise<void> {
  await call('schedule_alarm', { payload })
}

export async function cancelAlarm(occurrenceId: string): Promise<void> {
  await call('cancel_alarm', { occurrenceId })
}

export async function cancelEventAlarms(eventId: string): Promise<void> {
  await call('cancel_event_alarms', { eventId })
}

/** Cancels everything and schedules the given future alarms again (no duplicates). */
export async function resyncAlarms(payloads: AlarmRequest[]): Promise<void> {
  await call('resync_alarms', { payloads })
}

export async function getAlarmStatus(): Promise<AlarmStatus> {
  if (!isTauriContext()) return DESKTOP_STATUS
  const status = await call<AlarmStatus>('alarm_status')
  return status ?? DESKTOP_STATUS
}

export async function requestNotificationPermission(): Promise<boolean> {
  const result = await call<boolean>('request_notification_permission')
  return result ?? false
}

export async function openExactAlarmSettings(): Promise<void> {
  await call('open_exact_alarm_settings')
}

export async function openFullScreenIntentSettings(): Promise<void> {
  await call('open_full_screen_intent_settings')
}

/* ---------- Preferências do alarme (configurações) ---------- */

export interface AlarmPrefsInput {
  vibrationEnabled: boolean
  /** null/empty = system default alarm ringtone */
  ringtoneUri: string | null
  use12h: boolean
}

export interface RingtoneInfo {
  title: string
  uri: string
}

/** Pushes sound/vibration/12h prefs to Android (channel + fire-time behavior). */
export async function setAlarmPrefs(prefs: AlarmPrefsInput): Promise<void> {
  await call('set_alarm_prefs', { prefs })
}

/** Alarm ringtones available on the device (empty on desktop). */
export async function listRingtones(): Promise<RingtoneInfo[]> {
  const result = await call<{ items: RingtoneInfo[] }>('list_ringtones')
  return result?.items ?? []
}

/** Plays a preview (uri = null stops it). */
export async function previewRingtone(uri: string | null): Promise<void> {
  await call('preview_ringtone', { uri })
}
