import { getDatabase } from './database'

/** Simple key/value settings persisted in SQLite (single source of truth). */
export async function readSettings(): Promise<Record<string, string>> {
  const db = await getDatabase()
  const rows = await db.select<{ key: string; value: string }[]>(
    'SELECT key, value FROM settings',
  )
  const map: Record<string, string> = {}
  for (const row of rows) map[row.key] = row.value
  return map
}

export async function writeSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase()
  await db.execute(
    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value],
  )
}
