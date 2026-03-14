"use client";

import type { ScrapeRun } from "@/lib/queries/get-monitoring-data";

function dotColor(status: string): string {
  switch (status) {
    case "success":
      return "bg-green-500";
    case "partial_failure":
      return "bg-yellow-500";
    case "failure":
      return "bg-red-500";
    default:
      return "bg-gray-300 dark:bg-gray-600";
  }
}

/**
 * Build a grid of status dots: rows = sources, columns = last 14 days.
 */
export function ScrapeTimeline({ runs }: { runs: ScrapeRun[] }) {
  // Build date columns (last 14 days)
  const dates: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }

  // Group runs by source slug + date
  const sources = [...new Set(runs.map((r) => r.source_name))].sort();
  const lookup = new Map<string, string>();
  for (const r of runs) {
    const date = r.started_at.slice(0, 10);
    const key = `${r.source_name}|${date}`;
    // Keep the worst status for the day
    const existing = lookup.get(key);
    if (!existing || statusPriority(r.status) > statusPriority(existing)) {
      lookup.set(key, r.status);
    }
  }

  if (sources.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No scrape data yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="text-xs">
        <thead>
          <tr>
            <th className="pr-3 text-left font-medium text-muted-foreground">
              Source
            </th>
            {dates.map((d) => (
              <th
                key={d}
                className="px-1 text-center font-normal text-muted-foreground"
              >
                {d.slice(5)} {/* MM-DD */}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sources.map((source) => (
            <tr key={source}>
              <td className="pr-3 py-1 font-medium">{source}</td>
              {dates.map((date) => {
                const status = lookup.get(`${source}|${date}`);
                return (
                  <td key={date} className="px-1 py-1 text-center">
                    <div
                      className={`mx-auto h-3 w-3 rounded-full ${status ? dotColor(status) : "bg-gray-200 dark:bg-gray-700"}`}
                      title={status ? `${date}: ${status}` : `${date}: no run`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function statusPriority(status: string): number {
  switch (status) {
    case "failure":
      return 3;
    case "partial_failure":
      return 2;
    case "success":
      return 1;
    default:
      return 0;
  }
}
