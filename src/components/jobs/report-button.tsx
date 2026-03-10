"use client";

import { useState } from "react";
import { Flag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { reportJob } from "@/lib/actions/report-job";

type ReportReason = "broken_link" | "filled_expired" | "other";

export function ReportButton({ jobId }: { jobId: string }) {
  const [reported, setReported] = useState(false);

  async function handleReport(reason: ReportReason) {
    try {
      await reportJob(jobId, reason);
      setReported(true);
      setTimeout(() => setReported(false), 2000);
    } catch {
      // Silently fail -- non-critical action
    }
  }

  if (reported) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Check className="size-4" />
        Reported
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm">
            <Flag className="size-4" />
            Report an issue
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleReport("broken_link")}>
          Link is broken
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleReport("filled_expired")}>
          Job is filled/expired
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleReport("other")}>
          Other
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
