import { createAdminClient } from "@/lib/supabase/admin";

async function getStats() {
  const supabase = createAdminClient();

  const [jobsResult, sourcesResult, districtsResult] = await Promise.all([
    supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("sources")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("districts")
      .select("*", { count: "exact", head: true }),
  ]);

  return {
    jobs: jobsResult.count ?? 0,
    sources: sourcesResult.count ?? 0,
    districts: districtsResult.count ?? 0,
  };
}

export async function StatsBar() {
  const data = await getStats();

  const stats = [
    { label: "Active Listings", value: data.jobs.toLocaleString() },
    { label: "PA Sources", value: data.sources.toString() },
    { label: "Districts", value: data.districts.toLocaleString() },
  ];

  return (
    <section className="border-t border-border/50 py-12">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-8 px-4 sm:flex-row sm:gap-0 sm:divide-x sm:divide-border/50">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-1 px-12"
          >
            <span className="text-2xl font-bold text-cta">
              {stat.value}
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
