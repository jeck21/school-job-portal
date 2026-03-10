"use client";

import { useState, useTransition } from "react";
import { JobRow } from "@/components/jobs/job-row";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getJobs } from "@/lib/queries/get-jobs";
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

export function JobList({
  initialJobs,
  totalCount,
}: {
  initialJobs: JobData[];
  totalCount: number;
}) {
  const [jobs, setJobs] = useState(initialJobs);
  const [isPending, startTransition] = useTransition();
  const hasMore = jobs.length < totalCount;

  function loadMore() {
    startTransition(async () => {
      const { jobs: newJobs } = await getJobs(jobs.length, 25);
      setJobs((prev) => [...prev, ...newJobs]);
    });
  }

  return (
    <div>
      {/* Count header */}
      <p className="mb-4 text-sm text-muted-foreground">
        {totalCount} open position{totalCount !== 1 ? "s" : ""}
      </p>

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

      {/* Loading skeleton for visual feedback */}
      {isPending && (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2 px-4 py-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
