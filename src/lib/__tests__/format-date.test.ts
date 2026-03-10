import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatRelativeDate,
  formatAbsoluteDate,
  formatDateDisplay,
} from "@/lib/format-date";

describe("formatRelativeDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-10T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Today" for the same day', () => {
    expect(formatRelativeDate("2026-03-10T08:00:00Z")).toBe("Today");
  });

  it('returns "1 day ago" for yesterday', () => {
    expect(formatRelativeDate("2026-03-09T12:00:00Z")).toBe("1 day ago");
  });

  it('returns "3 days ago" for 3 days back', () => {
    expect(formatRelativeDate("2026-03-07T12:00:00Z")).toBe("3 days ago");
  });

  it('returns "1 week ago" for 7 days back', () => {
    expect(formatRelativeDate("2026-03-03T12:00:00Z")).toBe("1 week ago");
  });

  it('returns "2 weeks ago" for 14 days back', () => {
    expect(formatRelativeDate("2026-02-24T12:00:00Z")).toBe("2 weeks ago");
  });

  it('returns "1 month ago" for 30 days back', () => {
    expect(formatRelativeDate("2026-02-08T12:00:00Z")).toBe("1 month ago");
  });

  it('returns "3 months ago" for 90 days back', () => {
    expect(formatRelativeDate("2025-12-10T12:00:00Z")).toBe("3 months ago");
  });

  it("accepts a Date object", () => {
    expect(formatRelativeDate(new Date("2026-03-10T08:00:00Z"))).toBe("Today");
  });
});

describe("formatAbsoluteDate", () => {
  it('formats as "Mon D, YYYY"', () => {
    expect(formatAbsoluteDate("2026-03-05T12:00:00Z")).toBe("Mar 5, 2026");
  });

  it("handles different months", () => {
    expect(formatAbsoluteDate("2025-12-25T00:00:00Z")).toBe("Dec 25, 2025");
  });

  it("accepts a Date object", () => {
    expect(formatAbsoluteDate(new Date("2026-01-15T00:00:00Z"))).toBe(
      "Jan 15, 2026"
    );
  });
});

describe("formatDateDisplay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-10T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("combines relative and absolute formats", () => {
    expect(formatDateDisplay("2026-03-08T12:00:00Z")).toBe(
      "2 days ago (Mar 8, 2026)"
    );
  });

  it('uses "Today" for same day', () => {
    expect(formatDateDisplay("2026-03-10T08:00:00Z")).toBe(
      "Today (Mar 10, 2026)"
    );
  });
});
