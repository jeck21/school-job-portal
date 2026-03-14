import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-8xl font-bold text-primary">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-muted-foreground">
        Page not found
      </h2>
      <p className="mt-2 max-w-md text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="mt-8 flex gap-4">
        <Link
          href="/jobs"
          className={cn(
            buttonVariants(),
            "bg-cta text-cta-foreground hover:bg-cta/90"
          )}
        >
          Browse Jobs
        </Link>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Home
        </Link>
      </div>
    </main>
  );
}
