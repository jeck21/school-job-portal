/**
 * PAeducator.net adapter implementing the SourceAdapter interface.
 * Fetches job listings via REST API (no HTML scraping needed).
 *
 * API endpoints:
 * - POST /api/search/jobs?allowAnonymous=true  body: {} -> array of job IDs
 * - GET  /api/job/{id}?allowAnonymous=true     -> full job detail JSON
 */
import type { SourceAdapter, ScrapedJob } from "../../lib/types";
import type {
  PAeducatorSearchResponse,
  PAeducatorJobDetail,
} from "./types";

const PAEDUCATOR_BASE_URL = "https://www.paeducator.net";
const SEARCH_URL = `${PAEDUCATOR_BASE_URL}/api/search/jobs?allowAnonymous=true`;
const JOB_DETAIL_URL = (id: number) =>
  `${PAEDUCATOR_BASE_URL}/api/job/${id}?allowAnonymous=true`;
const FALLBACK_JOB_URL = (id: number) =>
  `${PAEDUCATOR_BASE_URL}/Job/${id}`;

/** Polite delay between job detail requests (1.5 seconds) */
const REQUEST_DELAY_MS = 1500;

/** Progress logging interval */
const LOG_INTERVAL = 50;

const USER_AGENT = "PAEdJobs-Bot/1.0 (+https://school-job-portal.vercel.app)";

/**
 * Strip HTML tags from a string.
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Polite delay between requests.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class PAeducatorAdapter implements SourceAdapter {
  readonly sourceSlug = "paeducator";

  async scrape(): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];

    // Step 1: Get all job IDs via search endpoint
    const searchResponse = await fetch(SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
      body: "{}",
    });

    if (!searchResponse.ok) {
      throw new Error(
        `PAeducator search API failed: HTTP ${searchResponse.status}`
      );
    }

    const jobIds: PAeducatorSearchResponse = await searchResponse.json();
    console.log(`[paeducator] Found ${jobIds.length} job IDs from search API`);

    if (jobIds.length === 0) {
      return [];
    }

    // Step 2: Fetch individual job details
    for (let i = 0; i < jobIds.length; i++) {
      const jobId = jobIds[i];

      try {
        const detailResponse = await fetch(JOB_DETAIL_URL(jobId), {
          headers: { "User-Agent": USER_AGENT },
        });

        if (!detailResponse.ok) {
          console.error(
            `[paeducator] Failed to fetch job ${jobId}: HTTP ${detailResponse.status}`
          );
          continue;
        }

        const detail: PAeducatorJobDetail = await detailResponse.json();
        const scrapedJob = this.mapToScrapedJob(detail);
        jobs.push(scrapedJob);
      } catch (error) {
        console.error(
          `[paeducator] Error fetching job ${jobId}: ${(error as Error).message}`
        );
      }

      // Log progress every LOG_INTERVAL jobs
      if ((i + 1) % LOG_INTERVAL === 0) {
        console.log(`[paeducator] Progress: ${i + 1}/${jobIds.length} jobs fetched`);
      }

      // Polite delay between requests (skip on last request)
      if (i < jobIds.length - 1) {
        await delay(REQUEST_DELAY_MS);
      }
    }

    console.log(
      `[paeducator] Scrape complete: ${jobs.length} jobs from ${jobIds.length} IDs`
    );
    return jobs;
  }

  /**
   * Map a PAeducator API job detail to the shared ScrapedJob format.
   */
  private mapToScrapedJob(detail: PAeducatorJobDetail): ScrapedJob {
    const org = detail.organization;

    // Use employer's direct URL when available, fallback to PAeducator job page
    const url = org.url && org.url.trim() !== ""
      ? org.url
      : FALLBACK_JOB_URL(detail.id);

    return {
      externalId: String(detail.id),
      title: detail.jobTitle,
      url,
      locationRaw: `${org.city}, PA ${org.zip}`,
      city: org.city,
      state: "PA",
      zipCode: org.zip,
      schoolName: org.name,
      description: detail.description ? stripHtml(detail.description) : undefined,
      certificates: detail.certifications.map((c) => c.name),
      deadline: detail.applicationDeadlineDate,
      postedDate: detail.postedDttm,
    };
  }
}
