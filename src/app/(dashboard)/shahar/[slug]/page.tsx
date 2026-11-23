import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RainChart, TempChart, type TempPoint } from "@/components/charts";
import { Card, CardHeader, Legend, Skeleton } from "@/components/ui";
import { dayMonth, monthLabel, monthShort, num, shortDate, temp, weekday, weekdayShort } from "@/lib/format";
import { getCity, getCityDaily, getCityMonthly, type CityDetail, type DailyRow } from "@/lib/queries";
import { weatherInfo } from "@/lib/weather-codes";

export default function CityPage({ params }: PageProps<"/shahar/[slug]">) {
  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-muted hover:text-ink">← Barcha shaharlar</Link>
      <Suspense fallback={<CitySkeleton />}>
        {params.then(({ slug }) => <CityContent slug={slug} />)}
      </Suspense>
    </div>
  );
}

async function CityContent({ slug }: { slug: string }) {
  const city = await getCity(decodeURIComponent(slug));
  if (!city) notFound();
  const [daily, monthly] = await Promise.all([getCityDaily(city.id), getCityMonthly(city.id)]);

  const todayIdx = daily.findIndex((d) => d.is_forecast) - 1;
  const today = todayIdx >= 0 ? daily[todayIdx] : daily.at(-1);
  const week = todayIdx >= 0 ? daily.slice(todayIdx, todayIdx + 7) : [];

  const dailyPoints: TempPoint[] = daily.map((d) => ({
    key: d.date,
    label: shortDate(d.date),
    title: `${weekday(d.date)}, ${dayMonth(d.date)}${d.is_forecast ? " · prognoz" : ""}`,
    max: d.temp_max,
    min: d.temp_min,
    rain: d.precipitation ?? 0,
  }));
  const forecastFrom = daily.find((d) => d.is_forecast)?.date;

  const monthPoints: TempPoint[] = monthly.map((m) => ({
    key: m.month,
    label: monthShort(m.month),
    title: monthLabel(m.month),
    max: m.avg_max,
    min: m.avg_min,
    rain: m.precipitation ?? 0,
  }));

  return (
    <>
      <Hero city={city} today={today} />

      <Card>
        <CardHeader title="Haftalik prognoz" subtitle="Bugundan boshlab 7 kun" />
        <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4 sm:px-5 lg:grid-cols-7">
          {week.map((d, i) => {
            const w = weatherInfo(d.weather_code);
            return (
              <div key={d.date} className={`rounded-lg border p-3 text-center ${i === 0 ? "border-accent" : "border-line"}`}>
                <div className="text-sm font-medium">{i === 0 ? "Bugun" : weekdayShort(d.date)}</div>
                <div className="text-xs text-muted">{dayMonth(d.date)}</div>
                <div className="my-2 text-3xl" role="img" aria-label={w.label}>{w.icon}</div>
                <div className="truncate text-xs text-ink-2" title={w.label}>{w.label}</div>
                <div className="tabular mt-2 text-sm">
                  <span className="font-semibold">{temp(d.temp_max)}</span>
                  <span className="text-muted"> / {temp(d.temp_min)}</span>
                </div>
                <div className="tabular mt-1 text-xs text-ink-2">
                  🌧 {num(d.precipitation, 1, " mm")} · 💨 {num(d.wind_speed_max, 0)}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="pb-4">
        <CardHeader
          title="Kunlik harorat: so'nggi 30 kun va 15 kunlik prognoz"
          subtitle="Kunduzgi maksimal va tungi minimal harorat, °C"
          right={<Legend items={[{ label: "Maks", color: "var(--s-max)" }, { label: "Min", color: "var(--s-min)" }]} />}
        />
        <div className="px-2 pt-2">
          <TempChart data={dailyPoints} todayKey={today?.date} forecastFromKey={forecastFrom} />
        </div>
        <div className="px-4 pt-3 sm:px-5"><h3 className="text-xs font-medium text-ink-2">Kunlik yog&apos;in, mm</h3></div>
        <div className="px-2"><RainChart data={dailyPoints} todayKey={today?.date} /></div>
      </Card>

      <Card className="pb-4">
        <CardHeader
          title="Oylik statistika (so'nggi 12 oy)"
          subtitle="Har oy uchun o'rtacha kunduzgi maksimal va tungi minimal harorat, °C"
          right={<Legend items={[{ label: "O'rtacha maks", color: "var(--s-max)" }, { label: "O'rtacha min", color: "var(--s-min)" }]} />}
        />
        <div className="px-2 pt-2"><TempChart data={monthPoints} height={240} /></div>
        <div className="px-4 pt-3 sm:px-5"><h3 className="text-xs font-medium text-ink-2">Oylik jami yog&apos;in, mm</h3></div>
        <div className="px-2"><RainChart data={monthPoints} height={130} /></div>

        <div className="mt-4 overflow-x-auto border-t border-line">
          <table className="tabular w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-2 text-xs text-muted">
                <th className="px-4 py-2 text-left font-medium">Oy</th>
                <th className="px-2 py-2 text-right font-medium">O&apos;rtacha</th>
                <th className="px-2 py-2 text-right font-medium">O&apos;rt. maks</th>
                <th className="px-2 py-2 text-right font-medium">O&apos;rt. min</th>
                <th className="px-2 py-2 text-right font-medium">Eng issiq</th>
                <th className="px-2 py-2 text-right font-medium">Eng sovuq</th>
                <th className="px-2 py-2 text-right font-medium">Yog&apos;in</th>
                <th className="px-2 py-2 text-right font-medium">Yomg&apos;irli kun</th>
                <th className="px-4 py-2 text-right font-medium">Qorli kun</th>
              </tr>
            </thead>
            <tbody>
              {[...monthly].reverse().map((m) => (
                <tr key={m.month} className="border-b border-line last:border-0">
                  <td className="px-4 py-2 font-medium">
                    {monthLabel(m.month)}
                    {m.days < 28 && <span className="ml-1 text-xs font-normal text-muted">({m.days} kun)</span>}
                  </td>
                  <td className="px-2 py-2 text-right font-semibold">{temp(m.avg_temp, 1)}</td>
                  <td className="px-2 py-2 text-right">{temp(m.avg_max, 1)}</td>
                  <td className="px-2 py-2 text-right">{temp(m.avg_min, 1)}</td>
                  <td className="px-2 py-2 text-right text-ink-2">{temp(m.max_temp, 1)}</td>
                  <td className="px-2 py-2 text-right text-ink-2">{temp(m.min_temp, 1)}</td>
                  <td className="px-2 py-2 text-right">{num(m.precipitation, 1, " mm")}</td>
                  <td className="px-2 py-2 text-right">{m.rainy_days}</td>
                  <td className="px-4 py-2 text-right">{m.snow_days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function Hero({ city, today }: { city: CityDetail; today?: DailyRow }) {
  const w = weatherInfo(city.current_code ?? today?.weather_code);
  const facts = [
    ["His qilinadi", temp(city.apparent_temperature)],
    ["Bugun", `${temp(today?.temp_max)} / ${temp(today?.temp_min)}`],
    ["Namlik", num(city.humidity, 0, "%")],
    ["Shamol", num(city.wind_speed, 0, " km/soat")],
    ["Bosim", num(city.pressure, 0, " hPa")],
    ["Yog'in (bugun)", num(today?.precipitation, 1, " mm")],
    ["Quyosh chiqishi", today?.sunrise ?? "–"],
    ["Quyosh botishi", today?.sunset ?? "–"],
  ];
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{city.name}</h1>
          <p className="text-sm text-muted">
            {city.region} · {city.latitude.toFixed(2)}°N, {city.longitude.toFixed(2)}°E
          </p>
          <div className="mt-4 flex items-center gap-4">
            <span className="text-6xl leading-none" role="img" aria-label={w.label}>{w.icon}</span>
            <div>
              <div className="tabular text-5xl font-semibold tracking-tight">{temp(city.temperature, 1)}</div>
              <div className="text-sm text-ink-2">{w.label}</div>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">O&apos;lchangan vaqt: {city.observed ?? "–"}</p>
        </div>
        <dl className="tabular grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-4">
          {facts.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Card>
  );
}

function CitySkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48" />
      <Skeleton className="h-56" />
      <Skeleton className="h-96" />
    </div>
  );
}
