/**
 * Cross-source job deduplication module.
 * Uses Dice coefficient (string-similarity) to identify duplicate jobs
 * across different sources based on fuzzy title + school name matching.
 */
import { compareTwoStrings } from "string-similarity";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Score at or above which two jobs are considered duplicates */
export const DEDUP_MATCH_THRESHOLD = 0.8;

/** Lower bound for borderline matches that should be logged for review */
export const DEDUP_REVIEW_LOW = 0.7;

/** Upper bound for borderline matches (above this is a clear match) */
export const DEDUP_REVIEW_HIGH = 0.85;

/**
 * Normalize text for dedup comparison:
 * lowercase, strip non-alphanumeric (except spaces), collapse whitespace, trim.
 */
export function normalizeForDedup(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Compute a weighted dedup similarity score between two jobs.
 * Uses Dice coefficient with title weighted at 0.6 and school at 0.4.
 */
export function computeDedupScore(
  titleA: string,
  schoolA: string,
  titleB: string,
  schoolB: string
): number {
  const titleScore = compareTwoStrings(
    normalizeForDedup(titleA),
    normalizeForDedup(titleB)
  );
  const schoolScore = compareTwoStrings(
    normalizeForDedup(schoolA),
    normalizeForDedup(schoolB)
  );

  return titleScore * 0.6 + schoolScore * 0.4;
}

/**
 * Search for a duplicate job in the database from other sources.
 * Returns the best match above DEDUP_REVIEW_LOW threshold, or null.
 *
 * @param supabase - Admin Supabase client
 * @param newJob - The new job to check for duplicates
 * @param excludeSourceId - Source ID to exclude (the current source being ingested)
 * @returns Best matching job ID and score, or null if no match above threshold
 */
export async function findDuplicate(
  supabase: SupabaseClient,
  newJob: { title: string; schoolName: string },
  excludeSourceId: string
): Promise<{ jobId: string; score: number } | null> {
  // Fetch active jobs from other sources with their school names
  const { data: existingJobs, error } = await supabase
    .from("jobs")
    .select("id, title, school_id, schools(name), source_id")
    .eq("is_active", true)
    .neq("source_id", excludeSourceId);

  if (error) {
    console.error(`[job-dedup] Error fetching existing jobs: ${error.message}`);
    return null;
  }

  if (!existingJobs || existingJobs.length === 0) return null;

  let bestMatch: { jobId: string; score: number } | null = null;

  for (const existing of existingJobs) {
    const schoolName =
      (existing.schools as unknown as { name: string } | null)?.name || "";
    const score = computeDedupScore(
      newJob.title,
      newJob.schoolName,
      existing.title,
      schoolName
    );

    if (score >= DEDUP_REVIEW_LOW && score > (bestMatch?.score ?? 0)) {
      bestMatch = { jobId: existing.id, score };
    }
  }

  if (bestMatch && bestMatch.score >= DEDUP_REVIEW_LOW && bestMatch.score < DEDUP_REVIEW_HIGH) {
    console.warn(
      `[job-dedup] Borderline match (${bestMatch.score.toFixed(2)}): "${newJob.title}" at "${newJob.schoolName}". Review recommended.`
    );
  }

  return bestMatch;
}
