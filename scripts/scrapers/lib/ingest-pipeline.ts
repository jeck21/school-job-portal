/**
 * Shared ingestion pipeline for all source adapters.
 * Extracts the common pattern from ingestPareap into a reusable function:
 * ensureSource -> createScrapeLog -> adapter.scrape() -> processBatch (with dedup) -> updateScrapeLog
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScrapeResult, ScrapeError, ScrapedJob, SourceAdapter } from "./types";
import { createAdminClient } from "./supabase-admin";
import { createScrapeLog, updateScrapeLog } from "./logger";
import { findOrCreateSchool } from "./school-matcher";
import {
  findDuplicate,
  DEDUP_MATCH_THRESHOLD,
  DEDUP_REVIEW_LOW,
  DEDUP_REVIEW_HIGH,
} from "./job-dedup";
import { detectSalary } from "./enrichment/salary-detector";
import { extractCertifications } from "./enrichment/cert-extractor";

const BATCH_SIZE = 25;

export interface SourceConfig {
  name: string;
  slug: string;
  baseUrl: string;
  scraperType: string;
}

/**
 * Ensure a source record exists in the sources table.
 * Uses upsert on slug to avoid duplicates. Returns the source UUID.
 */
async function ensureSource(
  supabase: SupabaseClient,
  config: SourceConfig
): Promise<string> {
  const { data, error } = await supabase
    .from("sources")
    .upsert(
      {
        name: config.name,
        slug: config.slug,
        base_url: config.baseUrl,
        scraper_type: config.scraperType,
        is_active: true,
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to seed ${config.name} source: ${error.message}`);
  }

  console.log(`[ingest] ${config.name} source: ${data.id}`);
  return data.id;
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

  while (true) {
    const { data, error } = await supabase
      .from("jobs")
      .select("external_id")
      .eq("source_id", sourceId)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error(`[ingest] Error fetching existing IDs: ${error.message}`);
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
 * Process a batch of scraped jobs: match schools, dedup, upsert jobs, upsert job_sources.
 * When a dedup match is found (score >= 0.8), links to the existing job via job_sources
 * instead of creating a new job. If the new version has a longer description, updates
 * the existing job record (most complete version as canonical).
 */
async function processBatch(
  supabase: SupabaseClient,
  batch: ScrapedJob[],
  sourceId: string,
  existingIds: Set<string>,
  stats: { added: number; updated: number; skipped: number; failed: number; deduplicated: number },
  errors: ScrapeError[]
): Promise<void> {
  for (const job of batch) {
    try {
      // Check for cross-source duplicate before inserting
      const dupResult = await findDuplicate(
        supabase,
        { title: job.title, schoolName: job.schoolName },
        sourceId
      );

      if (dupResult && dupResult.score >= DEDUP_MATCH_THRESHOLD) {
        // Dedup match found -- link to existing job via job_sources
        console.log(
          `[ingest] Dedup match (${dupResult.score.toFixed(2)}): "${job.title}" -> existing job ${dupResult.jobId}`
        );

        // Update existing job if new version has a longer description (most complete wins)
        if (job.description) {
          const { data: existingJob } = await supabase
            .from("jobs")
            .select("description, salary_mentioned, certifications")
            .eq("id", dupResult.jobId)
            .single();

          if (
            existingJob &&
            (!existingJob.description ||
              job.description.length > (existingJob.description?.length ?? 0))
          ) {
            // Enrich the longer description with salary/cert data
            const salaryResult = detectSalary(job.description);
            const enrichedCerts =
              job.certificates && job.certificates.length > 0
                ? job.certificates
                : extractCertifications(job.description);

            await supabase
              .from("jobs")
              .update({
                description: job.description,
                salary_mentioned: salaryResult.mentioned,
                salary_raw: salaryResult.raw,
                certifications:
                  enrichedCerts.length > 0 ? enrichedCerts : null,
                last_verified_at: new Date().toISOString(),
              })
              .eq("id", dupResult.jobId);
          } else if (
            existingJob &&
            (!existingJob.salary_mentioned ||
              !existingJob.certifications ||
              existingJob.certifications.length === 0)
          ) {
            // Even without a longer description, enrich if missing salary/cert data
            const updates: Record<string, unknown> = {};
            if (!existingJob.salary_mentioned) {
              const salaryResult = detectSalary(job.description);
              if (salaryResult.mentioned) {
                updates.salary_mentioned = salaryResult.mentioned;
                updates.salary_raw = salaryResult.raw;
              }
            }
            if (
              !existingJob.certifications ||
              existingJob.certifications.length === 0
            ) {
              const certs =
                job.certificates && job.certificates.length > 0
                  ? job.certificates
                  : extractCertifications(job.description);
              if (certs.length > 0) {
                updates.certifications = certs;
              }
            }
            if (Object.keys(updates).length > 0) {
              await supabase
                .from("jobs")
                .update(updates)
                .eq("id", dupResult.jobId);
            }
          }
        }

        // Upsert job_sources for cross-source attribution (with dedup score for audit)
        const { error: jsError } = await supabase
          .from("job_sources")
          .upsert(
            {
              job_id: dupResult.jobId,
              source_id: sourceId,
              external_id: job.externalId,
              external_url: job.url,
              dedup_score: Math.round(dupResult.score * 100) / 100,
              last_verified_at: new Date().toISOString(),
            },
            { onConflict: "job_id,source_id" }
          );

        if (jsError) {
          console.error(
            `[ingest] job_sources upsert warning for dedup ${job.externalId}: ${jsError.message}`
          );
        }

        stats.deduplicated++;
        continue;
      }

      // Log borderline matches for review (score 0.7-0.85)
      if (
        dupResult &&
        dupResult.score >= DEDUP_REVIEW_LOW &&
        dupResult.score < DEDUP_MATCH_THRESHOLD
      ) {
        console.warn(
          `[ingest] Borderline dedup (${dupResult.score.toFixed(2)}): "${job.title}" at "${job.schoolName}" ~ job ${dupResult.jobId}. Manual review recommended.`
        );
      }

      // Match or create school
      const schoolId = await findOrCreateSchool(
        supabase,
        job.schoolName,
        job.city,
        job.state,
        job.zipCode,
        job.schoolType
      );

      // Enrichment: salary detection
      const salaryResult = detectSalary(job.description);

      // Enrichment: cert extraction (adapter certs take priority per user decision)
      const enrichedCerts =
        job.certificates && job.certificates.length > 0
          ? job.certificates
          : extractCertifications(job.description);

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
        certifications: enrichedCerts.length > 0 ? enrichedCerts : null,
        salary_mentioned: salaryResult.mentioned,
        salary_raw: salaryResult.raw,
        is_active: true,
        last_verified_at: new Date().toISOString(),
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
        existingIds.add(job.externalId);
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

/**
 * Run the full ingestion pipeline for any source adapter:
 * 1. Seed/find source record
 * 2. Create scrape log
 * 3. Scrape via adapter
 * 4. For each job: dedup check, school match, upsert job, upsert job_sources
 * 5. Update source.last_scraped_at
 * 6. Finalize scrape log
 */
export async function runIngestion(
  adapter: SourceAdapter,
  sourceConfig: SourceConfig
): Promise<ScrapeResult> {
  const startTime = Date.now();
  const supabase = createAdminClient();

  // Step 1: Ensure source exists
  const sourceId = await ensureSource(supabase, sourceConfig);

  // Step 2: Create scrape log
  const logId = await createScrapeLog(supabase, sourceId);
  console.log(`[ingest] Scrape log created: ${logId}`);

  const errors: ScrapeError[] = [];
  const stats = { added: 0, updated: 0, skipped: 0, failed: 0, deduplicated: 0 };

  try {
    // Step 3: Scrape
    const scrapedJobs = await adapter.scrape();

    if (scrapedJobs.length === 0) {
      console.warn(`[ingest] No jobs scraped from ${sourceConfig.name}`);
    }

    // Step 4: Query existing external_ids for stats tracking
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
      `${sourceConfig.name} scrape complete: ${stats.added} added, ${stats.updated} updated, ${stats.deduplicated} deduplicated, ${stats.skipped} skipped, ${stats.failed} failed`
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
