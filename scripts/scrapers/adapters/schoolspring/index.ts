/**
 * SchoolSpring adapter implementing the SourceAdapter interface.
 * Fetches PA teaching job listings via HTML scraping with pagination.
 *
 * SchoolSpring serves server-rendered HTML tables. Pagination uses POST
 * with form data: pageNumber={N}&ssPageNumber={N}.
 */
import type { SourceAdapter, ScrapedJob } from "../../lib/types";
import { fetchWithRetry, delay } from "../../lib/http-client";
import { parseSchoolSpringListing } from "./parser";

const LISTING_URL =
  "https://employer.schoolspring.com/find/pennsylvania_teaching_jobs_in_pennsylvania.cfm";

/** Safety cap to prevent infinite pagination */
const MAX_PAGES = 50;

/** Polite delay between page requests (1 second) */
const PAGE_DELAY_MS = 1000;

/** Progress logging interval */
const LOG_INTERVAL = 5;

/**
 * Parse a date string like "Mar 11" into an ISO date string for the current year.
 * Returns undefined if parsing fails.
 */
function parseDateString(dateStr: string): string | undefined {
  if (!dateStr) return undefined;

  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };

  const parts = dateStr.trim().split(/\s+/);
  if (parts.length < 2) return undefined;

  const monthNum = months[parts[0]];
  const day = parseInt(parts[1], 10);

  if (monthNum === undefined || isNaN(day)) return undefined;

  const year = new Date().getFullYear();
  const date = new Date(year, monthNum, day);
  return date.toISOString().split("T")[0];
}

/**
 * Extract job ID from a SchoolSpring detail URL.
 * Examples:
 *   /jobs/details.cfm?jdid=12345 -> "12345"
 *   /jobs/12345 -> "12345"
 */
function extractJobId(detailUrl: string): string {
  // Try query parameter first
  const jdidMatch = detailUrl.match(/jdid=(\d+)/);
  if (jdidMatch) return jdidMatch[1];

  // Try last numeric path segment
  const pathMatch = detailUrl.match(/\/(\d+)(?:\?|$|\/)/);
  if (pathMatch) return pathMatch[1];

  // Fallback: use URL hash
  return detailUrl.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32);
}

/**
 * Parse city from a location string like "Philadelphia, Pennsylvania".
 */
function parseCity(location: string): string | undefined {
  if (!location) return undefined;
  const parts = location.split(",");
  return parts.length > 0 ? parts[0].trim() : undefined;
}

export class SchoolSpringAdapter implements SourceAdapter {
  readonly sourceSlug = "schoolspring";

  async scrape(): Promise<ScrapedJob[]> {
    const allJobs: ScrapedJob[] = [];

    for (let page = 0; page < MAX_PAGES; page++) {
      try {
        // POST with form data for pagination
        const body = `pageNumber=${page}&ssPageNumber=${page}`;
        const response = await fetch(LISTING_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "PAEdJobs-Bot/1.0 (+https://school-job-portal.vercel.app)",
          },
          body,
        });

        if (!response.ok) {
          console.error(
            `[schoolspring] Page ${page} failed: HTTP ${response.status}`
          );
          break;
        }

        const html = await response.text();
        const rows = parseSchoolSpringListing(html);

        if (rows.length === 0) {
          console.log(`[schoolspring] Page ${page}: no results, stopping pagination`);
          break;
        }

        // Map rows to ScrapedJob
        for (const row of rows) {
          const externalId = extractJobId(row.detailUrl);
          const fullUrl = row.detailUrl.startsWith("http")
            ? row.detailUrl
            : `https://employer.schoolspring.com${row.detailUrl}`;

          allJobs.push({
            externalId,
            title: row.title,
            url: fullUrl,
            locationRaw: row.location,
            city: parseCity(row.location),
            state: "PA",
            schoolName: row.school,
            postedDate: parseDateString(row.date),
          });
        }

        // Log progress every LOG_INTERVAL pages
        if ((page + 1) % LOG_INTERVAL === 0) {
          console.log(
            `[schoolspring] Progress: page ${page + 1}, ${allJobs.length} jobs so far`
          );
        }

        // Polite delay between page requests
        if (page < MAX_PAGES - 1) {
          await delay(PAGE_DELAY_MS);
        }
      } catch (error) {
        console.error(
          `[schoolspring] Error on page ${page}: ${(error as Error).message}`
        );
        break;
      }
    }

    console.log(
      `[schoolspring] Scrape complete: ${allJobs.length} jobs collected`
    );
    return allJobs;
  }
}
