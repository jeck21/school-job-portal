/**
 * SchoolSpring ingestion pipeline.
 * Uses the shared ingestion pipeline with the SchoolSpring adapter.
 */
import { runIngestion } from "../../lib/ingest-pipeline";
import { SchoolSpringAdapter } from "./index";

export async function ingestSchoolSpring() {
  return runIngestion(new SchoolSpringAdapter(), {
    name: "SchoolSpring",
    slug: "schoolspring",
    baseUrl: "https://employer.schoolspring.com",
    scraperType: "cheerio",
  });
}
