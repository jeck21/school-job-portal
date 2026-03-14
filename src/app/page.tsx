import type { Metadata } from "next";
import { Hero } from "@/components/landing/hero";
import { AudienceCards } from "@/components/landing/audience-cards";
import { StatsBar } from "@/components/landing/stats-bar";

export const revalidate = 3600; // 1 hour -- landing page shows live stats

export const metadata: Metadata = {
  title: "PA Educator Jobs - Find Every PA Teaching Position",
  description:
    "Browse and search all Pennsylvania educator job openings in one place. Filter by location, subject, salary, and more.",
  openGraph: {
    title: "PA Educator Jobs",
    description:
      "Find every relevant PA educator job opening in one place.",
    url: "https://school-job-portal.vercel.app",
    siteName: "PA Educator Jobs",
    type: "website",
  },
};

export default function Home() {
  return (
    <>
      <Hero />
      <AudienceCards />
      <StatsBar />
    </>
  );
}
