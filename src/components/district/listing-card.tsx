"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VerifiedBadge } from "./verified-badge";
import { delistJob, relistJob, updateManualJob } from "@/lib/actions/listing-actions";
import { formatRelativeDate } from "@/lib/format-date";
import { ExternalLink, DollarSign } from "lucide-react";
import type { DistrictJob } from "@/lib/queries/get-district-jobs";

export function ListingCard({ job }: { job: DistrictJob }) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const isDelisted = !!job.delisted_at;

  function handleDelist() {
    startTransition(async () => {
      await delistJob(job.id);
      setModalOpen(false);
    });
  }

  function handleRelist() {
    startTransition(async () => {
      await relistJob(job.id);
      setModalOpen(false);
    });
  }

  function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateManualJob(job.id, formData);
      setIsEditing(false);
      setModalOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-left transition-colors hover:bg-muted/50"
      >
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
      </button>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {job.title}
            </DialogTitle>
          </DialogHeader>

          {isEditing && job.is_manual ? (
            <form onSubmit={handleEdit} className="space-y-3">
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
                  defaultValue={job.description ?? ""}
                  rows={4}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`salaryRaw-${job.id}`}>Salary</Label>
                <Input
                  id={`salaryRaw-${job.id}`}
                  name="salaryRaw"
                  defaultValue={job.salary_raw ?? ""}
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
          ) : (
            <div className="space-y-4">
              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{job.schoolName}</span>
                <VerifiedBadge />
                {job.is_manual ? (
                  <Badge variant="secondary">Manual</Badge>
                ) : (
                  <Badge variant="outline">Scraped</Badge>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                Posted {formatRelativeDate(job.first_seen_at)}
              </div>

              {/* Salary */}
              {job.salary_raw && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="size-3.5 text-muted-foreground" />
                  <span>{job.salary_raw}</span>
                </div>
              )}

              {/* Description */}
              {job.description && (
                <div>
                  <h3 className="text-sm font-medium text-foreground">
                    Description
                  </h3>
                  <div
                    className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: job.description }}
                  />
                </div>
              )}

              {/* Link to original posting */}
              {job.url && (
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-cta hover:underline"
                >
                  View Original Posting
                  <ExternalLink className="size-3.5" />
                </a>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 border-t pt-4">
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
                    className="text-destructive hover:text-destructive"
                  >
                    {isPending ? "..." : "Delist"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
