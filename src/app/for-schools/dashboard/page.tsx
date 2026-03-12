import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDistrictJobs } from "@/lib/queries/get-district-jobs";
import { getClaimMatches } from "@/lib/queries/get-claim-matches";
import { DashboardTabs } from "@/components/district/dashboard-tabs";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/for-schools/login");
  }

  const admin = createAdminClient();
  const { data: account } = await admin
    .from("district_accounts")
    .select("district_id, districts(name)")
    .eq("user_id", user.id)
    .single();

  if (!account) {
    return null; // Layout handles this case
  }

  const districtName =
    (account.districts as unknown as { name: string } | null)?.name ?? "";

  const [activeJobs, delistedJobs, claimMatches] = await Promise.all([
    getDistrictJobs(account.district_id, "active"),
    getDistrictJobs(account.district_id, "delisted"),
    getClaimMatches(account.district_id, districtName),
  ]);

  return (
    <DashboardTabs
      activeJobs={activeJobs}
      delistedJobs={delistedJobs}
      claimMatches={claimMatches}
      districtId={account.district_id}
    />
  );
}
