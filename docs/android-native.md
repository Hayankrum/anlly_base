# Sistema nativo de alarme (Android)

Implementação da seção 14 do spec: o alarme usa **AlarmManager** nativo — funciona com
o app fechado, a tela bloqueada e após reboot. JavaScript (`setTimeout`,
Web Notifications) nunca é usado como alarme.

## Arquitetura

```
JS (alarmService.ts)
  → comando Rust (src-tauri/src/lib.rs)
    → plugin "alarm" → JNI → Kotlin AlarmPlugin
      → AlarmScheduler (AlarmManager + SharedPreferences)
        → AlarmReceiver (broadcast no disparo)
          → AlarmNotification (notificação + full-screen intent)
          → AlarmActivity (tela de despertador, toca e vibra)
```

- **Um alarme por ocorrência** (`occurrenceId`), agendado no horário do evento
  descontando `minutesBefore`.
- `setAlarmClock` (exato) quando `canScheduleExactAlarms()`; caso contrário
  fallback `setAndAllowWhileIdle` (inaexato — o aviso no app explica o atraso).
- Todos os alarmes são gravados em `SharedPreferences` (`anlly_alarms`) e
  **reagendados após reboot/update/alteração de permissão** pelo `BootReceiver`.
- `resync` cancela tudo e reagenda a lista enviada pelo frontend (sem duplicatas).

## Arquivos novos (`src-tauri/gen/android/app/src/main/java/com/richard/anlly/`)

| Arquivo | Responsabilidade |
| --- | --- |
| `AlarmPlugin.kt` | Comandos Tauri (`schedule`, `cancel`, `cancelEvent`, `resync`, `status`, `requestNotificationPermission`, `openExactAlarmSettings`, `openFullScreenIntentSettings`, `setAlarmPrefs`, `listRingtones`, `previewRingtone`). Registrado via `register_android_plugin("com.richard.anlly", "AlarmPlugin")`. |
| `AlarmScheduler.kt` | Agendamento/cancelamento (`AlarmManager`), espelho em `SharedPreferences`, cálculo `date+time−minutesBefore`, restauração pós-boot, `PendingIntent` de disparo e de "mostrar". Também define `AlarmRecord` e as chaves dos extras. |
| `AlarmPrefs.kt` | Preferências de alarme (`anlly_prefs`): toque (`ringtone_uri`), vibração (`vibration_enabled`) e formato 12h (`use12h`); `soundUri()` (padrão do sistema como fallback) e `formatTime()` (12h/24h). |
| `AlarmNotification.kt` | Canal `anlly_alarms` (IMPORTANCE_HIGH, som/vibração vindos de `AlarmPrefs` — `syncChannel` atualiza o canal a cada post e via `updateChannel`), notificação em alta prioridade com **full-screen intent** e ações DESLIGAR/SONECA. |
| `AlarmReceiver.kt` | Recebe `FIRE`/`SNOOZE`/`DISMISS`. Em FIRE **só posta a notificação com FSI** (não chama `startActivity` — ver "FSI puro" abaixo) e agenda o próximo passo. |
| `AlarmActivity.kt` | Tela de despertador em tela cheia sobre o lock screen (`showWhenLocked`/`turnScreenOn`), toca o ringtone de alarme escolhido em loop (fallback: bipes `ToneGenerator`), vibra contínuo (se habilitado), hora no formato 12h/24h configurado. Botões DESLIGAR e SONECA (5 min). Se destruída sem decisão (swipe), religa a notificação. |
| `BootReceiver.kt` | `BOOT_COMPLETED`, `MY_PACKAGE_REPLACED`, `SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED` → `restoreFromStorage()`. |

### FSI puro (decisão validada em testes)

O `startActivity` a partir do `BroadcastReceiver` em background é bloqueado
intermitentemente pelo BAL do Android 16 e deixava um "record limbo" que
ressuscitava e re-tocava depois da decisão do usuário. Por isso, em `FIRE` o
receiver **apenas posta a notificação com full-screen intent novo** (post
novo é reavaliado pelo sistema; update de notificação existente não dispara).
O start direto (`AlarmActivity` aberto sem FSI) só acontece quando o usuário
toca na notificação — start iniciado pelo usuário nunca é bloqueado.

### Preferências do alarme (Configurações do app)

- Fonte da verdade: tabela SQLite `settings` (`time_format`, `vibration_enabled`,
  `ringtone_uri`, `ringtone_name`).
- Ao carregar/salvar, o JS empurra `set_alarm_prefs` → `AlarmPrefs.save()` +
  `AlarmNotification.updateChannel()` (canal recriado com som/vibração novos).
- `listRingtones` enumera os ringtones de alarme do aparelho (`RingtoneManager`);
  `previewRingtone` toca/para a pré-escuta (`USAGE_ALARM`).
- Hora 12h/24h vale para: lista de eventos (JS), tela de alarme e texto da
  notificação (`AlarmPrefs.formatTime`).

Layout: `res/layout/activity_alarm.xml` (hora grande, título, data por extenso,
DESLIGAR / SONECA).

## Arquivos editados (gen/android — gerados pelo Tauri)

- **`AndroidManifest.xml`**: permissões `POST_NOTIFICATIONS`, `USE_EXACT_ALARM`,
  `SCHEDULE_EXACT_ALARM`, `USE_FULL_SCREEN_INTENT`, `RECEIVE_BOOT_COMPLETED`,
  `VIBRATE`; `AlarmActivity` (`exported=false`, `singleTop`, tema
  `Theme.Anlly.Alarm`, `showWhenLocked`/`turnScreenOn`); receivers
  `AlarmReceiver`/`BootReceiver` (`exported=false` — ainda recebem broadcasts
  protegidos do sistema).
- **`app/proguard-rules.pro`**: keep de `AlarmPlugin` (instanciado por reflexão
  pelo Tauri) e das classes `@InvokeArg` (preenchidas por Jackson via reflexão
  no build release com minify).
- **`res/values/themes.xml`**: tema escuro `Theme.Anlly.Alarm` da tela de alarme.

## Permissões e fluxo do usuário

1. **Notificações** (`POST_NOTIFICATIONS`, API 33+): `request_notification_permission`
   usa `PluginManager.requestPermissions`; em APIs antigas abre as configurações
   do app se estiver bloqueada.
2. **Alarmes exatos** (Android 12+): auto-concedido por `USE_EXACT_ALARM`
   (app de despertador/agenda); `SCHEDULE_EXACT_ALARM` fica como alternativa
   concedível pelo usuário. `open_exact_alarm_settings` abre
   `ACTION_REQUEST_SCHEDULE_EXACT_ALARM`.
3. **Tela cheia sobre o lock** (Android 14+): `USE_FULL_SCREEN_INTENT` é
   auto-concedido a apps de alarme; se `canUseFullScreenIntent()` for falso,
   `open_full_screen_intent_settings` abre `ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT`.

O aviso na UI (`AlarmPermissionNotice`) lê `alarm_status` (camelCase) e refaz a
chega quando a janela volta ao foco.

## Limitações conhecidas

- Sem permissão de notificação (API 33+) e com o app em segundo plano e
  desbloqueado, o Android pode exibir apenas a heads-up notification — o app
  nunca consegue garantir `startActivity` a partir do background; o
  full-screen intent cobre o caso tela bloqueada/desligada.
- Sem permissão de alarme exato (Android 12+), o disparo pode atrasar (fallback
  ininaexato é anunciado na UI).

## Verificação

```bash
npm run lint
npm run build
npm run tauri android build   # APK release (minify/R8 ativo)
```

Teste manual (Casos 1–7 do spec): agendar evento +1 min com aviso, matar o app,
bloquear a tela e confirmar alarme; testar soneca, desligar, reboot (alarmes
reagendados), exclusão de evento (alarme cancelado) e fallback sem permissões.
