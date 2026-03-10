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
      schools ( name, district_name )
    `
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}
