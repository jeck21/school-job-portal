"use client";

import type { JobCountTrend } from "@/lib/queries/get-monitoring-data";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const SOURCE_COLORS: Record<string, string> = {
  PAREAP: "hsl(var(--cta))",
  PAeducator: "hsl(var(--primary))",
  SchoolSpring: "#e879a0",
  TeachingJobsInPA: "#60a5fa",
};

function getColor(source: string): string {
  return SOURCE_COLORS[source] ?? "#94a3b8";
}

/**
 * Line chart showing daily job counts by source over time.
 */
export function JobCountChart({ trends }: { trends: JobCountTrend[] }) {
  if (trends.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No trend data yet.</p>
    );
  }

  // Get unique sources and dates
  const sources = [...new Set(trends.map((t) => t.source))].sort();
  const dates = [...new Set(trends.map((t) => t.date))].sort();

  // Transform into recharts format: [{date, Source1: count, Source2: count, ...}]
  const chartData = dates.map((date) => {
    const point: Record<string, string | number> = { date };
    for (const source of sources) {
      const entry = trends.find((t) => t.date === date && t.source === source);
      point[source] = entry?.count ?? 0;
    }
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickFormatter={(v: string) => v.slice(5)} // MM-DD
        />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        {sources.map((source) => (
          <Line
            key={source}
            type="monotone"
            dataKey={source}
            stroke={getColor(source)}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
