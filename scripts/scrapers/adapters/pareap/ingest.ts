/**
 * PAREAP ingestion pipeline: scrape -> normalize -> match schools -> upsert -> log.
 * Full orchestrator that connects PareapAdapter to the database.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScrapeResult, ScrapeError, ScrapedJob } from "../../lib/types";
import { createAdminClient } from "../../lib/supabase-admin";
import { createScrapeLog, updateScrapeLog } from "../../lib/logger";
import { findOrCreateSchool } from "../../lib/school-matcher";
import { PareapAdapter } from "./index";

const BATCH_SIZE = 25;

/**
 * Ensure a PAREAP source record exists in the sources table.
 * Uses upsert on slug to avoid duplicates. Returns the source UUID.
 */
async function ensureSource(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase
    .from("sources")
    .upsert(
      {
        name: "PAREAP",
        slug: "pareap",
        base_url: "https://www.pareap.net",
        scraper_type: "cheerio",
        is_active: true,
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to seed PAREAP source: ${error.message}`);
  }

  console.log(`[ingest] PAREAP source: ${data.id}`);
  return data.id;
}

/**
 * Run the full PAREAP ingestion pipeline:
 * 1. Seed/find source record
 * 2. Create scrape log
 * 3. Scrape via PareapAdapter
 * 4. For each job: match school, upsert job, upsert job_sources
 * 5. Update source.last_scraped_at
 * 6. Finalize scrape log
 */
export async function ingestPareap(): Promise<ScrapeResult> {
  const startTime = Date.now();
  const supabase = createAdminClient();

  // Step 1: Ensure source exists
  const sourceId = await ensureSource(supabase);

  // Step 2: Create scrape log
  const logId = await createScrapeLog(supabase, sourceId);
  console.log(`[ingest] Scrape log created: ${logId}`);

  const errors: ScrapeError[] = [];
  const stats = { added: 0, updated: 0, skipped: 0, failed: 0 };

  try {
    // Step 3: Scrape
    const adapter = new PareapAdapter();
    const scrapedJobs = await adapter.scrape();

    if (scrapedJobs.length === 0) {
      console.warn("[ingest] No jobs scraped from PAREAP");
    }

    // Step 4: Query existing external_ids for this source to distinguish added vs updated.
    // NOTE: Supabase upsert does not report whether a row was inserted or updated.
    // We pre-fetch existing external_ids and compare after upsert to track stats.
    const existingIds = await getExistingExternalIds(supabase, sourceId);

    // Process in batches for partial failure resilience
    for (let i = 0; i < scrapedJobs.length; i += BATCH_SIZE) {
      const batch = scrapedJobs.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;

      try {
        await processBatch(supabase, batch, sourceId, existingIds, stats, errors);
      } catch (error) {
        const msg = `Batch ${batchNum} failed: ${(error as Error).message}`;
        console.error(`[ingest] ${msg}`);
        stats.failed += batch.length;
        errors.push({
          message: msg,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Step 5: Update source.last_scraped_at
    await supabase
      .from("sources")
      .update({ last_scraped_at: new Date().toISOString() })
      .eq("id", sourceId);

    // Step 6: Finalize scrape log
    const durationMs = Date.now() - startTime;
    const status =
      errors.length === 0
        ? "success"
        : stats.added + stats.updated > 0
          ? "partial_failure"
          : "failure";

    await updateScrapeLog(supabase, logId, {
      status,
      jobs_added: stats.added,
      jobs_updated: stats.updated,
      jobs_skipped: stats.skipped,
      jobs_failed: stats.failed,
      errors: errors.map((e) => ({
        message: e.message,
        category: e.category,
        page: e.page,
      })),
      duration_ms: durationMs,
    });

    const result: ScrapeResult = {
      jobs: scrapedJobs,
      errors,
      stats,
    };

    console.log(
      `PAREAP scrape complete: ${stats.added} added, ${stats.updated} updated, ${stats.skipped} skipped, ${stats.failed} failed`
    );

    return result;
  } catch (error) {
    // Catastrophic failure -- still update the log
    const durationMs = Date.now() - startTime;
    await updateScrapeLog(supabase, logId, {
      status: "failure",
      jobs_failed: stats.failed,
      errors: [
        ...errors.map((e) => ({ message: e.message })),
        { message: (error as Error).message },
      ],
      duration_ms: durationMs,
    });
    throw error;
  }
}

/**
 * Fetch all existing external_ids for a given source.
 * Used to distinguish new inserts from updates after upsert.
 */
async function getExistingExternalIds(
  supabase: SupabaseClient,
  sourceId: string
): Promise<Set<string>> {
  const ids = new Set<string>();
  let page = 0;
  const pageSize = 1000;

  // Paginate through all existing jobs for this source
  while (true) {
    const { data, error } = await supabase
      .from("jobs")
      .select("external_id")
      .eq("source_id", sourceId)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error(
        `[ingest] Error fetching existing IDs: ${error.message}`
      );
      break;
    }

    if (!data || data.length === 0) break;

    for (const row of data) {
      if (row.external_id) ids.add(row.external_id);
    }

    if (data.length < pageSize) break;
    page++;
  }

  console.log(`[ingest] Found ${ids.size} existing jobs for source`);
  return ids;
}

/**
 * Process a batch of scraped jobs: match schools, upsert jobs, upsert job_sources.
 */
async function processBatch(
  supabase: SupabaseClient,
  batch: ScrapedJob[],
  sourceId: string,
  existingIds: Set<string>,
  stats: { added: number; updated: number; skipped: number; failed: number },
  errors: ScrapeError[]
): Promise<void> {
  for (const job of batch) {
    try {
      // Match or create school
      const schoolId = await findOrCreateSchool(
        supabase,
        job.schoolName,
        job.city,
        job.state,
        job.zipCode,
        job.schoolType
      );

      // Build job record for upsert
      const jobRecord = {
        source_id: sourceId,
        external_id: job.externalId,
        school_id: schoolId,
        title: job.title,
        description: job.description || null,
        url: job.url,
        location_raw: job.locationRaw,
        city: job.city || null,
        state: job.state || "PA",
        zip_code: job.zipCode || null,
        school_type: job.schoolType || null,
        subject_area: job.subjectArea ? [job.subjectArea] : null,
        certifications: job.certificates || null,
        is_active: true,
        last_verified_at: new Date().toISOString(),
        // NOTE: location (geography) is NOT set here -- geocoding deferred to Phase 4
      };

      // Upsert job
      const { data: upsertedJob, error: jobError } = await supabase
        .from("jobs")
        .upsert(jobRecord, { onConflict: "source_id,external_id" })
        .select("id")
        .single();

      if (jobError) {
        throw new Error(
          `Job upsert failed for ${job.externalId}: ${jobError.message}`
        );
      }

      // Track added vs updated
      if (existingIds.has(job.externalId)) {
        stats.updated++;
      } else {
        stats.added++;
        existingIds.add(job.externalId); // Track for within-run dedup
      }

      // Upsert job_sources for source attribution
      const { error: jsError } = await supabase
        .from("job_sources")
        .upsert(
          {
            job_id: upsertedJob.id,
            source_id: sourceId,
            external_id: job.externalId,
            external_url: job.url,
            last_verified_at: new Date().toISOString(),
          },
          { onConflict: "job_id,source_id" }
        );

      if (jsError) {
        console.error(
          `[ingest] job_sources upsert warning for ${job.externalId}: ${jsError.message}`
        );
      }
    } catch (error) {
      stats.failed++;
      errors.push({
        message: `Job ${job.externalId} failed: ${(error as Error).message}`,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
