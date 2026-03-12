import Link from "next/link";
import { Building2, Shield, PenLine } from "lucide-react";

export default function ForSchoolsPage() {
  return (
    <div className="container mx-auto flex flex-col items-center px-4 py-16">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          For Schools & Districts
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Manage your school&apos;s job listings, verify postings, and reach
          qualified Pennsylvania educators -- all in one place.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 text-center">
          <Shield className="mx-auto size-8 text-cta" />
          <h3 className="mt-3 font-semibold">Verified Listings</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Claim your school&apos;s postings and display a verified badge to
            job seekers.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6 text-center">
          <PenLine className="mx-auto size-8 text-cta" />
          <h3 className="mt-3 font-semibold">Post New Jobs</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage your own listings with full editing control.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6 text-center">
          <Building2 className="mx-auto size-8 text-cta" />
          <h3 className="mt-3 font-semibold">District Profile</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get a public profile page showcasing all your open positions.
          </p>
        </div>
      </div>

      <div className="mt-12 flex gap-4">
        <Link
          href="/for-schools/login"
          className="inline-flex h-11 items-center rounded-lg border border-input bg-background px-8 text-sm font-medium transition-colors hover:bg-accent"
        >
          Log In
        </Link>
        <Link
          href="/for-schools/signup"
          className="inline-flex h-11 items-center rounded-lg bg-cta px-8 text-sm font-medium text-cta-foreground transition-colors hover:bg-cta/90"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
