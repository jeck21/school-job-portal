/**
 * CLI entrypoint for scraper pipeline.
 * Usage: npx tsx scripts/scrapers/run.ts <adapter-name>
 * Example: npx tsx scripts/scrapers/run.ts pareap
 *          npx tsx scripts/scrapers/run.ts all
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config(); // also load .env as fallback
import { ingestPareap } from "./adapters/pareap/ingest";
import { ingestPaeducator } from "./adapters/paeducator/ingest";
import { ingestSchoolSpring } from "./adapters/schoolspring/ingest";
import { ingestTeachingJobsInPA } from "./adapters/teachingjobsinpa/ingest";
import { sendScrapeAlert } from "./lib/alert";

const ADAPTERS: Record<string, () => Promise<unknown>> = {
  pareap: ingestPareap,
  paeducator: ingestPaeducator,
  schoolspring: ingestSchoolSpring,
  teachingjobsinpa: ingestTeachingJobsInPA,
};

const ADAPTER_NAMES = Object.keys(ADAPTERS);

/**
 * Run all adapters sequentially with error isolation.
 * One adapter failing does not prevent others from running.
 */
async function runAll(): Promise<void> {
  const results: { adapter: string; success: boolean; error?: string }[] = [];
  const DELAY_MS = 30_000; // 30s delay between adapters

  for (let i = 0; i < ADAPTER_NAMES.length; i++) {
    const name = ADAPTER_NAMES[i];

    // Delay between adapters (not before the first one)
    if (i > 0) {
      console.log(`\n--- Waiting ${DELAY_MS / 1000}s before next adapter ---\n`);
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }

    console.log(`\n--- Starting ${name} scrape (${i + 1}/${ADAPTER_NAMES.length}) ---\n`);

    try {
      const result = await ADAPTERS[name]();

      if (result && typeof result === "object" && "stats" in result) {
        const { stats, errors: adapterErrors } = result as {
          stats: { added: number; updated: number; skipped: number; failed: number };
          errors: Array<{ message: string }>;
        };
        console.log(
          `  ${name}: ${stats.added} added, ${stats.updated} updated, ${stats.skipped} skipped, ${stats.failed} failed`
        );

        // Send alert if there were failures
        const status =
          stats.added + stats.updated === 0 && (adapterErrors?.length ?? 0) > 0
            ? "failure"
            : (adapterErrors?.length ?? 0) > 0
              ? "partial_failure"
              : "success";
        try {
          await sendScrapeAlert(name, status, adapterErrors ?? []);
        } catch {
          // Alert failure must not crash scraper
        }
      }

      results.push({ adapter: name, success: true });
    } catch (error) {
      const msg = (error as Error).message || String(error);
      console.error(`\n[ERROR] ${name} failed: ${msg}`);
      try {
        await sendScrapeAlert(name, "failure", [{ message: msg }]);
      } catch {
        // Alert failure must not crash scraper
      }
      results.push({ adapter: name, success: false, error: msg });
    }
  }

  // Summary
  console.log("\n--- All Adapters Summary ---");
  for (const r of results) {
    console.log(`  ${r.adapter}: ${r.success ? "OK" : `FAILED - ${r.error}`}`);
  }

  const failures = results.filter((r) => !r.success);
  if (failures.length > 0) {
    console.error(`\n${failures.length}/${results.length} adapter(s) failed`);
    process.exit(1);
  }

  console.log("\n--- All Done ---\n");
}

async function main() {
  const adapterName = process.argv[2];

  if (!adapterName) {
    console.error("Usage: npx tsx scripts/scrapers/run.ts <adapter-name>");
    console.error(`Available adapters: ${ADAPTER_NAMES.join(", ")}, all`);
    process.exit(1);
  }

  // Handle "all" command
  if (adapterName.toLowerCase() === "all") {
    await runAll();
    return;
  }

  const ingestFn = ADAPTERS[adapterName.toLowerCase()];

  if (!ingestFn) {
    console.error(`Unknown adapter: "${adapterName}"`);
    console.error(`Available adapters: ${ADAPTER_NAMES.join(", ")}, all`);
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

    // Send alert if needed
    const status =
      stats.added + stats.updated === 0 && errors.length > 0
        ? "failure"
        : errors.length > 0
          ? "partial_failure"
          : "success";
    try {
      await sendScrapeAlert(adapterName, status, errors);
    } catch {
      // Alert failure must not crash scraper
    }

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
