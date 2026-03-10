-- Initial database schema for PA Educator Jobs portal
-- Defines core tables: sources, schools, districts, jobs, job_sources

-- Enable PostGIS for future radius search (Phase 4)
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- Make PostGIS types available without schema prefix in this session
SET search_path TO public, extensions;

-- Sources: where jobs come from (PAREAP, PAeducator.net, PDE, etc.)
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  base_url TEXT,
  scraper_type TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Schools
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  district_name TEXT,
  school_type TEXT,
  address TEXT,
  city TEXT,
  state TEXT NOT NULL DEFAULT 'PA',
  zip_code TEXT,
  location GEOGRAPHY(POINT, 4326),
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Districts (for district accounts in Phase 7)
CREATE TABLE districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'PA',
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Jobs: the core entity
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES sources(id),
  school_id UUID REFERENCES schools(id),
  district_id UUID REFERENCES districts(id),
  external_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  location_raw TEXT,
  location GEOGRAPHY(POINT, 4326),
  city TEXT,
  state TEXT NOT NULL DEFAULT 'PA',
  zip_code TEXT,
  school_type TEXT,
  grade_band TEXT[],
  subject_area TEXT[],
  salary_mentioned BOOLEAN DEFAULT false,
  salary_raw TEXT,
  certifications TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_id, external_id)
);

-- Job-source attribution (for dedup: same job from multiple sources)
CREATE TABLE job_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES sources(id),
  external_id TEXT,
  external_url TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, source_id)
);

-- Indexes for common query patterns
CREATE INDEX idx_jobs_is_active ON jobs(is_active) WHERE is_active = true;
CREATE INDEX idx_jobs_state ON jobs(state);
CREATE INDEX idx_jobs_school_type ON jobs(school_type);
CREATE INDEX idx_jobs_location ON jobs USING GIST(location);
CREATE INDEX idx_jobs_source_id ON jobs(source_id);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_schools_location ON schools USING GIST(location);
CREATE INDEX idx_schools_state ON schools(state);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON districts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
