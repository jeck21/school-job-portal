import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  parseListingPage,
  parseDetailPage,
  getTotalPages,
} from "../../scripts/scrapers/adapters/pareap/parser";
import {
  PAREAP_BASE_URL,
  PAREAP_CATEGORIES,
} from "../../scripts/scrapers/adapters/pareap/types";

const FIXTURES_DIR = join(__dirname, "fixtures");
const listingHtml = readFileSync(
  join(FIXTURES_DIR, "pareap-listing.html"),
  "utf-8"
);
const detailHtml = readFileSync(
  join(FIXTURES_DIR, "pareap-detail.html"),
  "utf-8"
);

describe("parseListingPage", () => {
  it("extracts job rows from fixture HTML", () => {
    const jobs = parseListingPage(listingHtml);
    expect(jobs.length).toBe(5);
  });

  it("extracts correct externalId from URL", () => {
    const jobs = parseListingPage(listingHtml);
    expect(jobs[0].externalId).toBe("87845");
    expect(jobs[1].externalId).toBe("87200");
    expect(jobs[2].externalId).toBe("86500");
  });

  it("extracts positionType from link text", () => {
    const jobs = parseListingPage(listingHtml);
    expect(jobs[0].positionType).toContain("Classroom Teacher");
    expect(jobs[0].positionType).toContain("Social Studies");
  });

  it("extracts jobTitle from link div", () => {
    const jobs = parseListingPage(listingHtml);
    expect(jobs[0].jobTitle).toBe(
      "Social Studies Middle School Teacher (26-27 School Year)"
    );
    expect(jobs[1].jobTitle).toBe("High School Math Teacher");
  });

  it("extracts schoolName from td.school", () => {
    const jobs = parseListingPage(listingHtml);
    expect(jobs[0].schoolName).toBe("String Theory Schools");
    expect(jobs[1].schoolName).toBe("Central Dauphin SD");
  });

  it("extracts location from td.school", () => {
    const jobs = parseListingPage(listingHtml);
    expect(jobs[0].location).toContain("Philadelphia, PA 19102");
    expect(jobs[3].location).toContain("Pittsburgh, PA");
  });

  it("extracts date from td.dateTD", () => {
    const jobs = parseListingPage(listingHtml);
    expect(jobs[0].date).toBe("Mar 10 26");
    expect(jobs[1].date).toBe("Mar 08 26");
  });

  it("extracts detailUrl from link href", () => {
    const jobs = parseListingPage(listingHtml);
    expect(jobs[0].detailUrl).toBe("/job_postings/87845/PA01/PA01");
  });

  it("returns empty array for HTML without #jobsrch table", () => {
    const jobs = parseListingPage("<html><body><p>No table here</p></body></html>");
    expect(jobs).toEqual([]);
  });

  it("handles missing fields gracefully (no crash)", () => {
    const html = `
      <table id="jobsrch"><tbody>
        <tr class="jobfirstrow">
          <td></td>
          <td><a href="/job_postings/99999/PA01/PA01">Some Position</a></td>
          <td class="school">Unknown School</td>
          <td class="dateTD"></td>
        </tr>
      </tbody></table>
    `;
    const jobs = parseListingPage(html);
    expect(jobs.length).toBe(1);
    expect(jobs[0].externalId).toBe("99999");
    expect(jobs[0].jobTitle).toBe(""); // No div inside link
  });
});

describe("parseDetailPage", () => {
  it("extracts Position field", () => {
    const fields = parseDetailPage(detailHtml);
    expect(fields["Position"]).toBe("Classroom Teacher / Social Studies");
  });

  it("extracts Subject Area", () => {
    const fields = parseDetailPage(detailHtml);
    expect(fields["Subject Area"]).toBe("Social Studies");
  });

  it("extracts Job Title", () => {
    const fields = parseDetailPage(detailHtml);
    expect(fields["Job Title"]).toBe(
      "Social Studies Middle School Teacher (26-27 School Year)"
    );
  });

  it("extracts Job Location", () => {
    const fields = parseDetailPage(detailHtml);
    expect(fields["Job Location"]).toBe("Philadelphia, PA");
  });

  it("extracts Deadline", () => {
    const fields = parseDetailPage(detailHtml);
    expect(fields["Deadline"]).toBe("April 30, 2026");
  });

  it("handles multiple certificates with pipe separation", () => {
    const fields = parseDetailPage(detailHtml);
    expect(fields["Certificates"]).toBe(
      "Middle School Social Studies 7-9|Middle School Citizenship 7-9"
    );
  });

  it("extracts District name", () => {
    const fields = parseDetailPage(detailHtml);
    expect(fields["District"]).toBe("String Theory Schools");
  });

  it("extracts City/State/Zip", () => {
    const fields = parseDetailPage(detailHtml);
    expect(fields["City/State/Zip"]).toBe("Philadelphia, PA 19102");
  });

  it("extracts description text", () => {
    const fields = parseDetailPage(detailHtml);
    expect(fields["Description"]).toContain("passionate Social Studies teacher");
    expect(fields["Description"]).toContain("valid PA teaching certificate");
  });
});

describe("getTotalPages", () => {
  it('extracts total page count from pagination "Last" link', () => {
    const pages = getTotalPages(listingHtml);
    expect(pages).toBe(8);
  });

  it("returns 1 when no pagination found", () => {
    const pages = getTotalPages("<html><body>No pagination</body></html>");
    expect(pages).toBe(1);
  });
});

describe("PAREAP constants", () => {
  it("has correct base URL", () => {
    expect(PAREAP_BASE_URL).toBe("https://www.pareap.net");
  });

  it("has 4 categories with correct srch values", () => {
    expect(PAREAP_CATEGORIES).toHaveLength(4);
    expect(PAREAP_CATEGORIES[0]).toEqual({ name: "Teaching", srch: "100" });
    expect(PAREAP_CATEGORIES[3]).toEqual({
      name: "Support Services",
      srch: "400",
    });
  });

  it("constructs correct category URLs", () => {
    const cat = PAREAP_CATEGORIES[0];
    const url = `${PAREAP_BASE_URL}/jobsrch.php?srch=${cat.srch}&position=&page=1`;
    expect(url).toBe(
      "https://www.pareap.net/jobsrch.php?srch=100&position=&page=1"
    );
  });
});
