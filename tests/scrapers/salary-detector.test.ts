import { describe, it, expect } from "vitest";
import { detectSalary } from "../../scripts/scrapers/lib/enrichment/salary-detector";

describe("detectSalary", () => {
  it("detects a plain salary amount", () => {
    const result = detectSalary("$45,000");
    expect(result.mentioned).toBe(true);
    expect(result.raw).toBe("$45,000");
  });

  it("detects hourly rate", () => {
    const result = detectSalary("$25/hr");
    expect(result.mentioned).toBe(true);
    expect(result.raw).toBe("$25/hr");
  });

  it("detects k-suffix range", () => {
    const result = detectSalary("$50k-$70k");
    expect(result.mentioned).toBe(true);
    expect(result.raw).toBe("$50k-$70k");
  });

  it("detects full salary range", () => {
    const result = detectSalary("$45,000 - $65,000");
    expect(result.mentioned).toBe(true);
    expect(result.raw).toBe("$45,000 - $65,000");
  });

  it("detects decimal hourly rate with /hour", () => {
    const result = detectSalary("$25.50/hour");
    expect(result.mentioned).toBe(true);
    expect(result.raw).toBe("$25.50/hour");
  });

  it("detects annual salary with /year", () => {
    const result = detectSalary("$80,000/year");
    expect(result.mentioned).toBe(true);
    expect(result.raw).toBe("$80,000/year");
  });

  it("rejects vague 'competitive salary'", () => {
    const result = detectSalary("competitive salary");
    expect(result.mentioned).toBe(false);
    expect(result.raw).toBeNull();
  });

  it("rejects 'commensurate with experience'", () => {
    const result = detectSalary("commensurate with experience");
    expect(result.mentioned).toBe(false);
    expect(result.raw).toBeNull();
  });

  it("returns false for empty string", () => {
    const result = detectSalary("");
    expect(result.mentioned).toBe(false);
    expect(result.raw).toBeNull();
  });

  it("returns false for null", () => {
    const result = detectSalary(null);
    expect(result.mentioned).toBe(false);
    expect(result.raw).toBeNull();
  });

  it("returns false for undefined", () => {
    const result = detectSalary(undefined);
    expect(result.mentioned).toBe(false);
    expect(result.raw).toBeNull();
  });

  it("finds salary embedded in longer text", () => {
    const result = detectSalary(
      "The salary range is $45,000 - $65,000 annually"
    );
    expect(result.mentioned).toBe(true);
    expect(result.raw).toContain("$45,000");
  });

  it("takes the longest match when multiple dollar amounts exist", () => {
    const result = detectSalary(
      "Application fee $50. Salary: $45,000 - $65,000 per year."
    );
    expect(result.mentioned).toBe(true);
    // The range should be the longest match
    expect(result.raw!.length).toBeGreaterThan(6);
    expect(result.raw).toContain("$45,000");
  });
});
