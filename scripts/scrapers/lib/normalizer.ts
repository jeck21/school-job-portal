/**
 * Data normalizer for scraped job records.
 * Extracts structured location data and infers school types.
 */

/**
 * Parse a raw location string into structured city/state/zip components.
 * Handles PAREAP formats like:
 *  - "Philadelphia, PA 19102"
 *  - "Pittsburgh, PA"
 *  - "1600 Vine St. Philadelphia, PA 19102"
 */
export function parseLocation(raw: string): {
  city?: string;
  state?: string;
  zipCode?: string;
} {
  if (!raw || !raw.trim()) return {};

  // Match "City, ST" or "City, ST 12345" pattern.
  // City name: only letters, spaces, hyphens, apostrophes (no periods/digits).
  // This excludes street address prefixes like "1600 Vine St."
  const match = raw.match(
    /([A-Za-z][A-Za-z\s'\-]*[A-Za-z]),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?/
  );

  if (!match) return {};

  return {
    city: match[1].trim(),
    state: match[2],
    zipCode: match[3] || undefined,
  };
}

/**
 * Infer school type from the school/district name.
 * Returns null when type cannot be reliably determined.
 */
export function normalizeSchoolType(name: string): string | null {
  const lower = name.toLowerCase();

  // Check for cyber before charter (since "cyber charter" should be "cyber")
  if (lower.includes("cyber")) return "cyber";
  if (lower.includes("charter")) return "charter";
  if (
    lower.includes("intermediate unit") ||
    /\biu\s*\d/i.test(name)
  ) {
    return "iu";
  }
  if (lower.includes("private") || lower.includes("academy of faith")) {
    return "private";
  }

  // Default: cannot determine from name alone
  return null;
}
