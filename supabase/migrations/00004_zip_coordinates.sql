-- Zip code coordinates lookup table for geocoding
-- Used by radius search to convert zip codes to lat/lng
-- Seeded from US Census ZIP Code Tabulation Areas data via scripts/seed-zip-coordinates.ts

CREATE TABLE zip_coordinates (
  zip_code TEXT PRIMARY KEY,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  city TEXT,
  state TEXT
);

-- Index on state for filtering PA zips
CREATE INDEX idx_zip_coordinates_state ON zip_coordinates(state);
