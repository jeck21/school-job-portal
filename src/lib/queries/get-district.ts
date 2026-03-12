"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type DistrictProfile = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  verified_at: string | null;
};

export type DistrictProfileJob = {
  id: string;
  title: string;
  schoolName: string;
  city: string | null;
  school_type: string | null;
  first_seen_at: string;
  url: string;
};

/**
 * Fetch a single verified district by slug, including count of open jobs.
 */
export async function getDistrictBySlug(
  slug: string
): Promise<DistrictProfile | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("districts")
    .select("id, name, slug, website, verified_at")
    .eq("slug", slug)
    .eq("verified", true)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    website: data.website ?? null,
    verified_at: data.verified_at,
  };
}

/**
 * Fetch active (non-delisted) jobs claimed by a district.
 */
export async function getDistrictPublicJobs(
  districtId: string
): Promise<DistrictProfileJob[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("jobs")
    .select("id, title, city, school_type, first_seen_at, url, schools(name)")
    .eq("claimed_by_district_id", districtId)
    .eq("is_active", true)
    .is("delisted_at", null)
    .order("first_seen_at", { ascending: false });

  if (error) {
    console.error("[get-district] Error fetching district jobs:", error.message);
    return [];
  }

  return (data ?? []).map((job) => ({
    id: job.id,
    title: job.title,
    schoolName:
      (job.schools as unknown as { name: string } | null)?.name ?? "Unknown",
    city: job.city,
    school_type: job.school_type,
    first_seen_at: job.first_seen_at,
    url: job.url,
  }));
}
