"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CATEGORIES,
  Category,
  STAGES,
  StageRow,
  makeEmptyRows,
  rowTotal,
  todayIso,
} from "@/lib/schema";
import {
  Save24Regular,
  ArrowClockwise24Regular,
  Calendar24Regular,
  Checkmark24Regular,
  Delete24Regular,
} from "@fluentui/react-icons";

export default function EntryClient() {
  const router = useRouter();
  const search = useSearchParams();
  const initialDate = search.get("date") || todayIso();

  const [date, setDate] = useState<string>(initialDate);
  const [rows, setRows] = useState<StageRow[]>(makeEmptyRows());
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Load entry for selected date
  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/entries?date=${date}`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        if (d.entry && d.entry.rows) {
          const base = makeEmptyRows();
          const merged = base.map((br) => {
            const found = d.entry.rows.find(
              (er: StageRow) => er.stage === br.stage && er.subStage === br.subStage
            );
            if (!found) return br;
            return { ...found, pendingCounts: found.pendingCounts ?? br.pendingCounts };
          });
          setRows(merged);
          setSavedAt(d.entry.updatedAt || null);
        } else {
          setRows(makeEmptyRows());
          setSavedAt(null);
        }
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [date]);

  // ── computed summaries ──────────────────────────────────────────────────────
  const overallCount = useMemo(() => {
    const r = rows.find((r) => r.stage === "No of Applications Received");
    return r ? rowTotal(r) : 0;
  }, [rows]);

  const completedCount = useMemo(() => {
    const r = rows.find((r) => r.stage === "HV Completed");
    return r ? rowTotal(r) : 0;
  }, [rows]);

  const categoryReceived = useMemo(() => {
    const r = rows.find((r) => r.stage === "No of Applications Received");
    const t: Record<string, number> = {};
    CATEGORIES.forEach((c) => (t[c] = r ? r.counts[c] || 0 : 0));
    return t;
  }, [rows]);

  const categoryCompleted = useMemo(() => {
    const r = rows.find((r) => r.stage === "HV Completed");
    const t: Record<string, number> = {};
    CATEGORIES.forEach((c) => (t[c] = r ? r.counts[c] || 0 : 0));
    return t;
  }, [rows]);

  const categoryPending = useMemo(() => {
    const r = rows.find((r) => r.stage === "HV Completed");
    const t: Record<string, number> = {};
    CATEGORIES.forEach((c) => (t[c] = r ? r.pendingCounts?.[c] || 0 : 0));
    return t;
  }, [rows]);

  const totalPending = useMemo(() => {
    const r = rows.find((r) => r.stage === "HV Completed");
    return r ? CATEGORIES.reduce((s, c) => s + (r.pendingCounts?.[c] || 0), 0) : 0;
  }, [rows]);

  // ── cell updaters ───────────────────────────────────────────────────────────
  function updateCell(stage: string, subStage: string, cat: Category, value: string) {
    const num = Math.max(0, parseInt(value || "0", 10) || 0);
    setRows((prev) =>
      prev.map((r) =>
        r.stage === stage && r.subStage === subStage
          ? { ...r, counts: { ...r.counts, [cat]: num } }
          : r
      )
    );
  }

  function updatePendingCell(stage: string, subStage: string, cat: Category, value: string) {
    const num = Math.max(0, parseInt(value || "0", 10) || 0);
    setRows((prev) =>
      prev.map((r) => {
        if (r.stage !== stage || r.subStage !== subStage) return r;
        const base = {} as Record<Category, number>;
        CATEGORIES.forEach((c) => { base[c] = r.pendingCounts?.[c] ?? 0; });
        base[cat] = num;
        return { ...r, pendingCounts: base };
      })
    );
  }

  // ── save / reset / delete ───────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, rows }),
      });
      const data = await res.json();
      if (data.entry) {
        setSavedAt(data.entry.updatedAt);
        setToast({ type: "success", msg: "Entry saved successfully" });
      } else {
        setToast({ type: "error", msg: "Could not save entry" });
      }
    } catch {
      setToast({ type: "error", msg: "Network error while saving" });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 2800);
    }
  }

  async function handleReset() {
    if (!confirm("Reset all values for this date to zero? (Will not save until you click Save.)")) return;
    setRows(makeEmptyRows());
  }

  async function handleDelete() {
    if (!confirm(`Delete the saved entry for ${date}? This cannot be undone.`)) return;
    const res = await fetch(`/api/entries/${date}`, { method: "DELETE" });
    const data = await res.json();
    if (data.deleted) {
      setRows(makeEmptyRows());
      setSavedAt(null);
      setToast({ type: "success", msg: "Entry deleted" });
      setTimeout(() => setToast(null), 2200);
    } else {
      setToast({ type: "error", msg: "No saved entry to delete" });
      setTimeout(() => setToast(null), 2200);
    }
  }

  const stageGroups = useMemo(() => {
    return STAGES.map((s) => ({
      stage: s.stage,
      subRows: rows.filter((r) => r.stage === s.stage),
    }));
  }, [rows]);

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-[1400px]">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-6 top-20 z-50 flex items-center gap-2 rounded-md px-4 py-2.5 text-[13px] font-medium text-white shadow-lg ${
            toast.type === "success" ? "bg-[#00abc0]" : "bg-[#e04040]"
          }`}
        >
          <Checkmark24Regular className="h-4 w-4" />
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-5 flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#00abc0]">
            Daily Entry
          </div>
          <h1 className="text-[22px] font-semibold leading-tight text-[#242424]">
            Day to Day Vidhai Application Status
          </h1>
          {savedAt && (
            <div className="mt-1 text-[12px] text-[#909090]">
              Last saved: {new Date(savedAt).toLocaleString("en-IN")}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-[#D1D1D1] bg-white px-3 py-1.5 shadow-fluent">
            <Calendar24Regular className="h-4 w-4 text-[#00abc0]" />
            <label className="text-[12px] font-semibold text-[#909090]">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border-0 bg-transparent text-[13px] font-medium text-[#242424] focus:outline-none"
            />
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-md border border-[#D1D1D1] bg-white px-3 py-2 text-[13px] font-semibold text-[#242424] hover:bg-[#F5F5F5]"
          >
            <ArrowClockwise24Regular className="h-4 w-4" />
            Reset
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 rounded-md border border-[#D1D1D1] bg-white px-3 py-2 text-[13px] font-semibold text-[#e04040] hover:bg-[#FDE7E9]"
            disabled={!savedAt}
          >
            <Delete24Regular className="h-4 w-4" />
            Delete
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-md bg-[#00abc0] px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-[#0099aa] disabled:opacity-60"
          >
            <Save24Regular className="h-4 w-4" />
            {saving ? "Saving…" : "Save Entry"}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="fluent-card p-8 text-center text-[13px] text-[#909090]">
          Loading entry…
        </div>
      )}

      {!loading && (
        <div className="fluent-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="fluent-table w-full border-collapse text-[13px]">
              <thead>
                {/* Row 1 — category group headers */}
                <tr>
                  <th rowSpan={2} className="border-b-2 border-r border-[#E1E1E1] px-3 py-2 text-left font-semibold text-[#242424] align-bottom">
                    Stage
                  </th>
                  <th rowSpan={2} className="border-b-2 border-r border-[#E1E1E1] px-3 py-2 text-left font-semibold text-[#242424] align-bottom">
                    Sub-Stage
                  </th>
                  {CATEGORIES.map((c) => (
                    <th
                      key={c}
                      colSpan={2}
                      className="border-b border-r border-[#E1E1E1] px-2 py-2 text-center font-semibold text-[#242424]"
                      title={c}
                    >
                      <span className="block leading-tight text-[12px]">{c}</span>
                    </th>
                  ))}
                  <th rowSpan={2} className="border-b-2 border-r border-[#E1E1E1] bg-[#e6f8fb] px-3 py-2 text-center font-semibold text-[#00abc0] align-bottom">
                    Overall Count
                  </th>
                  <th rowSpan={2} className="border-b-2 border-[#E1E1E1] bg-[#e6f8fb] px-3 py-2 text-center font-semibold text-[#00abc0] align-bottom">
                    Completed Count
                  </th>
                </tr>
                {/* Row 2 — Received / Complete sub-headers */}
                <tr>
                  {CATEGORIES.map((c) => (
                    <React.Fragment key={c}>
                      <th className="border-b border-r border-[#E1E1E1] bg-[#e6f8fb] px-1 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-[#00abc0]">
                        Received
                      </th>
                      <th className="border-b border-r border-[#E1E1E1] bg-[#f4f4f4] px-1 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-[#909090]">
                        Complete
                      </th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stageGroups.map((group, gi) => (
                  <React.Fragment key={group.stage}>
                    {group.subRows.map((r, idx) => {
                      const isFirstOfGroup = idx === 0;
                      const total = rowTotal(r);
                      const pendingTotal = CATEGORIES.reduce(
                        (s, c) => s + (r.pendingCounts?.[c] || 0), 0
                      );
                      return (
                        <tr
                          key={`${r.stage}-${r.subStage}-${idx}`}
                          className={`fluent-row ${gi % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"}`}
                        >
                          {isFirstOfGroup ? (
                            <td
                              rowSpan={group.subRows.length}
                              className="border-b border-r border-[#E1E1E1] bg-[#F8FAFC] px-3 py-2 align-middle font-semibold text-[#242424]"
                            >
                              {r.stage}
                            </td>
                          ) : null}
                          <td className="border-b border-r border-[#E1E1E1] px-3 py-2 text-[#909090]">
                            {r.subStage || "—"}
                          </td>
                          {CATEGORIES.map((c) => (
                            <React.Fragment key={c}>
                              {/* Received cell — editable */}
                              <td className="border-b border-r border-[#E1E1E1] bg-[#e6f8fb]/30 px-1 py-1">
                                <input
                                  type="number"
                                  min={0}
                                  value={r.counts[c]}
                                  onChange={(e) => updateCell(r.stage, r.subStage, c, e.target.value)}
                                  onFocus={(e) => e.target.select()}
                                  className="cell-input received"
                                />
                              </td>
                              {/* Complete cell — editable */}
                              <td className="border-b border-r border-[#E1E1E1] bg-[#f4f4f4]/60 px-1 py-1">
                                <input
                                  type="number"
                                  min={0}
                                  value={r.pendingCounts?.[c] ?? 0}
                                  onChange={(e) => updatePendingCell(r.stage, r.subStage, c, e.target.value)}
                                  onFocus={(e) => e.target.select()}
                                  className="cell-input complete"
                                />
                              </td>
                            </React.Fragment>
                          ))}
                          {/* Overall Count = Received total */}
                          <td className="border-b border-r border-[#E1E1E1] bg-[#e6f8fb] px-3 py-2 text-center font-semibold text-[#00abc0]">
                            {total}
                          </td>
                          {/* Completed Count — sum of Complete (pendingCounts) for this row */}
                          <td className="border-b border-[#E1E1E1] bg-[#e6f8fb] px-3 py-2 text-center font-semibold text-[#00abc0]">
                            {pendingTotal}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
                {/* Footer summary */}
                <tr className="bg-[#F8FAFC]">
                  <td colSpan={2} className="border-t-2 border-[#00abc0] px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-[#00abc0]">
                    Summary
                  </td>
                  {CATEGORIES.map((c) => (
                    <React.Fragment key={c}>
                      <td className="border-t-2 border-[#00abc0] bg-[#e6f8fb]/40 px-2 py-1.5 text-center text-[13px] font-bold text-[#00abc0]">
                        {categoryCompleted[c]}
                      </td>
                      <td className="border-t-2 border-[#909090] bg-[#f4f4f4]/60 px-2 py-1.5 text-center text-[13px] font-bold text-[#909090]">
                        {categoryPending[c]}
                      </td>
                    </React.Fragment>
                  ))}
                  <td className="border-t-2 border-[#00abc0] bg-[#00abc0] px-3 py-2 text-center text-[14px] font-bold text-white">
                    {overallCount}
                  </td>
                  <td className="border-t-2 border-[#00abc0] bg-[#00abc0] px-3 py-2 text-center text-[14px] font-bold text-white">
                    {totalPending}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4 rounded-md border border-[#b3e8ef] bg-[#e6f8fb] p-3 text-[12px] text-[#007a8a]">
        <strong>Tip:</strong> Both <strong>Received</strong> (green) and <strong>Complete</strong> (orange) columns are editable — Tab between cells. Click <strong>Save Entry</strong> when done.
      </div>
    </div>
  );
}
