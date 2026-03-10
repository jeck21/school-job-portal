import { notFound } from "next/navigation";
import { getJobDetail } from "@/lib/queries/get-job-detail";
import { JobDetailModal } from "@/components/jobs/job-detail-modal";

export default async function JobModalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let job;
  try {
    job = await getJobDetail(id);
  } catch {
    notFound();
  }

  if (!job) {
    notFound();
  }

  return <JobDetailModal job={job} />;
}
