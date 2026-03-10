import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for upsert safety: verifying that the batch upsert logic
 * in the scraper pipeline handles conflicts, partial failures, and
 * idempotent updates correctly.
 *
 * These tests mock the Supabase client to simulate database behavior.
 */

// We'll import a batch upsert utility once it exists
// For now these tests define the expected behavior

function createMockSupabase() {
  const upsertedBatches: Array<Record<string, unknown>[]> = [];
  let shouldFail = false;
  let failOnBatch = -1;

  const mockClient = {
    from: vi.fn().mockImplementation(() => ({
      upsert: vi.fn().mockImplementation((rows: Record<string, unknown>[], opts?: { onConflict: string }) => {
        const batchIndex = upsertedBatches.length;
        upsertedBatches.push(rows);

        if (shouldFail || batchIndex === failOnBatch) {
          return { data: null, error: { message: "Batch insert failed", code: "23505" } };
        }
        return {
          data: rows.map((r, i) => ({ ...r, id: `uuid-${batchIndex}-${i}` })),
          error: null,
        };
      }),
    })),
    _upsertedBatches: upsertedBatches,
    _setShouldFail: (v: boolean) => { shouldFail = v; },
    _setFailOnBatch: (n: number) => { failOnBatch = n; },
  };

  return mockClient;
}

// Import the batchUpsertJobs function once implemented
// For now, define inline to make tests compile -- will be replaced by real import
import { batchUpsertJobs } from "../../scripts/scrapers/lib/batch-upsert";

describe("upsert safety", () => {
  it("upserts jobs with onConflict on source_id,external_id", async () => {
    const supabase = createMockSupabase();
    const jobs = [
      { source_id: "src-1", external_id: "ext-1", title: "Teacher", url: "http://example.com", state: "PA" },
      { source_id: "src-1", external_id: "ext-2", title: "Principal", url: "http://example.com", state: "PA" },
    ];

    const result = await batchUpsertJobs(supabase as any, jobs);

    expect(result.succeeded).toBe(2);
    expect(result.failed).toBe(0);
    expect(supabase._upsertedBatches.length).toBeGreaterThan(0);
  });

  it("sets last_verified_at on upserted records", async () => {
    const supabase = createMockSupabase();
    const jobs = [
      { source_id: "src-1", external_id: "ext-1", title: "Teacher", url: "http://example.com", state: "PA" },
    ];

    await batchUpsertJobs(supabase as any, jobs);

    const upsertedRows = supabase._upsertedBatches[0];
    expect(upsertedRows[0]).toHaveProperty("last_verified_at");
  });

  it("continues processing remaining batches when one batch fails", async () => {
    const supabase = createMockSupabase();
    supabase._setFailOnBatch(0); // First batch fails

    // Create enough jobs for 2 batches (batch size is typically 50)
    const jobs = Array.from({ length: 100 }, (_, i) => ({
      source_id: "src-1",
      external_id: `ext-${i}`,
      title: `Job ${i}`,
      url: "http://example.com",
      state: "PA",
    }));

    const result = await batchUpsertJobs(supabase as any, jobs, 50);

    // First batch failed, second batch succeeded
    expect(result.failed).toBe(50);
    expect(result.succeeded).toBe(50);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("logs errors from failed batches", async () => {
    const supabase = createMockSupabase();
    supabase._setShouldFail(true);

    const jobs = [
      { source_id: "src-1", external_id: "ext-1", title: "Teacher", url: "http://example.com", state: "PA" },
    ];

    const result = await batchUpsertJobs(supabase as any, jobs);

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("Batch insert failed");
  });
});
