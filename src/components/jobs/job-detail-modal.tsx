"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { JobDetail } from "@/components/jobs/job-detail";

type JobDetailData = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  location_raw: string | null;
  city: string | null;
  state: string;
  school_type: string | null;
  salary_raw: string | null;
  salary_mentioned: boolean | null;
  first_seen_at: string;
  last_verified_at: string;
  is_active: boolean;
  schools: { name: string; district_name: string | null } | null;
  claimed_by_district_id?: string | null;
};

export function JobDetailModal({ job }: { job: JobDetailData }) {
  const router = useRouter();
  const pathname = usePathname();
  const closingRef = useRef(false);

  // If pathname is /jobs (not /jobs/[id]), the modal is stale — force close
  useEffect(() => {
    if (pathname === "/jobs" && !closingRef.current) {
      closingRef.current = true;
      window.location.href = "/jobs";
    }
  }, [pathname]);

  const closeModal = useCallback(() => {
    closingRef.current = true;
    // router.back() properly clears the intercepting route parallel slot.
    // If history is unreliable (tab switching), the useEffect above catches
    // the stale state and forces a hard navigation.
    router.back();
  }, [router]);

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) closeModal(); }}>
      <DialogContent
        className="sm:max-w-2xl max-h-[85vh] overflow-y-auto"
        showCloseButton={false}
      >
        <button
          type="button"
          onClick={closeModal}
          className="absolute top-2 right-2 z-10 rounded-sm p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
        <DialogHeader>
          <JobDetail job={job} asModal={true} />
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
