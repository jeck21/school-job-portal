import { Search, Building2, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const audiences = [
  {
    title: "For Educators",
    description: "Find your next opportunity across Pennsylvania",
    icon: Search,
    benefits: [
      "Aggregated listings from every major PA source",
      "Powerful filters by location, grade, and subject",
      "Fresh data updated regularly",
      "Completely free to use",
    ],
  },
  {
    title: "For Schools & Districts",
    description: "Reach more qualified candidates",
    icon: Building2,
    benefits: [
      "Reach educators actively searching for roles",
      "Verified, up-to-date listings",
      "Manage and highlight your postings",
      "Showcase your district to candidates",
    ],
  },
] as const;

export function AudienceCards() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-2">
        {audiences.map((audience) => (
          <Card
            key={audience.title}
            className="warm-glow-hover group border-border/60 bg-card/80 transition-all duration-200 hover:-translate-y-0.5 hover:border-cta/30 hover:bg-cta/[0.03]"
          >
            <CardHeader>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-cta/10 transition-colors duration-200 group-hover:bg-cta/15">
                  <audience.icon className="size-5 text-cta" />
                </div>
                <CardTitle className="text-xl">{audience.title}</CardTitle>
              </div>
              <CardDescription className="text-sm">
                {audience.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {audience.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-cta" />
                    <span className="text-sm text-muted-foreground">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
