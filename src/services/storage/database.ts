import Database from '@tauri-apps/plugin-sql'

const DATABASE_URL = 'sqlite:anlly.db'

/**
 * Schema notes:
 * - date is always YYYY-MM-DD and time is always HH:mm (no timezone math).
 * - occurrences.time is per occurrence so a future version can give each
 *   date a different time without changing the architecture.
 * - deletes are always performed explicitly from the service layer.
 */
const MIGRATIONS: string[] = [
  `CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
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
