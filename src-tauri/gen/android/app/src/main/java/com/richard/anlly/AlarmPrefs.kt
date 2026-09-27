package com.richard.anlly

import android.content.Context
import android.content.SharedPreferences
import android.media.RingtoneManager
import android.net.Uri

/**
 * Alarm preferences shared with the app settings screen: ringtone, vibration
 * and 12h/24h format. Persisted in SharedPreferences (the JS settings table
 * is the source of truth and pushes values here through `setAlarmPrefs`).
 */
object AlarmPrefs {
  private const val PREFS_NAME = "anlly_prefs"

  fun prefs(context: Context): SharedPreferences =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  fun save(context: Context, vibrationEnabled: Boolean, ringtoneUri: String?, use12h: Boolean) {
    prefs(context)
      .edit()
      .putBoolean("vibration_enabled", vibrationEnabled)
      .putString("ringtone_uri", ringtoneUri?.takeIf { it.isNotEmpty() })
      .putBoolean("use12h", use12h)
      .apply()
  }

  fun vibrationEnabled(context: Context): Boolean =
    prefs(context).getBoolean("vibration_enabled", true)

  fun use12h(context: Context): Boolean =
    prefs(context).getBoolean("use12h", false)

  /** Custom ringtone or the system default alarm sound (never null in practice). */
  fun soundUri(context: Context): Uri? {
    val custom = prefs(context).getString("ringtone_uri", null)
    if (!custom.isNullOrEmpty()) {
      try {
        return Uri.parse(custom)
      } catch (e: Exception) {
      }
    }
    return RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
      ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
  }

  /** "14:53" stays "14:53" in 24h mode, becomes "2:53 PM" in 12h mode. */
  fun formatTime(time: String, use12h: Boolean): String {
    if (!use12h) return time
    val parts = time.split(":")
    if (parts.size != 2) return time
    val hour = parts[0].toIntOrNull() ?: return time
    val minute = parts[1]
    if (hour !in 0..23) return time
    val period = if (hour < 12) "AM" else "PM"
    val rem = hour % 12
    val hour12 = if (rem == 0) 12 else rem
    return "$hour12:$minute $period"
  }
}
