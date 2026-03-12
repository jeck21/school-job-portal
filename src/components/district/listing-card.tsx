"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { VerifiedBadge } from "./verified-badge";
import { delistJob, relistJob, updateManualJob } from "@/lib/actions/listing-actions";
import { formatRelativeDate } from "@/lib/format-date";
import type { DistrictJob } from "@/lib/queries/get-district-jobs";

export function ListingCard({ job }: { job: DistrictJob }) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const isDelisted = !!job.delisted_at;

  function handleDelist() {
    startTransition(async () => {
      await delistJob(job.id);
    });
  }

  function handleRelist() {
    startTransition(async () => {
      await relistJob(job.id);
    });
  }

  function handleEdit(formData: FormData) {
    startTransition(async () => {
      await updateManualJob(job.id, formData);
      setIsEditing(false);
    });
  }

  if (isEditing && job.is_manual) {
    return (
      <div className="rounded-lg border border-border p-4">
        <form action={handleEdit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor={`title-${job.id}`}>Title</Label>
            <Input
              id={`title-${job.id}`}
              name="title"
              defaultValue={job.title}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`url-${job.id}`}>Application URL</Label>
            <Input
              id={`url-${job.id}`}
              name="url"
              type="url"
              defaultValue={job.url ?? ""}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`description-${job.id}`}>Description</Label>
            <Textarea
              id={`description-${job.id}`}
              name="description"
              rows={4}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isPending}
              className="bg-cta text-cta-foreground hover:bg-cta/90"
            >
              {isPending ? "Saving..." : "Save"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-foreground">
            {job.title}
          </span>
          <VerifiedBadge />
          {job.is_manual ? (
            <Badge variant="secondary">Manual</Badge>
          ) : (
            <Badge variant="outline">Scraped</Badge>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{job.schoolName}</span>
          <span>&middot;</span>
          <span>Posted {formatRelativeDate(job.first_seen_at)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link href={`/jobs/${job.id}`}>
          <Button variant="outline" size="sm">
            View
          </Button>
        </Link>

        {job.is_manual && !isDelisted && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        )}

        {isDelisted ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRelist}
            disabled={isPending}
          >
            {isPending ? "..." : "Re-list"}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelist}
            disabled={isPending}
          >
            {isPending ? "..." : "Delist"}
          </Button>
        )}
      </div>
    </div>
  );
}
