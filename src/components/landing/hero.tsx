"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      {/* Subtle gradient glow behind hero */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
          {siteConfig.tagline}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          {siteConfig.description} Whether you&apos;re an educator seeking your
          next role or a school looking for the perfect candidate, start here.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/jobs"
            className={cn(
              buttonVariants({ size: "lg" }),
              "px-8 text-base"
            )}
          >
            Browse Jobs
          </Link>
          <Link
            href="/for-schools"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "px-8 text-base"
            )}
          >
            For Schools
          </Link>
        </div>
      </div>
    </section>
  );
}
