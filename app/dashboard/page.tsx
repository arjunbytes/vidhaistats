import { readAllAsync } from "@/lib/store";
import { CATEGORIES, formatDate, rowTotal } from "@/lib/schema";
import DashboardCharts from "@/components/DashboardCharts";
import {
  PeopleTeam24Regular,
  DocumentBulletList24Regular,
  Checkmark24Regular,
  Filter24Regular,
} from "@fluentui/react-icons";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const entries = (await readAllAsync()).sort((a, b) => (a.date < b.date ? -1 : 1));

  // Trend data (chronological)
  const trendData = entries.map((e) => {
    const apps = e.rows.find((r) => r.stage === "No of Applications Received");
    const hv = e.rows.find((r) => r.stage === "HV Completed");
    const reviewSel = e.rows.find(
      (r) => r.stage === "Review" && r.subStage === "Select"
    );
    const finalSel = e.rows.find(
      (r) => r.stage === "Final Interview" && r.subStage === "Select"
    );
    return {
      date: new Date(e.date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      }),
      received: apps ? rowTotal(apps) : 0,
      hv: hv ? rowTotal(hv) : 0,
      reviewSel: reviewSel ? rowTotal(reviewSel) : 0,
      finalSel: finalSel ? rowTotal(finalSel) : 0,
    };
  });

  // Funnel: sum each stage across all entries
  const stageKeys = [
    "No of Applications Received",
    "Application Number Generated",
    "Letter Reading",
    "Front Sheet Entry",
    "One to One Profile Filled",
    "HV Completed",
  ];
  const funnelData = stageKeys.map((stageName) => ({
    stage: stageName.replace(" Number Generated", " No.").replace(
      "One to One Profile Filled",
      "1-1 Profile"
    ),
    count: entries.reduce((sum, e) => {
      const r = e.rows.find((r) => r.stage === stageName);
      return sum + (r ? rowTotal(r) : 0);
    }, 0),
  }));

  // Category pie (Applications Received)
  const categoryData = CATEGORIES.map((c) => ({
    name: c,
    value: entries.reduce((sum, e) => {
      const r = e.rows.find((r) => r.stage === "No of Applications Received");
      return sum + (r ? r.counts[c] || 0 : 0);
    }, 0),
  }));

  // Review vs Final outcomes
  function sumStageSub(stage: string, sub: string) {
    return entries.reduce((sum, e) => {
      const r = e.rows.find((r) => r.stage === stage && r.subStage === sub);
      return sum + (r ? rowTotal(r) : 0);
    }, 0);
  }
  const reviewOutcomes = [
    {
      name: "Review",
      Select: sumStageSub("Review", "Select"),
      Hold: sumStageSub("Review", "Hold"),
      Reject: sumStageSub("Review", "Reject"),
    },
    {
      name: "Final Interview",
      Select: sumStageSub("Final Interview", "Select"),
      Hold: sumStageSub("Final Interview", "Hold"),
      Reject: sumStageSub("Final Interview", "Reject"),
    },
  ];

  const totalReceived = funnelData[0]?.count || 0;
  const totalHv = funnelData[5]?.count || 0;
  const totalReviewSelect = sumStageSub("Review", "Select");
  const totalFinalSelect = sumStageSub("Final Interview", "Select");
  const conversionRate =
    totalReceived > 0
      ? ((totalFinalSelect / totalReceived) * 100).toFixed(1)
      : "0.0";

  const stats = [
    {
      label: "Applications Received",
      value: totalReceived,
      hint: "all-time",
      icon: PeopleTeam24Regular,
      tone: "bg-[#e6f8fb] text-[#00abc0]",
    },
    {
      label: "Home Visits Completed",
      value: totalHv,
      hint: "all-time",
      icon: DocumentBulletList24Regular,
      tone: "bg-[#E6F4FA] text-[#00abc0]",
    },
    {
      label: "Review Selects",
      value: totalReviewSelect,
      hint: "moved forward",
      icon: Checkmark24Regular,
      tone: "bg-[#f4f4f4] text-[#909090]",
    },
    {
      label: "Final Selects",
      value: totalFinalSelect,
      hint: `${conversionRate}% conversion`,
      icon: Checkmark24Regular,
      tone: "bg-[#e6f8fb] text-[#00abc0]",
    },
  ];

  if (entries.length === 0) {
    return (
      <div className="mx-auto max-w-[1400px]">
        <div className="fluent-card p-12 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#e6f8fb] text-[#00abc0]">
            <Filter24Regular className="h-7 w-7" />
          </div>
          <div className="text-[15px] font-semibold text-[#242424]">
            Dashboard is empty
          </div>
          <p className="mx-auto mt-1 max-w-md text-[12px] text-[#909090]">
            Save at least one Daily Entry to see trends, the pipeline funnel,
            category composition and selection outcomes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="mb-5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#00abc0]">
          Insights
        </div>
        <h1 className="text-[22px] font-semibold leading-tight text-[#242424]">
          Dashboard
        </h1>
        <p className="text-[12px] text-[#909090]">
          Live aggregation across {entries.length} day{entries.length === 1 ? "" : "s"} of entries — from {formatDate(entries[0].date)} to {formatDate(entries[entries.length - 1].date)}.
        </p>
      </div>

      {/* Stat cards */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <DashboardCharts
        trendData={trendData}
        funnelData={funnelData}
        categoryData={categoryData}
        reviewOutcomes={reviewOutcomes}
      />
    </div>
  );
}
