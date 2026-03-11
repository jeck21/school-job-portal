/**
 * Seed zip_coordinates table from PA zip codes CSV
 *
 * Usage:
 *   npm run seed:zips
 *   npx tsx scripts/seed-zip-coordinates.ts
 *   npx tsx scripts/seed-zip-coordinates.ts --dry-run
 *
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

const DRY_RUN = process.argv.includes("--dry-run");
const BATCH_SIZE = 100;
const CSV_PATH = path.join(__dirname, "data", "pa-zip-codes.csv");

interface ZipRow {
  zip_code: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
}

function parseCSV(filePath: string): ZipRow[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.trim().split("\n");
  // Skip header
  const rows = lines.slice(1);

  return rows
    .map((line) => {
      const [zip_code, latitude, longitude, city, state] = line
        .split(",")
        .map((s) => s.trim());
      return {
        zip_code,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        city,
        state,
      };
    })
    .filter(
      (row) =>
        row.zip_code &&
        !isNaN(row.latitude) &&
        !isNaN(row.longitude) &&
        row.state === "PA"
    );
}

async function main() {
  const rows = parseCSV(CSV_PATH);
  console.log(`Parsed ${rows.length} PA zip codes from CSV`);

  if (DRY_RUN) {
    console.log("Dry run -- skipping database operations");
    console.log(`Sample entries:`);
    rows.slice(0, 5).forEach((r) =>
      console.log(`  ${r.zip_code}: ${r.city}, ${r.state} (${r.latitude}, ${r.longitude})`)
    );
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars required"
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("zip_coordinates")
      .upsert(batch, { onConflict: "zip_code" });

    if (error) {
      console.error(`Error upserting batch at offset ${i}:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`Upserted ${inserted}/${rows.length} zip codes`);
    }
  }

  console.log(`Done. ${inserted} zip codes seeded.`);
}

main().catch(console.error);
