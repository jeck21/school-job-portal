"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitCoachingRequest } from "@/lib/actions/coaching-action";
import { CheckCircle, Loader2 } from "lucide-react";

type FormState = {
  success: boolean;
  message: string;
} | null;

async function formAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  return submitCoachingRequest(formData);
}

export function CoachingForm() {
  const [state, action, isPending] = useActionState(formAction, null);

  if (state?.success) {
    return (
      <div className="rounded-xl border border-cta/30 bg-cta/5 p-8 text-center">
        <CheckCircle className="mx-auto size-10 text-cta" />
        <p className="mt-4 text-lg font-semibold">{state.message}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Check your inbox for a confirmation. If you don&apos;t hear back,
          feel free to submit again.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      {state && !state.success && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            required
            placeholder="Your full name"
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="(555) 123-4567"
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currentRole">Current Role</Label>
          <Input
            id="currentRole"
            name="currentRole"
            placeholder="e.g. 5th Grade Teacher"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="yearsExperience">Years of Experience</Label>
          <Input
            id="yearsExperience"
            name="yearsExperience"
            type="number"
            min={0}
            placeholder="0"
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="positionSought">Position Sought</Label>
          <Input
            id="positionSought"
            name="positionSought"
            placeholder="e.g. High School Math Teacher"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message / Goals</Label>
        <Textarea
          id="message"
          name="message"
          rows={4}
          placeholder="Tell me about your career goals, what you're looking for, or any questions you have..."
          disabled={isPending}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="warm-glow-hover inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-cta px-8 text-sm font-medium text-cta-foreground transition-all duration-200 hover:scale-[1.02] hover:bg-cta/90 disabled:opacity-60 sm:w-auto"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Send Request"
        )}
      </button>
    </form>
  );
}
