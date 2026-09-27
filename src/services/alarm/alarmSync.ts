import { compareDateTimeThenId } from '../../utils/dates'
import type { AlarmRequest } from '../../types/event'
import { buildEventAlarmRequests, loadEvents } from '../eventService'
import { resyncAlarms } from './alarmService'

/**
 * Single owner of the native alarm list.
 *
 * `resync_alarms` clears everything before scheduling, so the list must be
 * rebuilt from the database in one shot here.
 */

function sortRequests(requests: AlarmRequest[]): AlarmRequest[] {
  return requests.sort((a, b) =>
    compareDateTimeThenId(
      { date: a.date, time: a.time, id: a.occurrenceId },
      { date: b.date, time: b.time, id: b.occurrenceId },
    ),
  )
}

/** Rebuilds every future alarm from the database (app start / manual refresh). */
export async function resyncAllAlarms(): Promise<void> {
  const events = await loadEvents()
  await resyncAlarms(sortRequests(buildEventAlarmRequests(events)))
}
