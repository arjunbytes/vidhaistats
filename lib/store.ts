import fs from "fs";
import path from "path";
import { DailyEntry } from "./schema";

// ── SQLite setup (node:sqlite — built into Node 22) ─────────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = require("node:sqlite") as {
  DatabaseSync: new (path: string) => SqliteDb;
};

interface SqliteDb {
  exec(sql: string): void;
  prepare(sql: string): SqliteStmt;
}
interface SqliteStmt {
  run(...args: unknown[]): void;
  get(...args: unknown[]): Record<string, unknown> | undefined;
  all(...args: unknown[]): Record<string, unknown>[];
}

const DATA_DIR  = path.join(process.cwd(), "data");
const DB_PATH   = path.join(DATA_DIR, "entries.db");
const JSON_PATH = path.join(DATA_DIR, "entries.json"); // for one-time migration

function getDb(): SqliteDb {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const db = new DatabaseSync(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_entries (
      id         TEXT PRIMARY KEY,
      date       TEXT UNIQUE NOT NULL,
      rows_json  TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // One-time migration from JSON file → SQLite
  migrateFromJson(db);

  return db;
}

function migrateFromJson(db: SqliteDb) {
  if (!fs.existsSync(JSON_PATH)) return;

  const count = db.prepare("SELECT COUNT(*) as n FROM daily_entries").get() as { n: number };
  if (count.n > 0) return; // already migrated

  try {
    const raw  = fs.readFileSync(JSON_PATH, "utf-8");
    const json = JSON.parse(raw) as { entries?: DailyEntry[] };
    const entries = json.entries || [];
    if (entries.length === 0) return;

    const insert = db.prepare(
      "INSERT OR IGNORE INTO daily_entries (id, date, rows_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    );
    for (const e of entries) {
      insert.run(e.id, e.date, JSON.stringify(e.rows), e.createdAt, e.updatedAt);
    }
    console.log(`[store] Migrated ${entries.length} entries from JSON → SQLite`);
  } catch (err) {
    console.error("[store] JSON migration failed:", err);
  }
}

function toEntry(row: Record<string, unknown>): DailyEntry {
  return {
    id:        row.id        as string,
    date:      row.date      as string,
    rows:      JSON.parse(row.rows_json as string),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

export function readAll(): DailyEntry[] {
  try {
    const db   = getDb();
    const rows = db.prepare("SELECT * FROM daily_entries ORDER BY date DESC").all();
    return rows.map(toEntry);
  } catch {
    return [];
  }
}

export function findByDate(date: string): DailyEntry | null {
  try {
    const db  = getDb();
    const row = db.prepare("SELECT * FROM daily_entries WHERE date = ?").get(date);
    return row ? toEntry(row) : null;
  } catch {
    return null;
  }
}

export function upsertEntry(entry: DailyEntry): DailyEntry {
  const db  = getDb();
  const now = new Date().toISOString();
  const existing = db.prepare("SELECT id, created_at FROM daily_entries WHERE date = ?").get(entry.date);

  if (existing) {
    db.prepare(
      "UPDATE daily_entries SET rows_json = ?, updated_at = ? WHERE date = ?"
    ).run(JSON.stringify(entry.rows), now, entry.date);
    return {
      ...entry,
      id:        existing.id        as string,
      createdAt: existing.created_at as string,
      updatedAt: now,
    };
  } else {
    const id = entry.id || `entry_${Date.now()}`;
    db.prepare(
      "INSERT INTO daily_entries (id, date, rows_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    ).run(id, entry.date, JSON.stringify(entry.rows), now, now);
    return { ...entry, id, createdAt: now, updatedAt: now };
  }
}

export function deleteEntry(date: string): boolean {
  const db  = getDb();
  const row = db.prepare("SELECT id FROM daily_entries WHERE date = ?").get(date);
  if (!row) return false;
  db.prepare("DELETE FROM daily_entries WHERE date = ?").run(date);
  return true;
}

// kept for API export route compatibility
export function writeAll(entries: DailyEntry[]) {
  const db = getDb();
  db.exec("DELETE FROM daily_entries");
  const insert = db.prepare(
    "INSERT INTO daily_entries (id, date, rows_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
  );
  for (const e of entries) {
    insert.run(e.id, e.date, JSON.stringify(e.rows), e.createdAt, e.updatedAt);
  }
}
