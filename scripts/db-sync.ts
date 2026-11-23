/**
 * Ma'lumotlarni qo'lda yangilash (cron bilan bir xil): prognoz + soatlik + havo sifati.
 *   npm run db:sync
 */
import { config } from "dotenv";

config({ path: [".env.local", ".env"], quiet: true });

async function main() {
  const { getSql } = await import("../src/lib/db");
  const { syncForecast, syncHourly } = await import("../src/lib/sync");
  const sql = getSql();
  console.log(`Prognoz: ${await syncForecast(sql)} qator`);
  console.log(`Soatlik + AQI: ${await syncHourly(sql)} qator`);
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
