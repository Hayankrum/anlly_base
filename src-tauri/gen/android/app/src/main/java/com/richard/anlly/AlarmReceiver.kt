package com.richard.anlly

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * Receives alarm broadcasts from AlarmManager:
 *
 * - FIRE: posts the alarm notification WITH its full-screen intent — the
 *   single launch mechanism. A direct `startActivity` from a background
 *   receiver is subject to Android's background-activity-start block: when
 *   blocked it leaves an abandoned activity record that resurrects and rings
 *   again after the user has already decided the alarm, and launching both
 *   ways (activity + FSI) creates duplicate ringing instances. With FSI the
 *   system launches [AlarmActivity] over the lock screen when the device is
 *   dozing (~1s); when the screen is on, the high-priority heads-up
 *   notification alerts and its content intent opens the ringing screen on
 *   tap (user-initiated starts are never blocked).
 * - SNOOZE: re-schedules the same occurrence in 5 minutes.
 * - DISMISS: stops a ringing activity and drops the stored record.
 */
class AlarmReceiver : BroadcastReceiver() {
  private companion object {
    const val TAG = "AnllyAlarm"
  }

  override fun onReceive(context: Context, intent: Intent) {
    val record = AlarmScheduler.recordFrom(intent) ?: return
    Log.i(TAG, "onReceive action=${intent.action} occurrence=${record.occurrenceId} title=${record.title}")
    when (intent.action) {
      AlarmScheduler.ACTION_FIRE -> {
        AlarmNotification.show(context, record, withFsi = true)
      }
      AlarmScheduler.ACTION_SNOOZE -> {
        AlarmNotification.cancel(context, record.occurrenceId)
        AlarmActivity.stopRinging()
        AlarmScheduler(context).scheduleSnooze(record)
      }
      AlarmScheduler.ACTION_DISMISS -> {
        AlarmNotification.cancel(context, record.occurrenceId)
        AlarmActivity.stopRinging()
        AlarmScheduler(context).removeRecord(record.occurrenceId)
      }
    }
  }
}
