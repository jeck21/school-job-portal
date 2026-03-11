import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import type { PAeducatorJobDetail } from "../../scripts/scrapers/adapters/paeducator/types";
import { PAeducatorAdapter } from "../../scripts/scrapers/adapters/paeducator/index";

const FIXTURES_DIR = join(__dirname, "fixtures");
const sampleJob: PAeducatorJobDetail = JSON.parse(
  readFileSync(join(FIXTURES_DIR, "paeducator-job.json"), "utf-8")
);

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe("PAeducatorAdapter", () => {
  it("has correct sourceSlug", () => {
    const adapter = new PAeducatorAdapter();
    expect(adapter.sourceSlug).toBe("paeducator");
  });

  it("maps PAeducatorJobDetail to ScrapedJob correctly", async () => {
    // Mock search endpoint returning one job ID
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [12345],
    });
    // Mock job detail endpoint
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleJob,
    });

    const adapter = new PAeducatorAdapter();
    const jobs = await adapter.scrape();

    expect(jobs).toHaveLength(1);
    const job = jobs[0];
    expect(job.externalId).toBe("12345");
    expect(job.title).toBe("Elementary Teacher - 3rd Grade");
    expect(job.schoolName).toBe("Springfield School District");
    expect(job.city).toBe("Springfield");
    expect(job.state).toBe("PA");
    expect(job.zipCode).toBe("19064");
    expect(job.locationRaw).toBe("Springfield, PA 19064");
    expect(job.deadline).toBe("2026-04-15T00:00:00");
    expect(job.postedDate).toBe("2026-03-01T00:00:00");
  });

  it("uses organization.url as job URL when available", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [12345],
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleJob,
    });

    const adapter = new PAeducatorAdapter();
    const jobs = await adapter.scrape();

    expect(jobs[0].url).toBe("https://www.springfieldsd.org/employment");
  });

  it("falls back to paeducator.net URL when organization.url is empty", async () => {
    const jobNoUrl = {
      ...sampleJob,
      organization: { ...sampleJob.organization, url: "" },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [12345],
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => jobNoUrl,
    });

    const adapter = new PAeducatorAdapter();
    const jobs = await adapter.scrape();

    expect(jobs[0].url).toBe("https://www.paeducator.net/Job/12345");
  });

  it("maps certifications array to string names", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [12345],
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleJob,
    });

    const adapter = new PAeducatorAdapter();
    const jobs = await adapter.scrape();

    expect(jobs[0].certificates).toEqual([
      "Elementary K-6",
      "General Science K-8",
    ]);
  });

  it("strips HTML tags from description", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [12345],
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleJob,
    });

    const adapter = new PAeducatorAdapter();
    const jobs = await adapter.scrape();

    expect(jobs[0].description).not.toContain("<p>");
    expect(jobs[0].description).not.toContain("<strong>");
    expect(jobs[0].description).not.toContain("<ul>");
    expect(jobs[0].description).toContain("3rd Grade Elementary Teacher");
  });

  it("returns empty array for empty API response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const adapter = new PAeducatorAdapter();
    const jobs = await adapter.scrape();

    expect(jobs).toEqual([]);
  });

  it("handles jobs with no certifications", async () => {
    const jobNoCerts = { ...sampleJob, certifications: [] };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [12345],
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => jobNoCerts,
    });

    const adapter = new PAeducatorAdapter();
    const jobs = await adapter.scrape();

    expect(jobs[0].certificates).toEqual([]);
  });

  it("skips individual job on fetch failure without crashing", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [111, 222],
    });
    // First job fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });
    // Second job succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...sampleJob, id: 222 }),
    });

    const adapter = new PAeducatorAdapter();
    const jobs = await adapter.scrape();

    expect(jobs).toHaveLength(1);
    expect(jobs[0].externalId).toBe("222");
  });
});
