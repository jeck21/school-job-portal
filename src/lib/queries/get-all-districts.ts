"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type DistrictListItem = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  jobCount: number;
};

/**
 * Fetch all verified districts with their active job counts, ordered by name.
 */
export async function getAllVerifiedDistricts(): Promise<DistrictListItem[]> {
  const supabase = createAdminClient();

  // Fetch verified districts
  const { data: districts, error } = await supabase
    .from("districts")
    .select("id, name, slug, website")
    .eq("verified", true)
    .order("name", { ascending: true });

  if (error || !districts) {
    console.error(
      "[get-all-districts] Error fetching districts:",
      error?.message
    );
    return [];
  }

  if (districts.length === 0) return [];

  // Fetch job counts for all verified districts in one query
  const districtIds = districts.map((d) => d.id);
  const { data: jobCounts, error: countError } = await supabase
    .from("jobs")
    .select("claimed_by_district_id")
    .in("claimed_by_district_id", districtIds)
    .eq("is_active", true)
    .is("delisted_at", null);

  if (countError) {
    console.error(
      "[get-all-districts] Error fetching job counts:",
      countError.message
    );
  }

  // Build count map
  const countMap = new Map<string, number>();
  for (const row of jobCounts ?? []) {
    const did = row.claimed_by_district_id as string;
    countMap.set(did, (countMap.get(did) ?? 0) + 1);
  }

  return districts.map((d) => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    website: d.website ?? null,
    jobCount: countMap.get(d.id) ?? 0,
  }));
}
