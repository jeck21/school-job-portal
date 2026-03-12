/**
 * Domain validation for district account auto-verification.
 * .k12.pa.us domains are auto-verified on signup.
 * All others require manual approval (checked at DB level).
 */

export function validateDomain(email: string): {
  autoVerified: boolean;
  domain: string;
} {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";

  // .k12.pa.us domains are auto-verified (official PA public school districts)
  if (domain.endsWith(".k12.pa.us")) {
    return { autoVerified: true, domain };
  }

  // All other domains: not auto-verified (whitelist check happens at DB level)
  return { autoVerified: false, domain };
}

/**
 * Generate a URL-safe slug from a district name.
 * Simple: lowercase, replace non-alphanumeric with hyphens, trim leading/trailing hyphens.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
