import { NextRequest, NextResponse } from "next/server";
import { deleteEntry, findByDate } from "@/lib/store";

export async function GET(_req: NextRequest, { params }: { params: { date: string } }) {
  const entry = findByDate(params.date);
  return NextResponse.json({ entry });
}

export async function DELETE(_req: NextRequest, { params }: { params: { date: string } }) {
  const ok = deleteEntry(params.date);
  return NextResponse.json({ deleted: ok });
}
