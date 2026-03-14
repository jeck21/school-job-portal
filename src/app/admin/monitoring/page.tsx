import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getRecentScrapeRuns,
  getJobCountTrends,
  getSourceSummaries,
} from "@/lib/queries/get-monitoring-data";
import { SourceSummaryCards } from "@/components/admin/source-summary";
import { ScrapeTimeline } from "@/components/admin/scrape-timeline";
import { JobCountChart } from "@/components/admin/job-count-chart";
import { ErrorLogViewer } from "@/components/admin/error-log-viewer";

export const metadata = {
  title: "Monitoring | PA Educator Jobs",
};

export default async function MonitoringPage() {
  // Auth gate: only operator can access
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const operatorEmail = process.env.OPERATOR_EMAIL;
  if (!user || !operatorEmail || user.email !== operatorEmail) {
    redirect("/");
  }

  // Fetch all monitoring data in parallel
  const [runs, trends, summaries] = await Promise.all([
    getRecentScrapeRuns(30),
    getJobCountTrends(30),
    getSourceSummaries(),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">Scrape Monitoring</h1>

      {/* Source Summary Cards */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Source Overview</h2>
        <SourceSummaryCards summaries={summaries} />
      </section>

      {/* Scrape Timeline */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">
          Scrape Timeline (Last 14 Days)
        </h2>
        <div className="rounded-lg border bg-card p-4">
          <ScrapeTimeline runs={runs} />
        </div>
      </section>

      {/* Job Count Trends */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">
          Job Count Trends (Last 30 Days)
        </h2>
        <div className="rounded-lg border bg-card p-4">
          <JobCountChart trends={trends} />
        </div>
      </section>

      {/* Error Log */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Recent Errors</h2>
        <ErrorLogViewer runs={runs} />
      </section>
    </main>
  );
}
