import { describe, it, expect } from "vitest";
import {
  normalizeForDedup,
  computeDedupScore,
  DEDUP_MATCH_THRESHOLD,
  DEDUP_REVIEW_LOW,
  DEDUP_REVIEW_HIGH,
} from "../../scripts/scrapers/lib/job-dedup";

describe("normalizeForDedup", () => {
  it("lowercases text", () => {
    expect(normalizeForDedup("Math Teacher")).toBe("math teacher");
  });

  it("strips non-alphanumeric characters except spaces", () => {
    expect(normalizeForDedup("  Math Teacher (K-4)  ")).toBe(
      "math teacher k4"
    );
  });

  it("collapses multiple spaces", () => {
    expect(normalizeForDedup("Math   Teacher   Grade  5")).toBe(
      "math teacher grade 5"
    );
  });

  it("handles empty string", () => {
    expect(normalizeForDedup("")).toBe("");
  });

  it("strips special characters like commas and periods", () => {
    expect(normalizeForDedup("Sr. Math Teacher, Grades 9-12")).toBe(
      "sr math teacher grades 912"
    );
  });
});

describe("computeDedupScore", () => {
  it("returns high score for exact match (title + school)", () => {
    const score = computeDedupScore(
      "Math Teacher",
      "Springfield SD",
      "Math Teacher",
      "Springfield SD"
    );
    expect(score).toBe(1.0);
  });

  it("returns high score for semantically matching school names", () => {
    const score = computeDedupScore(
      "Math Teacher",
      "Springfield SD",
      "Math Teacher",
      "Springfield School District"
    );
    expect(score).toBeGreaterThanOrEqual(0.8);
  });

  it("returns low score for different titles", () => {
    const score = computeDedupScore(
      "Math Teacher",
      "Springfield SD",
      "Science Teacher",
      "Springfield SD"
    );
    expect(score).toBeLessThan(0.8);
  });

  it("returns low score for different schools", () => {
    const score = computeDedupScore(
      "Math Teacher",
      "Springfield SD",
      "Math Teacher",
      "Harrisburg SD"
    );
    expect(score).toBeLessThan(0.8);
  });

  it("weights title at 0.6 and school at 0.4", () => {
    // Exact title match (1.0 * 0.6 = 0.6), zero school match (0 * 0.4 = 0)
    const score = computeDedupScore(
      "Math Teacher",
      "AAAAA",
      "Math Teacher",
      "ZZZZZ"
    );
    // Title contributes 0.6, school contributes ~0
    expect(score).toBeGreaterThan(0.5);
    expect(score).toBeLessThan(0.7);
  });

  it("returns 0 for completely different inputs", () => {
    const score = computeDedupScore("AAAA", "BBBB", "XXXX", "YYYY");
    expect(score).toBe(0);
  });
});

describe("dedup thresholds", () => {
  it("has correct threshold constants", () => {
    expect(DEDUP_MATCH_THRESHOLD).toBe(0.8);
    expect(DEDUP_REVIEW_LOW).toBe(0.7);
    expect(DEDUP_REVIEW_HIGH).toBe(0.85);
  });

  it("identifies borderline scores (0.7-0.85 range)", () => {
    // Similar but not identical title, same school
    const score = computeDedupScore(
      "Math Teacher",
      "Springfield SD",
      "Mathematics Teacher",
      "Springfield SD"
    );
    // Should be in the borderline review range
    expect(score).toBeGreaterThanOrEqual(DEDUP_REVIEW_LOW);
  });

  it("distinguishes match from non-match at 0.8 boundary", () => {
    // Exact match should be above threshold
    const exactScore = computeDedupScore(
      "Math Teacher",
      "Springfield SD",
      "Math Teacher",
      "Springfield SD"
    );
    expect(exactScore).toBeGreaterThanOrEqual(DEDUP_MATCH_THRESHOLD);

    // Different title and school should be below threshold
    const differentScore = computeDedupScore(
      "Math Teacher",
      "Springfield SD",
      "Art Teacher",
      "Harrisburg SD"
    );
    expect(differentScore).toBeLessThan(DEDUP_MATCH_THRESHOLD);
  });
});
