import Link from "next/link";
import type { Metadata } from "next";
import { getAllVerifiedDistricts } from "@/lib/queries/get-all-districts";
import { VerifiedBadge } from "@/components/district/verified-badge";
import { ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Verified School Districts | PA School Jobs",
  description:
    "Browse verified Pennsylvania school districts actively hiring educators. View open positions and apply directly.",
};

export default async function DistrictsPage() {
  const districts = await getAllVerifiedDistricts();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Verified School Districts
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          These Pennsylvania school districts have verified their accounts and
          manage their job listings directly on PA School Jobs.
        </p>
      </div>

      {districts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/50 py-16 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            No verified districts yet
          </p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground/70">
            School districts can verify their accounts to manage listings and
            appear here. Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {districts.map((district) => (
            <Link
              key={district.id}
              href={`/districts/${district.slug}`}
              className="group rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <h2 className="font-medium text-foreground group-hover:text-cta">
                  {district.name}
                </h2>
                <VerifiedBadge />
              </div>

              {district.website && (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <ExternalLink className="size-3" />
                  {district.website.replace(/^https?:\/\//, "")}
                </p>
              )}

              <p className="mt-2 text-sm text-muted-foreground">
                {district.jobCount} open position
                {district.jobCount !== 1 ? "s" : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
