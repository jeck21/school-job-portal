"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type DistrictJob = {
  id: string;
  title: string;
  schoolName: string;
  description: string | null;
  salary_raw: string | null;
  first_seen_at: string;
  is_manual: boolean;
  delisted_at: string | null;
  url: string | null;
};

/**
 * Fetch jobs claimed by a district, filtered by active or delisted status.
 */
export async function getDistrictJobs(
  districtId: string,
  filter: "active" | "delisted"
): Promise<DistrictJob[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("jobs")
    .select("id, title, description, salary_raw, first_seen_at, is_manual, delisted_at, url, schools(name)")
    .eq("claimed_by_district_id", districtId);

  if (filter === "active") {
    query = query.eq("is_active", true).is("delisted_at", null);
  } else {
    query = query.not("delisted_at", "is", null);
  }

  const { data, error } = await query.order("first_seen_at", {
    ascending: false,
  });

  if (error) {
    console.error("[district-jobs] Error fetching jobs:", error.message);
    return [];
  }

  return (data ?? []).map((job) => ({
    id: job.id,
    title: job.title,
    description: job.description,
    salary_raw: job.salary_raw,
    schoolName:
      (job.schools as unknown as { name: string } | null)?.name ?? "Unknown",
    first_seen_at: job.first_seen_at,
    is_manual: job.is_manual,
    delisted_at: job.delisted_at,
    url: job.url,
  }));
}
