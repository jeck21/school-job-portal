import { notFound } from "next/navigation";
import { getJobDetail } from "@/lib/queries/get-job-detail";
import { JobDetail } from "@/components/jobs/job-detail";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const job = await getJobDetail(id);
    return {
      title: `${job.title} - ${job.schools?.name ?? "Job"} | PA School Jobs`,
      description: job.description?.slice(0, 160) ?? undefined,
    };
  } catch {
    return { title: "Job Not Found" };
  }
}

export default async function JobPage({
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <JobDetail job={job} asModal={false} />
    </div>
  );
}
