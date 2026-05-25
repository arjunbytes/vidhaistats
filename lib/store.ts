import { DailyEntry } from "./schema";

// ── Detect environment ───────────────────────────────────────────────────────
// BLOB_READ_WRITE_TOKEN is injected automatically when a Blob store is linked.
const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

const BLOB_PATHNAME = "vidhai-entries.json";

// ── Vercel Blob helpers ──────────────────────────────────────────────────────
async function blobReadAll(): Promise<DailyEntry[]> {
  const { list } = await import("@vercel/blob");
  const { blobs } = await list({ prefix: BLOB_PATHNAME });
  if (blobs.length === 0) return [];
  const res = await fetch(blobs[0].url);
  if (!res.ok) return [];
  const data = await res.json() as { entries?: DailyEntry[] };
  return data.entries ?? [];
}

async function blobWriteAll(entries: DailyEntry[]): Promise<void> {
  const { put } = await import("@vercel/blob");
  await put(BLOB_PATHNAME, JSON.stringify({ entries }, null, 2), {
    access: "public",
    allowOverwrite: true,
    contentType: "application/json",
  });
}

// ── JSON file helpers (local dev) ────────────────────────────────────────────
function jsonReadAll(): DailyEntry[] {
  const fs   = require("fs")   as typeof import("fs");
  const path = require("path") as typeof import("path");
  const dir  = path.join(process.cwd(), "data");
  const file = path.join(dir, "entries.json");
  if (!fs.existsSync(dir))  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({ entries: [] }, null, 2));
  try {
    return (JSON.parse(fs.readFileSync(file, "utf-8")).entries ?? []) as DailyEntry[];
  } catch { return []; }
}

function jsonWriteAll(entries: DailyEntry[]): void {
  const fs   = require("fs")   as typeof import("fs");
  const path = require("path") as typeof import("path");
  const file = path.join(process.cwd(), "data", "entries.json");
  fs.writeFileSync(file, JSON.stringify({ entries }, null, 2));
}

// ── Async public API (used by API routes) ────────────────────────────────────

export async function readAllAsync(): Promise<DailyEntry[]> {
  return USE_BLOB ? blobReadAll() : jsonReadAll();
}

export async function writeAllAsync(entries: DailyEntry[]): Promise<void> {
  return USE_BLOB ? blobWriteAll(entries) : jsonWriteAll(entries);
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

// ── Sync shims for server-side page components (local only) ──────────────────
export function readAll(): DailyEntry[] { return jsonReadAll(); }
export function writeAll(e: DailyEntry[]): void { jsonWriteAll(e); }
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
