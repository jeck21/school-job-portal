/**
 * PAREAP ingestion pipeline.
 * Uses the shared ingestion pipeline with the PAREAP adapter.
 */
import { runIngestion } from "../../lib/ingest-pipeline";
import { PareapAdapter } from "./index";

export async function ingestPareap() {
  return runIngestion(new PareapAdapter(), {
    name: "PAREAP",
    slug: "pareap",
    baseUrl: "https://www.pareap.net",
    scraperType: "cheerio",
  });
}
