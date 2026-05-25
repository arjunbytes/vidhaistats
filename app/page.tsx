import Link from "next/link";
import { readAll } from "@/lib/store";
import { CATEGORIES, entryTotal, formatDate, rowTotal } from "@/lib/schema";
import {
  ClipboardTextEdit24Regular,
  DataBarVertical24Regular,
  History24Regular,
  PeopleTeam24Regular,
  DocumentBulletList24Regular,
  Checkmark24Regular,
} from "@fluentui/react-icons";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const entries = readAll().sort((a, b) => (a.date < b.date ? 1 : -1));
  const latest = entries[0];
  const totalEntries = entries.length;
  const totalApps = entries.reduce(
    (sum, e) =>
      sum +
      (e.rows.find((r) => r.stage === "No of Applications Received")
        ? rowTotal(e.rows.find((r) => r.stage === "No of Applications Received")!)
        : 0),
    0
  );
  const reviewSelected = entries.reduce(
    (sum, e) =>
      sum +
      (e.rows.find((r) => r.stage === "Review" && r.subStage === "Select")
        ? rowTotal(e.rows.find((r) => r.stage === "Review" && r.subStage === "Select")!)
        : 0),
    0
  );
  const finalSelected = entries.reduce(
    (sum, e) =>
      sum +
      (e.rows.find((r) => r.stage === "Final Interview" && r.subStage === "Select")
        ? rowTotal(
            e.rows.find((r) => r.stage === "Final Interview" && r.subStage === "Select")!
          )
        : 0),
    0
  );

  const stats = [
    {
      label: "Total Daily Entries",
      value: totalEntries,
      hint: "logged so far",
      icon: DocumentBulletList24Regular,
      tone: "bg-[#e6f8fb] text-[#00abc0]",
    },
    {
      label: "Applications Received",
      value: totalApps,
      hint: "cumulative",
      icon: PeopleTeam24Regular,
      tone: "bg-[#e6f8fb] text-[#00abc0]",
    },
    {
      label: "Review — Selected",
      value: reviewSelected,
      hint: "cumulative",
      icon: Checkmark24Regular,
      tone: "bg-[#f4f4f4] text-[#909090]",
    },
    {
      label: "Final Interview — Selected",
      value: finalSelected,
      hint: "cumulative",
      icon: Checkmark24Regular,
      tone: "bg-[#FDE7E9] text-[#e04040]",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      {/* Hero */}
      <div className="mb-6 rounded-xl border border-[#E1E1E1] bg-gradient-to-br from-[#00abc0] via-[#1B7CC6] to-[#00abc0] p-6 text-white shadow-fluentMd">
        <div className="text-[11px] font-semibold uppercase tracking-wider opacity-90">
          Welcome back
        </div>
        <h1 className="mt-1 text-2xl font-semibold leading-tight">
          Day to Day Vidhai Application Status
        </h1>
        <p className="mt-1 max-w-2xl text-[13px] opacity-90">
          Track every applicant through the pipeline — from letter reading to final
          interview. Enter today&apos;s numbers, review history, and visualise trends in
          the dashboard.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/entry"
            className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-[13px] font-semibold text-[#00abc0] shadow-sm transition hover:bg-[#F5F5F5]"
          >
            <ClipboardTextEdit24Regular className="h-4 w-4" />
            Enter Today&apos;s Data
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md border border-white/40 bg-white/10 px-4 py-2 text-[13px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            <DataBarVertical24Regular className="h-4 w-4" />
            View Dashboard
          </Link>
          <Link
            href="/history"
            className="inline-flex items-center gap-2 rounded-md border border-white/40 bg-white/10 px-4 py-2 text-[13px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            <History24Regular className="h-4 w-4" />
            History Log
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="fluent-card flex items-center gap-4 p-5 transition hover:shadow-fluentMd"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${s.tone}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-[#909090]">
                  {s.label}
                </div>
                <div className="text-2xl font-semibold text-[#242424]">{s.value}</div>
                <div className="text-[11px] text-[#909090]">{s.hint}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Latest entry */}
      <div className="fluent-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-[#909090]">
              Most recent entry
            </div>
            <div className="text-[18px] font-semibold text-[#242424]">
              {latest ? formatDate(latest.date) : "No entries yet"}
            </div>
          </div>
          {latest && (
            <Link
              href={`/entry?date=${latest.date}`}
              className="rounded-md border border-[#D1D1D1] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#242424] hover:bg-[#F5F5F5]"
            >
              Open
            </Link>
          )}
        </div>

        {latest ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {CATEGORIES.map((c) => {
              const total = latest.rows.reduce((s, r) => s + (r.counts[c] || 0), 0);
              return (
                <div
                  key={c}
                  className="rounded-md border border-[#E1E1E1] bg-[#FAFAFA] px-3 py-2"
                >
                  <div className="text-[11px] font-medium text-[#909090]">{c}</div>
                  <div className="text-[16px] font-semibold text-[#242424]">{total}</div>
                </div>
              );
            })}
            <div className="col-span-2 rounded-md border border-[#00abc0] bg-[#e6f8fb] px-3 py-2 md:col-span-4">
              <div className="text-[11px] font-medium text-[#00abc0]">
                Total today across all stages and categories
              </div>
              <div className="text-[20px] font-semibold text-[#00abc0]">
                {entryTotal(latest)}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-[#D1D1D1] bg-[#FAFAFA] p-8 text-center">
            <div className="text-[14px] font-medium text-[#242424]">
              No entries logged yet
            </div>
            <p className="mt-1 text-[12px] text-[#909090]">
              Head to Daily Entry to capture today&apos;s numbers.
            </p>
            <Link
              href="/entry"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#00abc0] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#0099aa]"
            >
              <ClipboardTextEdit24Regular className="h-4 w-4" />
              Start Daily Entry
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
