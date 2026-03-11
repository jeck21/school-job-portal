/**
 * Freshness validation orchestrator.
 *
 * Pipeline:
 *   1. HEAD check all active job URLs (dead URL -> soft-delete)
 *   2. Content analysis for alive URLs (heuristic closed -> soft-delete)
 *   3. AI fallback for ambiguous cases (Haiku closed + high confidence -> soft-delete)
 *
 * Jobs are never hard-deleted. Results are logged to scrape_logs.
 */
import * as cheerio from "cheerio";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "../lib/supabase-admin";
import { createScrapeLog, updateScrapeLog } from "../lib/logger";
import { checkClosedHeuristics } from "./heuristics";
import { isAIAvailable, analyzeWithHaiku } from "./ai-analyzer";
import { delay } from "../lib/http-client";

const USER_AGENT = "PAEdJobs-Bot/1.0 (+https://school-job-portal.vercel.app)";

/** Domains that need TLS verification disabled */
const TLS_SKIP_DOMAINS = ["pareap.pa.gov", "www.pareap.pa.gov"];

interface JobRow {
  id: string;
  title: string;
  url: string;
  source_id: string;
  salary_mentioned?: boolean;
  certifications?: string[] | null;
}

interface ProcessOptions {
  maxAICalls?: number;
  politeDelayMs?: number;
  maxConcurrent?: number;
}

interface FreshnessStats {
  total_checked: number;
  broken_url: number;
  content_closed: number;
  ai_closed: number;
  ai_calls: number;
  still_active: number;
  ambiguous_skipped: number;
}

/**
 * Check if a URL is alive via HEAD request.
 * Returns 'dead' for 404/410/timeout, 'alive' for 200/3xx.
 */
async function checkUrlHealth(
  url: string
): Promise<"alive" | "dead"> {
  try {
    const isPareap = TLS_SKIP_DOMAINS.some((d) => url.includes(d));
    const fetchOptions: RequestInit = {
      method: "HEAD",
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(10_000),
    };

    // For PAREAP, we need to handle TLS differently
    // Node's fetch respects NODE_TLS_REJECT_UNAUTHORIZED at process level
    // We scope it per-request via a temporary override
    let prevTLS: string | undefined;
    if (isPareap) {
      prevTLS = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    }

    try {
      const response = await fetch(url, fetchOptions);
      if (response.status === 404 || response.status === 410) return "dead";
      if (response.ok || response.status === 301 || response.status === 302)
        return "alive";
      // 5xx or unexpected -- treat as alive to avoid false soft-deletes
      return "alive";
    } finally {
      if (isPareap) {
        if (prevTLS === undefined) {
          delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        } else {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = prevTLS;
        }
      }
    }
  } catch {
    // Timeout or network error -- treat as dead
    return "dead";
  }
}

/**
 * Fetch full page content and extract text.
 */
async function fetchPageText(url: string): Promise<string> {
  const isPareap = TLS_SKIP_DOMAINS.some((d) => url.includes(d));

  let prevTLS: string | undefined;
  if (isPareap) {
    prevTLS = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(15_000),
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    return $.text();
  } finally {
    if (isPareap) {
      if (prevTLS === undefined) {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      } else {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = prevTLS;
      }
    }
  }
}

/**
 * Soft-delete a job by setting is_active = false.
 */
async function softDeleteJob(
  supabase: SupabaseClient,
  jobId: string
): Promise<void> {
  await supabase.from("jobs").update({ is_active: false }).eq("id", jobId);
}

/**
 * Extract domain from URL for polite delay grouping.
 */
function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "unknown";
  }
}

/**
 * Process a batch of jobs through the freshness pipeline.
 * Exported for unit testing with mocked dependencies.
 */
export async function processJobs(
  jobs: JobRow[],
  supabase: SupabaseClient,
  options: ProcessOptions = {}
): Promise<FreshnessStats> {
  const { maxAICalls = 100, politeDelayMs = 1500 } = options;

  const stats: FreshnessStats = {
    total_checked: jobs.length,
    broken_url: 0,
    content_closed: 0,
    ai_closed: 0,
    ai_calls: 0,
    still_active: 0,
    ambiguous_skipped: 0,
  };

  // Track last request time per domain for polite delays
  const domainLastRequest = new Map<string, number>();

  // Step 1 & 2: Process each job sequentially with domain-based delays
  const ambiguousQueue: JobRow[] = [];

  for (const job of jobs) {
    const domain = getDomain(job.url);

    // Polite delay: wait if we recently hit this domain
    const lastReq = domainLastRequest.get(domain);
    if (lastReq) {
      const elapsed = Date.now() - lastReq;
      if (elapsed < politeDelayMs) {
        await delay(politeDelayMs - elapsed);
      }
    }

    // Step 1: HEAD check
    domainLastRequest.set(domain, Date.now());
    const health = await checkUrlHealth(job.url);

    if (health === "dead") {
      await softDeleteJob(supabase, job.id);
      stats.broken_url++;
      continue;
    }

    // Step 2: Content analysis
    try {
      domainLastRequest.set(domain, Date.now());
      const pageText = await fetchPageText(job.url);
      const heuristic = checkClosedHeuristics(pageText);

      if (heuristic === "closed") {
        await softDeleteJob(supabase, job.id);
        stats.content_closed++;
      } else if (heuristic === "active") {
        stats.still_active++;
      } else {
        // Ambiguous -- queue for AI
        ambiguousQueue.push(job);
      }
    } catch {
      // Content fetch failed -- treat as dead
      await softDeleteJob(supabase, job.id);
      stats.broken_url++;
    }
  }

  // Step 3: AI fallback for ambiguous cases
  let aiCallCount = 0;
  const aiAvailable = isAIAvailable();

  for (const job of ambiguousQueue) {
    if (!aiAvailable || aiCallCount >= maxAICalls) {
      stats.ambiguous_skipped++;
      stats.still_active++; // Don't soft-delete ambiguous jobs without AI confirmation
      continue;
    }

    try {
      const domain = getDomain(job.url);
      const lastReq = domainLastRequest.get(domain);
      if (lastReq) {
        const elapsed = Date.now() - lastReq;
        if (elapsed < politeDelayMs) {
          await delay(politeDelayMs - elapsed);
        }
      }

      domainLastRequest.set(domain, Date.now());
      const pageText = await fetchPageText(job.url);
      const result = await analyzeWithHaiku(pageText, job.title);
      aiCallCount++;
      stats.ai_calls++;

      if (result.status === "closed" && result.confidence >= 0.7) {
        await softDeleteJob(supabase, job.id);
        stats.ai_closed++;
      } else {
        // AI says active or low confidence -- keep the job
        stats.still_active++;

        // Backfill salary/cert data if AI found it and job is missing it
        const updates: Record<string, unknown> = {};
        if (result.salary_raw && !job.salary_mentioned) {
          updates.salary_mentioned = true;
          updates.salary_raw = result.salary_raw;
        }
        if (
          result.certifications &&
          result.certifications.length > 0 &&
          (!job.certifications || job.certifications.length === 0)
        ) {
          updates.certifications = result.certifications;
        }
        if (Object.keys(updates).length > 0) {
          await supabase.from("jobs").update(updates).eq("id", job.id);
        }
      }
    } catch (err) {
      console.warn(
        `[freshness] AI analysis failed for job ${job.id}: ${(err as Error).message}`
      );
      stats.ambiguous_skipped++;
      stats.still_active++;
    }
  }

  return stats;
}

/**
 * Main freshness check entry point.
 * Queries all active jobs and runs the full pipeline.
 */
export async function runFreshnessCheck(): Promise<void> {
  const startTime = Date.now();
  const supabase = createAdminClient();

  console.log("[freshness] Starting freshness check...");

  // Upsert the "freshness-checker" source for logging
  const { data: sourceData, error: sourceError } = await supabase
    .from("job_sources")
    .upsert(
      {
        slug: "freshness-checker",
        name: "Freshness Checker",
        base_url: "internal",
        scrape_type: "utility",
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (sourceError) {
    throw new Error(
      `Failed to upsert freshness source: ${sourceError.message}`
    );
  }

  const sourceId = sourceData.id;
  const logId = await createScrapeLog(supabase, sourceId);

  // Query all active jobs
  const { data: jobs, error: queryError } = await supabase
    .from("jobs")
    .select("id, title, url, source_id, salary_mentioned, certifications")
    .eq("is_active", true);

  if (queryError) {
    await updateScrapeLog(supabase, logId, {
      status: "failure",
      errors: [{ message: `Query failed: ${queryError.message}` }],
      duration_ms: Date.now() - startTime,
    });
    throw new Error(`Failed to query active jobs: ${queryError.message}`);
  }

  if (!jobs || jobs.length === 0) {
    console.log("[freshness] No active jobs to check.");
    await updateScrapeLog(supabase, logId, {
      status: "success",
      jobs_updated: 0,
      jobs_failed: 0,
      duration_ms: Date.now() - startTime,
    });
    return;
  }

  console.log(`[freshness] Checking ${jobs.length} active jobs...`);

  try {
    const stats = await processJobs(jobs, supabase);

    const duration = Date.now() - startTime;

    await updateScrapeLog(supabase, logId, {
      status: "success",
      jobs_updated: stats.still_active,
      jobs_failed: stats.broken_url + stats.content_closed + stats.ai_closed,
      duration_ms: duration,
    });

    console.log("[freshness] Complete:", {
      ...stats,
      duration_ms: duration,
    });
  } catch (err) {
    await updateScrapeLog(supabase, logId, {
      status: "failure",
      errors: [{ message: (err as Error).message }],
      duration_ms: Date.now() - startTime,
    });
    throw err;
  }
}
