import { describe, it, expect } from "vitest";
import { extractCertifications } from "../../scripts/scrapers/lib/enrichment/cert-extractor";

describe("extractCertifications", () => {
  it("extracts Special Education PK-8 from description", () => {
    const result = extractCertifications(
      "Must hold Special Education PK-8 certification"
    );
    expect(result).toContain("Special Education PK-8");
  });

  it("matches ESL/ESOL alias to canonical ESL Program Specialist", () => {
    const result = extractCertifications(
      "ESL or ESOL certification preferred"
    );
    expect(result).toContain("ESL Program Specialist");
  });

  it("extracts multiple certifications", () => {
    const result = extractCertifications(
      "Certified in Mathematics and Physics"
    );
    expect(result).toContain("Mathematics");
    expect(result).toContain("Physics");
  });

  it("matches Elementary Education alias to canonical name", () => {
    const result = extractCertifications(
      "Looking for an Elementary Education teacher"
    );
    expect(result).toContain("Elementary Education K-6");
  });

  it("skips short names like PE (matched via longer alias)", () => {
    // "PE" alone (< 4 chars) should not match
    const result = extractCertifications("Must have PE cert");
    expect(result).not.toContain("Health and Physical Education");
  });

  it("matches Physical Education (longer alias) to Health and Physical Education", () => {
    const result = extractCertifications(
      "Physical Education certification required"
    );
    expect(result).toContain("Health and Physical Education");
  });

  it("returns canonical PDE names, not aliases", () => {
    const result = extractCertifications("Math certification required");
    expect(result).toContain("Mathematics");
    expect(result).not.toContain("Math");
  });

  it("returns empty array for null", () => {
    expect(extractCertifications(null)).toEqual([]);
  });

  it("returns empty array for undefined", () => {
    expect(extractCertifications(undefined)).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(extractCertifications("")).toEqual([]);
  });

  it("does not match Science inside Computer Science", () => {
    // "General Science" has alias "Science 7-12" but the canonical name "General Science"
    // should NOT match when "Science" appears only inside "Computer Science"
    const result = extractCertifications("Computer Science program available");
    // Computer Science matches BCIT alias, that's fine
    // But General Science should NOT be in results
    expect(result).not.toContain("General Science");
  });

  it("matches General Science as standalone term", () => {
    const result = extractCertifications(
      "Must hold General Science certification"
    );
    expect(result).toContain("General Science");
  });

  it("does not produce duplicates", () => {
    const result = extractCertifications(
      "Special Education and SpEd PK-8 certification needed"
    );
    const specEdCount = result.filter(
      (c) => c === "Special Education PK-8"
    ).length;
    expect(specEdCount).toBeLessThanOrEqual(1);
  });
});
