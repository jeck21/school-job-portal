"use client";

import { useState } from "react";
import { SearchFilterBar } from "@/components/jobs/search-filter-bar";
import { JobList } from "@/components/jobs/job-list";

type JobData = {
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

export function JobsPageClient({
  initialJobs,
  totalCount,
}: {
  initialJobs: JobData[];
  totalCount: number;
}) {
  const [count, setCount] = useState(totalCount);

  return (
    <>
      <div className="mt-6">
        <SearchFilterBar count={count} />
      </div>

      <div className="mt-6">
        <JobList
          initialJobs={initialJobs}
          totalCount={totalCount}
          onCountChange={setCount}
        />
      </div>
    </>
  );
}
