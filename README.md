# Anlly

Agenda pessoal com alarmes nativos, construída com **Tauri 2 + React 19 + TypeScript**.

## O que o app faz

- **Agenda** — calendário em Dia / Semana / Mês + mapa do ano, com eventos que podem ter
  várias datas e alarme por ocorrência.
- **Configurações** — formato de hora (12h/24h), início da semana, vibração, toque do
  alarme e reagendamento manual dos alarmes.

Os dados ficam em um **SQLite local** (`anlly.db`) e os alarmes são agendados pelo
`AlarmManager` do Android (um plugin Kotlin acessado via Rust). Em desktop os comandos
de alarme são no-op.

## Desenvolvimento

```bash
npm install
npm run tauri dev      # app desktop
npm run tauri build    # empacotar
```

Estrutura:

```
src/
  modules/agenda/        calendário, itens do dia, formulário de evento
  pages/SettingsPage/    configurações + permissões de alarme
  services/
    alarm/               ponte de alarmes (JS) + reconstrução da lista nativa
    eventService.ts      validação e CRUD de eventos/ocorrências
    storage/             SQL puro (events, occurrences, settings)
  navigation/            pilha de navegação com deep-link de data
  components/            Sidebar, aviso de permissão de alarme
src-tauri/               Rust (comandos) + plugin Android de alarmes
```
