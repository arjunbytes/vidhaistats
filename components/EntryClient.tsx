"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CATEGORIES,
  Category,
  DailyEntry,
  STAGES,
  StageRow,
  makeEmptyRows,
  formatDate,
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
  const [isDirty, setIsDirty] = useState(false);
  const [carriedFrom, setCarriedFrom] = useState<string | null>(null);

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load entry for the selected date — carry forward latest prior day when empty
  useEffect(() => {
    let active = true;
    setLoading(true);
    const base = makeEmptyRows();
    const mergeRows = (src: StageRow[]): StageRow[] =>
      base.map((br) => {
        const found = src.find(
          (er) => er.stage === br.stage && er.subStage === br.subStage
        );
        if (!found) return br;
        const counts = {} as Record<Category, number>;
        const pendingCounts = {} as Record<Category, number>;
        CATEGORIES.forEach((c) => {
          counts[c] = found.counts[c] ?? 0;
          pendingCounts[c] = found.pendingCounts?.[c] ?? 0;
        });
        return { stage: br.stage, subStage: br.subStage, counts, pendingCounts };
      });
    fetch(`/api/entries`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        const all: DailyEntry[] = [...(d.entries ?? [])].sort((a, b) =>
          a.date < b.date ? 1 : -1
        );
        const exact = all.find((e) => e.date === date);
        if (exact && exact.rows) {
          setRows(mergeRows(exact.rows));
          setSavedAt(exact.updatedAt || null);
          setCarriedFrom(null);
        } else {
          const prev = all.find((e) => e.date < date);
          if (prev && prev.rows) {
            setRows(mergeRows(prev.rows));
            setSavedAt(null);
            setCarriedFrom(prev.date);
          } else {
            setRows(makeEmptyRows());
            setSavedAt(null);
            setCarriedFrom(null);
          }
        }
        setIsDirty(false);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [date]);

  // ── computed summaries ──────────────────────────────────────────────────────
  const categoryPending = useMemo(() => {
    const t: Record<string, number> = {};
    CATEGORIES.forEach((c) => (t[c] = rows.reduce((s, r) => s + (r.pendingCounts?.[c] || 0), 0)));
    return t;
  }, [rows]);

  const totalPending = useMemo(() => {
    return rows.reduce(
      (sum, r) => sum + CATEGORIES.reduce((s, c) => s + (r.pendingCounts?.[c] || 0), 0),
      0
    );
  }, [rows]);

  // ── save ────────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async (auto = false) => {
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
        setIsDirty(false);
        if (!auto) setToast({ type: "success", msg: "Entry saved successfully" });
      } else {
        setToast({ type: "error", msg: "Could not save entry" });
      }
    } catch {
      setToast({ type: "error", msg: "Network error while saving" });
    } finally {
      setSaving(false);
      if (!auto) setTimeout(() => setToast(null), 2800);
    }
  }, [date, rows]);

  // ── autosave: debounce 1.5 s after any change ───────────────────────────────
  useEffect(() => {
    if (!isDirty || loading) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => handleSave(true), 1500);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [rows, isDirty, loading, handleSave]);

  // ── cell updaters ───────────────────────────────────────────────────────────
  function updatePendingCell(stage: string, subStage: string, cat: Category, value: string) {
    const num = Math.max(0, parseInt(value || "0", 10) || 0);
    setRows((prev) =>
      prev.map((r) => {
        if (r.stage !== stage || r.subStage !== subStage) return r;
        const pending = {} as Record<Category, number>;
        CATEGORIES.forEach((c) => { pending[c] = r.pendingCounts?.[c] ?? 0; });
        pending[cat] = num;
        // keep counts in sync so the table value and the dashboards agree
        const counts = { ...r.counts, [cat]: num };
        return { ...r, counts, pendingCounts: pending };
      })
    );
    setIsDirty(true);
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
          {!savedAt && carriedFrom && (
            <div className="mt-1 text-[12px] font-medium text-[#006b78]">
              Carried forward from {formatDate(carriedFrom)} — adjust the numbers and Save to record this day.
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
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-2 rounded-md bg-[#00abc0] px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-[#0099aa] disabled:opacity-60"
          >
            <Save24Regular className="h-4 w-4" />
            {saving ? "Saving…" : isDirty ? "Save Entry*" : "Save Entry"}
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
                {/* Header — Stage, Sub-Stage, one column per category, total */}
                <tr>
                  <th className="border-b-2 border-r border-[#E1E1E1] px-3 py-2 text-left font-semibold text-[#242424] align-bottom">
                    Stage
                  </th>
                  <th className="border-b-2 border-r border-[#E1E1E1] px-3 py-2 text-left font-semibold text-[#242424] align-bottom">
                    Sub-Stage
                  </th>
                  {CATEGORIES.map((c) => (
                    <th
                      key={c}
                      className="border-b-2 border-r border-[#E1E1E1] px-2 py-2 text-center font-semibold text-[#242424]"
                      title={c}
                    >
                      <span className="block leading-tight text-[12px]">{c}</span>
                    </th>
                  ))}
                  <th className="border-b-2 border-[#E1E1E1] bg-[#e6f8fb] px-3 py-2 text-center font-semibold text-[#00abc0] align-bottom">
                    Completed Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {stageGroups.map((group, gi) => (
                  <React.Fragment key={group.stage}>
                    {group.subRows.map((r, idx) => {
                      const isFirstOfGroup = idx === 0;
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
                            /* Complete cell — editable */
                            <td key={c} className="border-b border-r border-[#E1E1E1] bg-[#f4f4f4]/60 px-1 py-1">
                              <input
                                type="number"
                                min={0}
                                value={r.pendingCounts?.[c] ?? 0}
                                onChange={(e) => updatePendingCell(r.stage, r.subStage, c, e.target.value)}
                                onFocus={(e) => e.target.select()}
                                className="cell-input complete"
                              />
                            </td>
                          ))}
                          {/* Completed Count — sum of Complete (pendingCounts) for this row */}
                          <td className="border-b border-[#E1E1E1] bg-[#e6f8fb] px-3 py-2 text-center font-bold text-[#00abc0]">
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
                    <td key={c} className="border-t-2 border-[#909090] bg-[#f4f4f4]/60 px-2 py-1.5 text-center text-[13px] font-bold text-[#909090]">
                      {categoryPending[c]}
                    </td>
                  ))}
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
        <strong>Tip:</strong> Enter the count for each category — Tab between cells. Click <strong>Save Entry</strong> when done.
      </div>
    </div>
  );
}
