"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatRelativeDate } from "@/lib/format-date";

type JobRowData = {
  id: string;
  title: string;
  location_raw: string | null;
  city: string | null;
  school_type: string | null;
  first_seen_at: string;
  url: string;
  schools: { name: string; district_name: string | null } | null;
};

function getSchoolTypeBadgeVariant(
  type: string | null
): "default" | "secondary" | "outline" {
  switch (type?.toLowerCase()) {
    case "public":
      return "default";
    case "private":
      return "secondary";
    case "charter":
      return "outline";
    default:
      return "secondary";
  }
}

export function JobRow({ job }: { job: JobRowData }) {
  const schoolName = job.schools?.name ?? "School";
  const location = job.city ?? job.location_raw;

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block border-b border-border/50 px-4 py-3 transition-colors hover:bg-muted/50"
    >
      {/* Line 1: Title . School . Location */}
      <div className="flex flex-wrap items-baseline gap-x-1.5 text-sm">
        <span className="font-medium text-foreground">{job.title}</span>
        <span className="text-muted-foreground/60">&middot;</span>
        <span className="text-muted-foreground">{schoolName}</span>
        {location && (
          <>
            <span className="text-muted-foreground/60">&middot;</span>
            <span className="text-muted-foreground">{location}</span>
          </>
        )}
      </div>

      {/* Line 2: Badge + Posted date */}
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        {job.school_type && (
          <Badge variant={getSchoolTypeBadgeVariant(job.school_type)}>
            {job.school_type}
          </Badge>
        )}
        <span>Posted {formatRelativeDate(job.first_seen_at)}</span>
      </div>
    </Link>
  );
}
