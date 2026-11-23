import postgres from "postgres";

declare global {
  var __sql: postgres.Sql | undefined;
}

function createClient() {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL topilmadi. .env.local faylida yoki Vercel sozlamalarida belgilang.",
    );
  }
  const isLocal = /localhost|127\.0\.0\.1/.test(url);
  return postgres(url, {
    ssl: isLocal ? false : "require",
    // Serverless (Vercel) uchun kichik pool; pgbouncer/pooler bilan mos bo'lishi uchun prepare o'chirilgan
    max: process.env.VERCEL ? 3 : 10,
    idle_timeout: 20,
    connect_timeout: 15,
    prepare: false,
    onnotice: () => {},
  });
}

export function getSql(): postgres.Sql {
  if (!globalThis.__sql) globalThis.__sql = createClient();
  return globalThis.__sql;
}
