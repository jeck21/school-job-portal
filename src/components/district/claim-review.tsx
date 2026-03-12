"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { claimJobs } from "@/lib/actions/claim-actions";
import type { ClaimMatch } from "@/lib/queries/get-claim-matches";

type Props = {
  matches: ClaimMatch[];
  districtId: string;
};

export function ClaimReview({ matches, districtId }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (matches.length === 0) return null;

  function handleClaimAll() {
    startTransition(async () => {
      const jobIds = matches.map((m) => m.jobId);
      const result = await claimJobs(jobIds, districtId);
      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-lg border border-cta/30 bg-cta/5 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-foreground">
            {matches.length} unclaimed job{matches.length === 1 ? "" : "s"} found for your district
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            These listings match your district and can be claimed.
          </p>
        </div>
        <Button
          onClick={handleClaimAll}
          disabled={isPending}
          className="bg-cta text-cta-foreground hover:bg-cta/90"
        >
          {isPending ? "Claiming..." : `Claim All (${matches.length})`}
        </Button>
      </div>

      <div className="mt-3 space-y-1.5">
        {matches.slice(0, 10).map((match) => (
          <div
            key={match.jobId}
            className="flex items-center justify-between rounded bg-background/50 px-3 py-2 text-sm"
          >
            <div>
              <span className="font-medium">{match.title}</span>
              <span className="ml-2 text-muted-foreground">
                {match.schoolName}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {Math.round(match.score * 100)}% match
            </span>
          </div>
        ))}
        {matches.length > 10 && (
          <p className="text-xs text-muted-foreground">
            ...and {matches.length - 10} more
          </p>
        )}
      </div>
    </div>
  );
}
