import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getDistrictBySlug,
  getDistrictPublicJobs,
} from "@/lib/queries/get-district";
import { VerifiedBadge } from "@/components/district/verified-badge";
import { Badge } from "@/components/ui/badge";
import { formatRelativeDate } from "@/lib/format-date";
import { ExternalLink, MapPin } from "lucide-react";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const district = await getDistrictBySlug(slug);

  if (!district) {
    return { title: "District Not Found" };
  }

  return {
    title: `${district.name} - Open Positions | PA School Jobs`,
    description: `Browse open educator positions at ${district.name}. Verified district on PA School Jobs.`,
  };
}

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

export default async function DistrictProfilePage({ params }: Props) {
  const { slug } = await params;
  const district = await getDistrictBySlug(slug);

  if (!district) {
    notFound();
  }

  const jobs = await getDistrictPublicJobs(district.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* District header */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {district.name}
          </h1>
          <VerifiedBadge className="text-sm" />
        </div>

        {district.website && (
          <a
            href={
              district.website.startsWith("http")
                ? district.website
                : `https://${district.website}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-cta"
          >
            <ExternalLink className="size-3.5" />
            {district.website.replace(/^https?:\/\//, "")}
          </a>
        )}
      </div>

      {/* Open positions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">
          Open Positions ({jobs.length})
        </h2>

        {jobs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/50 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No open positions at this time. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex flex-wrap items-baseline gap-x-1.5 text-sm">
                  <span className="font-medium text-foreground">
                    {job.title}
                  </span>
                  <span className="text-muted-foreground/60">&middot;</span>
                  <span className="text-muted-foreground">
                    {job.schoolName}
                  </span>
                  {job.city && (
                    <>
                      <span className="text-muted-foreground/60">&middot;</span>
                      <span className="flex items-center gap-0.5 text-muted-foreground">
                        <MapPin className="size-3" />
                        {job.city}
                      </span>
                    </>
                  )}
                </div>

                <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                  {job.school_type && (
                    <Badge
                      variant={getSchoolTypeBadgeVariant(job.school_type)}
                    >
                      {job.school_type}
                    </Badge>
                  )}
                  <span>Posted {formatRelativeDate(job.first_seen_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
