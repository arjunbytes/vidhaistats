import React from "react";
import Link from "next/link";
import { readAllAsync } from "@/lib/store";
import { CATEGORIES, STAGES, formatDate, rowTotal } from "@/lib/schema";
import {
  Open24Regular,
  DocumentArrowDown24Regular,
  ClipboardTextEdit24Regular,
} from "@fluentui/react-icons";

export const dynamic = "force-dynamic";

const STAGE_ROWS = STAGES.flatMap((s) =>
  s.subStages.map((sub) => ({ stage: s.stage, subStage: sub }))
);

export default async function HistoryPage() {
  const allEntries = (await readAllAsync()).sort((a, b) => (a.date < b.date ? 1 : -1));

  // Always show last 5 calendar days (newest first), with zeros for missing days
  const last5Dates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().slice(0, 10);
  });
  const entryByDate = Object.fromEntries(allEntries.map((e) => [e.date, e]));
  const last5 = last5Dates.map((date) => entryByDate[date] ?? { id: date, date, rows: [], createdAt: "", updatedAt: "" });

  return (
    <div className="mx-auto max-w-[1400px]">
      {/* Page header */}
      <div className="mb-5 flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#00abc0]">
            History Log
          </div>
          <h1 className="text-[22px] font-semibold leading-tight text-[#242424]">
            Daily Submissions
          </h1>
          <p className="text-[12px] text-[#909090]">
            Every saved day, sorted newest first.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/entries"
            className="flex items-center gap-2 rounded-md border border-[#D1D1D1] bg-white px-3 py-2 text-[13px] font-semibold text-[#242424] hover:bg-[#F5F5F5]"
            download="vidhai-entries.json"
          >
            <DocumentArrowDown24Regular className="h-4 w-4" />
            Export JSON
          </a>
          <Link
            href="/entry"
            className="flex items-center gap-2 rounded-md bg-[#00abc0] px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-[#0099aa]"
          >
            <ClipboardTextEdit24Regular className="h-4 w-4" />
            New Entry
          </Link>
        </div>
      </div>

      {allEntries.length === 0 ? (
        <div className="fluent-card p-12 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#e6f8fb] text-[#00abc0]">
            <ClipboardTextEdit24Regular className="h-7 w-7" />
          </div>
          <div className="text-[15px] font-semibold text-[#242424]">No entries yet</div>
          <p className="mx-auto mt-1 max-w-md text-[12px] text-[#909090]">
            When you save your first daily entry it will appear here.
          </p>
          <Link
            href="/entry"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#00abc0] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#0099aa]"
          >
            <ClipboardTextEdit24Regular className="h-4 w-4" />
            Start Daily Entry
          </Link>
        </div>
      ) : (
        <>
          {/* ── Last 5 Days Status ─────────────────────────────────── */}
          <div className="mb-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#00abc0]">
              Last 5 Days Status
            </div>
            <h2 className="text-[16px] font-semibold text-[#242424]">
              Stage-wise breakdown — last 5 days
            </h2>
          </div>

          <div className="fluent-card overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px] table-fixed">
                <colgroup>
                  {/* Date column */}
                  <col style={{ width: "130px" }} />
                  {/* Metric column */}
                  <col style={{ width: "90px" }} />
                  {/* One equal column per stage+substage */}
                  {STAGE_ROWS.map((col) => (
                    <col key={`${col.stage}::${col.subStage}`} style={{ width: `${Math.floor(800 / STAGE_ROWS.length)}px` }} />
                  ))}
                </colgroup>
                <thead>
                  {/* Row 1: fixed cols + stage group headers */}
                  <tr className="bg-[#F0F4F8]">
                    <th rowSpan={2} className="border-b-2 border-r border-[#E1E1E1] px-3 py-3 text-left font-semibold text-[#242424] align-bottom">
                      Date
                    </th>
                    <th rowSpan={2} className="border-b-2 border-r border-[#E1E1E1] bg-[#e6f8fb] px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-[#00abc0] align-bottom">
                      Metric
                    </th>
                    {STAGES.map((s) => (
                      <th
                        key={s.stage}
                        colSpan={s.subStages.length}
                        className="border-b border-r border-[#E1E1E1] px-2 py-2 text-center text-[11px] font-semibold text-[#242424]"
                      >
                        {s.stage}
                      </th>
                    ))}
                  </tr>
                  {/* Row 2: sub-stage labels */}
                  <tr className="bg-[#F0F4F8]">
                    {STAGE_ROWS.map((col) => (
                      <th
                        key={`${col.stage}::${col.subStage}`}
                        className="border-b-2 border-r border-[#E1E1E1] px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-[#909090]"
                      >
                        {col.subStage || "—"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {last5.map((e, di) => (
                    <React.Fragment key={e.id}>
                      {/* Overall row */}
                      <tr className={di % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"}>
                        <td rowSpan={3} className="border-b border-r border-[#E1E1E1] bg-[#F8FAFC] px-4 py-2 font-semibold text-[#242424] whitespace-nowrap align-middle">
                          <div>{formatDate(e.date)}</div>
                          <div className="mt-1">
                            <Link
                              href={`/entry?date=${e.date}`}
                              className="inline-flex items-center gap-1 rounded border border-[#D1D1D1] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#242424] hover:bg-[#F5F5F5]"
                            >
                              <Open24Regular className="h-3 w-3" />
                              Open
                            </Link>
                          </div>
                        </td>
                        <td className="border-b border-r border-[#E1E1E1] bg-[#e6f8fb]/50 px-3 py-1.5 text-[11px] font-semibold text-[#00abc0] whitespace-nowrap">
                          Overall
                        </td>
                        {STAGE_ROWS.map((col) => {
                          const row = e.rows.find((r) => r.stage === col.stage && r.subStage === col.subStage);
                          return (
                            <td key={`${col.stage}::${col.subStage}`} className="border-b border-r border-[#E1E1E1] bg-[#e6f8fb]/20 px-2 py-1.5 text-center font-medium text-[#242424]">
                              {row ? rowTotal(row) : 0}
                            </td>
                          );
                        })}
                      </tr>
                      {/* Completed row */}
                      <tr className={di % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"}>
                        <td className="border-b border-r border-[#E1E1E1] bg-[#e6f8fb]/50 px-3 py-1.5 text-[11px] font-semibold text-[#00abc0] whitespace-nowrap">
                          Completed
                        </td>
                        {STAGE_ROWS.map((col) => {
                          const row = e.rows.find((r) => r.stage === col.stage && r.subStage === col.subStage);
                          const val = row ? CATEGORIES.reduce((s, c) => s + (row.pendingCounts?.[c] || 0), 0) : 0;
                          return (
                            <td key={`${col.stage}::${col.subStage}`} className="border-b border-r border-[#E1E1E1] bg-[#e6f8fb]/20 px-2 py-1.5 text-center font-medium text-[#00abc0]">
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                      {/* Pending row */}
                      <tr className={di % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"}>
                        <td className="border-b-2 border-r border-[#E1E1E1] bg-[#fff3e0]/60 px-3 py-1.5 text-[11px] font-semibold text-[#e07800] whitespace-nowrap">
                          Pending
                        </td>
                        {STAGE_ROWS.map((col) => {
                          const row = e.rows.find((r) => r.stage === col.stage && r.subStage === col.subStage);
                          const overall = row ? rowTotal(row) : 0;
                          const completed = row ? CATEGORIES.reduce((s, c) => s + (row.pendingCounts?.[c] || 0), 0) : 0;
                          return (
                            <td key={`${col.stage}::${col.subStage}`} className="border-b-2 border-r border-[#E1E1E1] bg-[#fff3e0]/30 px-2 py-1.5 text-center font-medium text-[#e07800]">
                              {Math.max(0, overall - completed)}
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Category-wise Breakdown ───────────────────────────── */}
          <div className="mb-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#00abc0]">
              Category-wise Breakdown
            </div>
            <h2 className="text-[16px] font-semibold text-[#242424]">
              Overall / Completed / Pending by category — last 5 days
            </h2>
          </div>

          <div className="fluent-card overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px] table-fixed">
                <colgroup>
                  <col style={{ width: "130px" }} />
                  <col style={{ width: "90px" }} />
                  {CATEGORIES.map((c) => (
                    <col key={c} style={{ width: `${Math.floor(800 / CATEGORIES.length)}px` }} />
                  ))}
                </colgroup>
                <thead>
                  <tr className="bg-[#F0F4F8]">
                    <th className="border-b-2 border-r border-[#E1E1E1] px-3 py-3 text-left font-semibold text-[#242424]">
                      Date
                    </th>
                    <th className="border-b-2 border-r border-[#E1E1E1] bg-[#e6f8fb] px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-[#00abc0]">
                      Metric
                    </th>
                    {CATEGORIES.map((c) => (
                      <th
                        key={c}
                        className="border-b-2 border-r border-[#E1E1E1] px-2 py-3 text-center text-[11px] font-semibold text-[#242424]"
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {last5.map((e, di) => {
                    const appsRow = e.rows.find((r) => r.stage === "Front Sheet Entry");
                    const hvRow   = e.rows.find((r) => r.stage === "House Visit" && r.subStage === "Completed");
                    const bgClass = di % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]";
                    return (
                      <React.Fragment key={`cat-${e.id}`}>
                        {/* Overall */}
                        <tr className={bgClass}>
                          <td rowSpan={3} className="border-b-2 border-r border-[#E1E1E1] bg-[#F8FAFC] px-3 py-2 font-semibold text-[#242424] align-middle">
                            <div>{formatDate(e.date)}</div>
                            <div className="mt-1">
                              <Link
                                href={`/entry?date=${e.date}`}
                                className="inline-flex items-center gap-1 rounded border border-[#D1D1D1] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#242424] hover:bg-[#F5F5F5]"
                              >
                                <Open24Regular className="h-3 w-3" />
                                Open
                              </Link>
                            </div>
                          </td>
                          <td className="border-b border-r border-[#E1E1E1] bg-[#e6f8fb]/50 px-2 py-1.5 text-[11px] font-semibold text-[#00abc0]">
                            Overall
                          </td>
                          {CATEGORIES.map((c) => (
                            <td key={c} className="border-b border-r border-[#E1E1E1] bg-[#e6f8fb]/20 px-2 py-1.5 text-center font-medium text-[#242424]">
                              {appsRow ? (appsRow.counts[c] || 0) : 0}
                            </td>
                          ))}
                        </tr>
                        {/* Completed */}
                        <tr className={bgClass}>
                          <td className="border-b border-r border-[#E1E1E1] bg-[#e6f8fb]/50 px-2 py-1.5 text-[11px] font-semibold text-[#00abc0]">
                            Completed
                          </td>
                          {CATEGORIES.map((c) => (
                            <td key={c} className="border-b border-r border-[#E1E1E1] bg-[#e6f8fb]/20 px-2 py-1.5 text-center font-medium text-[#00abc0]">
                              {hvRow ? (hvRow.pendingCounts?.[c] || 0) : 0}
                            </td>
                          ))}
                        </tr>
                        {/* Pending */}
                        <tr className={bgClass}>
                          <td className="border-b-2 border-r border-[#E1E1E1] bg-[#fff3e0]/60 px-2 py-1.5 text-[11px] font-semibold text-[#e07800]">
                            Pending
                          </td>
                          {CATEGORIES.map((c) => {
                            const overall   = appsRow ? (appsRow.counts[c] || 0) : 0;
                            const completed = hvRow   ? (hvRow.pendingCounts?.[c] || 0) : 0;
                            return (
                              <td key={c} className="border-b-2 border-r border-[#E1E1E1] bg-[#fff3e0]/30 px-2 py-1.5 text-center font-medium text-[#e07800]">
                                {Math.max(0, overall - completed)}
                              </td>
                            );
                          })}
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── All Entries ────────────────────────────────────────── */}
          <div className="mb-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#00abc0]">
              All Entries
            </div>
            <h2 className="text-[16px] font-semibold text-[#242424]">
              Complete history — {allEntries.length} day{allEntries.length !== 1 ? "s" : ""} recorded
            </h2>
          </div>

          <div className="fluent-card overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="bg-[#F0F4F8]">
                    <th className="border-b border-r border-[#E1E1E1] px-4 py-3 text-left font-semibold text-[#242424] whitespace-nowrap">Date</th>
                    <th className="border-b border-r border-[#E1E1E1] px-4 py-3 text-right font-semibold text-[#242424] whitespace-nowrap">Front Sheet Entries</th>
                    <th className="border-b border-r border-[#E1E1E1] px-4 py-3 text-right font-semibold text-[#242424] whitespace-nowrap">House Visit Completed</th>
                    <th className="border-b border-r border-[#E1E1E1] px-4 py-3 text-right font-semibold text-[#242424] whitespace-nowrap">Review Selected</th>
                    <th className="border-b border-r border-[#E1E1E1] px-4 py-3 text-right font-semibold text-[#242424] whitespace-nowrap">Profiles Created</th>
                    <th className="border-b border-r border-[#E1E1E1] bg-[#e6f8fb] px-4 py-3 text-right font-semibold text-[#00abc0] whitespace-nowrap">Overall Count</th>
                    <th className="border-b border-r border-[#E1E1E1] bg-[#e6f8fb] px-4 py-3 text-right font-semibold text-[#00abc0] whitespace-nowrap">Completed Count</th>
                    <th className="border-b border-r border-[#E1E1E1] bg-[#fff3e0] px-4 py-3 text-right font-semibold text-[#e07800] whitespace-nowrap">Pending Count</th>
                    <th className="border-b border-r border-[#E1E1E1] px-4 py-3 text-right font-semibold text-[#242424] whitespace-nowrap">Last Updated</th>
                    <th className="border-b border-[#E1E1E1] px-4 py-3 text-center font-semibold text-[#242424]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allEntries.map((e, i) => {
                    const apps = e.rows.find((r) => r.stage === "Front Sheet Entry");
                    const hv = e.rows.find((r) => r.stage === "House Visit" && r.subStage === "Completed");
                    const reviewSel = e.rows.find((r) => r.stage === "Review" && r.subStage === "Selected");
                    const finalSel = e.rows.find((r) => r.stage === "Student Profile Created");
                    const overall = apps ? rowTotal(apps) : 0;
                    const completed = hv ? CATEGORIES.reduce((s, c) => s + (hv.pendingCounts?.[c] || 0), 0) : 0;
                    const pending = Math.max(0, overall - completed);
                    return (
                      <tr key={e.id} className={`fluent-row ${i % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"}`}>
                        <td className="border-b border-r border-[#E1E1E1] px-4 py-3 font-semibold text-[#242424] whitespace-nowrap">
                          {formatDate(e.date)}
                        </td>
                        <td className="border-b border-r border-[#E1E1E1] px-4 py-3 text-right">{apps ? rowTotal(apps) : 0}</td>
                        <td className="border-b border-r border-[#E1E1E1] px-4 py-3 text-right">{hv ? rowTotal(hv) : 0}</td>
                        <td className="border-b border-r border-[#E1E1E1] px-4 py-3 text-right">{reviewSel ? rowTotal(reviewSel) : 0}</td>
                        <td className="border-b border-r border-[#E1E1E1] px-4 py-3 text-right">{finalSel ? rowTotal(finalSel) : 0}</td>
                        <td className="border-b border-r border-[#E1E1E1] bg-[#e6f8fb]/40 px-4 py-3 text-right font-semibold text-[#00abc0]">{overall}</td>
                        <td className="border-b border-r border-[#E1E1E1] bg-[#e6f8fb]/40 px-4 py-3 text-right font-semibold text-[#00abc0]">{completed}</td>
                        <td className="border-b border-r border-[#E1E1E1] bg-[#fff3e0]/60 px-4 py-3 text-right font-semibold text-[#e07800]">{pending}</td>
                        <td className="border-b border-r border-[#E1E1E1] px-4 py-3 text-right text-[12px] text-[#909090] whitespace-nowrap">
                          {new Date(e.updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                        </td>
                        <td className="border-b border-[#E1E1E1] px-4 py-3 text-center">
                          <Link
                            href={`/entry?date=${e.date}`}
                            className="inline-flex items-center gap-1.5 rounded-md border border-[#D1D1D1] bg-white px-2.5 py-1 text-[12px] font-semibold text-[#242424] hover:bg-[#F5F5F5]"
                          >
                            <Open24Regular className="h-3.5 w-3.5" />
                            Open
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Cumulative Totals ──────────────────────────────────── */}
          <div className="fluent-card p-5">
            <div className="mb-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#00abc0]">
                Cumulative Totals
              </div>
              <h2 className="text-[16px] font-semibold text-[#242424]">
                Front Sheet Entries by Category — All-time
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {CATEGORIES.map((c) => {
                const total = allEntries.reduce((sum, e) => {
                  const r = e.rows.find((r) => r.stage === "Front Sheet Entry");
                  return sum + (r ? r.counts[c] || 0 : 0);
                }, 0);
                return (
                  <div key={c} className="rounded-md border border-[#E1E1E1] bg-[#FAFAFA] px-3 py-2">
                    <div className="text-[11px] font-medium text-[#909090]">{c}</div>
                    <div className="text-[18px] font-semibold text-[#242424]">{total}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
