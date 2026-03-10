import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

describe("Database Migration: 00001_initial_schema.sql", () => {
  const migrationPath = path.resolve(
    __dirname,
    "../../supabase/migrations/00001_initial_schema.sql"
  );
  const sql = readFileSync(migrationPath, "utf-8");

  it("enables PostGIS extension", () => {
    expect(sql).toContain("CREATE EXTENSION IF NOT EXISTS postgis");
  });

  it("creates the sources table", () => {
    expect(sql).toMatch(/CREATE TABLE sources/);
  });

  it("creates the schools table", () => {
    expect(sql).toMatch(/CREATE TABLE schools/);
  });

  it("creates the districts table", () => {
    expect(sql).toMatch(/CREATE TABLE districts/);
  });

  it("creates the jobs table", () => {
    expect(sql).toMatch(/CREATE TABLE jobs/);
  });

  it("creates the job_sources table", () => {
    expect(sql).toMatch(/CREATE TABLE job_sources/);
  });

  it("creates GIST index for job location", () => {
    expect(sql).toContain("idx_jobs_location ON jobs USING GIST(location)");
  });

  it("creates updated_at trigger function", () => {
    expect(sql).toContain("CREATE OR REPLACE FUNCTION update_updated_at()");
  });

  it("applies updated_at triggers to all tables", () => {
    expect(sql).toContain("CREATE TRIGGER set_updated_at BEFORE UPDATE ON sources");
    expect(sql).toContain("CREATE TRIGGER set_updated_at BEFORE UPDATE ON schools");
    expect(sql).toContain("CREATE TRIGGER set_updated_at BEFORE UPDATE ON districts");
    expect(sql).toContain("CREATE TRIGGER set_updated_at BEFORE UPDATE ON jobs");
  });
});
