"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { CERT_TYPE_TO_NAMES } from "@/lib/filter-options";

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

  // Expand cert type filter values to canonical PDE cert names
  let expandedCerts: string[] | null = null;
  if (filters.cert?.length) {
    const names = new Set<string>();
    for (const certType of filters.cert) {
      const mapped = CERT_TYPE_TO_NAMES[certType];
      if (mapped) {
        for (const name of mapped) names.add(name);
      }
    }
    expandedCerts = names.size > 0 ? Array.from(names) : null;
  }

  const { data, error } = await supabase.rpc("search_jobs", {
    search_term: filters.q || null,
    school_types: filters.type?.length ? filters.type : null,
    grade_bands: filters.grade?.length ? filters.grade : null,
    subject_areas: filters.subject?.length ? filters.subject : null,
    cert_types: expandedCerts,
    salary_only: filters.salary ?? false,
    verified_only: filters.verified ?? false,
    zip_lat: zipLat,
    zip_lng: zipLng,
    radius_miles: filters.zip ? (filters.radius ?? 25) : null,
    include_unspecified: filters.unspecified ?? true,
    include_remote: includeRemote,
    result_offset: offset,
    result_limit: limit,
  });

  if (error) throw error;

  const results = data ?? [];

  return {
    jobs: results,
    count: Number(data?.[0]?.total_count ?? 0),
  };
}
