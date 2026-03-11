"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { JobRow } from "@/components/jobs/job-row";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { searchJobs, type JobFilters } from "@/lib/queries/search-jobs";
import { useJobFilters } from "@/lib/hooks/use-job-filters";
import { Loader2 } from "lucide-react";

type JobData = {
  id: string;
  title: string;
  location_raw: string | null;
  city: string | null;
  school_type: string | null;
  first_seen_at: string;
  url: string;
  schools: { name: string; district_name: string | null } | null;
};

// Map flat RPC fields to the nested shape JobRow expects
function mapSearchResult(row: Record<string, unknown>): JobData {
  return {
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
  };
}

export function JobList({
  initialJobs,
  totalCount,
}: {
  initialJobs: JobData[];
  totalCount: number;
}) {
  const [filters] = useJobFilters();
  const [jobs, setJobs] = useState(initialJobs);
  const [count, setCount] = useState(totalCount);
  const [isPending, startTransition] = useTransition();
  const [isFiltering, setIsFiltering] = useState(false);
  const isInitialMount = useRef(true);

  const hasMore = jobs.length < count;

  // Check if any filters are non-default
  const hasActiveFilters =
    filters.q !== "" ||
    filters.type.length > 0 ||
    filters.grade.length > 0 ||
    filters.subject.length > 0 ||
    filters.cert.length > 0 ||
    filters.salary !== false ||
    (filters.zip !== "" && filters.zip.length === 5) ||
    filters.unspecified !== true;

  // Build JobFilters object from nuqs state
  function buildFilters(): JobFilters {
    return {
      q: filters.q || undefined,
      type: filters.type.length > 0 ? filters.type : undefined,
      grade: filters.grade.length > 0 ? filters.grade : undefined,
      subject: filters.subject.length > 0 ? filters.subject : undefined,
      cert: filters.cert.length > 0 ? filters.cert : undefined,
      salary: filters.salary || undefined,
      zip: filters.zip && filters.zip.length === 5 ? filters.zip : undefined,
      radius: filters.radius,
      unspecified: filters.unspecified,
    };
  }

  // Re-fetch when filters change (skip initial mount since we have SSR data)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setIsFiltering(true);
    startTransition(async () => {
      const filterParams = buildFilters();
      const { jobs: newJobs, count: newCount } = await searchJobs(
        filterParams,
        0,
        25
      );
      setJobs(newJobs.map(mapSearchResult));
      setCount(newCount);
      setIsFiltering(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.q,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    filters.type.join(","),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    filters.grade.join(","),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    filters.subject.join(","),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    filters.cert.join(","),
    filters.salary,
    filters.zip,
    filters.radius,
    filters.unspecified,
  ]);

  function loadMore() {
    startTransition(async () => {
      const filterParams = buildFilters();
      const { jobs: newJobs } = await searchJobs(
        filterParams,
        jobs.length,
        25
      );
      setJobs((prev) => [...prev, ...newJobs.map(mapSearchResult)]);
    });
  }

  return (
    <div>
      {/* Count header */}
      <p className="mb-4 text-sm text-muted-foreground">
        {count} open position{count !== 1 ? "s" : ""}
      </p>

      {/* Loading skeleton during filter transitions */}
      {isFiltering ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2 px-4 py-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/50 py-16 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            {hasActiveFilters
              ? "No jobs match your filters"
              : "No job listings yet"}
          </p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground/70">
            {hasActiveFilters
              ? "Try adjusting your search or removing some filters."
              : "We're actively collecting PA educator positions. Check back soon!"}
          </p>
        </div>
      ) : (
        <>
          {/* Job rows */}
          <div className="rounded-lg border border-border/50 [&>a:nth-child(even)]:bg-muted/30">
            {jobs.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load more"
                )}
              </Button>
            </div>
          )}

          {/* Loading skeleton for load-more */}
          {isPending && !isFiltering && (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2 px-4 py-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
