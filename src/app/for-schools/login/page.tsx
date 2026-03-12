import Link from "next/link";
import { login } from "@/lib/actions/auth-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;

  return (
    <div className="container mx-auto flex flex-col items-center px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight">Log In</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to your district account.
        </p>

        {error === "confirmation" && (
          <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            Email confirmation failed. Please try again or request a new
            confirmation link.
          </div>
        )}

        {error === "invalid" && (
          <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            Invalid email or password. Please try again.
          </div>
        )}

        <form action={login} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@school.k12.pa.us"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Your password"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-cta text-cta-foreground hover:bg-cta/90"
          >
            Log In
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/for-schools/signup"
            className="font-medium text-cta hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
