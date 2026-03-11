import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock logger before importing check-freshness
vi.mock("../../scripts/scrapers/lib/logger", () => ({
  createScrapeLog: vi.fn().mockResolvedValue("mock-log-id"),
  updateScrapeLog: vi.fn().mockResolvedValue(undefined),
}));

// Mock ai-analyzer
vi.mock("../../scripts/scrapers/freshness/ai-analyzer", () => ({
  isAIAvailable: vi.fn().mockReturnValue(false),
  analyzeWithHaiku: vi.fn(),
}));

import { processJobs } from "../../scripts/scrapers/freshness/check-freshness";
import { createScrapeLog, updateScrapeLog } from "../../scripts/scrapers/lib/logger";

// Helper to build a mock Supabase client
function createMockSupabase(jobs: Array<{ id: string; title: string; url: string; source_id: string }>) {
  const updateCalls: Array<{ id: string; data: Record<string, unknown> }> = [];
  const deleteCalls: Array<string> = [];

  const mockClient = {
    from: vi.fn((table: string) => {
      if (table === "jobs") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: jobs, error: null }),
          }),
          update: vi.fn((data: Record<string, unknown>) => ({
            eq: vi.fn((col: string, val: string) => {
              updateCalls.push({ id: val, data });
              return Promise.resolve({ error: null });
            }),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn((col: string, val: string) => {
              deleteCalls.push(val);
              return Promise.resolve({ error: null });
            }),
          })),
        };
      }
      if (table === "job_sources") {
        return {
          upsert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "freshness-source-id" },
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    }),
    _updateCalls: updateCalls,
    _deleteCalls: deleteCalls,
  };

  return mockClient;
}

describe("processJobs", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("soft-deletes a job with 404 URL", async () => {
    const jobs = [
      { id: "job-1", title: "Teacher", url: "https://example.com/job/1", source_id: "src-1" },
    ];
    const supabase = createMockSupabase(jobs);

    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 404,
      ok: false,
    });

    await processJobs(jobs, supabase as any, { maxAICalls: 0 });

    expect(supabase._updateCalls).toContainEqual(
      expect.objectContaining({
        id: "job-1",
        data: expect.objectContaining({ is_active: false }),
      })
    );
  });

  it("soft-deletes a job with 410 URL", async () => {
    const jobs = [
      { id: "job-1", title: "Principal", url: "https://example.com/job/2", source_id: "src-1" },
    ];
    const supabase = createMockSupabase(jobs);

    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 410,
      ok: false,
    });

    await processJobs(jobs, supabase as any, { maxAICalls: 0 });

    expect(supabase._updateCalls).toContainEqual(
      expect.objectContaining({
        id: "job-1",
        data: expect.objectContaining({ is_active: false }),
      })
    );
  });

  it("soft-deletes a job with closed heuristic content", async () => {
    const jobs = [
      { id: "job-2", title: "Counselor", url: "https://example.com/job/3", source_id: "src-1" },
    ];
    const supabase = createMockSupabase(jobs);

    // HEAD returns 200, then content fetch returns closed content
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ status: 200, ok: true }) // HEAD
      .mockResolvedValueOnce({ // GET for content
        status: 200,
        ok: true,
        text: async () => "<html><body>This position has been filled. Thank you for your interest.</body></html>",
      });

    await processJobs(jobs, supabase as any, { maxAICalls: 0 });

    expect(supabase._updateCalls).toContainEqual(
      expect.objectContaining({
        id: "job-2",
        data: expect.objectContaining({ is_active: false }),
      })
    );
  });

  it("does NOT update a job with active heuristic content", async () => {
    const jobs = [
      { id: "job-3", title: "Teacher", url: "https://example.com/job/4", source_id: "src-1" },
    ];
    const supabase = createMockSupabase(jobs);

    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ status: 200, ok: true }) // HEAD
      .mockResolvedValueOnce({ // GET for content
        status: 200,
        ok: true,
        text: async () => "<html><body>Apply now for this exciting opportunity! Submit your application today.</body></html>",
      });

    await processJobs(jobs, supabase as any, { maxAICalls: 0 });

    expect(supabase._updateCalls).toHaveLength(0);
  });

  it("soft-deletes a job with URL timeout", async () => {
    const jobs = [
      { id: "job-4", title: "Nurse", url: "https://example.com/job/5", source_id: "src-1" },
    ];
    const supabase = createMockSupabase(jobs);

    globalThis.fetch = vi.fn().mockRejectedValue(new Error("timeout"));

    await processJobs(jobs, supabase as any, { maxAICalls: 0 });

    expect(supabase._updateCalls).toContainEqual(
      expect.objectContaining({
        id: "job-4",
        data: expect.objectContaining({ is_active: false }),
      })
    );
  });

  it("never hard-deletes jobs (no DELETE calls)", async () => {
    const jobs = [
      { id: "job-5", title: "Admin", url: "https://example.com/job/6", source_id: "src-1" },
    ];
    const supabase = createMockSupabase(jobs);

    globalThis.fetch = vi.fn().mockResolvedValue({ status: 404, ok: false });

    await processJobs(jobs, supabase as any, { maxAICalls: 0 });

    expect(supabase._deleteCalls).toHaveLength(0);
  });

  it("respects AI call cap", async () => {
    // Create 5 jobs that will all be ambiguous
    const jobs = Array.from({ length: 5 }, (_, i) => ({
      id: `job-${i}`,
      title: `Job ${i}`,
      url: `https://example${i}.com/job`,
      source_id: "src-1",
    }));
    const supabase = createMockSupabase(jobs);

    // HEAD returns 200, content is ambiguous
    globalThis.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        status: 200,
        ok: true,
        text: async () => "<html><body>Some generic text about a teaching position.</body></html>",
      })
    );

    // With maxAICalls=0, no AI calls should be made and ambiguous jobs left alone
    await processJobs(jobs, supabase as any, { maxAICalls: 0 });

    // Ambiguous jobs with no AI should NOT be soft-deleted
    expect(supabase._updateCalls).toHaveLength(0);
  });
});

// Need to import afterEach
import { afterEach } from "vitest";
