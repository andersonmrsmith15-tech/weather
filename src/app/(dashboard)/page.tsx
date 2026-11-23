import Link from "next/link";
import { Suspense } from "react";
import { CategoryBars } from "@/components/charts";
import { ParamSelect } from "@/components/param-select";
import { RangeBar } from "@/components/range-bar";
import { Card, CardHeader, EmptyState, Skeleton, StatTile, Tabs } from "@/components/ui";
import { monthLabel, num, shortDate, temp, weekdayShort } from "@/lib/format";
import {
  getAvailableMonths, getLastSync, getMonthlyStats, getOverview, getWeekly,
  type OverviewRow,
} from "@/lib/queries";
import { weatherInfo } from "@/lib/weather-codes";

type View = "bugun" | "hafta" | "oy";
type SP = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      {searchParams.then((sp) => <Dashboard sp={sp} />)}
    </Suspense>
  );
}

async function Dashboard({ sp }: { sp: SP }) {
  const view: View = one(sp.view) === "hafta" ? "hafta" : one(sp.view) === "oy" ? "oy" : "bugun";
  const region = one(sp.region);
  const month = /^\d{4}-\d{2}$/.test(one(sp.month)) ? one(sp.month) : "";

  let overview: OverviewRow[];
  let lastSync: string | null;
  try {
    [overview, lastSync] = await Promise.all([getOverview(), getLastSync()]);
  } catch (err) {
    return (
      <EmptyState title="PostgreSQL bilan ulanib bo'lmadi">
        <p><code>DATABASE_URL</code> o&apos;zgaruvchisini tekshiring.</p>
        <p className="mt-2 text-xs text-muted">{err instanceof Error ? err.message : String(err)}</p>
      </EmptyState>
    );
  }
  if (overview.length === 0) {
    return (
      <EmptyState title="Baza hali bo'sh">
        Ma&apos;lumotlarni yuklash uchun <code>npm run db:setup</code> buyrug&apos;ini ishga tushiring.
      </EmptyState>
    );
  }

  const regions = Array.from(new Set(overview.map((c) => c.region)));
  const cities = region ? overview.filter((c) => c.region === region) : overview;
  const params: Record<string, string> = {};
  if (view !== "bugun") params.view = view;
  if (region) params.region = region;
  if (month && view === "oy") params.month = month;

  const href = (v: View) => {
    const p = new URLSearchParams();
    if (v !== "bugun") p.set("view", v);
    if (region) p.set("region", region);
    const qs = p.toString();
    return qs ? `/?${qs}` : "/";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ob-havo dashboardi</h1>
          <p className="mt-1 text-sm text-muted">
            {cities.length} ta shahar · Oxirgi yangilanish: {lastSync ?? "–"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ParamSelect
            label="Hudud"
            name="region"
            value={region}
            params={params}
            options={[{ value: "", label: "Barcha hududlar" }, ...regions.map((r) => ({ value: r, label: r }))]}
          />
          <Tabs
            items={[
              { href: href("bugun"), label: "Bugun", active: view === "bugun" },
              { href: href("hafta"), label: "Haftalik", active: view === "hafta" },
              { href: href("oy"), label: "Oylik", active: view === "oy" },
            ]}
          />
        </div>
      </div>

      <Kpis cities={cities} />

      {view === "bugun" && <TodayView cities={cities} grouped={!region} />}
      {view === "hafta" && <WeekView cities={cities} />}
      {view === "oy" && <MonthView cities={cities} month={month} params={params} />}
    </div>
  );
}

/* ---------------------------------- KPI ---------------------------------- */

function Kpis({ cities }: { cities: OverviewRow[] }) {
  const withTemp = cities.filter((c) => c.temperature != null);
  const avg = withTemp.length ? withTemp.reduce((s, c) => s + (c.temperature ?? 0), 0) / withTemp.length : null;
  const hottest = [...withTemp].sort((a, b) => (b.temperature ?? 0) - (a.temperature ?? 0))[0];
  const coldest = [...withTemp].sort((a, b) => (a.temperature ?? 0) - (b.temperature ?? 0))[0];
  const rainy = cities.filter((c) => (c.precipitation ?? 0) >= 0.5).length;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile label="O'rtacha harorat (hozir)" value={temp(avg, 1)} hint={`${withTemp.length} ta shahar bo'yicha`} />
      <StatTile label="Eng issiq" value={temp(hottest?.temperature, 1)} hint={hottest?.name} />
      <StatTile label="Eng sovuq" value={temp(coldest?.temperature, 1)} hint={coldest?.name} />
      <StatTile label="Bugun yog'in kutilmoqda" value={`${rainy} / ${cities.length}`} hint="≥ 0,5 mm yog'in" />
    </div>
  );
}

/* --------------------------------- Bugun --------------------------------- */

function TodayView({ cities, grouped }: { cities: OverviewRow[]; grouped: boolean }) {
  const groups = grouped
    ? Array.from(new Set(cities.map((c) => c.region))).map((r) => ({ region: r, items: cities.filter((c) => c.region === r) }))
    : [{ region: "", items: cities }];
  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.region || "all"}>
          {g.region && <h2 className="mb-2 text-sm font-semibold text-ink-2">{g.region}</h2>}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {g.items.map((c) => <CityCard key={c.id} c={c} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function CityCard({ c }: { c: OverviewRow }) {
  const w = weatherInfo(c.current_code ?? c.day_code);
  return (
    <Link href={`/shahar/${c.slug}`} className="group block rounded-xl border border-line bg-surface p-4 transition hover:border-accent">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-medium group-hover:text-accent">
            {c.name}
            {c.is_center && <span className="ml-1.5 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-normal text-muted">markaz</span>}
          </div>
          <div className="mt-0.5 truncate text-xs text-muted">{w.label}</div>
        </div>
        <span className="text-3xl leading-none" role="img" aria-label={w.label}>{w.icon}</span>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div className="tabular text-3xl font-semibold tracking-tight">{temp(c.temperature)}</div>
        <div className="tabular text-right text-xs text-ink-2">
          <div>↑ {temp(c.temp_max)} &nbsp;↓ {temp(c.temp_min)}</div>
          <div className="text-muted">His qilinadi {temp(c.apparent_temperature)}</div>
        </div>
      </div>
      <div className="tabular mt-3 flex gap-3 border-t border-line pt-2 text-xs text-ink-2">
        <span title="Namlik">💧 {num(c.humidity, 0, "%")}</span>
        <span title="Shamol">💨 {num(c.wind_speed, 0, " km/s")}</span>
        <span title="Yog'in">🌧 {num(c.precipitation, 1, " mm")}</span>
      </div>
    </Link>
  );
}

/* -------------------------------- Haftalik -------------------------------- */

async function WeekView({ cities }: { cities: OverviewRow[] }) {
  const rows = await getWeekly();
  const byCity = new Map<number, typeof rows>();
  for (const r of rows) byCity.set(r.city_id, [...(byCity.get(r.city_id) ?? []), r]);
  const dates = Array.from(new Set(rows.map((r) => r.date))).sort().slice(0, 7);

  return (
    <Card>
      <CardHeader title="7 kunlik prognoz" subtitle="Har bir kun uchun: kunduzgi maksimal / tungi minimal harorat va yog'in" />
      <div className="mt-3 overflow-x-auto">
        <table className="tabular w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-y border-line bg-surface-2 text-xs text-muted">
              <th className="sticky left-0 z-10 bg-surface-2 px-4 py-2 text-left font-medium">Shahar</th>
              {dates.map((d, i) => (
                <th key={d} className="px-2 py-2 text-center font-medium">
                  <div className={i === 0 ? "text-ink" : ""}>{i === 0 ? "Bugun" : weekdayShort(d)}</div>
                  <div className="font-normal">{shortDate(d)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cities.map((c) => {
              const days = new Map((byCity.get(c.id) ?? []).map((d) => [d.date, d]));
              return (
                <tr key={c.id} className="border-b border-line last:border-0 hover:bg-surface-2/60">
                  <td className="sticky left-0 z-10 bg-surface px-4 py-2">
                    <Link href={`/shahar/${c.slug}`} className="font-medium hover:text-accent">{c.name}</Link>
                    <div className="text-xs text-muted">{c.region}</div>
                  </td>
                  {dates.map((d) => {
                    const day = days.get(d);
                    const w = weatherInfo(day?.weather_code);
                    return (
                      <td key={d} className="px-2 py-2 text-center" title={w.label}>
                        <div className="text-lg leading-none" role="img" aria-label={w.label}>{w.icon}</div>
                        <div className="mt-1 text-xs">
                          <span className="font-semibold">{temp(day?.temp_max)}</span>
                          <span className="text-muted"> / {temp(day?.temp_min)}</span>
                        </div>
                        {(day?.precipitation ?? 0) >= 0.1 && (
                          <div className="text-[10px] text-ink-2">{num(day?.precipitation, 1, " mm")}</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* --------------------------------- Oylik --------------------------------- */

async function MonthView({ cities, month, params }: { cities: OverviewRow[]; month: string; params: Record<string, string> }) {
  const [stats, months] = await Promise.all([getMonthlyStats(month || null), getAvailableMonths()]);
  const byId = new Map(stats.map((s) => [s.city_id, s]));
  const rows = cities.map((c) => ({ c, s: byId.get(c.id) }));
  const mins = rows.map((r) => r.s?.min_temp).filter((v): v is number => v != null);
  const maxs = rows.map((r) => r.s?.max_temp).filter((v): v is number => v != null);
  const scaleMin = Math.floor(Math.min(...mins, 0));
  const scaleMax = Math.ceil(Math.max(...maxs, 10));
  const periodLabel = month ? monthLabel(month) : "So'nggi 30 kun";

  // Hududlar kesimida o'rtacha qiymatlar
  const regionAgg = new Map<string, { t: number; tn: number; p: number; pn: number }>();
  for (const { c, s } of rows) {
    if (!s) continue;
    const a = regionAgg.get(c.region) ?? { t: 0, tn: 0, p: 0, pn: 0 };
    if (s.avg_temp != null) { a.t += s.avg_temp; a.tn++; }
    if (s.precipitation != null) { a.p += s.precipitation; a.pn++; }
    regionAgg.set(c.region, a);
  }
  const tempByRegion = [...regionAgg].filter(([, a]) => a.tn)
    .map(([name, a]) => ({ name, value: a.t / a.tn })).sort((a, b) => b.value - a.value);
  const rainByRegion = [...regionAgg].filter(([, a]) => a.pn)
    .map(([name, a]) => ({ name, value: a.p / a.pn })).sort((a, b) => b.value - a.value);
  const many = tempByRegion.length > 1;
  const short = (r: string) =>
    r.replace("Toshkent viloyati", "Toshkent vil.").replace(" viloyati", "").replace(" Respublikasi", "");
  for (const d of [...tempByRegion, ...rainByRegion]) d.name = short(d.name);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{periodLabel}</h2>
        <ParamSelect
          label="Davr"
          name="month"
          value={month}
          params={params}
          options={[{ value: "", label: "So'nggi 30 kun" }, ...months.map((m) => ({ value: m, label: monthLabel(m) }))]}
        />
      </div>

      {many && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="pb-3">
            <CardHeader title="O'rtacha harorat — hududlar bo'yicha" subtitle={`${periodLabel}, kunlik o'rtacha haroratlarning o'rtachasi`} />
            <div className="px-2 pt-2"><CategoryBars data={tempByRegion} unit="°" color="var(--s-max)" valueLabel="O'rtacha harorat" /></div>
          </Card>
          <Card className="pb-3">
            <CardHeader title="Jami yog'in — hududlar bo'yicha" subtitle={`${periodLabel}, hudud shaharlari o'rtachasi (mm)`} />
            <div className="px-2 pt-2"><CategoryBars data={rainByRegion} unit=" mm" color="var(--s-rain)" valueLabel="Yog'in" /></div>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader title="Shaharlar bo'yicha oylik statistika"
          subtitle={`Chiziq: davrdagi eng past → eng yuqori harorat (${scaleMin}°…${scaleMax}°), nuqta — o'rtacha`} />
        <div className="mt-3 overflow-x-auto">
          <table className="tabular w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-y border-line bg-surface-2 text-xs text-muted">
                <th className="px-4 py-2 text-left font-medium">Shahar</th>
                <th className="px-2 py-2 text-right font-medium">O&apos;rtacha</th>
                <th className="px-2 py-2 text-right font-medium">Min</th>
                <th className="w-[22%] px-3 py-2 font-medium">Harorat oralig&apos;i</th>
                <th className="px-2 py-2 text-left font-medium">Maks</th>
                <th className="px-2 py-2 text-right font-medium">Yog&apos;in</th>
                <th className="px-2 py-2 text-right font-medium">Yomg&apos;irli kun</th>
                <th className="px-2 py-2 text-right font-medium">Qorli kun</th>
                <th className="px-2 py-2 text-right font-medium">Namlik</th>
                <th className="px-4 py-2 text-right font-medium">Shamol (maks)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ c, s }) => (
                <tr key={c.id} className="border-b border-line last:border-0 hover:bg-surface-2/60">
                  <td className="px-4 py-2">
                    <Link href={`/shahar/${c.slug}`} className="font-medium hover:text-accent">{c.name}</Link>
                    <div className="text-xs text-muted">{c.region}</div>
                  </td>
                  <td className="px-2 py-2 text-right font-semibold">{temp(s?.avg_temp, 1)}</td>
                  <td className="px-2 py-2 text-right text-ink-2">{temp(s?.min_temp, 1)}</td>
                  <td className="px-3 py-2">
                    <RangeBar min={s?.min_temp ?? null} max={s?.max_temp ?? null} mean={s?.avg_temp} scaleMin={scaleMin} scaleMax={scaleMax} />
                  </td>
                  <td className="px-2 py-2 text-ink-2">{temp(s?.max_temp, 1)}</td>
                  <td className="px-2 py-2 text-right">{num(s?.precipitation, 1, " mm")}</td>
                  <td className="px-2 py-2 text-right">{s?.rainy_days ?? "–"}</td>
                  <td className="px-2 py-2 text-right">{s?.snow_days ?? "–"}</td>
                  <td className="px-2 py-2 text-right">{num(s?.humidity, 0, "%")}</td>
                  <td className="px-4 py-2 text-right">{num(s?.max_wind, 0, " km/s")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* -------------------------------- Skeleton -------------------------------- */

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-72" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-40" />)}
      </div>
    </div>
  );
}
