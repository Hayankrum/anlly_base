# Anlly

Afazeres do dia a dia apresentados como uma **jornada** — construído com
**Tauri 2 + React 19 + TypeScript**.

## O que o app faz

- **Home (jornada de hoje)** — os afazeres do dia em uma trilha vertical.
  Toque abre os detalhes; **pressionar e segurar** conclui (anel de progresso,
  com desfazer). O nó seguinte fica em destaque e o trilho deixa o percurso
  percorrido em cor de concluído.
- **Dashboard** — semana em andamento, calendário em Dia / Semana / Mês / Ano
  (com mapa do ano), lista do dia, categorias do mês e histórico de conclusões.
- **Afazeres** — nome, ícone, categoria, repetição (nenhuma, todo dia, dias
  úteis, semanal, quinzenal, mensal), duração, lembrete, cor e descrição.
  Cada repetição gera as ocorrências concretas na hora de salvar.
- **Detalhes** — resumo do afazer, horário, duração, repetição, lembrete,
  conclusão com horário e ações de editar / excluir.
- **Configurações** — formato de hora, início da semana, notificações e
  permissão de alarme, vibração, toque do alarme, reagendamento e dados.

Os dados ficam em um **SQLite local** (`anlly.db`) e os alarmes são agendados
pelo `AlarmManager` do Android (um plugin Kotlin acessado via Rust). Em desktop
os comandos de alarme são no-op.

### Modelo de dados

Um "afazer" é um `Event` + suas `EventOccurrence`s — não existe sistema
paralelo. Concluir um afazer grava `done_at` na ocorrência; uma ocorrência
concluída **não** agenda nem reagenda alarme.

## Desenvolvimento

```bash
npm install
npm run tauri dev      # app desktop
npm run tauri build    # empacotar
```

Verificação:

```bash
npx tsc -b
npx eslint .
npm run build
```

Estrutura:

```
src/
  modules/
    home/               Home + trilha (Trail, TrailStep)
    dashboard/          painel (substitui a antiga página de Agenda)
    detail/             detalhes do afazer
    agenda/             itens do dia, formulário de evento
  pages/SettingsPage/   configurações + permissões de alarme
  hooks/                JourneyProvider (estado dos afazeres), useHoldToComplete
  services/
    alarm/              ponte de alarmes (JS) + reconstrução da lista nativa
    eventService.ts     validação, expansão de repetição e CRUD
    storage/            SQL puro (events, occurrences, settings)
  navigation/           áreas + pilha (home, dashboard, detalhe, configurações)
  utils/                recurrence, reminder, icons, time, dates
  components/           BottomNav, aviso de permissão de alarme
src-tauri/              Rust (comandos) + plugin Android de alarmes
```
