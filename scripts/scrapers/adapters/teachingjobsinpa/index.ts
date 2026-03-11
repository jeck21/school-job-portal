/**
 * TeachingJobsInPA adapter implementing the SourceAdapter interface.
 * Fetches PA teaching job listings from a single HTML page.
 *
 * TeachingJobsInPA serves all jobs on one page -- no pagination needed.
 * Apply URLs point directly to employer application pages.
 */
import type { SourceAdapter, ScrapedJob } from "../../lib/types";
import { fetchWithRetry } from "../../lib/http-client";
import { parseTeachingJobsInPAListing } from "./parser";

const LISTING_URL = "https://www.teachingjobsinpa.com/jobsList";

/**
 * Generate a stable external ID from school name + title.
 * Uses a simple slugification approach for deterministic IDs.
 */
function generateExternalId(school: string, title: string): string {
  const combined = `${school}-${title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
  return combined;
}

export class TeachingJobsInPAAdapter implements SourceAdapter {
  readonly sourceSlug = "teachingjobsinpa";

  async scrape(): Promise<ScrapedJob[]> {
    const html = await fetchWithRetry(LISTING_URL);
    const rows = parseTeachingJobsInPAListing(html);

    console.log(
      `[teachingjobsinpa] Parsed ${rows.length} jobs from listing page`
    );

    const jobs: ScrapedJob[] = rows.map((row) => ({
      externalId: generateExternalId(row.school, row.title),
      title: row.title,
      url: row.applyUrl,
      locationRaw: "PA",
      state: "PA",
      schoolName: row.school,
      subjectArea: row.subject || undefined,
    }));

    console.log(
      `[teachingjobsinpa] Scrape complete: ${jobs.length} jobs collected`
    );
    return jobs;
  }
}
