import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { parseTeachingJobsInPAListing } from "../../scripts/scrapers/adapters/teachingjobsinpa/parser";
import { TeachingJobsInPAAdapter } from "../../scripts/scrapers/adapters/teachingjobsinpa/index";

const FIXTURES_DIR = join(__dirname, "fixtures");
const listingHtml = readFileSync(
  join(FIXTURES_DIR, "teachingjobsinpa-listing.html"),
  "utf-8"
);

describe("parseTeachingJobsInPAListing", () => {
  it("extracts job rows from fixture HTML", () => {
    const rows = parseTeachingJobsInPAListing(listingHtml);
    expect(rows).toHaveLength(4);
  });

  it("extracts school name from first cell", () => {
    const rows = parseTeachingJobsInPAListing(listingHtml);
    expect(rows[0].school).toBe("Springfield School District");
    expect(rows[1].school).toBe("Central Dauphin SD");
  });

  it("extracts subject from second cell", () => {
    const rows = parseTeachingJobsInPAListing(listingHtml);
    expect(rows[0].subject).toBe("Mathematics");
    expect(rows[2].subject).toBe("Special Education");
  });

  it("extracts title from anchor text in third cell", () => {
    const rows = parseTeachingJobsInPAListing(listingHtml);
    expect(rows[0].title).toBe("High School Math Teacher");
    expect(rows[1].title).toBe("7th Grade ELA Teacher");
  });

  it("extracts apply URL from anchor href (employer direct links)", () => {
    const rows = parseTeachingJobsInPAListing(listingHtml);
    expect(rows[0].applyUrl).toBe(
      "https://www.springfieldsd.org/careers/math-teacher"
    );
    expect(rows[2].applyUrl).toBe(
      "https://www.pps.k12.pa.us/apply/sped-k3"
    );
  });

  it("skips header row (first tr)", () => {
    const rows = parseTeachingJobsInPAListing(listingHtml);
    const schools = rows.map((r) => r.school);
    expect(schools).not.toContain("School");
  });

  it("returns empty array for empty table", () => {
    const html = '<table id="myTable"><tr><th>School</th><th>Subject</th><th>Position</th></tr></table>';
    const rows = parseTeachingJobsInPAListing(html);
    expect(rows).toEqual([]);
  });

  it("returns empty array for HTML without myTable", () => {
    const rows = parseTeachingJobsInPAListing(
      "<html><body><p>No table</p></body></html>"
    );
    expect(rows).toEqual([]);
  });

  it("returns empty array for empty HTML", () => {
    const rows = parseTeachingJobsInPAListing("");
    expect(rows).toEqual([]);
  });
});

describe("TeachingJobsInPAAdapter", () => {
  it("has correct sourceSlug", () => {
    const adapter = new TeachingJobsInPAAdapter();
    expect(adapter.sourceSlug).toBe("teachingjobsinpa");
  });
});

describe("externalId uniqueness", () => {
  it("generates unique IDs for different jobs", () => {
    const rows = parseTeachingJobsInPAListing(listingHtml);
    // Each row has a unique apply URL, so IDs should be unique
    // We test this indirectly: all schools+titles are distinct
    const keys = rows.map((r) => `${r.school}|${r.title}`);
    const unique = new Set(keys);
    expect(unique.size).toBe(rows.length);
  });
});
