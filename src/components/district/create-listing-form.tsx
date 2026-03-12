"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createManualJob } from "@/lib/actions/listing-actions";
import { GRADE_BANDS, SUBJECT_AREAS } from "@/lib/filter-options";

export function CreateListingForm() {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setSuccess(false);
    setError(null);
    startTransition(async () => {
      const result = await createManualJob(formData);
      if (result.success) {
        setSuccess(true);
        // Reset form by clearing state after a moment
      } else {
        setError(result.error ?? "Failed to create listing");
      }
    });
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold text-foreground">
        Create New Job Listing
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Post a new job listing for your district. This will appear with a
        Verified badge.
      </p>

      {success && (
        <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
          Job listing created successfully.
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="mt-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="title">Job Title *</Label>
          <Input
            id="title"
            name="title"
            placeholder="e.g. 3rd Grade Teacher"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Job description, responsibilities, qualifications..."
            rows={6}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="schoolName">School Name</Label>
          <Input
            id="schoolName"
            name="schoolName"
            placeholder="e.g. Lincoln Elementary"
          />
        </div>

        <div className="space-y-2">
          <Label>Grade Band</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {GRADE_BANDS.map((gb) => (
              <label
                key={gb.value}
                className="flex items-center gap-2 text-sm"
              >
                <input type="checkbox" name="gradeBand" value={gb.value} className="size-4 rounded border-input accent-primary" />
                {gb.label}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Subject Area</Label>
          <div className="grid grid-cols-2 gap-2">
            {SUBJECT_AREAS.slice(0, 12).map((sa) => (
              <label
                key={sa.value}
                className="flex items-center gap-2 text-sm"
              >
                <input type="checkbox" name="subjectArea" value={sa.value} className="size-4 rounded border-input accent-primary" />
                {sa.label}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="salaryRaw">Salary Information</Label>
          <Input
            id="salaryRaw"
            name="salaryRaw"
            placeholder="e.g. $45,000 - $65,000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="url">Application URL *</Label>
          <Input
            id="url"
            name="url"
            type="url"
            placeholder="https://..."
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiresAt">Application Deadline</Label>
          <Input id="expiresAt" name="expiresAt" type="date" />
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="bg-cta text-cta-foreground hover:bg-cta/90"
        >
          {isPending ? "Creating..." : "Create Listing"}
        </Button>
      </form>
    </div>
  );
}
