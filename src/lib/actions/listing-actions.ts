"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Helper: get the authenticated user's district_id and verify ownership of a job.
 */
async function getAuthedDistrict(): Promise<{
  userId: string;
  districtId: string;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();
  const { data: account } = await admin
    .from("district_accounts")
    .select("district_id")
    .eq("user_id", user.id)
    .single();

  if (!account) return null;

  return { userId: user.id, districtId: account.district_id };
}

async function verifyJobOwnership(
  jobId: string,
  districtId: string
): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .eq("claimed_by_district_id", districtId)
    .single();

  return !!data;
}

/**
 * Delist a job: sets delisted_at and is_active = false.
 */
export async function delistJob(
  jobId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await getAuthedDistrict();
  if (!auth) return { success: false, error: "Not authenticated" };

  const owns = await verifyJobOwnership(jobId, auth.districtId);
  if (!owns) return { success: false, error: "Unauthorized" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("jobs")
    .update({
      delisted_at: new Date().toISOString(),
      is_active: false,
    })
    .eq("id", jobId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/for-schools/dashboard");
  return { success: true };
}

/**
 * Relist a previously delisted job: clears delisted_at and sets is_active = true.
 */
export async function relistJob(
  jobId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await getAuthedDistrict();
  if (!auth) return { success: false, error: "Not authenticated" };

  const owns = await verifyJobOwnership(jobId, auth.districtId);
  if (!owns) return { success: false, error: "Unauthorized" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("jobs")
    .update({
      delisted_at: null,
      is_active: true,
    })
    .eq("id", jobId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/for-schools/dashboard");
  return { success: true };
}

/**
 * Create a manual job posting for the authenticated user's district.
 */
export async function createManualJob(
  formData: FormData
): Promise<{ success: boolean; jobId?: string; error?: string }> {
  const auth = await getAuthedDistrict();
  if (!auth) return { success: false, error: "Not authenticated" };

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const schoolName = formData.get("schoolName") as string;
  const gradeBand = formData.getAll("gradeBand") as string[];
  const subjectArea = formData.getAll("subjectArea") as string[];
  const salaryRaw = formData.get("salaryRaw") as string;
  const url = formData.get("url") as string;
  const expiresAt = formData.get("expiresAt") as string;

  if (!title || !description || !url) {
    return { success: false, error: "Title, description, and application URL are required" };
  }

  const admin = createAdminClient();

  // Ensure manual source exists
  const { data: source } = await admin
    .from("sources")
    .upsert(
      {
        name: "District Portal",
        slug: "manual",
        base_url: "",
        scraper_type: "manual",
        is_active: true,
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (!source) {
    return { success: false, error: "Failed to create manual source" };
  }

  // Generate a stable external_id for manual posts
  const externalId = `manual-${auth.districtId}-${Date.now()}`;

  const { data: job, error } = await admin
    .from("jobs")
    .insert({
      source_id: source.id,
      external_id: externalId,
      title,
      description,
      url,
      location_raw: schoolName || null,
      salary_raw: salaryRaw || null,
      salary_mentioned: !!salaryRaw,
      grade_band: gradeBand.length > 0 ? gradeBand : null,
      subject_area: subjectArea.length > 0 ? subjectArea : null,
      is_manual: true,
      is_active: true,
      claimed_by_district_id: auth.districtId,
      claimed_at: new Date().toISOString(),
      last_verified_at: new Date().toISOString(),
      expires_at: expiresAt || null,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/for-schools/dashboard");
  return { success: true, jobId: job?.id };
}

/**
 * Update a manual job posting. Scraped jobs cannot be edited.
 */
export async function updateManualJob(
  jobId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const auth = await getAuthedDistrict();
  if (!auth) return { success: false, error: "Not authenticated" };

  const admin = createAdminClient();

  // Check ownership AND is_manual
  const { data: existing } = await admin
    .from("jobs")
    .select("id, is_manual")
    .eq("id", jobId)
    .eq("claimed_by_district_id", auth.districtId)
    .single();

  if (!existing) return { success: false, error: "Unauthorized" };
  if (!existing.is_manual) {
    return { success: false, error: "Cannot edit scraped listings" };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const schoolName = formData.get("schoolName") as string;
  const gradeBand = formData.getAll("gradeBand") as string[];
  const subjectArea = formData.getAll("subjectArea") as string[];
  const salaryRaw = formData.get("salaryRaw") as string;
  const url = formData.get("url") as string;
  const expiresAt = formData.get("expiresAt") as string;

  const { error } = await admin
    .from("jobs")
    .update({
      title: title || undefined,
      description: description || undefined,
      url: url || undefined,
      location_raw: schoolName || undefined,
      salary_raw: salaryRaw || null,
      salary_mentioned: !!salaryRaw,
      grade_band: gradeBand.length > 0 ? gradeBand : null,
      subject_area: subjectArea.length > 0 ? subjectArea : null,
      expires_at: expiresAt || null,
      last_verified_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/for-schools/dashboard");
  return { success: true };
}
