"use client";

import { useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold text-primary">Something went wrong</h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        We&apos;re sorry, an unexpected error occurred.
      </p>

      <div className="mt-8 flex gap-4">
        <Button
          onClick={reset}
          className="bg-cta text-cta-foreground hover:bg-cta/90"
        >
          Try Again
        </Button>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Go Home
        </Link>
      </div>
    </main>
  );
}
