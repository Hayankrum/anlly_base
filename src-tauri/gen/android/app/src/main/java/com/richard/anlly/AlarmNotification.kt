package com.richard.anlly

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.AudioManager
import android.os.Build
import androidx.core.app.NotificationCompat

/**
 * High-priority alarm notification with full-screen intent, system alarm
 * ringtone and DESLIGAR/SONECA actions. Posted by [AlarmReceiver] before the
 * ringing activity starts so the alarm is visible even when the system blocks
 * background activity starts.
 */
object AlarmNotification {
  private const val CHANNEL_ID = "anlly_alarms"
  private val VIBRATION_PATTERN = longArrayOf(0, 700, 700)

  /**
   * Posts the alarm notification. [withFsi] attaches the full-screen intent —
   * the system's mechanism for launching the ringing [AlarmActivity] over
   * the lock screen while the device is dozing.
   */
  fun show(context: Context, record: AlarmRecord, withFsi: Boolean = true) {
    val manager =
      context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    syncChannel(context, manager)

    val vibrationEnabled = AlarmPrefs.vibrationEnabled(context)
    val timeText = AlarmPrefs.formatTime(record.time, AlarmPrefs.use12h(context))

    val builder = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(R.mipmap.ic_launcher)
      .setContentTitle(record.title)
      .setContentText("${record.date} às $timeText")
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setOngoing(true)
      .setAutoCancel(false)
      .setContentIntent(AlarmScheduler.alarmPendingIntent(context, record))
      .setSound(AlarmPrefs.soundUri(context), AudioManager.STREAM_ALARM)
      .setVibrate(if (vibrationEnabled) VIBRATION_PATTERN else null)
      .addAction(
        android.R.drawable.ic_lock_idle_alarm,
        "DESLIGAR",
        receiverIntent(context, AlarmScheduler.ACTION_DISMISS, record),
      )
      .addAction(
        android.R.drawable.ic_media_pause,
        "SONECA",
        receiverIntent(context, AlarmScheduler.ACTION_SNOOZE, record),
      )

    if (withFsi && canUseFullScreenIntent(manager)) {
      builder.setFullScreenIntent(
        AlarmScheduler.alarmPendingIntent(context, record),
        true,
      )
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
      context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) !=
      PackageManager.PERMISSION_GRANTED
    ) {
      // Without the runtime permission the notification is dropped silently;
      // the ringing activity (when launched) still shows the alarm.
      return
    }

    manager.notify(notificationId(record.occurrenceId), builder.build())
  }

  fun cancel(context: Context, occurrenceId: String) {
    val manager =
      context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    manager.cancel(notificationId(occurrenceId))
  }

  private fun canUseFullScreenIntent(manager: NotificationManager): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) return true
    return try {
      manager.canUseFullScreenIntent()
    } catch (e: Exception) {
      true
    }
  }

  /** Recreates the alarm channel so ringtone/vibration changes take effect. */
  fun updateChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager =
      context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    syncChannel(context, manager)
  }

  private fun syncChannel(context: Context, manager: NotificationManager) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

    val soundUri = AlarmPrefs.soundUri(context)
    val vibrationEnabled = AlarmPrefs.vibrationEnabled(context)
    val soundAttrs = AudioAttributes.Builder()
      .setUsage(AudioAttributes.USAGE_ALARM)
      .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
      .build()

    val channel = manager.getNotificationChannel(CHANNEL_ID)
      ?: NotificationChannel(
        CHANNEL_ID,
        "Alarmes",
        NotificationManager.IMPORTANCE_HIGH,
      ).also { it.description = "Alertas de horário dos eventos da agenda" }

    channel.enableVibration(vibrationEnabled)
    if (vibrationEnabled) {
      channel.setVibrationPattern(VIBRATION_PATTERN)
    }
    channel.setSound(soundUri, soundAttrs)
    manager.createNotificationChannel(channel)
  }

  private fun receiverIntent(
    context: Context,
    action: String,
    record: AlarmRecord,
  ): PendingIntent {
    val intent = Intent(context, AlarmReceiver::class.java).apply {
      this.action = action
      putExtras(AlarmScheduler.extrasOf(record))
    }
    return PendingIntent.getBroadcast(
      context,
      record.occurrenceId.hashCode(),
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun notificationId(occurrenceId: String): Int = occurrenceId.hashCode()
}
