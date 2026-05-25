import { DailyEntry } from "./schema";

// ── Detect environment ───────────────────────────────────────────────────────
const IS_VERCEL = !!process.env.BLOB_READ_WRITE_TOKEN;

const BLOB_PATHNAME = "vidhai-entries.json";

// ── Vercel Blob helpers ──────────────────────────────────────────────────────
async function blobReadAll(): Promise<DailyEntry[]> {
  try {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: BLOB_PATHNAME });
    if (blobs.length === 0) return [];
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { entries?: DailyEntry[] };
    return data.entries ?? [];
  } catch (e) {
    console.error("[store] blobReadAll error:", e);
    return [];
  }
}

async function blobWriteAll(entries: DailyEntry[]): Promise<void> {
  try {
    const { put, list, del } = await import("@vercel/blob");
    // Remove old blobs first
    const { blobs } = await list({ prefix: BLOB_PATHNAME });
    for (const b of blobs) await del(b.url);
    await put(BLOB_PATHNAME, JSON.stringify({ entries }, null, 2), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
    });
  } catch (e) {
    console.error("[store] blobWriteAll error:", e);
    throw e;
  }
}

// ── Local JSON file helpers ──────────────────────────────────────────────────
import fs from "fs";
import path from "path";

const DATA_DIR  = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "entries.json");

function ensureFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DATA_FILE))
      fs.writeFileSync(DATA_FILE, JSON.stringify({ entries: [] }, null, 2));
  } catch { /* read-only fs on Vercel — safe to ignore */ }
}

function jsonReadAll(): DailyEntry[] {
  try {
    ensureFile();
    return (JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")).entries ?? []) as DailyEntry[];
  } catch { return []; }
}

function jsonWriteAll(entries: DailyEntry[]): void {
  try {
    ensureFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify({ entries }, null, 2));
  } catch { /* silently fail on read-only fs */ }
}

// ── Async public API (API routes + server components) ───────────────────────

export async function readAllAsync(): Promise<DailyEntry[]> {
  return IS_VERCEL ? blobReadAll() : jsonReadAll();
}

export async function writeAllAsync(entries: DailyEntry[]): Promise<void> {
  if (IS_VERCEL) return blobWriteAll(entries);
  jsonWriteAll(entries);
}

export async function upsertEntryAsync(entry: DailyEntry): Promise<DailyEntry> {
  const all = await readAllAsync();
  const idx = all.findIndex((e) => e.date === entry.date);
  const now = new Date().toISOString();
  let result: DailyEntry;
  if (idx >= 0) {
    result = { ...all[idx], rows: entry.rows, updatedAt: now };
    all[idx] = result;
  } else {
    result = { ...entry, id: entry.id || `entry_${Date.now()}`, createdAt: now, updatedAt: now };
    all.push(result);
  }
  await writeAllAsync(all);
  return result;
}

export async function findByDateAsync(date: string): Promise<DailyEntry | null> {
  const all = await readAllAsync();
  return all.find((e) => e.date === date) ?? null;
}

export async function deleteEntryAsync(date: string): Promise<boolean> {
  const all  = await readAllAsync();
  const next = all.filter((e) => e.date !== date);
  if (next.length === all.length) return false;
  await writeAllAsync(next);
  return true;
}

// ── Sync shims (server components — local dev only) ──────────────────────────
export function readAll(): DailyEntry[] { return jsonReadAll(); }
export function writeAll(entries: DailyEntry[]): void { jsonWriteAll(entries); }
export function findByDate(date: string): DailyEntry | null {
  return jsonReadAll().find((e) => e.date === date) ?? null;
}
export function upsertEntry(entry: DailyEntry): DailyEntry {
  const all = jsonReadAll();
  const idx = all.findIndex((e) => e.date === entry.date);
  const now = new Date().toISOString();
  let result: DailyEntry;
  if (idx >= 0) {
    result = { ...all[idx], rows: entry.rows, updatedAt: now };
    all[idx] = result;
  } else {
    result = { ...entry, id: entry.id || `entry_${Date.now()}`, createdAt: now, updatedAt: now };
    all.push(result);
  }
  jsonWriteAll(all);
  return result;
}
export function deleteEntry(date: string): boolean {
  const all  = jsonReadAll();
  const next = all.filter((e) => e.date !== date);
  if (next.length === all.length) return false;
  jsonWriteAll(next);
  return true;
}
