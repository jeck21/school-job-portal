/**
 * Scrape run logger -- writes to the scrape_logs table.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Create a new scrape log entry with "running" status.
 * Returns the log entry UUID.
 */
export async function createScrapeLog(
  supabase: SupabaseClient,
  sourceId: string
): Promise<string> {
  const { data, error } = await supabase
    .from("scrape_logs")
    .insert({
      source_id: sourceId,
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create scrape log: ${error.message}`);
  }

  return data.id;
}

/**
 * Update an existing scrape log entry with results.
 */
export async function updateScrapeLog(
  supabase: SupabaseClient,
  logId: string,
  data: {
    status: "success" | "partial_failure" | "failure";
    jobs_added?: number;
    jobs_updated?: number;
    jobs_skipped?: number;
    jobs_failed?: number;
    errors?: Array<{ message: string; category?: string; page?: number }>;
    duration_ms?: number;
  }
): Promise<void> {
  const { error } = await supabase
    .from("scrape_logs")
    .update({
      ...data,
      finished_at: new Date().toISOString(),
      errors: data.errors ?? [],
    })
    .eq("id", logId);

  if (error) {
    console.error(
      `[logger] Failed to update scrape log ${logId}: ${error.message}`
    );
  }
}
