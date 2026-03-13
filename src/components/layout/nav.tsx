"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function Nav({
  onLinkClick,
  isLoggedIn = false,
}: {
  onLinkClick?: () => void;
  isLoggedIn?: boolean;
}) {
  const pathname = usePathname();

  // When logged in, replace "For Schools" with "Dashboard"
  const navItems = siteConfig.nav.map((item) =>
    isLoggedIn && item.href === "/for-schools"
      ? { label: "Dashboard", href: "/for-schools/dashboard" }
      : item
  );

  return (
    <nav className="flex items-center gap-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onLinkClick}
          className={cn(
            "relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            pathname === item.href
              ? "text-foreground after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-4 after:-translate-x-1/2 after:rounded-full after:bg-cta"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
