/**
 * HTML parser for TeachingJobsInPA listing page.
 * Extracts job rows from the single-page HTML table (#myTable).
 */
import * as cheerio from "cheerio";
import type { TeachingJobsInPARow } from "./types";

/**
 * Parse the TeachingJobsInPA listing page HTML.
 * Table structure: #myTable with rows containing [school, subject, title+link].
 * First row (header) is skipped.
 */
export function parseTeachingJobsInPAListing(
  html: string
): TeachingJobsInPARow[] {
  if (!html || html.trim() === "") return [];

  const $ = cheerio.load(html);
  const rows: TeachingJobsInPARow[] = [];

  const tableRows = $("#myTable tr");
  if (tableRows.length === 0) return [];

  // Skip first row (header)
  tableRows.slice(1).each((_i, tr) => {
    const cells = $(tr).find("td");
    if (cells.length < 3) return; // skip malformed rows

    const school = $(cells[0]).text().trim();
    const subject = $(cells[1]).text().trim();
    const titleCell = $(cells[2]);
    const anchor = titleCell.find("a");
    const title = anchor.length > 0 ? anchor.text().trim() : titleCell.text().trim();
    const applyUrl = anchor.length > 0 ? (anchor.attr("href") || "") : "";

    if (!title) return; // skip empty rows

    rows.push({ school, subject, title, applyUrl });
  });

  return rows;
}
