import { Briefcase } from "lucide-react";
import { getJobs } from "@/lib/queries/get-jobs";
import { JobList } from "@/components/jobs/job-list";

export default async function JobsPage() {
  const { jobs, count } = await getJobs(0, 25);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">Job Listings</h1>
      <p className="mt-2 text-muted-foreground">
        Browse PA educator job openings across the state.
      </p>

      {jobs.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-lg border border-dashed border-border/50 py-24 text-center">
          <Briefcase className="size-12 text-muted-foreground/50" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">
            No job listings yet
          </p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground/70">
            We&apos;re actively collecting PA educator positions. Check back
            soon!
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <JobList initialJobs={jobs} totalCount={count} />
        </div>
      )}
    </div>
  );
}
