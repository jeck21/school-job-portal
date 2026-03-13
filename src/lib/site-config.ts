export const siteConfig = {
  name: "PA Educator Jobs",
  tagline: "Connecting the right educators with the right jobs",
  description:
    "Find every relevant PA educator job opening in one place with filters that actually work.",
  url: "https://paeducatorjobs.vercel.app",
  nav: [
    { label: "Home", href: "/" },
    { label: "Jobs", href: "/jobs" },
    { label: "About", href: "/about" },
    { label: "Coaching", href: "/coaching" },
    { label: "Districts", href: "/districts" },
    { label: "For Schools", href: "/for-schools" },
  ],
} as const;
