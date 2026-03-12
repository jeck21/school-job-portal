"use server";

import { createClient } from "@/lib/supabase/server";

export async function getJobDetail(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("jobs")
    .select(
      `
      id, title, description, url, location_raw, city, state,
      school_type, salary_raw, salary_mentioned,
      first_seen_at, last_verified_at, is_active,
      claimed_by_district_id,
      schools ( name, district_name )
    `
    )
    .eq("id", id)
    .single();

  if (error) throw error;

  // Normalize schools from Supabase array join to single object
  const schools = Array.isArray(data.schools)
    ? (data.schools[0] as { name: string; district_name: string | null } | undefined) ?? null
    : data.schools;

  return { ...data, schools };
}
