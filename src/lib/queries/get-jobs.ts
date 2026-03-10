"use server";

import { createClient } from "@/lib/supabase/server";

export async function getJobs(offset: number = 0, limit: number = 25) {
  const supabase = await createClient();

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
  return { jobs: data ?? [], count: count ?? 0 };
}
