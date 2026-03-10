/**
 * PAREAP adapter implementing the SourceAdapter interface.
 * Scrapes job listings from https://www.pareap.net across all categories.
 */
import type { SourceAdapter, ScrapedJob, ScrapeError } from "../../lib/types";
import { fetchWithRetry, delay } from "../../lib/http-client";
import { parseLocation, normalizeSchoolType } from "../../lib/normalizer";
import { parseListingPage, parseDetailPage, getTotalPages } from "./parser";
import {
  PAREAP_BASE_URL,
  PAREAP_CATEGORIES,
  type PareapListingRow,
} from "./types";

/** Days threshold for expired-page detection */
const EXPIRED_DAYS_THRESHOLD = 90;

/** Delay between requests in ms (polite scraping) */
const REQUEST_DELAY_MS = 2000;

export class PareapAdapter implements SourceAdapter {
  readonly sourceSlug = "pareap";

  async scrape(): Promise<ScrapedJob[]> {
    const allJobs: ScrapedJob[] = [];
    const errors: ScrapeError[] = [];

    for (const category of PAREAP_CATEGORIES) {
      try {
        const categoryJobs = await this.scrapeCategory(category.srch, category.name, errors);
        allJobs.push(...categoryJobs);
      } catch (error) {
        errors.push({
          message: `Failed to scrape category ${category.name}: ${(error as Error).message}`,
          category: category.name,
          timestamp: new Date().toISOString(),
        });
      }
    }

    console.log(
      `[pareap] Scrape complete: ${allJobs.length} jobs from ${PAREAP_CATEGORIES.length} categories, ${errors.length} errors`
    );
    return allJobs;
  }

  private async scrapeCategory(
    srch: string,
    categoryName: string,
    errors: ScrapeError[]
  ): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];

    // Fetch first page to determine total pages
    const firstPageUrl = `${PAREAP_BASE_URL}/jobsrch.php?srch=${srch}&position=&page=1`;
    const firstPageHtml = await fetchWithRetry(firstPageUrl);
    const totalPages = getTotalPages(firstPageHtml);

    console.log(
      `[pareap] Category ${categoryName} (srch=${srch}): ${totalPages} pages`
    );

    // Parse first page
    const firstPageRows = parseListingPage(firstPageHtml);
    if (this.isExpiredPage(firstPageRows)) {
      console.log(
        `[pareap] Category ${categoryName} page 1 appears expired, skipping`
      );
      return jobs;
    }
    jobs.push(...this.convertRows(firstPageRows, categoryName, errors));

    // Fetch remaining pages
    for (let page = 2; page <= totalPages; page++) {
      await delay(REQUEST_DELAY_MS);

      try {
        const pageUrl = `${PAREAP_BASE_URL}/jobsrch.php?srch=${srch}&position=&page=${page}`;
        const pageHtml = await fetchWithRetry(pageUrl);
        const rows = parseListingPage(pageHtml);

        // Expired-page detection: stop category if all jobs are old
        if (this.isExpiredPage(rows)) {
          console.log(
            `[pareap] Category ${categoryName} page ${page} appears expired, stopping early`
          );
          break;
        }

        jobs.push(...this.convertRows(rows, categoryName, errors));
      } catch (error) {
        errors.push({
          message: `Page ${page} of ${categoryName} failed: ${(error as Error).message}`,
          category: categoryName,
          page,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return jobs;
  }

  /**
   * Convert PAREAP listing rows to ScrapedJob records,
   * optionally enriching with detail page data.
   */
  private convertRows(
    rows: PareapListingRow[],
    categoryName: string,
    errors: ScrapeError[]
  ): ScrapedJob[] {
    return rows
      .filter((row) => row.externalId)
      .map((row) => {
        const location = parseLocation(row.location);

        return {
          externalId: row.externalId,
          title: row.jobTitle || row.positionType,
          url: `${PAREAP_BASE_URL}${row.detailUrl}`,
          locationRaw: row.location,
          city: location.city,
          state: location.state || "PA",
          zipCode: location.zipCode,
          schoolName: row.schoolName,
          schoolType: normalizeSchoolType(row.schoolName) || undefined,
          positionType: row.positionType,
          certificates: row.certificate
            ? row.certificate.split("|").map((c) => c.trim())
            : undefined,
          postedDate: row.date,
        };
      });
  }

  /**
   * Detect if a page contains only expired postings.
   * Uses a simple heuristic: if all job dates are older than the threshold,
   * consider the page expired.
   */
  private isExpiredPage(rows: PareapListingRow[]): boolean {
    if (rows.length === 0) return false;

    const now = Date.now();
    const thresholdMs = EXPIRED_DAYS_THRESHOLD * 24 * 60 * 60 * 1000;

    const allExpired = rows.every((row) => {
      if (!row.date) return false;
      const parsed = this.parsePareapDate(row.date);
      if (!parsed) return false;
      return now - parsed.getTime() > thresholdMs;
    });

    return allExpired;
  }

  /**
   * Parse PAREAP date format: "Mar 10 26" -> Date
   * Assumes 2-digit year is 20XX.
   */
  private parsePareapDate(dateStr: string): Date | null {
    const months: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
    };

    const parts = dateStr.trim().split(/\s+/);
    if (parts.length !== 3) return null;

    const month = months[parts[0]];
    const day = parseInt(parts[1], 10);
    const year = 2000 + parseInt(parts[2], 10);

    if (month === undefined || isNaN(day) || isNaN(year)) return null;

    return new Date(year, month, day);
  }
}
