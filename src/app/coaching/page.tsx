import type { Metadata } from "next";
import { CoachingForm } from "./coaching-form";
import { Compass } from "lucide-react";

export const revalidate = 86400; // 24 hours -- content rarely changes

export const metadata: Metadata = {
  title: "Career Coaching | PA Educator Jobs",
  description:
    "Get personalized career guidance for your next role in Pennsylvania education. Whether you're starting out or making a change, we can help.",
  openGraph: {
    title: "Career Coaching | PA Educator Jobs",
    description:
      "Get personalized career guidance for your next role in Pennsylvania education.",
    url: "https://school-job-portal.vercel.app/coaching",
    type: "website",
  },
};

export default function CoachingPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl">
        {/* Intro section */}
        <section className="mb-10">
          <Compass className="mb-4 size-8 text-cta" />
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Career Coaching
          </h1>
          <div className="mt-4 space-y-3 text-muted-foreground">
            <p>
              Whether you&apos;re a first-year teacher looking for the right
              fit or a veteran educator considering a career change,
              personalized guidance can make all the difference.
            </p>
            <p>
              Fill out the form below and I&apos;ll reach out to discuss your
              goals, review your materials, and help you navigate the
              Pennsylvania education job market with confidence.
            </p>
          </div>
        </section>

        {/* Form */}
        <section className="rounded-2xl border bg-card p-6 sm:p-8">
          <CoachingForm />
        </section>
      </div>
    </div>
  );
}
