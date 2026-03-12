import Link from "next/link";
import { signup } from "@/lib/actions/auth-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ "check-email"?: string; error?: string }>;
}) {
  const params = await searchParams;
  const checkEmail = params["check-email"] === "true";
  const error = params.error;

  if (checkEmail) {
    return (
      <div className="container mx-auto flex flex-col items-center px-4 py-16">
        <div className="w-full max-w-sm text-center">
          <CheckCircle className="mx-auto size-12 text-cta" />
          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            Check Your Email
          </h1>
          <p className="mt-2 text-muted-foreground">
            We sent a confirmation link to your email address. Click the link to
            verify your account and get started.
          </p>
          <Link
            href="/for-schools/login"
            className="mt-6 inline-flex h-10 items-center rounded-lg border border-input bg-background px-6 text-sm font-medium transition-colors hover:bg-accent"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex flex-col items-center px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight">Create Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign up to manage your district&apos;s job listings.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {decodeURIComponent(error)}
          </div>
        )}

        <form action={signup} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="districtName">District / Organization Name</Label>
            <Input
              id="districtName"
              name="districtName"
              type="text"
              placeholder="Springfield School District"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@school.k12.pa.us"
              required
            />
            <p className="text-xs text-muted-foreground">
              .k12.pa.us emails are automatically verified. Other domains will
              need manual approval.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-cta text-cta-foreground hover:bg-cta/90"
          >
            Sign Up
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/for-schools/login"
            className="font-medium text-cta hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
