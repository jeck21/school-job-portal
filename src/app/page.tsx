import { Hero } from "@/components/landing/hero";
import { AudienceCards } from "@/components/landing/audience-cards";
import { StatsBar } from "@/components/landing/stats-bar";

export default function Home() {
  return (
    <>
      <Hero />
      <AudienceCards />
      <StatsBar />
    </>
  );
}
