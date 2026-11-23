import { revalidateTag } from "next/cache";
import { getSql } from "@/lib/db";
import { syncArchive, syncForecast, syncHourly } from "@/lib/sync";

export const maxDuration = 60;

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

/**
 * Vercel Cron har kuni chaqiradi (vercel.json).
 * Qo'lda: curl -H "Authorization: Bearer $CRON_SECRET" https://<domen>/api/cron/sync
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const sql = getSql();
  try {
    const forecastRows = await syncForecast(sql);
    const hourlyRows = await syncHourly(sql);
    // Arxivdan so'nggi ikki haftani tasdiqlangan ma'lumot bilan yangilaymiz
    const end = new Date(Date.now() - 6 * 86400_000);
    const start = new Date(end.getTime() - 14 * 86400_000);
    const archiveRows = await syncArchive(sql, iso(start), iso(end));

    revalidateTag("weather", "max");
    return Response.json({ ok: true, forecastRows, hourlyRows, archiveRows });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
