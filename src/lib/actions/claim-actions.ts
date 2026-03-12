"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Claim a set of jobs for the authenticated user's district.
 * Verifies the user belongs to the district before claiming.
 */
export async function claimJobs(
  jobIds: string[],
  districtId: string
): Promise<{ success: boolean; claimed: number; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, claimed: 0, error: "Not authenticated" };
  }

  // Verify user belongs to this district
  const admin = createAdminClient();
  const { data: account } = await admin
    .from("district_accounts")
    .select("district_id")
    .eq("user_id", user.id)
    .eq("district_id", districtId)
    .single();

  if (!account) {
    return { success: false, claimed: 0, error: "Unauthorized" };
  }

  // Claim the jobs
  const { data, error } = await admin
    .from("jobs")
    .update({
      claimed_by_district_id: districtId,
      claimed_at: new Date().toISOString(),
    })
    .in("id", jobIds)
    .is("claimed_by_district_id", null)
    .select("id");

  if (error) {
    return { success: false, claimed: 0, error: error.message };
  }

  return { success: true, claimed: data?.length ?? 0 };
}
