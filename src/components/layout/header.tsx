"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, Menu, X } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { buttonVariants } from "@/components/ui/button";
import { logout } from "@/lib/actions/auth-actions";
import { Nav } from "@/components/layout/nav";
import { cn } from "@/lib/utils";

export function Header({ userEmail }: { userEmail: string | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLoggedIn = !!userEmail;

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo / Site Name */}
        <Link href="/" className="flex items-center gap-2">
          <GraduationCap className="size-6 text-primary" />
          <span className="text-base font-semibold tracking-tight">
            {siteConfig.name}
          </span>
        </Link>

        {/* Desktop Nav (centered) */}
        <div className="hidden md:flex">
          <Nav isLoggedIn={isLoggedIn} />
        </div>

        {/* Desktop right side */}
        <div className="hidden items-center gap-3 md:flex">
          {isLoggedIn ? (
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Log Out
              </button>
            </form>
          ) : (
            <Link href="/jobs" className={cn(buttonVariants({ size: "sm" }))}>
              Browse Jobs
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile Nav */}
      <div
        className={cn(
          "overflow-hidden border-t border-border/50 md:hidden",
          mobileOpen ? "block" : "hidden"
        )}
      >
        <div className="flex flex-col gap-2 px-4 py-4">
          <Nav onLinkClick={() => setMobileOpen(false)} isLoggedIn={isLoggedIn} />
          {isLoggedIn ? (
            <form action={logout}>
              <button
                type="submit"
                className="w-full rounded-md px-3 py-1.5 text-left text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Log Out
              </button>
            </form>
          ) : (
            <Link
              href="/jobs"
              onClick={() => setMobileOpen(false)}
              className={cn(buttonVariants({ size: "sm" }), "mt-2 w-full")}
            >
              Browse Jobs
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
