package com.richard.anlly

import android.app.Activity
import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.ToneGenerator
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView

/**
 * Full-screen ringing alarm. Shows over the lock screen, turns the screen on
 * and plays the system alarm ringtone (fallback: DTMF beeps) with continuous
 * vibration until the user dismisses or snoozes.
 */
class AlarmActivity : Activity() {

  private var record: AlarmRecord? = null
  private var handled = false
  private var ringing = false
  private var mediaPlayer: MediaPlayer? = null
  private var toneGenerator: ToneGenerator? = null
  private val handler = Handler(Looper.getMainLooper())
  private val beepRunnable = object : Runnable {
    override fun run() {
      if (!ringing) return
      try {
        toneGenerator?.startTone(ToneGenerator.TONE_DTMF_S, 700)
      } catch (e: Exception) {
      }
      handler.postDelayed(this, 1600)
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    prepareWindow()

    val initial = AlarmScheduler.recordFrom(intent)
    if (initial == null) {
      finish()
      return
    }

    val previous = current
    if (previous != null && previous !== this && !previous.isFinishing) {
      // A ringing instance already exists — never ring twice. The other
      // instance keeps the UI; this one was a duplicate (late FSI/content tap).
      Log.i(TAG, "AlarmActivity duplicate instance blocked")
      finish()
      return
    }

    current = this
    Log.i(TAG, "AlarmActivity onCreate title=${initial.title} time=${initial.time}")
    setContentView(R.layout.activity_alarm)
    bindRecord(initial)
    findViewById<Button>(R.id.alarm_dismiss).setOnClickListener { dismiss() }
    findViewById<Button>(R.id.alarm_snooze).setOnClickListener { snooze() }
    startRinging()
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    val next = AlarmScheduler.recordFrom(intent) ?: return
    bindRecord(next)
    if (!ringing) startRinging()
  }

  @Deprecated("Deprecated in Java")
  override fun onBackPressed() {
    dismiss()
  }

  override fun onDestroy() {
    super.onDestroy()
    Log.i(TAG, "AlarmActivity onDestroy handled=$handled")
    stopRingingInternal()
    val pending = record
    if (!handled && pending != null) {
      // The activity was destroyed without a decision (e.g. task swiped):
      // keep the alarm visible so it can still be dismissed or snoozed.
      try {
        AlarmNotification.show(this, pending)
      } catch (e: Exception) {
      }
    }
    if (current === this) current = null
  }

  private fun prepareWindow() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
      val keyguard = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
      keyguard.requestDismissKeyguard(this, object : KeyguardManager.KeyguardDismissCallback() {
        override fun onDismissError() {}
        override fun onDismissSucceeded() {}
        override fun onDismissCancelled() {}
      })
    } else {
      @Suppress("DEPRECATION")
      window.addFlags(
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
          WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
          WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON,
      )
    }
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
  }

  private fun bindRecord(value: AlarmRecord) {
    record = value
    findViewById<TextView>(R.id.alarm_time).text =
      AlarmPrefs.formatTime(value.time, AlarmPrefs.use12h(this))
    findViewById<TextView>(R.id.alarm_title).text = value.title
    findViewById<TextView>(R.id.alarm_date).text = formatDate(value)
  }

  private fun startRinging() {
    val value = record ?: return
    try {
      AlarmNotification.cancel(this, value.occurrenceId)
    } catch (e: Exception) {
    }
    ringing = true
    playSound()
    if (AlarmPrefs.vibrationEnabled(this)) {
      startVibration()
    }
  }

  private fun playSound() {
    val uri = AlarmPrefs.soundUri(this)
    var started = false
    if (uri != null) {
      try {
        val attrs = AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_ALARM)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build()
        mediaPlayer = MediaPlayer.create(applicationContext, uri, null, attrs, 0)
        mediaPlayer?.let {
          it.isLooping = true
          it.start()
          started = true
        }
      } catch (e: Exception) {
        started = false
      }
    }
    if (!started) {
      try {
        toneGenerator = ToneGenerator(AudioManager.STREAM_ALARM, 80)
        handler.post(beepRunnable)
      } catch (e: Exception) {
      }
    }
  }

  @Suppress("DEPRECATION")
  private fun startVibration() {
    try {
      val vibrator = currentVibrator()
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        vibrator.vibrate(VibrationEffect.createWaveform(VIBRATION_PATTERN, 0))
      } else {
        vibrator.vibrate(VIBRATION_PATTERN, 0)
      }
    } catch (e: Exception) {
    }
  }

  @Suppress("DEPRECATION")
  private fun currentVibrator(): Vibrator {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      val manager =
        getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
      manager.defaultVibrator
    } else {
      getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
    }
  }

  private fun dismiss() {
    val value = record
    handled = true
    if (value != null) {
      try {
        AlarmScheduler(this).cancel(value.occurrenceId)
      } catch (e: Exception) {
      }
    }
    stopRingingInternal()
    finish()
  }

  private fun snooze() {
    val value = record
    handled = true
    if (value != null) {
      try {
        AlarmNotification.cancel(this, value.occurrenceId)
        AlarmScheduler(this).scheduleSnooze(value)
      } catch (e: Exception) {
      }
    }
    stopRingingInternal()
    finish()
  }

  /** Called by [AlarmReceiver] when a notification action decides the alarm. */
  private fun stopFromAction() {
    handled = true
    stopRingingInternal()
    finish()
  }

  private fun stopRingingInternal() {
    ringing = false
    handler.removeCallbacks(beepRunnable)
    try {
      mediaPlayer?.stop()
    } catch (e: Exception) {
    }
    mediaPlayer?.release()
    mediaPlayer = null
    try {
      toneGenerator?.stopTone()
    } catch (e: Exception) {
    }
    toneGenerator?.release()
    toneGenerator = null
    try {
      currentVibrator().cancel()
    } catch (e: Exception) {
    }
  }

  companion object {
    private const val TAG = "AnllyAlarm"
    private val VIBRATION_PATTERN = longArrayOf(0, 700, 700)
    private val MONTHS = arrayOf(
      "janeiro", "fevereiro", "março", "abril", "maio", "junho",
      "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
    )

    @Volatile
    private var current: AlarmActivity? = null

    fun stopRinging() {
      current?.stopFromAction()
    }

    private fun formatDate(record: AlarmRecord): String {
      val parts = record.date.split("-")
      if (parts.size != 3) return record.date
      val day = parts[2].toIntOrNull() ?: return record.date
      val monthIndex = (parts[1].toIntOrNull() ?: return record.date) - 1
      if (monthIndex !in MONTHS.indices) return record.date
      return "$day de ${MONTHS[monthIndex]}"
    }
  }
}
