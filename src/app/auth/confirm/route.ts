import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateDomain, generateSlug } from "@/lib/domain-validation";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as "email" | "recovery" | null;
  const code = searchParams.get("code");

  const supabase = await createClient();

  // Handle PKCE flow (code exchange) or legacy token_hash flow
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL("/for-schools/login?error=confirmation", request.url)
      );
    }
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (error) {
      return NextResponse.redirect(
        new URL("/for-schools/login?error=confirmation", request.url)
      );
    }
  } else {
    return NextResponse.redirect(
      new URL("/for-schools/login?error=confirmation", request.url)
    );
  }

  // Get the authenticated user after verification
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.redirect(
      new URL("/for-schools/dashboard", request.url)
    );
  }

  // Use admin client to bypass RLS for district_accounts insert
  const admin = createAdminClient();
  const { autoVerified, domain } = validateDomain(user.email);
  const districtName =
    user.user_metadata?.district_name ?? domain.split(".")[0];

  // Check if domain is in verified_domains whitelist
  let isWhitelisted = false;
  if (!autoVerified) {
    const { data: domainRow } = await admin
      .from("verified_domains")
      .select("id")
      .eq("domain", domain)
      .single();
    isWhitelisted = !!domainRow;
  }

  const shouldVerify = autoVerified || isWhitelisted;

  // Find or create district
  let districtId: string;
  const slug = generateSlug(districtName);

  // Try to find existing district by name (case-insensitive)
  const { data: existingDistrict } = await admin
    .from("districts")
    .select("id")
    .ilike("name", districtName)
    .single();

  if (existingDistrict) {
    districtId = existingDistrict.id;

    // Update slug and verified status if verifying
    if (shouldVerify) {
      await admin
        .from("districts")
        .update({ slug, verified: true, verified_at: new Date().toISOString() })
        .eq("id", districtId);
    } else {
      // Ensure slug is set even if not verified
      await admin
        .from("districts")
        .update({ slug })
        .eq("id", districtId)
        .is("slug", null);
    }
  } else {
    // Create new district
    const { data: newDistrict } = await admin
      .from("districts")
      .insert({
        name: districtName,
        slug,
        verified: shouldVerify,
        verified_at: shouldVerify ? new Date().toISOString() : null,
      })
      .select("id")
      .single();

    districtId = newDistrict!.id;
  }

  // Check if district_account already exists for this user
  const { data: existingAccount } = await admin
    .from("district_accounts")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!existingAccount) {
    // Create district_accounts row
    await admin.from("district_accounts").insert({
      user_id: user.id,
      district_id: districtId,
      email: user.email,
      email_domain: domain,
      is_verified: shouldVerify,
      verified_at: shouldVerify ? new Date().toISOString() : null,
    });
  }

  // If auto-verified, add domain to whitelist for future signups
  if (autoVerified) {
    await admin
      .from("verified_domains")
      .upsert({ domain, added_by: "auto" }, { onConflict: "domain" });
  }

  return NextResponse.redirect(
    new URL("/for-schools/dashboard", request.url)
  );
}
