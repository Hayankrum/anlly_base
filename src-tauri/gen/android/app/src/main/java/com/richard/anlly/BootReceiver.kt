package com.richard.anlly

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.app.AlarmManager

/**
 * Restores every locally stored alarm after a reboot, app update or an
 * exact-alarm permission change. AlarmManager alarms do not survive reboots,
 * but the records are kept in SharedPreferences for exactly this purpose.
 */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      Intent.ACTION_BOOT_COMPLETED,
      Intent.ACTION_MY_PACKAGE_REPLACED,
      AlarmManager.ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED,
      -> {
        try {
          AlarmScheduler(context).restoreFromStorage()
        } catch (e: Exception) {
        }
      }
    }
  }
}
