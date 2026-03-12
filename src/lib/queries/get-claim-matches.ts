"use server";

import { compareTwoStrings } from "string-similarity";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeSchoolName } from "@/../scripts/scrapers/lib/school-matcher";

export type ClaimMatch = {
  jobId: string;
  title: string;
  schoolName: string;
  score: number;
};

const MATCH_THRESHOLD = 0.8;

/**
 * Find unclaimed jobs that fuzzy-match a district name.
 * Uses Dice coefficient at 0.8 threshold (same as school-matcher).
 */
export async function getClaimMatches(
  districtId: string,
  districtName: string
): Promise<ClaimMatch[]> {
  const supabase = createAdminClient();

  // Get all unclaimed active jobs with their school's district_name
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("id, title, schools!inner(name, district_name)")
    .is("claimed_by_district_id", null)
    .eq("is_active", true)
    .is("delisted_at", null);

  if (error) {
    console.error("[claim-matches] Error fetching jobs:", error.message);
    return [];
  }

  if (!jobs || jobs.length === 0) return [];

  const normalizedDistrict = normalizeSchoolName(districtName);
  const matches: ClaimMatch[] = [];

  for (const job of jobs) {
    const school = job.schools as unknown as {
      name: string;
      district_name: string | null;
    };
    if (!school?.district_name) continue;

    const normalizedSchoolDistrict = normalizeSchoolName(school.district_name);
    const score = compareTwoStrings(normalizedDistrict, normalizedSchoolDistrict);

    if (score >= MATCH_THRESHOLD) {
      matches.push({
        jobId: job.id,
        title: job.title,
        schoolName: school.name,
        score,
      });
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  return matches;
}
