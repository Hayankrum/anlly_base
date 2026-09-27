use serde::{Deserialize, Serialize};

#[cfg(target_os = "android")]
use tauri::Manager;

/// One alarm per occurrence (never per event) — section 14.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AlarmPayload {
  pub occurrence_id: String,
  pub event_id: String,
  pub title: String,
  /// YYYY-MM-DD (local calendar date)
  pub date: String,
  /// HH:mm
  pub time: String,
  pub minutes_before: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AlarmStatus {
  pub is_android: bool,
  pub notifications_granted: bool,
  pub can_schedule_exact_alarms: bool,
  pub can_use_full_screen_intent: bool,
  pub exact_alarm_fallback: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct OccurrenceRef {
  occurrence_id: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct EventRef {
  event_id: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ResyncPayload {
  payloads: Vec<AlarmPayload>,
}

/// Sound/vibration/12h preferences pushed to the Android alarm layer.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AlarmPrefs {
  pub vibration_enabled: bool,
  /// null/empty = system default alarm ringtone
  pub ringtone_uri: Option<String>,
  pub use12h: bool,
}

/// One device ringtone (title + content uri).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RingtoneInfo {
  pub title: String,
  pub uri: String,
}

#[cfg(target_os = "android")]
#[derive(Debug, Deserialize)]
struct RingtoneListResult {
  items: Vec<RingtoneInfo>,
}

/// Handle to the Kotlin `AlarmPlugin` (Android only).
#[cfg(target_os = "android")]
pub struct AlarmPluginState(pub tauri::plugin::PluginHandle<tauri::Wry>);

/// Runs a command on the Kotlin alarm plugin. Blocking on purpose: the
/// response comes back from the Android main thread through JNI.
#[cfg(target_os = "android")]
async fn run_android<P: Serialize + Send + 'static>(
  app: tauri::AppHandle,
  command: &'static str,
  payload: P,
) -> Result<serde_json::Value, String> {
  let handle = app.state::<AlarmPluginState>().0.clone();
  tauri::async_runtime::spawn_blocking(move || {
    handle.run_mobile_plugin::<serde_json::Value>(command, payload)
  })
  .await
  .map_err(|e| e.to_string())?
  .map_err(|e| e.to_string())
}

#[cfg(not(target_os = "android"))]
async fn run_android<P: Serialize + Send + 'static>(
  _app: tauri::AppHandle,
  _command: &'static str,
  _payload: P,
) -> Result<serde_json::Value, String> {
  Ok(serde_json::Value::Null)
}

#[tauri::command]
async fn schedule_alarm(app: tauri::AppHandle, payload: AlarmPayload) -> Result<(), String> {
  run_android(app, "schedule", payload).await.map(|_| ())
}

#[tauri::command]
async fn cancel_alarm(app: tauri::AppHandle, occurrence_id: String) -> Result<(), String> {
  run_android(app, "cancel", OccurrenceRef { occurrence_id })
    .await
    .map(|_| ())
}

#[tauri::command]
async fn cancel_event_alarms(app: tauri::AppHandle, event_id: String) -> Result<(), String> {
  run_android(app, "cancelEvent", EventRef { event_id })
    .await
    .map(|_| ())
}

#[tauri::command]
async fn resync_alarms(app: tauri::AppHandle, payloads: Vec<AlarmPayload>) -> Result<(), String> {
  run_android(app, "resync", ResyncPayload { payloads })
    .await
    .map(|_| ())
}

#[cfg(target_os = "android")]
async fn alarm_status_impl(app: tauri::AppHandle) -> Result<AlarmStatus, String> {
  let value = run_android(app, "status", serde_json::json!({})).await?;
  serde_json::from_value(value).map_err(|e| e.to_string())
}

#[cfg(not(target_os = "android"))]
async fn alarm_status_impl(_app: tauri::AppHandle) -> Result<AlarmStatus, String> {
  Ok(AlarmStatus {
    is_android: false,
    notifications_granted: false,
    can_schedule_exact_alarms: false,
    can_use_full_screen_intent: false,
    exact_alarm_fallback: false,
  })
}

#[tauri::command]
async fn alarm_status(app: tauri::AppHandle) -> Result<AlarmStatus, String> {
  alarm_status_impl(app).await
}

#[cfg(target_os = "android")]
async fn request_notification_permission_impl(app: tauri::AppHandle) -> Result<bool, String> {
  let value = run_android(app, "requestNotificationPermission", serde_json::json!({})).await?;
  Ok(value.as_bool().unwrap_or(false))
}

#[cfg(not(target_os = "android"))]
async fn request_notification_permission_impl(_app: tauri::AppHandle) -> Result<bool, String> {
  Ok(false)
}

#[tauri::command]
async fn request_notification_permission(app: tauri::AppHandle) -> Result<bool, String> {
  request_notification_permission_impl(app).await
}

#[tauri::command]
async fn open_exact_alarm_settings(app: tauri::AppHandle) -> Result<(), String> {
  run_android(app, "openExactAlarmSettings", serde_json::json!({}))
    .await
    .map(|_| ())
}

#[tauri::command]
async fn open_full_screen_intent_settings(app: tauri::AppHandle) -> Result<(), String> {
  run_android(app, "openFullScreenIntentSettings", serde_json::json!({}))
    .await
    .map(|_| ())
}

#[tauri::command]
async fn set_alarm_prefs(app: tauri::AppHandle, prefs: AlarmPrefs) -> Result<(), String> {
  run_android(app, "setAlarmPrefs", prefs).await.map(|_| ())
}

#[cfg(target_os = "android")]
async fn list_ringtones_impl(app: tauri::AppHandle) -> Result<Vec<RingtoneInfo>, String> {
  let value = run_android(app, "listRingtones", serde_json::json!({})).await?;
  serde_json::from_value::<RingtoneListResult>(value)
    .map(|result| result.items)
    .map_err(|e| e.to_string())
}

#[cfg(not(target_os = "android"))]
async fn list_ringtones_impl(_app: tauri::AppHandle) -> Result<Vec<RingtoneInfo>, String> {
  Ok(Vec::new())
}

#[tauri::command]
async fn list_ringtones(app: tauri::AppHandle) -> Result<Vec<RingtoneInfo>, String> {
  list_ringtones_impl(app).await
}

#[tauri::command]
async fn preview_ringtone(app: tauri::AppHandle, uri: Option<String>) -> Result<(), String> {
  run_android(app, "previewRingtone", serde_json::json!({ "uri": uri }))
    .await
    .map(|_| ())
}

fn alarm_plugin() -> tauri::plugin::TauriPlugin<tauri::Wry> {
  tauri::plugin::Builder::new("alarm")
    .setup(|app, api| {
      #[cfg(target_os = "android")]
      {
        let handle = api.register_android_plugin("com.richard.anlly", "AlarmPlugin")?;
        app.manage(AlarmPluginState(handle));
      }
      #[cfg(not(target_os = "android"))]
      {
        let _ = (app, api);
      }
      Ok(())
    })
    .build()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_sql::Builder::default().build())
    .plugin(alarm_plugin())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      schedule_alarm,
      cancel_alarm,
      cancel_event_alarms,
      resync_alarms,
      alarm_status,
      request_notification_permission,
      open_exact_alarm_settings,
      open_full_screen_intent_settings,
      set_alarm_prefs,
      list_ringtones,
      preview_ringtone,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
