-- District accounts infrastructure: district_accounts table, verified_domains table,
-- jobs claim/delist columns, RLS policies, and search_jobs RPC update.

-- 1. Alter districts table: add slug, verified, verified_at
ALTER TABLE districts ADD COLUMN slug TEXT UNIQUE;
ALTER TABLE districts ADD COLUMN verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE districts ADD COLUMN verified_at TIMESTAMPTZ;

-- 2. Create district_accounts table (links auth.users to districts)
CREATE TABLE district_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  district_id UUID NOT NULL REFERENCES districts(id),
  email TEXT NOT NULL,
  email_domain TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Apply existing updated_at trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON district_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. Create verified_domains table (domain whitelist for auto-verification)
CREATE TABLE verified_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  added_by TEXT, -- 'auto' for .k12.pa.us pattern, or admin email for manual
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Alter jobs table: add claim/delist/manual columns
ALTER TABLE jobs ADD COLUMN claimed_by_district_id UUID REFERENCES districts(id);
ALTER TABLE jobs ADD COLUMN claimed_at TIMESTAMPTZ;
ALTER TABLE jobs ADD COLUMN delisted_at TIMESTAMPTZ;
ALTER TABLE jobs ADD COLUMN is_manual BOOLEAN NOT NULL DEFAULT false;

-- 5. Create indexes
CREATE INDEX idx_jobs_claimed_district ON jobs(claimed_by_district_id) WHERE claimed_by_district_id IS NOT NULL;
CREATE INDEX idx_districts_slug ON districts(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_districts_verified ON districts(verified) WHERE verified = true;

-- 6. Enable RLS and create policies

-- district_accounts RLS
ALTER TABLE district_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own district account"
  ON district_accounts FOR SELECT
  USING (auth.uid() = user_id);

-- verified_domains RLS
ALTER TABLE verified_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read verified domains"
  ON verified_domains FOR SELECT
  USING (auth.role() = 'authenticated');

-- districts: public read for profile pages
-- (RLS is not enabled on districts by default; enable it and add a permissive SELECT)
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read districts"
  ON districts FOR SELECT
  USING (true);

-- jobs: district update for own claimed jobs
CREATE POLICY "Districts can update own claimed jobs"
  ON jobs FOR UPDATE
  USING (
    claimed_by_district_id IN (
      SELECT district_id FROM district_accounts WHERE user_id = auth.uid()
    )
  );

-- jobs: district insert for manual jobs
CREATE POLICY "Districts can insert manual jobs"
  ON jobs FOR INSERT
  WITH CHECK (
    claimed_by_district_id IN (
      SELECT district_id FROM district_accounts WHERE user_id = auth.uid()
    )
    AND is_manual = true
  );

-- 7 & 8. Update search_jobs RPC: exclude delisted jobs and return claimed_by_district_id
CREATE OR REPLACE FUNCTION search_jobs(
  search_term TEXT DEFAULT NULL,
  school_types TEXT[] DEFAULT NULL,
  grade_bands TEXT[] DEFAULT NULL,
  subject_areas TEXT[] DEFAULT NULL,
  cert_types TEXT[] DEFAULT NULL,
  salary_only BOOLEAN DEFAULT FALSE,
  zip_lat FLOAT DEFAULT NULL,
  zip_lng FLOAT DEFAULT NULL,
  radius_miles FLOAT DEFAULT NULL,
  include_unspecified BOOLEAN DEFAULT TRUE,
  include_remote BOOLEAN DEFAULT FALSE,
  result_offset INT DEFAULT 0,
  result_limit INT DEFAULT 25
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  location_raw TEXT,
  city TEXT,
  school_type TEXT,
  grade_band TEXT[],
  subject_area TEXT[],
  salary_mentioned BOOLEAN,
  certifications TEXT[],
  first_seen_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  url TEXT,
  zip_code TEXT,
  school_name TEXT,
  district_name TEXT,
  total_count BIGINT,
  claimed_by_district_id UUID
)
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.id,
    j.title,
    j.description,
    j.location_raw,
    j.city,
    j.school_type,
    j.grade_band,
    j.subject_area,
    j.salary_mentioned,
    j.certifications,
    j.first_seen_at,
    j.last_verified_at,
    j.url,
    j.zip_code,
    s.name AS school_name,
    s.district_name,
    COUNT(*) OVER() AS total_count,
    j.claimed_by_district_id
  FROM public.jobs j
  LEFT JOIN public.schools s ON j.school_id = s.id
  WHERE j.is_active = true
    AND j.delisted_at IS NULL

    -- Keyword search: title, school name, location (NOT description per user decision)
    AND (search_term IS NULL OR (
      j.title ILIKE '%' || search_term || '%'
      OR j.location_raw ILIKE '%' || search_term || '%'
      OR s.name ILIKE '%' || search_term || '%'
    ))

    -- School type filter
    AND (school_types IS NULL OR (
      j.school_type = ANY(school_types)
      OR (include_unspecified AND j.school_type IS NULL)
    ))

    -- Grade band filter (array overlap)
    AND (grade_bands IS NULL OR (
      j.grade_band && grade_bands
      OR (include_unspecified AND (j.grade_band IS NULL OR j.grade_band = '{}'))
    ))

    -- Subject area filter (array overlap)
    AND (subject_areas IS NULL OR (
      j.subject_area && subject_areas
      OR (include_unspecified AND (j.subject_area IS NULL OR j.subject_area = '{}'))
    ))

    -- Certification filter (array overlap)
    AND (cert_types IS NULL OR (
      j.certifications && cert_types
      OR (include_unspecified AND (j.certifications IS NULL OR j.certifications = '{}'))
    ))

    -- Salary toggle
    AND (NOT salary_only OR j.salary_mentioned = true)

    -- Radius filter
    -- NOTE: ST_Point takes (longitude, latitude) -- longitude FIRST (x, y order)
    AND (zip_lat IS NULL OR zip_lng IS NULL OR radius_miles IS NULL OR (
      (j.location IS NOT NULL AND extensions.st_dwithin(
        j.location,
        -- ST_Point(longitude, latitude) -- longitude FIRST
        extensions.st_point(zip_lng, zip_lat)::extensions.geography,
        radius_miles * 1609.34  -- convert miles to meters
      ))
      OR (include_remote AND j.school_type = 'cyber')
    ))

  ORDER BY j.first_seen_at DESC
  OFFSET result_offset
  LIMIT result_limit;
END;
$$;
