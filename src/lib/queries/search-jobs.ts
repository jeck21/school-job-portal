"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type JobFilters = {
  q?: string;
  type?: string[];
  grade?: string[];
  subject?: string[];
  cert?: string[];
  salary?: boolean;
  zip?: string;
  radius?: number;
  unspecified?: boolean;
  verified?: boolean;
};

export async function searchJobs(
  filters: JobFilters,
  offset: number = 0,
  limit: number = 25
) {
  // Use admin client to bypass RLS — job listings are public data
  const supabase = createAdminClient();

  // If zip is provided, look up coordinates from zip_coordinates table
  let zipLat: number | null = null;
  let zipLng: number | null = null;

  if (filters.zip && filters.radius) {
    const { data: zipData } = await supabase
      .from("zip_coordinates")
      .select("latitude, longitude")
      .eq("zip_code", filters.zip)
      .single();

    if (zipData) {
      zipLat = zipData.latitude;
      zipLng = zipData.longitude;
    }
  }

  // Determine include_remote: true when radius is active AND type filter includes "cyber"
  const includeRemote =
    zipLat !== null &&
    zipLng !== null &&
    (filters.type?.includes("cyber") ?? false);

  const { data, error } = await supabase.rpc("search_jobs", {
    search_term: filters.q || null,
    school_types: filters.type?.length ? filters.type : null,
    grade_bands: filters.grade?.length ? filters.grade : null,
    subject_areas: filters.subject?.length ? filters.subject : null,
    cert_types: filters.cert?.length ? filters.cert : null,
    salary_only: filters.salary ?? false,
    zip_lat: zipLat,
    zip_lng: zipLng,
    radius_miles: filters.zip ? (filters.radius ?? 25) : null,
    include_unspecified: filters.unspecified ?? true,
    include_remote: includeRemote,
    result_offset: offset,
    result_limit: limit,
  });

  if (error) throw error;

  let results = data ?? [];

  // Client-side verified filter
  if (filters.verified) {
    results = results.filter(
      (row: Record<string, unknown>) => row.claimed_by_district_id != null
    );
  }

  const totalCount = filters.verified
    ? results.length
    : (data?.[0]?.total_count ?? 0);

  return {
    jobs: results,
    count: Number(totalCount),
  };
}
