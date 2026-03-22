import { describe, it, expect, vi, beforeEach } from "vitest";

// Track RPC and query calls
let rpcCalledWith: { fn: string; params: Record<string, unknown> } | null = null;
let fromCalledWith: string | null = null;
let eqCalledWith: { column: string; value: unknown } | null = null;

const mockSingle = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockRpc = vi.fn();

const mockRpcData = [
  {
    id: "test-id-1",
    title: "Math Teacher",
    description: "Teaching math",
    location_raw: "Philadelphia, PA",
    city: "Philadelphia",
    school_type: "public",
    grade_band: ["high"],
    subject_area: ["math"],
    salary_mentioned: true,
    certifications: ["instructional"],
    first_seen_at: "2026-01-01T00:00:00Z",
    last_verified_at: "2026-01-15T00:00:00Z",
    url: "https://example.com/job/1",
    zip_code: "19101",
    school_name: "Central High",
    district_name: "Philadelphia SD",
    total_count: 1,
  },
];

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (...args: unknown[]) => mockFrom(...args),
  })),
}));

import { searchJobs } from "@/lib/queries/search-jobs";

describe("searchJobs", () => {
  beforeEach(() => {
    rpcCalledWith = null;
    fromCalledWith = null;
    eqCalledWith = null;
    mockRpc.mockReset();
    mockFrom.mockReset();
    mockSelect.mockReset();
    mockEq.mockReset();
    mockSingle.mockReset();

    // Default chain: from -> select -> eq -> single
    mockSingle.mockResolvedValue({
      data: { latitude: 39.9526, longitude: -75.1652 },
      error: null,
    });

    mockEq.mockImplementation((column: string, value: unknown) => {
      eqCalledWith = { column, value };
      return { single: mockSingle };
    });

    mockSelect.mockImplementation(() => {
      return { eq: mockEq };
    });

    mockFrom.mockImplementation((table: string) => {
      fromCalledWith = table;
      return { select: mockSelect };
    });

    mockRpc.mockImplementation((fn: string, params: Record<string, unknown>) => {
      rpcCalledWith = { fn, params };
      return Promise.resolve({ data: mockRpcData, error: null });
    });
  });

  describe("keyword", () => {
    it("passes search_term to RPC for keyword filtering", async () => {
      await searchJobs({ q: "math teacher" });
      expect(rpcCalledWith?.fn).toBe("search_jobs");
      expect(rpcCalledWith?.params.search_term).toBe("math teacher");
    });

    it("passes null search_term when no keyword", async () => {
      await searchJobs({});
      expect(rpcCalledWith?.params.search_term).toBeNull();
    });

    it("passes null search_term for empty string", async () => {
      await searchJobs({ q: "" });
      expect(rpcCalledWith?.params.search_term).toBeNull();
    });

    it("keyword searches title, school name, location (not description) via RPC", async () => {
      // The RPC function handles the actual ILIKE filtering
      // We verify the correct param is passed to the RPC
      await searchJobs({ q: "Philadelphia" });
      expect(rpcCalledWith?.params.search_term).toBe("Philadelphia");
    });
  });

  describe("radius", () => {
    it("looks up zip coordinates before calling RPC", async () => {
      await searchJobs({ zip: "19101", radius: 25 });
      expect(fromCalledWith).toBe("zip_coordinates");
      expect(eqCalledWith?.column).toBe("zip_code");
      expect(eqCalledWith?.value).toBe("19101");
    });

    it("passes lat/lng/radius to RPC when zip provided", async () => {
      await searchJobs({ zip: "19101", radius: 50 });
      expect(rpcCalledWith?.params.zip_lat).toBe(39.9526);
      expect(rpcCalledWith?.params.zip_lng).toBe(-75.1652);
      expect(rpcCalledWith?.params.radius_miles).toBe(50);
    });

    it("omits location params when no zip provided", async () => {
      await searchJobs({});
      expect(rpcCalledWith?.params.zip_lat).toBeNull();
      expect(rpcCalledWith?.params.zip_lng).toBeNull();
      expect(rpcCalledWith?.params.radius_miles).toBeNull();
    });
  });

  describe("school type", () => {
    it("passes school_types array to RPC", async () => {
      await searchJobs({ type: ["public", "charter"] });
      expect(rpcCalledWith?.params.school_types).toEqual(["public", "charter"]);
    });

    it("passes null when no type selected", async () => {
      await searchJobs({ type: [] });
      expect(rpcCalledWith?.params.school_types).toBeNull();
    });
  });

  describe("grade", () => {
    it("passes grade_bands array to RPC", async () => {
      await searchJobs({ grade: ["elementary", "middle"] });
      expect(rpcCalledWith?.params.grade_bands).toEqual(["elementary", "middle"]);
    });
  });

  describe("subject", () => {
    it("passes subject_areas array to RPC", async () => {
      await searchJobs({ subject: ["math", "science-biology"] });
      expect(rpcCalledWith?.params.subject_areas).toEqual(["math", "science-biology"]);
    });
  });

  describe("salary", () => {
    it("passes salary_only=true when salary filter active", async () => {
      await searchJobs({ salary: true });
      expect(rpcCalledWith?.params.salary_only).toBe(true);
    });

    it("passes salary_only=false when salary filter inactive", async () => {
      await searchJobs({ salary: false });
      expect(rpcCalledWith?.params.salary_only).toBe(false);
    });
  });

  describe("cert", () => {
    it("expands cert type categories to canonical PDE names", async () => {
      await searchJobs({ cert: ["administrative"] });
      expect(rpcCalledWith?.params.cert_types).toEqual([
        "Principal", "Superintendent",
      ]);
    });

    it("passes null when cert types have no canonical names", async () => {
      await searchJobs({ cert: ["emergency-permit"] });
      expect(rpcCalledWith?.params.cert_types).toBeNull();
    });

    it("combines names from multiple cert type categories", async () => {
      await searchJobs({ cert: ["administrative", "supervisory"] });
      const certTypes = rpcCalledWith?.params.cert_types as string[];
      expect(certTypes).toContain("Principal");
      expect(certTypes).toContain("Superintendent");
      expect(certTypes).toContain("Supervisor");
      expect(certTypes).toContain("Special Education Supervisor");
      expect(certTypes).toContain("Instructional Coach");
    });
  });

  describe("verified", () => {
    it("passes verified_only=true to RPC when verified filter active", async () => {
      await searchJobs({ verified: true });
      expect(rpcCalledWith?.params.verified_only).toBe(true);
    });

    it("passes verified_only=false when verified filter inactive", async () => {
      await searchJobs({ verified: false });
      expect(rpcCalledWith?.params.verified_only).toBe(false);
    });

    it("defaults verified_only to false when not specified", async () => {
      await searchJobs({});
      expect(rpcCalledWith?.params.verified_only).toBe(false);
    });

    it("does not do client-side filtering (count comes from RPC total_count)", async () => {
      // Mock RPC returning 3 rows -- mix of claimed and unclaimed
      const mixedRows = [
        { ...mockRpcData[0], id: "a", claimed_by_district_id: "dist-1", total_count: 50 },
        { ...mockRpcData[0], id: "b", claimed_by_district_id: null, total_count: 50 },
        { ...mockRpcData[0], id: "c", claimed_by_district_id: "dist-2", total_count: 50 },
      ];
      mockRpc.mockImplementation((fn: string, params: Record<string, unknown>) => {
        rpcCalledWith = { fn, params };
        return Promise.resolve({ data: mixedRows, error: null });
      });

      const result = await searchJobs({ verified: true });
      // All 3 rows returned (server-side filtering, not client-side)
      expect(result.jobs).toHaveLength(3);
      // Count comes from RPC total_count, not results.length
      expect(result.count).toBe(50);
    });
  });

  describe("combined", () => {
    it("passes all filter params together to RPC", async () => {
      await searchJobs({
        q: "math",
        type: ["public"],
        grade: ["high"],
        subject: ["math"],
        cert: ["instructional"],
        salary: true,
        verified: true,
        zip: "19101",
        radius: 30,
        unspecified: false,
      });

      expect(rpcCalledWith?.fn).toBe("search_jobs");
      expect(rpcCalledWith?.params.search_term).toBe("math");
      expect(rpcCalledWith?.params.school_types).toEqual(["public"]);
      expect(rpcCalledWith?.params.grade_bands).toEqual(["high"]);
      expect(rpcCalledWith?.params.subject_areas).toEqual(["math"]);
      expect(rpcCalledWith?.params.cert_types).toBeTruthy();
      expect((rpcCalledWith?.params.cert_types as string[])).toContain("Mathematics");
      expect(rpcCalledWith?.params.salary_only).toBe(true);
      expect(rpcCalledWith?.params.verified_only).toBe(true);
      expect(rpcCalledWith?.params.zip_lat).toBe(39.9526);
      expect(rpcCalledWith?.params.zip_lng).toBe(-75.1652);
      expect(rpcCalledWith?.params.radius_miles).toBe(30);
      expect(rpcCalledWith?.params.include_unspecified).toBe(false);
    });

    it("returns jobs and count from RPC response", async () => {
      const result = await searchJobs({});
      expect(result.jobs).toHaveLength(1);
      expect(result.jobs[0].title).toBe("Math Teacher");
      expect(result.count).toBe(1);
    });

    it("handles pagination offset and limit", async () => {
      await searchJobs({}, 50, 10);
      expect(rpcCalledWith?.params.result_offset).toBe(50);
      expect(rpcCalledWith?.params.result_limit).toBe(10);
    });

    it("returns empty jobs and zero count when no data", async () => {
      mockRpc.mockImplementation((fn: string, params: Record<string, unknown>) => {
        rpcCalledWith = { fn, params };
        return Promise.resolve({ data: [], error: null });
      });
      const result = await searchJobs({});
      expect(result.jobs).toHaveLength(0);
      expect(result.count).toBe(0);
    });

    it("sets include_remote when radius active and type includes cyber", async () => {
      await searchJobs({ zip: "19101", radius: 25, type: ["public", "cyber"] });
      expect(rpcCalledWith?.params.include_remote).toBe(true);
    });

    it("does not set include_remote when no radius", async () => {
      mockSingle.mockResolvedValue({ data: null, error: null });
      await searchJobs({ type: ["cyber"] });
      expect(rpcCalledWith?.params.include_remote).toBe(false);
    });

    it("defaults include_unspecified to true", async () => {
      await searchJobs({});
      expect(rpcCalledWith?.params.include_unspecified).toBe(true);
    });
  });
});
