import { notFound } from "next/navigation";
import { getJobDetail } from "@/lib/queries/get-job-detail";
import { JobDetail } from "@/components/jobs/job-detail";
import type { Metadata } from "next";

const BASE_URL = "https://school-job-portal.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const job = await getJobDetail(id);
    const description = job.description?.slice(0, 160) ?? undefined;

    return {
      title: `${job.title} - ${job.schools?.name ?? "Job"} | PA School Jobs`,
      description,
      openGraph: {
        title: `${job.title} - ${job.schools?.name ?? "Job"}`,
        description:
          description ?? "View this job opening on PA Educator Jobs.",
        type: "website",
        url: `${BASE_URL}/jobs/${id}`,
      },
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description || "",
    datePosted: job.first_seen_at,
    hiringOrganization: {
      "@type": "Organization",
      name: job.schools?.name || "Unknown School",
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressRegion: "PA",
        addressLocality: job.city || undefined,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <JobDetail job={job} asModal={false} />
      </div>
    </>
  );
}
