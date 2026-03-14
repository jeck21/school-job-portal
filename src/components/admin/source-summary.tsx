import type { SourceSummary } from "@/lib/queries/get-monitoring-data";

function statusColor(status: string | null): string {
  switch (status) {
    case "success":
      return "bg-green-500";
    case "partial_failure":
      return "bg-yellow-500";
    case "failure":
      return "bg-red-500";
    default:
      return "bg-gray-400";
  }
}

function statusLabel(status: string | null): string {
  switch (status) {
    case "success":
      return "Success";
    case "partial_failure":
      return "Partial Failure";
    case "failure":
      return "Failure";
    default:
      return "No Data";
  }
}

function formatDuration(ms: number | null): string {
  if (ms === null) return "--";
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "< 1 hour ago";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function SourceSummaryCards({
  summaries,
}: {
  summaries: SourceSummary[];
}) {
  if (summaries.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No sources configured.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {summaries.map((s) => (
        <div
          key={s.source_slug}
          className="rounded-lg border bg-card p-4 shadow-sm"
        >
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">{s.source_name}</h3>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium text-white ${statusColor(s.status)}`}
            >
              {statusLabel(s.status)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">Last run:</span>{" "}
              {formatRelativeTime(s.last_run)}
            </div>
            <div>
              <span className="font-medium text-foreground">Duration:</span>{" "}
              {formatDuration(s.duration_ms)}
            </div>
            <div>
              <span className="font-medium text-foreground">Added:</span>{" "}
              {s.jobs_added}
            </div>
            <div>
              <span className="font-medium text-foreground">Updated:</span>{" "}
              {s.jobs_updated}
            </div>
            <div className="col-span-2">
              <span className="font-medium text-foreground">
                Active jobs:
              </span>{" "}
              <span className="warm-text font-semibold">{s.total_active}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
