import { Badge } from "@/components/ui/badge";
import { VerifiedBadge } from "@/components/district/verified-badge";
import { DialogTitle } from "@/components/ui/dialog";
import { formatDateDisplay } from "@/lib/format-date";
import { ReportButton } from "@/components/jobs/report-button";
import {
  MapPin,
  Calendar,
  RefreshCw,
  DollarSign,
  ExternalLink,
} from "lucide-react";

type JobDetailData = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  location_raw: string | null;
  city: string | null;
  state: string;
  school_type: string | null;
  salary_raw: string | null;
  salary_mentioned: boolean | null;
  first_seen_at: string;
  last_verified_at: string;
  is_active: boolean;
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

export function JobDetail({
  job,
  asModal = false,
}: {
  job: JobDetailData;
  asModal?: boolean;
}) {
  const location = job.city
    ? `${job.city}, ${job.state}`
    : job.location_raw ?? job.state;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        {asModal ? (
          <DialogTitle className="text-xl font-semibold">
            {job.title}
          </DialogTitle>
        ) : (
          <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
        )}

        {/* School + Location */}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>{job.schools?.name ?? "School"}</span>
          {job.claimed_by_district_id && <VerifiedBadge />}
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" />
            {location}
          </span>
        </div>

        {/* School type badge */}
        {job.school_type && (
          <div className="mt-3">
            <Badge variant={getSchoolTypeBadgeVariant(job.school_type)}>
              {job.school_type}
            </Badge>
          </div>
        )}
      </div>

      {/* Dates */}
      <div className="space-y-1.5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="size-3.5" />
          <span>Posted {formatDateDisplay(job.first_seen_at)}</span>
        </div>
        <div className="flex items-center gap-2">
          <RefreshCw className="size-3.5" />
          <span>Last verified {formatDateDisplay(job.last_verified_at)}</span>
        </div>
      </div>

      {/* Salary */}
      {job.salary_raw && (
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="size-3.5 text-muted-foreground" />
          <span>{job.salary_raw}</span>
        </div>
      )}

      {/* Description */}
      {job.description && (
        <div className="prose prose-sm prose-invert max-w-none">
          <h3 className="text-sm font-medium text-foreground">Description</h3>
          <div
            className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: job.description }}
          />
        </div>
      )}

      {/* Apply CTA */}
      <a
        href={job.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-cta px-6 text-sm font-medium text-cta-foreground transition-colors hover:bg-cta/90"
      >
        View Original Posting
        <ExternalLink className="size-4" />
      </a>

      {/* Report */}
      <div className="border-t pt-4">
        <ReportButton jobId={job.id} />
      </div>
    </div>
  );
}
