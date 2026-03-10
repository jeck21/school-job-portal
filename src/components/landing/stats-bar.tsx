const stats = [
  { label: "Active Listings", value: "--" },
  { label: "PA Sources", value: "--" },
  { label: "Districts", value: "--" },
] as const;

export function StatsBar() {
  return (
    <section className="border-t border-border/50 py-12">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-8 px-4 sm:flex-row sm:gap-0 sm:divide-x sm:divide-border/50">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-1 px-12"
          >
            <span className="text-2xl font-bold text-muted-foreground/60">
              {stat.value}
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/40">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground/30">
        Stats will populate as data collection begins
      </p>
    </section>
  );
}
