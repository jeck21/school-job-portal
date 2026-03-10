import { describe, it, expect, vi } from "vitest";

// Mock Supabase client -- the searchJobs server action calls supabase.rpc()
// Mock will be filled in during Task 2 once the actual function signature is finalized
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("searchJobs", () => {
  describe("keyword", () => {
    it.todo("filters jobs matching title by keyword");
    it.todo("filters jobs matching school name by keyword");
    it.todo("filters jobs matching location by keyword");
    it.todo("does NOT search description text");
  });

  describe("radius", () => {
    it.todo("looks up zip coordinates before calling RPC");
    it.todo("passes lat/lng/radius to RPC when zip provided");
    it.todo("omits location params when no zip provided");
  });

  describe("school type", () => {
    it.todo("passes school_types array to RPC");
    it.todo("passes empty array when no type selected");
  });

  describe("grade", () => {
    it.todo("passes grade_bands array to RPC");
  });

  describe("subject", () => {
    it.todo("passes subject_areas array to RPC");
  });

  describe("salary", () => {
    it.todo("passes salary_only=true when salary filter active");
    it.todo("passes salary_only=false when salary filter inactive");
  });

  describe("cert", () => {
    it.todo("passes cert_types array to RPC");
  });

  describe("combined", () => {
    it.todo("passes all filter params together to RPC");
    it.todo("returns jobs and count from RPC response");
    it.todo("handles pagination offset and limit");
  });
});
