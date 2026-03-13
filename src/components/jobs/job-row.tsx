"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { VerifiedBadge } from "@/components/district/verified-badge";
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
  claimed_by_district_id?: string | null;
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
      {/* Line 1: Title + School + Location — stacked on mobile, inline on desktop */}
      <div className="flex flex-col gap-0.5 text-sm sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-1.5">
        <span className="font-medium text-foreground">{job.title}</span>
        <span className="hidden text-muted-foreground/60 sm:inline">&middot;</span>
        <span className="text-muted-foreground">
          {schoolName}
          {job.claimed_by_district_id && (
            <span className="ml-1 inline-flex align-text-bottom">
              <VerifiedBadge />
            </span>
          )}
        </span>
        {location && (
          <>
            <span className="hidden text-muted-foreground/60 sm:inline">&middot;</span>
            <span className="text-xs text-muted-foreground sm:text-sm">{location}</span>
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
