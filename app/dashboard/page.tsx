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
    const apps = e.rows.find((r) => r.stage === "Front Sheet Entry");
    const hv = e.rows.find((r) => r.stage === "House Visit" && r.subStage === "Completed");
    const reviewSel = e.rows.find(
      (r) => r.stage === "Review" && r.subStage === "Selected"
    );
    const finalSel = e.rows.find(
      (r) => r.stage === "Student Profile Created"
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
  const funnelSteps: { label: string; stage: string; subStage?: string }[] = [
    { label: "Front Sheet Entry", stage: "Front Sheet Entry" },
    { label: "One to One Received", stage: "One to One", subStage: "Received" },
    { label: "L1 Completed", stage: "L1 Completed" },
    { label: "L2 Completed", stage: "L2 Completed" },
    { label: "House Visit Completed", stage: "House Visit", subStage: "Completed" },
    { label: "Review Selected", stage: "Review", subStage: "Selected" },
    { label: "Student Profile Created", stage: "Student Profile Created" },
  ];
  const funnelData = funnelSteps.map((step) => ({
    stage: step.label,
    count: entries.reduce((sum, e) => {
      const r = e.rows.find(
        (r) =>
          r.stage === step.stage &&
          (step.subStage === undefined || r.subStage === step.subStage)
      );
      return sum + (r ? rowTotal(r) : 0);
    }, 0),
  }));

  // Category pie (Applications Received)
  const categoryData = CATEGORIES.map((c) => ({
    name: c,
    value: entries.reduce((sum, e) => {
      const r = e.rows.find((r) => r.stage === "Front Sheet Entry");
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
      name: "One to One",
      Select: sumStageSub("One to One", "Received"),
      Hold: sumStageSub("One to One", "Waiting List"),
      Reject: sumStageSub("One to One", "Rejected"),
    },
    {
      name: "Review",
      Select: sumStageSub("Review", "Selected"),
      Hold: sumStageSub("Review", "Hold"),
      Reject: sumStageSub("Review", "Rejected"),
    },
  ];

  const totalReceived = funnelData[0]?.count || 0;
  const totalHv = funnelData.find((f) => f.stage === "House Visit Completed")?.count || 0;
  const totalReviewSelect = sumStageSub("Review", "Selected");
  const totalFinalSelect = sumStageSub("Student Profile Created", "");
  const conversionRate =
    totalReceived > 0
      ? ((totalFinalSelect / totalReceived) * 100).toFixed(1)
      : "0.0";

  const stats = [
    {
      label: "Front Sheet Entries",
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
      label: "Profiles Created",
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
