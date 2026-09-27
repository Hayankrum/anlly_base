package com.richard.anlly

import android.app.AlarmManager
import java.util.Calendar

/**
 * One scheduled alarm for a single occurrence of an event.
 * [fireAt] is an absolute epoch millis in the device timezone (RTC_WAKEUP).
 */
data class AlarmRecord(
  val occurrenceId: String,
  val eventId: String,
  val title: String,
  /** YYYY-MM-DD */
  val date: String,
  /** HH:mm */
  val time: String,
  val minutesBefore: Int,
  var fireAt: Long = 0L,
  var snoozed: Boolean = false,
)

class AlarmScheduler(private val context: android.content.Context) {

  private val alarmManager: android.app.AlarmManager =
    context.getSystemService(android.content.Context.ALARM_SERVICE) as android.app.AlarmManager
  private val prefs =
    context.getSharedPreferences(PREFS_NAME, android.content.Context.MODE_PRIVATE)

  fun canScheduleExactAlarms(): Boolean {
    return if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
      alarmManager.canScheduleExactAlarms()
    } else {
      true
    }
  }

  /**
   * Schedules a future alarm for the occurrence. Past occurrences are never
   * scheduled. A pending snooze is preserved (app relaunch/rebuild case).
   */
  fun schedule(record: AlarmRecord): Boolean {
    val existing = readRecord(record.occurrenceId)
    if (existing != null && existing.snoozed && existing.fireAt > System.currentTimeMillis()) {
      return true
    }
    val fireAt = fireAtMillis(record.date, record.time, record.minutesBefore)
    if (fireAt == null || fireAt <= System.currentTimeMillis()) {
      cancel(record.occurrenceId)
      return false
    }
    val stored = record.copy(fireAt = fireAt, snoozed = false)
    setAlarm(stored, stored.fireAt)
    writeRecord(stored)
    return true
  }

  fun scheduleSnooze(record: AlarmRecord, delayMillis: Long = SNOOZE_DELAY_MS) {
    val stored = record.copy(
      fireAt = System.currentTimeMillis() + delayMillis,
      snoozed = true,
    )
    setAlarm(stored, stored.fireAt)
    writeRecord(stored)
  }

  /** Cancels the pending alarm, its notification and the stored record. */
  fun cancel(occurrenceId: String) {
    cancelPendingIntent(occurrenceId)
    AlarmNotification.cancel(context, occurrenceId)
    removeRecord(occurrenceId)
  }

  fun cancelEvent(eventId: String) {
    for (record in readAll()) {
      if (record.eventId == eventId) cancel(record.occurrenceId)
    }
  }

  fun cancelAll() {
    for (record in readAll()) {
      cancelPendingIntent(record.occurrenceId)
      AlarmNotification.cancel(context, record.occurrenceId)
    }
    prefs.edit().clear().apply()
  }

  fun removeRecord(occurrenceId: String) {
    prefs.edit().remove(occurrenceId).apply()
  }

  /** Re-schedules every locally stored alarm that is still in the future. */
  fun restoreFromStorage() {
    val now = System.currentTimeMillis()
    for (record in readAll()) {
      if (record.fireAt > now) setAlarm(record, record.fireAt)
    }
  }

  private fun setAlarm(record: AlarmRecord, fireAt: Long) {
    val operation = firePendingIntent(record)
    val showIntent = showPendingIntent(record)
    try {
      when {
        canScheduleExactAlarms() ->
          alarmManager.setAlarmClock(
            android.app.AlarmManager.AlarmClockInfo(fireAt, showIntent),
            operation,
          )
        android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M ->
          alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, fireAt, operation)
        else ->
          alarmManager.set(AlarmManager.RTC_WAKEUP, fireAt, operation)
      }
    } catch (e: SecurityException) {
      // Permission revoked between the check and the call: degrade gracefully.
      inexactFallback(fireAt, operation)
    }
  }

  private fun inexactFallback(fireAt: Long, operation: android.app.PendingIntent) {
    try {
      if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
        alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, fireAt, operation)
      } else {
        alarmManager.set(AlarmManager.RTC_WAKEUP, fireAt, operation)
      }
    } catch (e: Exception) {
      try {
        alarmManager.set(AlarmManager.RTC_WAKEUP, fireAt, operation)
      } catch (ignored: Exception) {
      }
    }
  }

  private fun firePendingIntent(record: AlarmRecord): android.app.PendingIntent {
    val intent = android.content.Intent(context, AlarmReceiver::class.java).apply {
      action = ACTION_FIRE
      putExtras(AlarmScheduler.extrasOf(record))
    }
    return android.app.PendingIntent.getBroadcast(
      context,
      record.occurrenceId.hashCode(),
      intent,
      android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun showPendingIntent(record: AlarmRecord): android.app.PendingIntent {
    return showPendingIntent(context, record)
  }

  private fun cancelPendingIntent(occurrenceId: String) {
    val intent = android.content.Intent(context, AlarmReceiver::class.java).apply {
      action = ACTION_FIRE
    }
    val pending = android.app.PendingIntent.getBroadcast(
      context,
      occurrenceId.hashCode(),
      intent,
      android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE,
    )
    pending.cancel()
  }

  private fun fireAtMillis(date: String, time: String, minutesBefore: Int): Long? {
    val dateParts = date.split("-")
    val timeParts = time.split(":")
    if (dateParts.size != 3 || timeParts.size != 2) return null
    return try {
      val calendar = Calendar.getInstance().apply {
        set(Calendar.YEAR, dateParts[0].toInt())
        set(Calendar.MONTH, dateParts[1].toInt() - 1)
        set(Calendar.DAY_OF_MONTH, dateParts[2].toInt())
        set(Calendar.HOUR_OF_DAY, timeParts[0].toInt())
        set(Calendar.MINUTE, timeParts[1].toInt())
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
      }
      calendar.timeInMillis - minutesBefore * 60_000L
    } catch (e: NumberFormatException) {
      null
    }
  }

  private fun writeRecord(record: AlarmRecord) {
    val json = org.json.JSONObject().apply {
      put("occurrenceId", record.occurrenceId)
      put("eventId", record.eventId)
      put("title", record.title)
      put("date", record.date)
      put("time", record.time)
      put("minutesBefore", record.minutesBefore)
      put("fireAt", record.fireAt)
      put("snoozed", record.snoozed)
    }
    prefs.edit().putString(record.occurrenceId, json.toString()).apply()
  }

  private fun readRecord(occurrenceId: String): AlarmRecord? {
    val raw = prefs.getString(occurrenceId, null) ?: return null
    return parse(raw)
  }

  private fun readAll(): List<AlarmRecord> {
    return prefs.all.values
      .filterIsInstance<String>()
      .mapNotNull { parse(it) }
  }

  private fun parse(raw: String): AlarmRecord? {
    return try {
      val json = org.json.JSONObject(raw)
      AlarmRecord(
        occurrenceId = json.getString("occurrenceId"),
        eventId = json.getString("eventId"),
        title = json.getString("title"),
        date = json.getString("date"),
        time = json.getString("time"),
        minutesBefore = json.optInt("minutesBefore", 0),
        fireAt = json.optLong("fireAt", 0L),
        snoozed = json.optBoolean("snoozed", false),
      )
    } catch (e: Exception) {
      null
    }
  }

  companion object {
    const val PREFS_NAME = "anlly_alarms"
    const val ACTION_FIRE = "com.richard.anlly.action.ALARM_FIRE"
    const val ACTION_SNOOZE = "com.richard.anlly.action.ALARM_SNOOZE"
    const val ACTION_DISMISS = "com.richard.anlly.action.ALARM_DISMISS"
    const val SNOOZE_DELAY_MS = 5 * 60 * 1000L

    const val EXTRA_OCCURRENCE_ID = "com.richard.anlly.extra.occurrenceId"
    const val EXTRA_EVENT_ID = "com.richard.anlly.extra.eventId"
    const val EXTRA_TITLE = "com.richard.anlly.extra.title"
    const val EXTRA_DATE = "com.richard.anlly.extra.date"
    const val EXTRA_TIME = "com.richard.anlly.extra.time"
    const val EXTRA_MINUTES_BEFORE = "com.richard.anlly.extra.minutesBefore"

    fun extrasOf(record: AlarmRecord): android.os.Bundle {
      return android.os.Bundle().apply {
        putString(EXTRA_OCCURRENCE_ID, record.occurrenceId)
        putString(EXTRA_EVENT_ID, record.eventId)
        putString(EXTRA_TITLE, record.title)
        putString(EXTRA_DATE, record.date)
        putString(EXTRA_TIME, record.time)
        putInt(EXTRA_MINUTES_BEFORE, record.minutesBefore)
      }
    }

    /** Opens (or re-uses) the main activity — used as the AlarmClock show intent. */
    fun showPendingIntent(
      context: android.content.Context,
      record: AlarmRecord,
    ): android.app.PendingIntent {
      val intent = android.content.Intent(context, MainActivity::class.java).apply {
        action = android.content.Intent.ACTION_VIEW
        data = android.net.Uri.parse("anlly://event/${record.eventId}")
        flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK or
          android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP
      }
      return android.app.PendingIntent.getActivity(
        context,
        record.occurrenceId.hashCode(),
        intent,
        android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE,
      )
    }

    /** Launches the ringing screen — used by the notification content/full-screen
     *  intents so a fired alarm opens [AlarmActivity], never the calendar. */
    fun alarmPendingIntent(
      context: android.content.Context,
      record: AlarmRecord,
    ): android.app.PendingIntent {
      val intent = android.content.Intent(context, AlarmActivity::class.java).apply {
        action = ACTION_FIRE
        putExtras(extrasOf(record))
        flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK or
          android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP
      }
      return android.app.PendingIntent.getActivity(
        context,
        record.occurrenceId.hashCode(),
        intent,
        android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE,
      )
    }

    fun recordFrom(intent: android.content.Intent): AlarmRecord? {
      val occurrenceId = intent.getStringExtra(EXTRA_OCCURRENCE_ID) ?: return null
      val eventId = intent.getStringExtra(EXTRA_EVENT_ID) ?: return null
      val title = intent.getStringExtra(EXTRA_TITLE) ?: return null
      val date = intent.getStringExtra(EXTRA_DATE) ?: return null
      val time = intent.getStringExtra(EXTRA_TIME) ?: return null
      return AlarmRecord(
        occurrenceId = occurrenceId,
        eventId = eventId,
        title = title,
        date = date,
        time = time,
        minutesBefore = intent.getIntExtra(EXTRA_MINUTES_BEFORE, 0),
      )
    }
  }
}
