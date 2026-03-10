/**
 * PAREAP HTML parser for listing and detail pages.
 * Uses cheerio for DOM traversal of server-rendered HTML.
 */
import * as cheerio from "cheerio";
import type { PareapListingRow } from "./types";

/**
 * Parse a PAREAP listing page into structured job rows.
 * Returns empty array if the expected #jobsrch table is missing.
 */
export function parseListingPage(html: string): PareapListingRow[] {
  const $ = cheerio.load(html);
  const table = $("#jobsrch");

  if (table.length === 0) {
    console.warn(
      "[pareap-parser] #jobsrch table not found -- HTML structure may have changed"
    );
    return [];
  }

  const jobs: PareapListingRow[] = [];

  table.find("tbody tr.jobfirstrow").each((_, row) => {
    const $row = $(row);
    const link = $row.find("td:nth-child(2) a");
    const href = link.attr("href") || "";
    const idMatch = href.match(/\/job_postings\/(\d+)\//);

    // Extract position type: direct text content of the <a>, excluding child elements
    const positionType = link
      .contents()
      .filter(function () {
        return this.type === "text";
      })
      .text()
      .trim();

    // Extract job title from the div inside the link
    const jobTitle = link.find("div").text().trim();

    // Extract certificate from span
    const certificate = $row
      .find("td:nth-child(2) span")
      .text()
      .replace("Certificate:", "")
      .trim();

    // Extract school name: first line of td.school text content
    const schoolTd = $row.find("td.school");
    const schoolFullText = schoolTd.text().trim();
    // School name is the first line; location info follows on subsequent lines
    const schoolName = schoolFullText.split("\n")[0].trim();

    // Full text of the school td for location
    const location = schoolTd.text().replace(/\s+/g, " ").trim();

    const date = $row.find("td.dateTD").text().trim();

    jobs.push({
      externalId: idMatch ? idMatch[1] : "",
      positionType,
      jobTitle,
      certificate,
      schoolName,
      location,
      date,
      detailUrl: href,
    });
  });

  return jobs;
}

/**
 * Parse a PAREAP detail page into key-value pairs.
 * Handles multiple Certificate rows by pipe-concatenating them.
 */
export function parseDetailPage(html: string): Record<string, string> {
  const $ = cheerio.load(html);
  const fields: Record<string, string> = {};

  $("table.jobpostingtable tr").each((_, row) => {
    const label = $(row).find("td.td_label").text().trim().replace(":", "");
    const value = $(row).find("td:nth-child(2)").text().trim();

    if (label && value) {
      // Handle multiple Certificate rows by pipe-concatenating
      if (label === "Certificate" && fields["Certificate"]) {
        fields["Certificates"] =
          (fields["Certificates"] || fields["Certificate"]) + "|" + value;
      } else {
        fields[label] = value;
      }
    }
  });

  // Parse job description from jobdescription/joblisting_div sections
  const description = $(
    "div.jobdescription p, div.jobdescription div:not(table div), #joblisting_div p, #joblisting_div div:not(table div)"
  )
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean)
    .join(" ");

  if (description) {
    fields["Description"] = description;
  }

  return fields;
}

/**
 * Extract total page count from pagination "Last" link.
 * Returns 1 if no pagination found.
 */
export function getTotalPages(html: string): number {
  const $ = cheerio.load(html);

  // Find the "Last" pagination link
  const lastLink = $(".pagination a")
    .filter(function () {
      return $(this).text().trim() === "Last";
    })
    .first();

  if (lastLink.length === 0) return 1;

  const href = lastLink.attr("href") || "";
  const pageMatch = href.match(/page=(\d+)/);

  return pageMatch ? parseInt(pageMatch[1], 10) : 1;
}
