-- Geocode existing jobs and schools by looking up their zip_code in zip_coordinates
--
-- DEPENDENCY: This migration should run AFTER zip_coordinates table is seeded
-- with PA zip code data via: npm run seed:zips
-- If zip_coordinates is empty, these UPDATEs will match zero rows (safe but no-op).

-- Update jobs that have a zip_code but no location
-- NOTE: ST_Point takes (longitude, latitude) -- longitude FIRST (x, y order)
UPDATE jobs
SET location = extensions.st_point(zc.longitude, zc.latitude)::extensions.geography
FROM zip_coordinates zc
WHERE jobs.zip_code = zc.zip_code
  AND jobs.location IS NULL;

-- Update schools that have a zip_code but no location
-- NOTE: ST_Point takes (longitude, latitude) -- longitude FIRST (x, y order)
UPDATE schools
SET location = extensions.st_point(zc.longitude, zc.latitude)::extensions.geography
FROM zip_coordinates zc
WHERE schools.zip_code = zc.zip_code
  AND schools.location IS NULL;
