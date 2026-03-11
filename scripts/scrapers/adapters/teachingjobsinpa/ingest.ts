/**
 * TeachingJobsInPA ingestion pipeline.
 * Uses the shared ingestion pipeline with the TeachingJobsInPA adapter.
 */
import { runIngestion } from "../../lib/ingest-pipeline";
import { TeachingJobsInPAAdapter } from "./index";

export async function ingestTeachingJobsInPA() {
  return runIngestion(new TeachingJobsInPAAdapter(), {
    name: "TeachingJobsInPA",
    slug: "teachingjobsinpa",
    baseUrl: "https://www.teachingjobsinpa.com",
    scraperType: "cheerio",
  });
}
