"use client";

import type { ScrapeRun } from "@/lib/queries/get-monitoring-data";

function statusBadge(status: string): string {
  switch (status) {
    case "failure":
      return "bg-red-500 text-white";
    case "partial_failure":
      return "bg-yellow-500 text-white";
    default:
      return "bg-gray-400 text-white";
  }
}

/**
 * Expandable error log showing recent scrape failures.
 */
export function ErrorLogViewer({ runs }: { runs: ScrapeRun[] }) {
  // Filter to runs with errors, take most recent 20
  const errorRuns = runs
    .filter((r) => r.errors && r.errors.length > 0)
    .slice(0, 20);

  if (errorRuns.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No recent errors. All clear!
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {errorRuns.map((run) => (
        <details
          key={run.id}
          className="rounded-lg border bg-card overflow-hidden"
        >
          <summary className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm hover:bg-accent/50">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(run.status)}`}
            >
              {run.status}
            </span>
            <span className="font-medium">{run.source_name}</span>
            <span className="text-muted-foreground">
              {new Date(run.started_at).toLocaleDateString()} --{" "}
              {run.errors.length} error{run.errors.length !== 1 ? "s" : ""}
            </span>
          </summary>
          <div className="border-t px-4 py-3">
            <ul className="space-y-1 text-sm text-muted-foreground">
              {run.errors.map((err, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-red-500 shrink-0">-</span>
                  <span>{err.message}</span>
                  {err.category && (
                    <span className="text-xs text-muted-foreground">
                      [{err.category}]
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </details>
      ))}
    </div>
  );
}
