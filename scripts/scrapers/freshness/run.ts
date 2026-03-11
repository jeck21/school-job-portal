/**
 * CLI entrypoint for freshness checker.
 * Usage: npx tsx scripts/scrapers/freshness/run.ts
 */
import { runFreshnessCheck } from "./check-freshness";

runFreshnessCheck()
  .then(() => {
    console.log("[freshness] Done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("[freshness] Fatal error:", err);
    process.exit(1);
  });
