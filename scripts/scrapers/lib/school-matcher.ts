/**
 * Fuzzy school name matching against the schools table.
 * Uses Dice coefficient (string-similarity) to find existing entries
 * and creates new records for unmatched schools.
 */
import { compareTwoStrings } from "string-similarity";
import type { SupabaseClient } from "@supabase/supabase-js";

const MATCH_THRESHOLD = 0.8;
const NEAR_MISS_THRESHOLD = 0.6;

/**
 * Normalize a school name for comparison:
 * lowercase, strip common suffixes, collapse whitespace, remove hyphens.
 */
export function normalizeSchoolName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\bschool\s+district\b/gi, "")
    .replace(/\bsd\b/gi, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Find an existing school matching the given name, or create a new one.
 * Returns the school UUID.
 */
export async function findOrCreateSchool(
  supabase: SupabaseClient,
  schoolName: string,
  city?: string,
  state?: string,
  zipCode?: string,
  schoolType?: string
): Promise<string> {
  // Fetch all schools in the same state for comparison
  const { data: existingSchools, error } = await supabase
    .from("schools")
    .select("id, name, city, state")
    .eq("state", state || "PA");

  if (error) {
    console.error("[school-matcher] Error fetching schools:", error.message);
  }

  const normalizedInput = normalizeSchoolName(schoolName);

  if (existingSchools && existingSchools.length > 0) {
    let bestMatch: { id: string; score: number; name: string } | null = null;

    for (const school of existingSchools) {
      const normalizedExisting = normalizeSchoolName(school.name);
      const score = compareTwoStrings(normalizedInput, normalizedExisting);

      if (score > (bestMatch?.score ?? 0)) {
        bestMatch = { id: school.id, score, name: school.name };
      }
    }

    if (bestMatch) {
      if (bestMatch.score >= MATCH_THRESHOLD) {
        return bestMatch.id;
      }

      if (bestMatch.score >= NEAR_MISS_THRESHOLD) {
        console.warn(
          `[school-matcher] Near miss (${bestMatch.score.toFixed(2)}): "${schoolName}" ~ "${bestMatch.name}". Review for manual merge.`
        );
      }
    }
  }

  // No match found -- create new school record
  const { data: newSchool, error: insertError } = await supabase
    .from("schools")
    .insert({
      name: schoolName,
      city: city || null,
      state: state || "PA",
      zip_code: zipCode || null,
      school_type: schoolType || null,
    })
    .select("id")
    .single();

  if (insertError) {
    throw new Error(
      `[school-matcher] Failed to create school "${schoolName}": ${insertError.message}`
    );
  }

  return newSchool.id;
}
