import type { Metadata } from "next";
import Link from "next/link";
import {
  Search,
  MapPin,
  ShieldCheck,
  RefreshCw,
  Heart,
  Building2,
  Users,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About | PA Educator Jobs",
  description:
    "Built by a Pennsylvania educator who saw the problem firsthand. Learn how PA Educator Jobs brings every relevant job opening into one place.",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-3xl">
        {/* Section 1: Mission / Origin Story */}
        <section className="relative rounded-2xl border border-cta/20 bg-gradient-to-br from-cta/5 via-transparent to-primary/5 px-6 py-12 sm:px-10">
          <Heart className="mb-4 size-8 text-cta" />
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Built by an educator who saw the problem firsthand
          </h1>
          <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted-foreground">
            <p>
              As a Pennsylvania educator, I spent way too many evenings
              cross-referencing PAREAP, PAeducator, SchoolSpring, and individual
              district websites just to see what jobs were out there. Every
              source had different search tools, different update schedules, and
              different quirks. Listings would vanish without warning. Filters
              barely worked. It was exhausting.
            </p>
            <p>
              I built PA Educator Jobs because I wanted one place where every
              relevant opening across Pennsylvania is collected, kept current,
              and actually easy to search. No stale postings, no missing
              listings, no guesswork.
            </p>
          </div>
        </section>

        {/* Section 2: Value for Educators */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight">
            What educators get
          </h2>
          <p className="mt-2 text-muted-foreground">
            Everything you need to find the right role, without the runaround.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="group rounded-xl border bg-card p-5 transition-colors hover:border-cta/40 hover:bg-cta/5">
              <Search className="size-6 text-cta" />
              <h3 className="mt-3 font-semibold">Every PA opening, one place</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                We pull listings from PAREAP, PAeducator, SchoolSpring, and
                individual district sites so you don&apos;t have to check them
                all yourself.
              </p>
            </div>
            <div className="group rounded-xl border bg-card p-5 transition-colors hover:border-cta/40 hover:bg-cta/5">
              <MapPin className="size-6 text-cta" />
              <h3 className="mt-3 font-semibold">Filters that actually work</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Search by location radius, subject area, certification type, and
                more. Find what&apos;s relevant to you in seconds, not hours.
              </p>
            </div>
            <div className="group rounded-xl border bg-card p-5 transition-colors hover:border-cta/40 hover:bg-cta/5">
              <RefreshCw className="size-6 text-cta" />
              <h3 className="mt-3 font-semibold">No stale postings</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Listings are verified daily. If a job has been filled or taken
                down at the source, it won&apos;t waste your time here.
              </p>
            </div>
            <div className="group rounded-xl border bg-card p-5 transition-colors hover:border-cta/40 hover:bg-cta/5">
              <Heart className="size-6 text-cta" />
              <h3 className="mt-3 font-semibold">Free forever for job seekers</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                This was built for educators. Searching for your next role will
                always be completely free.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Value for Districts */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight">
            What districts get
          </h2>
          <p className="mt-2 text-muted-foreground">
            Reach qualified candidates across Pennsylvania at no cost.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/5">
              <Building2 className="size-6 text-primary" />
              <h3 className="mt-3 font-semibold">Free verified profiles</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Claim your district&apos;s profile to manage listings and
                showcase your openings with a verified badge.
              </p>
            </div>
            <div className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/5">
              <ShieldCheck className="size-6 text-primary" />
              <h3 className="mt-3 font-semibold">Verified badge builds trust</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Educators see that your listings are directly managed by your
                team, building confidence in the posting.
              </p>
            </div>
            <div className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/5">
              <Users className="size-6 text-primary" />
              <h3 className="mt-3 font-semibold">Reach more candidates</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your listings appear alongside every other PA opening,
                increasing visibility to educators actively searching.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Contact / CTA */}
        <section className="mt-16 rounded-2xl border border-cta/20 bg-gradient-to-br from-cta/5 to-transparent p-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Get in touch
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Have feedback, a question, or want to partner with us? I&apos;d love
            to hear from you. This project is a work in progress and your input
            makes it better.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/coaching"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-cta px-6 text-sm font-medium text-cta-foreground transition-colors hover:bg-cta/90"
            >
              Looking for career coaching?
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/for-schools/signup"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-input bg-background px-6 text-sm font-medium transition-colors hover:bg-accent"
            >
              District sign up
              <Building2 className="size-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
