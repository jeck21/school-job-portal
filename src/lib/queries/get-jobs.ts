"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function getJobs(offset: number = 0, limit: number = 25) {
  const supabase = createAdminClient();

  const { data, error, count } = await supabase
    .from("jobs")
    .select(
      `
      id, title, location_raw, city, school_type,
      first_seen_at, url,
      schools ( name, district_name )
    `,
      { count: "exact" }
    )
    .eq("is_active", true)
    .order("first_seen_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  // Normalize schools from Supabase array join to single object
  const jobs = (data ?? []).map((job) => ({
    ...job,
    schools: Array.isArray(job.schools)
      ? (job.schools[0] as { name: string; district_name: string | null } | undefined) ?? null
      : job.schools,
  }));

  return { jobs, count: count ?? 0 };
}
