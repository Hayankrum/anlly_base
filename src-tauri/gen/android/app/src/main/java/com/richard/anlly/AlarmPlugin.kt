package com.richard.anlly

import android.Manifest
import android.app.Activity
import android.app.AlarmManager
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.Ringtone
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import app.tauri.plugin.PluginManager
import org.json.JSONArray
import org.json.JSONObject

@InvokeArg
class AlarmPayloadArgs {
  lateinit var occurrenceId: String
  lateinit var eventId: String
  lateinit var title: String
  lateinit var date: String
  lateinit var time: String
  var minutesBefore: Int = 0
}

@InvokeArg
class ResyncArgs {
  lateinit var payloads: List<AlarmPayloadArgs>
}

@InvokeArg
class OccurrenceArgs {
  lateinit var occurrenceId: String
}

@InvokeArg
class EventArgs {
  lateinit var eventId: String
}

@InvokeArg
class AlarmPrefsArgs {
  var vibrationEnabled: Boolean = true
  var ringtoneUri: String? = null
  var use12h: Boolean = false
}

@InvokeArg
class PreviewRingtoneArgs {
  var uri: String? = null
}

@TauriPlugin
class AlarmPlugin(private val activity: Activity) : Plugin(activity) {

  private var previewTone: Ringtone? = null

  @Command
  fun schedule(invoke: Invoke) {
    try {
      val args = invoke.parseArgs(AlarmPayloadArgs::class.java)
      val record = AlarmRecord(
        occurrenceId = args.occurrenceId,
        eventId = args.eventId,
        title = args.title,
        date = args.date,
        time = args.time,
        minutesBefore = args.minutesBefore,
      )
      val scheduled = AlarmScheduler(activity).schedule(record)
      val result = JSObject()
      result.put("scheduled", scheduled)
      invoke.resolve(result)
    } catch (e: Exception) {
      invoke.reject(e.message, e, null)
    }
  }

  @Command
  fun cancel(invoke: Invoke) {
    try {
      val args = invoke.parseArgs(OccurrenceArgs::class.java)
      AlarmScheduler(activity).cancel(args.occurrenceId)
      invoke.resolve()
    } catch (e: Exception) {
      invoke.reject(e.message, e, null)
    }
  }

  @Command
  fun cancelEvent(invoke: Invoke) {
    try {
      val args = invoke.parseArgs(EventArgs::class.java)
      AlarmScheduler(activity).cancelEvent(args.eventId)
      invoke.resolve()
    } catch (e: Exception) {
      invoke.reject(e.message, e, null)
    }
  }

  @Command
  fun resync(invoke: Invoke) {
    try {
      val args = invoke.parseArgs(ResyncArgs::class.java)
      val scheduler = AlarmScheduler(activity)
      scheduler.cancelAll()
      for (payload in args.payloads) {
        scheduler.schedule(
          AlarmRecord(
            occurrenceId = payload.occurrenceId,
            eventId = payload.eventId,
            title = payload.title,
            date = payload.date,
            time = payload.time,
            minutesBefore = payload.minutesBefore,
          )
        )
      }
      invoke.resolve()
    } catch (e: Exception) {
      invoke.reject(e.message, e, null)
    }
  }

  @Command
  fun status(invoke: Invoke) {
    try {
      val notificationManager =
        activity.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      val alarmManager = activity.getSystemService(Context.ALARM_SERVICE) as AlarmManager

      val notificationsGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        activity.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) ==
          PackageManager.PERMISSION_GRANTED
      } else {
        notificationManager.areNotificationsEnabled()
      }

      val canExact = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        alarmManager.canScheduleExactAlarms()
      } else {
        true
      }

      val canFsi = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        try {
          notificationManager.canUseFullScreenIntent()
        } catch (e: Exception) {
          true
        }
      } else {
        true
      }

      val result = JSObject()
      result.put("isAndroid", true)
      result.put("notificationsGranted", notificationsGranted)
      result.put("canScheduleExactAlarms", canExact)
      result.put("canUseFullScreenIntent", canFsi)
      result.put(
        "exactAlarmFallback",
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !canExact,
      )
      invoke.resolve(result)
    } catch (e: Exception) {
      invoke.reject(e.message, e, null)
    }
  }

  @Command
  fun requestNotificationPermission(invoke: Invoke) {
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        activity.runOnUiThread {
          try {
            PluginManager.requestPermissions(
              arrayOf(Manifest.permission.POST_NOTIFICATIONS),
            ) { result ->
              invoke.resolveObject(result[Manifest.permission.POST_NOTIFICATIONS] == true)
            }
          } catch (e: Exception) {
            invoke.reject(e.message, e, null)
          }
        }
      } else {
        val notificationManager =
          activity.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val enabled = notificationManager.areNotificationsEnabled()
        if (!enabled) {
          activity.runOnUiThread {
            try {
              val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                putExtra(Settings.EXTRA_APP_PACKAGE, activity.packageName)
              }
              activity.startActivity(intent)
            } catch (e: Exception) {
            }
          }
        }
        invoke.resolveObject(enabled)
      }
    } catch (e: Exception) {
      invoke.reject(e.message, e, null)
    }
  }

  @Command
  fun openExactAlarmSettings(invoke: Invoke) {
    activity.runOnUiThread {
      try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
            data = Uri.parse("package:${activity.packageName}")
          }
          activity.startActivity(intent)
        }
        invoke.resolve()
      } catch (e: Exception) {
        invoke.reject(e.message, e, null)
      }
    }
  }

  @Command
  fun openFullScreenIntentSettings(invoke: Invoke) {
    activity.runOnUiThread {
      try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
          val intent = Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT).apply {
            data = Uri.parse("package:${activity.packageName}")
          }
          activity.startActivity(intent)
        }
        invoke.resolve()
      } catch (e: Exception) {
        invoke.reject(e.message, e, null)
      }
    }
  }

  @Command
  fun setAlarmPrefs(invoke: Invoke) {
    try {
      val args = invoke.parseArgs(AlarmPrefsArgs::class.java)
      AlarmPrefs.save(activity, args.vibrationEnabled, args.ringtoneUri, args.use12h)
      AlarmNotification.updateChannel(activity)
      invoke.resolve()
    } catch (e: Exception) {
      invoke.reject(e.message, e, null)
    }
  }

  /** Alarm ringtones of the device as { title, uri } items. */
  @Command
  fun listRingtones(invoke: Invoke) {
    try {
      val manager = RingtoneManager(activity)
      manager.setType(RingtoneManager.TYPE_ALARM)
      val items = JSONArray()
      manager.cursor?.use { cursor ->
        val titleIndex =
          if (RingtoneManager.TITLE_COLUMN_INDEX in 0 until cursor.columnCount) {
            RingtoneManager.TITLE_COLUMN_INDEX
          } else {
            -1
          }
        while (cursor.moveToNext()) {
          val uri = manager.getRingtoneUri(cursor.position) ?: continue
          val title = (if (titleIndex >= 0) cursor.getString(titleIndex) else null)
            ?.takeIf { it.isNotBlank() }
            ?: "Toque ${cursor.position + 1}"
          items.put(JSONObject().put("title", title).put("uri", uri.toString()))
        }
      }
      val result = JSObject()
      result.put("items", items)
      invoke.resolve(result)
    } catch (e: Exception) {
      invoke.reject(e.message, e, null)
    }
  }

  /** Plays a preview of the given ringtone; uri = null/empty stops it. */
  @Command
  fun previewRingtone(invoke: Invoke) {
    try {
      val args = invoke.parseArgs(PreviewRingtoneArgs::class.java)
      stopRingtonePreview()
      val uriValue = args.uri
      if (!uriValue.isNullOrEmpty()) {
        val tone: Ringtone? = RingtoneManager.getRingtone(activity, Uri.parse(uriValue))
        if (tone != null) {
          tone.audioAttributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
          tone.isLooping = true
          tone.play()
          previewTone = tone
        }
      }
      invoke.resolve()
    } catch (e: Exception) {
      invoke.reject(e.message, e, null)
    }
  }

  override fun onDestroy() {
    stopRingtonePreview()
    super.onDestroy()
  }

  private fun stopRingtonePreview() {
    try {
      previewTone?.stop()
    } catch (e: Exception) {
    }
    previewTone = null
  }
}
