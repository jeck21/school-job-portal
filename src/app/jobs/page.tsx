import { Briefcase } from "lucide-react";

export default function JobsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Job Listings</h1>
      <p className="mt-2 text-muted-foreground">
        Browse all PA educator job openings. Listings coming soon.
      </p>

      {/* Empty state placeholder */}
      <div className="mt-12 flex flex-col items-center justify-center rounded-lg border border-dashed border-border/50 py-24 text-center">
        <Briefcase className="size-12 text-muted-foreground/50" />
        <p className="mt-4 text-lg font-medium text-muted-foreground">
          No listings yet
        </p>
        <p className="mt-1 text-sm text-muted-foreground/70">
          Job listings will appear here once data collection begins.
        </p>
      </div>
    </div>
  );
}
