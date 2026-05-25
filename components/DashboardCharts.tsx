"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";

const PALETTE = [
  "#00abc0",
  "#00abc0",
  "#00abc0",
  "#909090",
  "#e04040",
  "#00abc0",
  "#909090",
  "#00abc0",
];

interface Props {
  trendData: { date: string; received: number; hv: number; reviewSel: number; finalSel: number }[];
  funnelData: { stage: string; count: number }[];
  categoryData: { name: string; value: number }[];
  reviewOutcomes: { name: string; Select: number; Hold: number; Reject: number }[];
}

export default function DashboardCharts({
  trendData,
  funnelData,
  categoryData,
  reviewOutcomes,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {/* Trend */}
      <div className="fluent-card p-5 xl:col-span-2">
        <div className="mb-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#00abc0]">
            Daily Trend
          </div>
          <h3 className="text-[16px] font-semibold text-[#242424]">
            Applications & Selections Over Time
          </h3>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer>
            <AreaChart data={trendData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="recv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00abc0" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#00abc0" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="hv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00abc0" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#00abc0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E1E1E1" />
              <XAxis dataKey="date" stroke="#909090" tick={{ fontSize: 11 }} />
              <YAxis stroke="#909090" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "#FFFFFF",
                  border: "1px solid #E1E1E1",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="received"
                name="Applications Received"
                stroke="#00abc0"
                strokeWidth={2}
                fill="url(#recv)"
              />
              <Area
                type="monotone"
                dataKey="hv"
                name="HV Completed"
                stroke="#00abc0"
                strokeWidth={2}
                fill="url(#hv)"
              />
              <Line
                type="monotone"
                dataKey="reviewSel"
                name="Review Select"
                stroke="#909090"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="finalSel"
                name="Final Select"
                stroke="#00abc0"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Funnel */}
      <div className="fluent-card p-5">
        <div className="mb-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#00abc0]">
            Pipeline Funnel
          </div>
          <h3 className="text-[16px] font-semibold text-[#242424]">
            Cumulative by Stage
          </h3>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer>
            <BarChart
              data={funnelData}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 60, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E1E1E1" />
              <XAxis type="number" stroke="#909090" tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="stage"
                stroke="#909090"
                tick={{ fontSize: 11 }}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  background: "#FFFFFF",
                  border: "1px solid #E1E1E1",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" name="Count" fill="#00abc0" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category pie */}
      <div className="fluent-card p-5">
        <div className="mb-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#00abc0]">
            Composition
          </div>
          <h3 className="text-[16px] font-semibold text-[#242424]">
            Applications by Category
          </h3>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                innerRadius={50}
                paddingAngle={2}
              >
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#FFFFFF",
                  border: "1px solid #E1E1E1",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Review outcomes */}
      <div className="fluent-card p-5 xl:col-span-2">
        <div className="mb-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#00abc0]">
            Selection Outcomes
          </div>
          <h3 className="text-[16px] font-semibold text-[#242424]">
            Review vs Final Interview — Select / Hold / Reject
          </h3>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer>
            <BarChart data={reviewOutcomes} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E1E1E1" />
              <XAxis dataKey="name" stroke="#909090" tick={{ fontSize: 12 }} />
              <YAxis stroke="#909090" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "#FFFFFF",
                  border: "1px solid #E1E1E1",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Select" stackId="a" fill="#00abc0" />
              <Bar dataKey="Hold" stackId="a" fill="#909090" />
              <Bar dataKey="Reject" stackId="a" fill="#e04040" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
