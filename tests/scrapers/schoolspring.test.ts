import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { parseSchoolSpringListing } from "../../scripts/scrapers/adapters/schoolspring/parser";
import { SchoolSpringAdapter } from "../../scripts/scrapers/adapters/schoolspring/index";

const FIXTURES_DIR = join(__dirname, "fixtures");
const listingHtml = readFileSync(
  join(FIXTURES_DIR, "schoolspring-listing.html"),
  "utf-8"
);

describe("parseSchoolSpringListing", () => {
  it("extracts job rows from fixture HTML", () => {
    const rows = parseSchoolSpringListing(listingHtml);
    expect(rows).toHaveLength(4);
  });

  it("extracts title from anchor text", () => {
    const rows = parseSchoolSpringListing(listingHtml);
    expect(rows[0].title).toBe("3rd Grade Teacher");
    expect(rows[1].title).toBe("High School Math Teacher");
  });

  it("extracts detail URL from anchor href", () => {
    const rows = parseSchoolSpringListing(listingHtml);
    expect(rows[0].detailUrl).toBe("/jobs/details.cfm?jdid=12345");
  });

  it("extracts school name", () => {
    const rows = parseSchoolSpringListing(listingHtml);
    expect(rows[0].school).toBe("Springfield Elementary");
    expect(rows[2].school).toBe("Harrisburg School District");
  });

  it("extracts location", () => {
    const rows = parseSchoolSpringListing(listingHtml);
    expect(rows[0].location).toBe("Philadelphia, Pennsylvania");
    expect(rows[1].location).toBe("Pittsburgh, Pennsylvania");
  });

  it("extracts date string", () => {
    const rows = parseSchoolSpringListing(listingHtml);
    expect(rows[0].date).toBe("Mar 11");
    expect(rows[1].date).toBe("Mar 10");
  });

  it("skips header row (no cellData TDs)", () => {
    const rows = parseSchoolSpringListing(listingHtml);
    // Fixture has a header row with <th> elements - should be skipped
    // Should have 4 data rows total
    const titles = rows.map((r) => r.title);
    expect(titles).not.toContain("Position");
  });

  it("returns empty array for empty HTML", () => {
    const rows = parseSchoolSpringListing("");
    expect(rows).toEqual([]);
  });

  it("returns empty array for HTML without table", () => {
    const rows = parseSchoolSpringListing("<html><body><p>No table</p></body></html>");
    expect(rows).toEqual([]);
  });

  it("skips rows with fewer than 4 cellData cells", () => {
    const html = `
      <table>
        <tr>
          <TD class="cellData">Mar 11</TD>
          <TD class="cellData">Only two cells</TD>
        </tr>
        <tr>
          <TD class="cellData">Mar 10</TD>
          <TD class="cellData"><a href="/jobs/details.cfm?jdid=99999">Valid Job</a></TD>
          <TD class="cellData">School</TD>
          <TD class="cellData">Location, PA</TD>
        </tr>
      </table>
    `;
    const rows = parseSchoolSpringListing(html);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Valid Job");
  });
});

describe("SchoolSpringAdapter", () => {
  it("has correct sourceSlug", () => {
    const adapter = new SchoolSpringAdapter();
    expect(adapter.sourceSlug).toBe("schoolspring");
  });
});

describe("date parsing", () => {
  it("extracts job ID from detail URL with jdid query parameter", () => {
    const rows = parseSchoolSpringListing(listingHtml);
    // The adapter uses jdid from URL: /jobs/details.cfm?jdid=12345
    expect(rows[0].detailUrl).toContain("jdid=12345");
  });
});
