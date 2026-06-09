export const CATEGORIES = [
  "No Parents",
  "PWD",
  "ST",
  "SC-A",
  "BC-M",
  "Last Year Passed Out",
  "SLR",
  "Single Parent (FG)",
  "General",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface StageDef {
  stage: string;
  subStages: string[]; // empty string "" means single row
}

export const STAGES: StageDef[] = [
  { stage: "Front Sheet Entry", subStages: [""] },
  { stage: "One to One", subStages: ["Received", "Waiting List", "Rejected"] },
  { stage: "L1 Completed", subStages: [""] },
  { stage: "L2 Completed", subStages: [""] },
  { stage: "House Visit", subStages: ["Received", "Rejected", "Completed"] },
  { stage: "Review", subStages: ["Selected", "Hold", "Rejected"] },
  { stage: "Student Profile Created", subStages: [""] },
];

export interface StageRow {
  stage: string;
  subStage: string; // "" if none
  counts: Record<Category, number>;
  pendingCounts?: Record<Category, number>; // manually entered pending/yet-to-complete counts
}

export interface DailyEntry {
  id: string;
  date: string; // ISO yyyy-mm-dd
  rows: StageRow[];
  createdAt: string;
  updatedAt: string;
}

export function makeEmptyRows(): StageRow[] {
  const rows: StageRow[] = [];
  for (const s of STAGES) {
    for (const sub of s.subStages) {
      const counts = {} as Record<Category, number>;
      const pendingCounts = {} as Record<Category, number>;
      CATEGORIES.forEach((c) => { counts[c] = 0; pendingCounts[c] = 0; });
      rows.push({ stage: s.stage, subStage: sub, counts, pendingCounts });
    }
  }
  return rows;
}

export function rowTotal(row: StageRow): number {
  return CATEGORIES.reduce((sum, c) => sum + (row.counts[c] || 0), 0);
}

export function entryTotal(entry: DailyEntry): number {
  return entry.rows.reduce((sum, r) => sum + rowTotal(r), 0);
}

export function rowKey(stage: string, subStage: string): string {
  return subStage ? `${stage}::${subStage}` : stage;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function todayIso(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
