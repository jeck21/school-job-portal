/**
 * PAeducator.net ingestion pipeline.
 * Uses the shared ingestion pipeline with the PAeducator adapter.
 */
import { runIngestion } from "../../lib/ingest-pipeline";
import { PAeducatorAdapter } from "./index";

export async function ingestPaeducator() {
  return runIngestion(new PAeducatorAdapter(), {
    name: "PAeducator.net",
    slug: "paeducator",
    baseUrl: "https://www.paeducator.net",
    scraperType: "api",
  });
}
