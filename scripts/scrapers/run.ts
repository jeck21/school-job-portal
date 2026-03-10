/**
 * CLI entrypoint for scraper pipeline.
 * Usage: npx tsx scripts/scrapers/run.ts <adapter-name>
 * Example: npx tsx scripts/scrapers/run.ts pareap
 */
import "dotenv/config";
import { ingestPareap } from "./adapters/pareap/ingest";

const ADAPTERS: Record<string, () => Promise<unknown>> = {
  pareap: ingestPareap,
};

async function main() {
  const adapterName = process.argv[2];

  if (!adapterName) {
    console.error("Usage: npx tsx scripts/scrapers/run.ts <adapter-name>");
    console.error(`Available adapters: ${Object.keys(ADAPTERS).join(", ")}`);
    process.exit(1);
  }

  const ingestFn = ADAPTERS[adapterName.toLowerCase()];

  if (!ingestFn) {
    console.error(`Unknown adapter: "${adapterName}"`);
    console.error(`Available adapters: ${Object.keys(ADAPTERS).join(", ")}`);
    process.exit(1);
  }

  console.log(`\n--- Starting ${adapterName} scrape ---\n`);

  const result = await ingestFn();

  // Type-safe stats access for ScrapeResult
  if (result && typeof result === "object" && "stats" in result) {
    const { stats, errors } = result as {
      stats: { added: number; updated: number; skipped: number; failed: number };
      errors: Array<{ message: string }>;
    };

    console.log("\n--- Scrape Results ---");
    console.log(`  Added:   ${stats.added}`);
    console.log(`  Updated: ${stats.updated}`);
    console.log(`  Skipped: ${stats.skipped}`);
    console.log(`  Failed:  ${stats.failed}`);

    if (errors.length > 0) {
      console.log(`\n  Errors (${errors.length}):`);
      for (const err of errors) {
        console.log(`    - ${err.message}`);
      }
    }

    console.log("\n--- Done ---\n");

    // Exit with error code if total failure (0 jobs and errors exist)
    if (stats.added + stats.updated === 0 && errors.length > 0) {
      process.exit(1);
    }
  }
}

main().catch((error) => {
  console.error("\n[FATAL] Scraper failed:", error.message || error);
  process.exit(1);
});
