"use client";

import { useRouter } from "next/navigation";
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

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          router.back();
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <JobDetail job={job} asModal={true} />
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
