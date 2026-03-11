/**
 * HTML parser for SchoolSpring listing pages.
 * Extracts job rows from server-rendered HTML table.
 */
import * as cheerio from "cheerio";
import type { SchoolSpringListingRow } from "./types";

/**
 * Parse a SchoolSpring listing page HTML and extract job rows.
 * Each valid row has 4+ <TD class="cellData"> cells:
 *   [0] = date, [1] = title + link, [2] = school, [3] = location
 * Rows with fewer than 4 cellData TDs are skipped (header rows, empty rows).
 */
export function parseSchoolSpringListing(
  html: string
): SchoolSpringListingRow[] {
  if (!html || html.trim() === "") return [];

  const $ = cheerio.load(html);
  const rows: SchoolSpringListingRow[] = [];

  $("tr").each((_i, tr) => {
    const cells = $(tr).find("td.cellData");
    if (cells.length < 4) return; // skip header/incomplete rows

    const date = $(cells[0]).text().trim();
    const titleCell = $(cells[1]);
    const anchor = titleCell.find("a");
    const title = anchor.length > 0 ? anchor.text().trim() : titleCell.text().trim();
    const detailUrl = anchor.length > 0 ? (anchor.attr("href") || "") : "";
    const school = $(cells[2]).text().trim();
    const location = $(cells[3]).text().trim();

    rows.push({ date, title, detailUrl, school, location });
  });

  return rows;
}
