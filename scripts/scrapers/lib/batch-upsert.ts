/**
 * Batch upsert utility for job records.
 * Processes jobs in configurable batches, continues on partial failure.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

interface UpsertResult {
  succeeded: number;
  failed: number;
  errors: string[];
}

/**
 * Upsert job records in batches. Partial batch failure does not
 * roll back successful batches -- each batch is independent.
 */
export async function batchUpsertJobs(
  supabase: SupabaseClient,
  jobs: Array<Record<string, unknown>>,
  batchSize = 50
): Promise<UpsertResult> {
  const result: UpsertResult = {
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  // Stamp each job with last_verified_at
  const stamped = jobs.map((job) => ({
    ...job,
    last_verified_at: new Date().toISOString(),
    is_active: true,
  }));

  // Process in batches
  for (let i = 0; i < stamped.length; i += batchSize) {
    const batch = stamped.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from("jobs")
      .upsert(batch, { onConflict: "source_id,external_id" });

    if (error) {
      result.failed += batch.length;
      result.errors.push(error.message);
      console.error(
        `[batch-upsert] Batch ${Math.floor(i / batchSize) + 1} failed: ${error.message}`
      );
    } else {
      result.succeeded += batch.length;
    }
  }

  return result;
}
