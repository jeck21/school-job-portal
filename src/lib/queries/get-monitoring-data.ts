"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type ScrapeRun = {
  id: string;
  source_id: string;
  source_name: string;
  source_slug: string;
  status: "running" | "success" | "partial_failure" | "failure";
  started_at: string;
  finished_at: string | null;
  jobs_added: number;
  jobs_updated: number;
  jobs_skipped: number;
  jobs_failed: number;
  errors: Array<{ message: string; category?: string; page?: number }>;
  duration_ms: number | null;
};

export type JobCountTrend = {
  date: string;
  source: string;
  count: number;
};

export type SourceSummary = {
  source_name: string;
  source_slug: string;
  status: string | null;
  last_run: string | null;
  jobs_added: number;
  jobs_updated: number;
  duration_ms: number | null;
  total_active: number;
};

/**
 * Fetch recent scrape runs joined with source info.
 */
export async function getRecentScrapeRuns(
  days: number = 30
): Promise<ScrapeRun[]> {
  const supabase = createAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("scrape_logs")
    .select("*, sources!inner(name, slug)")
    .gte("started_at", since.toISOString())
    .order("started_at", { ascending: false });

  if (error) {
    console.error("[monitoring] Failed to fetch scrape runs:", error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const source = row.sources as { name: string; slug: string };
    return {
      id: row.id as string,
      source_id: row.source_id as string,
      source_name: source.name,
      source_slug: source.slug,
      status: row.status as ScrapeRun["status"],
      started_at: row.started_at as string,
      finished_at: row.finished_at as string | null,
      jobs_added: (row.jobs_added as number) ?? 0,
      jobs_updated: (row.jobs_updated as number) ?? 0,
      jobs_skipped: (row.jobs_skipped as number) ?? 0,
      jobs_failed: (row.jobs_failed as number) ?? 0,
      errors: (row.errors as ScrapeRun["errors"]) ?? [],
      duration_ms: row.duration_ms as number | null,
    };
  });
}

/**
 * Get daily job count trends by source from scrape_logs.
 * Groups by date and source, summing jobs_added per day.
 */
export async function getJobCountTrends(
  days: number = 30
): Promise<JobCountTrend[]> {
  const supabase = createAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("scrape_logs")
    .select("started_at, source_id, jobs_added, sources!inner(name)")
    .gte("started_at", since.toISOString())
    .in("status", ["success", "partial_failure"])
    .order("started_at", { ascending: true });

  if (error) {
    console.error(
      "[monitoring] Failed to fetch job count trends:",
      error.message
    );
    return [];
  }

  // Group by date + source
  const grouped = new Map<string, number>();
  for (const row of data ?? []) {
    const date = (row.started_at as string).slice(0, 10); // YYYY-MM-DD
    const source = (row.sources as unknown as { name: string }).name;
    const key = `${date}|${source}`;
    grouped.set(key, (grouped.get(key) ?? 0) + (row.jobs_added ?? 0));
  }

  return Array.from(grouped.entries()).map(([key, count]) => {
    const [date, source] = key.split("|");
    return { date, source, count };
  });
}

/**
 * Get per-source summary: latest run info + total active jobs.
 */
export async function getSourceSummaries(): Promise<SourceSummary[]> {
  const supabase = createAdminClient();

  // Get all sources
  const { data: sources, error: srcError } = await supabase
    .from("sources")
    .select("id, name, slug");

  if (srcError || !sources) {
    console.error(
      "[monitoring] Failed to fetch sources:",
      srcError?.message
    );
    return [];
  }

  // Get latest scrape log per source
  const summaries: SourceSummary[] = [];

  for (const src of sources) {
    // Latest scrape log for this source
    const { data: latestLog } = await supabase
      .from("scrape_logs")
      .select("status, started_at, jobs_added, jobs_updated, duration_ms")
      .eq("source_id", src.id)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Count active jobs for this source
    const { count } = await supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("source_id", src.id)
      .eq("is_active", true);

    summaries.push({
      source_name: src.name,
      source_slug: src.slug,
      status: latestLog?.status ?? null,
      last_run: latestLog?.started_at ?? null,
      jobs_added: latestLog?.jobs_added ?? 0,
      jobs_updated: latestLog?.jobs_updated ?? 0,
      duration_ms: latestLog?.duration_ms ?? null,
      total_active: count ?? 0,
    });
  }

  return summaries;
}
