/**
 * Bazani tayyorlash: sxema + shaharlar + 1 yillik arxiv + prognoz.
 *   npm run db:setup
 */
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { join } from "node:path";

config({ path: [".env.local", ".env"], quiet: true });

const DAYS = Number(process.env.BACKFILL_DAYS ?? 400);

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function main() {
  const { getSql } = await import("../src/lib/db");
  const { seedCities, syncArchive, syncForecast, syncHourly } = await import("../src/lib/sync");
  const sql = getSql();

  console.log("1/4 Sxema yaratilmoqda...");
  await sql.unsafe(readFileSync(join(process.cwd(), "db/schema.sql"), "utf8"));

  console.log("2/4 Shaharlar yozilmoqda...");
  console.log(`    ${await seedCities(sql)} ta shahar`);

  // Arxiv ~5 kun kechikadi; oxirgi kunlarni prognoz API qoplaydi
  const end = new Date(Date.now() - 6 * 86400_000);
  const start = new Date(end.getTime() - DAYS * 86400_000);
  console.log(`3/4 Arxiv yuklanmoqda: ${isoDate(start)} → ${isoDate(end)} ...`);
  console.log(`    ${await syncArchive(sql, isoDate(start), isoDate(end), (d, t) => console.log(`    ${d}/${t} shahar`))} qator`);

  console.log("4/4 Prognoz va joriy holat yuklanmoqda...");
  console.log(`    ${await syncForecast(sql)} qator`);
  console.log("    soatlik prognoz va havo sifati...");
  console.log(`    ${await syncHourly(sql)} qator`);

  await sql.end();
  console.log("Tayyor ✅");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
