"use server";

import { createClient } from "@/lib/supabase/server";

type ReportReason = "broken_link" | "filled_expired" | "other";

export async function reportJob(
  jobId: string,
  reason: ReportReason,
  details?: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("report_flags")
    .insert({ job_id: jobId, reason, details });

  if (error) throw new Error("Failed to submit report");
  return { success: true };
}
