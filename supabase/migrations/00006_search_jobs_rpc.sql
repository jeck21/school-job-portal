-- Combined search and filter RPC function
-- Accepts all filter parameters and returns paginated, filtered jobs
-- Uses PostGIS for radius search, array overlap for multi-select filters

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
  total_count BIGINT
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
    COUNT(*) OVER() AS total_count
  FROM public.jobs j
  LEFT JOIN public.schools s ON j.school_id = s.id
  WHERE j.is_active = true

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
