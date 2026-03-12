import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logout } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/for-schools/login");
  }

  // Get district account info
  const admin = createAdminClient();
  const { data: account } = await admin
    .from("district_accounts")
    .select("id, district_id, is_verified, districts(name)")
    .eq("user_id", user.id)
    .single();

  if (!account) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Account Pending</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your district account is being set up. Please check your email for a
          confirmation link.
        </p>
        <form action={logout} className="mt-4">
          <Button variant="outline" type="submit">
            Log Out
          </Button>
        </form>
      </div>
    );
  }

  const districtName =
    (account.districts as unknown as { name: string } | null)?.name ??
    "Your District";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{districtName}</h1>
          <p className="text-sm text-muted-foreground">District Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          {!account.is_verified && (
            <span className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1 text-xs text-yellow-500">
              Pending Verification
            </span>
          )}
          <form action={logout}>
            <Button variant="outline" size="sm" type="submit">
              Log Out
            </Button>
          </form>
        </div>
      </div>
      {children}
    </div>
  );
}
