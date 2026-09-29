import Database from '@tauri-apps/plugin-sql'

const DATABASE_URL = 'sqlite:anlly.db'

/**
 * Schema notes:
 * - date is always YYYY-MM-DD and time is always HH:mm (no timezone math).
 * - occurrences.time is per occurrence so a future version can give each
 *   date a different time without changing the architecture.
 * - occurrences.done_at is the completion timestamp of one "afazer" day;
 *   it never touches the alarm columns.
 * - deletes are always performed explicitly from the service layer.
 */
const MIGRATIONS: string[] = [
  `CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    icon TEXT,
    color TEXT,
    duration_minutes INTEGER,
    recurrence TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS occurrences (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    alarm_enabled INTEGER NOT NULL DEFAULT 0,
    alarm_minutes_before INTEGER NOT NULL DEFAULT 0,
    done_at TEXT,
    UNIQUE(event_id, date, time)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_occurrences_date ON occurrences(date)`,
  `CREATE INDEX IF NOT EXISTS idx_occurrences_event ON occurrences(event_id)`,
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
]

let dbPromise: Promise<Database> | null = null

/** ALTER TABLE ADD COLUMN is not idempotent — check the schema first. */
async function addColumnIfMissing(db: Database, table: string, column: string, ddl: string) {
  try {
    const cols = await db.select<{ name: string }[]>(`PRAGMA table_info(${table})`)
    if (!cols.some((c) => c.name === column)) {
      await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`)
    }
  } catch {
    // PRAGMA unsupported: best effort — ignore "duplicate column" errors.
    await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`).catch(() => {})
  }
}

async function open(): Promise<Database> {
  const db = await Database.load(DATABASE_URL)
  for (const sql of MIGRATIONS) {
    await db.execute(sql)
  }
  await addColumnIfMissing(db, 'events', 'color', 'TEXT')
  await addColumnIfMissing(db, 'events', 'icon', 'TEXT')
  await addColumnIfMissing(db, 'events', 'duration_minutes', 'INTEGER')
  await addColumnIfMissing(db, 'events', 'recurrence', 'TEXT')
  await addColumnIfMissing(db, 'events', 'recurrence_days', 'TEXT')
  await addColumnIfMissing(db, 'occurrences', 'done_at', 'TEXT')
  await addColumnIfMissing(db, 'events', 'kind', "TEXT NOT NULL DEFAULT 'normal'")
  await addColumnIfMissing(db, 'occurrences', 'timer_started_at', 'TEXT')
  await addColumnIfMissing(db, 'occurrences', 'timer_elapsed_ms', 'INTEGER NOT NULL DEFAULT 0')
  return db
}

export function getDatabase(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = open().catch((err) => {
      dbPromise = null
      throw err
    })
  }
  return dbPromise
}
