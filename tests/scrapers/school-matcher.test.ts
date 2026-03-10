import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  normalizeSchoolName,
  findOrCreateSchool,
} from "../../scripts/scrapers/lib/school-matcher";

// Mock Supabase client
function createMockSupabase(existingSchools: Array<{ id: string; name: string; city?: string; state?: string }> = []) {
  const insertedRows: Array<Record<string, unknown>> = [];

  const mockClient = {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          data: existingSchools,
          error: null,
        }),
      }),
      insert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
        const newRow = { id: "new-uuid-123", ...row };
        insertedRows.push(newRow);
        return {
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockReturnValue({
              data: newRow,
              error: null,
            }),
          }),
        };
      }),
    }),
    _insertedRows: insertedRows,
  };

  return mockClient;
}

describe("normalizeSchoolName", () => {
  it('strips "School District" suffix', () => {
    const result = normalizeSchoolName("Spring-Ford Area School District");
    expect(result).not.toContain("school district");
    expect(result).toContain("spring");
    expect(result).toContain("ford");
  });

  it('strips "SD" abbreviation', () => {
    const result = normalizeSchoolName("Central Dauphin SD");
    expect(result).not.toMatch(/\bsd\b/);
    expect(result).toContain("central dauphin");
  });

  it("lowercases and normalizes whitespace", () => {
    const result = normalizeSchoolName("  Some  School  District  ");
    expect(result).toBe(result.trim());
    expect(result).toBe(result.toLowerCase());
  });

  it("normalizes similar names to matchable forms", () => {
    const a = normalizeSchoolName("Spring-Ford Area School District");
    const b = normalizeSchoolName("Spring Ford Area SD");
    // After normalization, these should be very similar
    expect(a).toBe(b);
  });
});

describe("findOrCreateSchool", () => {
  it("returns existing school ID when match found above threshold", async () => {
    const supabase = createMockSupabase([
      { id: "existing-uuid", name: "Spring-Ford Area School District", state: "PA" },
    ]);

    const id = await findOrCreateSchool(
      supabase as any,
      "Spring Ford Area SD",
      undefined,
      "PA"
    );

    expect(id).toBe("existing-uuid");
  });

  it("creates new school record when no match found", async () => {
    const supabase = createMockSupabase([]);

    const id = await findOrCreateSchool(
      supabase as any,
      "Brand New Academy",
      "Philadelphia",
      "PA",
      "19102",
      "charter"
    );

    expect(id).toBe("new-uuid-123");
  });
});
