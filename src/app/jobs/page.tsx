import { Suspense } from "react";
import { Briefcase } from "lucide-react";
import { searchJobs, type JobFilters } from "@/lib/queries/search-jobs";
import { JobList } from "@/components/jobs/job-list";
import { SearchFilterBar } from "@/components/jobs/search-filter-bar";
import { Skeleton } from "@/components/ui/skeleton";

interface JobsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseSearchParams(
  params: Record<string, string | string[] | undefined>
): JobFilters {
  const str = (key: string): string | undefined => {
    const val = params[key];
    return typeof val === "string" && val ? val : undefined;
  };
  const arr = (key: string): string[] | undefined => {
    const val = params[key];
    if (typeof val === "string" && val) return val.split(",");
    if (Array.isArray(val) && val.length > 0) return val;
    return undefined;
  };

  return {
    q: str("q"),
    type: arr("type"),
    grade: arr("grade"),
    subject: arr("subject"),
    cert: arr("cert"),
    salary: params.salary === "true" ? true : undefined,
    zip: str("zip"),
    radius: params.radius ? Number(params.radius) : undefined,
    unspecified: params.unspecified === "false" ? false : undefined,
  };
}

function JobListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2 px-4 py-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const params = await searchParams;
  const filters = parseSearchParams(params);
  const { jobs, count } = await searchJobs(filters, 0, 25);

  // Map flat RPC results to the shape JobList/JobRow expects
  const mappedJobs = jobs.map(
    (row: Record<string, unknown>) => ({
      id: row.id as string,
      title: row.title as string,
      location_raw: row.location_raw as string | null,
      city: row.city as string | null,
      school_type: row.school_type as string | null,
      first_seen_at: row.first_seen_at as string,
      url: row.url as string,
      schools: row.school_name
        ? {
            name: row.school_name as string,
            district_name: (row.district_name as string | null) ?? null,
          }
        : null,
      claimed_by_district_id:
        (row.claimed_by_district_id as string | null) ?? null,
    })
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">Job Listings</h1>
      <p className="mt-2 text-muted-foreground">
        Browse PA educator job openings across the state.
      </p>

      <div className="mt-6">
        <SearchFilterBar />
      </div>

      <div className="mt-6">
        <Suspense fallback={<JobListSkeleton />}>
          <JobList initialJobs={mappedJobs} totalCount={count} />
        </Suspense>
      </div>
    </div>
  );
}
