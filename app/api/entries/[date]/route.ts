import { NextRequest, NextResponse } from "next/server";
import { deleteEntryAsync, findByDateAsync } from "@/lib/store";

export async function GET(_req: NextRequest, { params }: { params: { date: string } }) {
  const entry = await findByDateAsync(params.date);
  return NextResponse.json({ entry });
}

export async function DELETE(_req: NextRequest, { params }: { params: { date: string } }) {
  const ok = await deleteEntryAsync(params.date);
  return NextResponse.json({ deleted: ok });
}
