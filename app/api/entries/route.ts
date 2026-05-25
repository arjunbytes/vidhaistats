import { NextRequest, NextResponse } from "next/server";
import { readAllAsync, upsertEntryAsync, findByDateAsync } from "@/lib/store";
import { DailyEntry, makeEmptyRows } from "@/lib/schema";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (date) {
    const found = await findByDateAsync(date);
    return NextResponse.json({ entry: found });
  }
  const entries = (await readAllAsync()).sort((a, b) => (a.date < b.date ? 1 : -1));
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<DailyEntry>;
  if (!body.date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }
  const rows = body.rows && body.rows.length > 0 ? body.rows : makeEmptyRows();
  const saved = await upsertEntryAsync({
    id: body.id || `entry_${Date.now()}`,
    date: body.date,
    rows,
    createdAt: body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return NextResponse.json({ entry: saved });
}
