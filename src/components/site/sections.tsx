import type { ReactNode } from "react";
import type { SiteData } from "@/lib/site-data";
import { aqiLevel, dirIndex, uvLevel, wxCondition, wxLabel, type Dict, type Lang } from "@/lib/site-i18n";
import { Clock, SunArc } from "./clock";
import { BigTemp, CountUp, Temp } from "./temp";
import { WeatherIcon } from "./weather-icon";

/* --------------------------------- Hero --------------------------------- */

export function Hero({ data, t, lang }: { data: SiteData; t: Dict; lang: Lang }) {
  const { now, city, days } = data;
  const today = days[0];
  const label = wxLabel(now.code, lang);
  return (
    <section className="glass flex min-h-[calc(100svh-9rem)] flex-col justify-between p-6 sm:p-8 lg:min-h-0" aria-labelledby="hero-city">
      <div>
        <h1 id="hero-city" className="text-3xl font-bold tracking-tight sm:text-4xl">{city.name}</h1>
        <p className="mt-1 text-sm text-2nd">
          {city.region} · <Clock fallback={now.time} weekdays={t.weekdays} months={t.months} lang={lang} />
        </p>
      </div>

      <div className="my-8 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-8">
        <div className="text-[104px] leading-none font-extralight tracking-tighter sm:text-[120px]">
          <BigTemp c={now.temp} />
        </div>
        <div className="flex items-center gap-3">
          <WeatherIcon cond={wxCondition(now.code)} night={!now.isDay} size={84} label={label} />
          <div>
            <div className="text-xl font-semibold">{label}</div>
            <div className="text-sm text-2nd">{t.feelsLike} <Temp c={now.feels} sign /></div>
          </div>
        </div>
      </div>

      <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
        <div className="flex items-center gap-2"><dt className="text-2nd">{t.high}</dt><dd className="text-lg font-semibold"><Temp c={today?.max} sign /></dd></div>
        <div className="flex items-center gap-2"><dt className="text-2nd">{t.low}</dt><dd className="text-lg font-semibold"><Temp c={today?.min} sign /></dd></div>
        <div className="flex items-center gap-2"><dt className="text-2nd">{t.chanceOfRain}</dt><dd className="text-lg font-semibold">{Math.round(today?.pop ?? now.pop ?? 0)}%</dd></div>
      </dl>
    </section>
  );
}

/* ------------------------------- Soatlik ------------------------------- */

function Drop() {
  return (
    <svg aria-hidden viewBox="0 0 12 12" className="h-3 w-3" fill="#7dd3fc"><path d="M6 1C6 1 2 5.5 2 8a4 4 0 0 0 8 0C10 5.5 6 1 6 1z" /></svg>
  );
}

export function Hourly({ data, t, lang }: { data: SiteData; t: Dict; lang: Lang }) {
  return (
    <section className="glass p-4 sm:p-5" aria-labelledby="hourly-title">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="hourly-title" className="text-base font-semibold">{t.hourly}</h2>
        <span className="text-xs text-2nd">{t.hourlyHint}</span>
      </div>
      <ol
        className="hide-scrollbar -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1"
        tabIndex={0}
        aria-label={`${t.hourly} — ${t.hourlyHint}`}
      >
        {data.hours.map((h, i) => {
          const label = wxLabel(h.code, lang);
          return (
            <li key={h.time} className={`flex w-[68px] shrink-0 snap-start flex-col items-center gap-1.5 rounded-2xl px-1 py-3 ${i === 0 ? "bg-white/15" : ""}`}>
              <span className="text-xs font-semibold text-2nd">{i === 0 ? t.now : h.time.slice(11, 16)}</span>
              <WeatherIcon cond={wxCondition(h.code)} night={!h.isDay} size={34} label={label} />
              <span className="text-base font-semibold"><Temp c={h.temp} /></span>
              <span className="flex items-center gap-0.5 text-[11px] text-2nd" title={t.chanceOfRain}>
                <Drop /><span className="sr-only">{t.chanceOfRain}</span>{Math.round(h.pop ?? 0)}%
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ------------------------------- 7 kunlik ------------------------------- */

const TEMP_COLORS: [number, string][] = [[-10, "#93c5fd"], [0, "#7dd3fc"], [8, "#5eead4"], [15, "#bef264"], [22, "#fcd34d"], [30, "#fb923c"], [38, "#f87171"]];
function tempColor(v: number) {
  let c = TEMP_COLORS[0][1];
  for (const [t, col] of TEMP_COLORS) if (v >= t) c = col;
  return c;
}

export function Daily({ data, t, lang }: { data: SiteData; t: Dict; lang: Lang }) {
  const { days, now } = data;
  const lo = Math.min(...days.map((d) => d.min ?? 99));
  const hi = Math.max(...days.map((d) => d.max ?? -99));
  const span = Math.max(1, hi - lo);
  return (
    <section className="glass p-4 sm:p-5" aria-labelledby="daily-title">
      <h2 id="daily-title" className="mb-2 text-base font-semibold">{t.week}</h2>
      <ul className="divide-y divide-white/10">
        {days.map((d, i) => {
          const label = wxLabel(d.code, lang);
          const wd = new Date(`${d.date}T00:00:00Z`).getUTCDay();
          const left = (((d.min ?? lo) - lo) / span) * 100;
          const width = Math.max(4, (((d.max ?? hi) - (d.min ?? lo)) / span) * 100);
          const nowPos = i === 0 && now.temp != null ? Math.min(100, Math.max(0, ((now.temp - lo) / span) * 100)) : null;
          return (
            <li key={d.date} className="grid grid-cols-[3.2rem_2.25rem_2.75rem_2.6rem_1fr_2.6rem] items-center gap-2 py-2.5 text-sm">
              <span className="font-semibold">{i === 0 ? t.today : t.weekdaysShort[wd]}</span>
              <WeatherIcon cond={wxCondition(d.code)} size={30} label={label} />
              <span className="flex items-center gap-0.5 text-xs text-2nd" title={t.chanceOfRain}>
                {(d.pop ?? 0) >= 10 && <><Drop />{Math.round(d.pop ?? 0)}%</>}
              </span>
              <span className="text-right text-2nd"><Temp c={d.min} /></span>
              <span className="relative h-1.5 rounded-full bg-white/15" aria-hidden>
                <span
                  className="absolute inset-y-0 rounded-full"
                  style={{
                    left: `${left}%`, width: `${width}%`,
                    background: `linear-gradient(90deg, ${tempColor(d.min ?? lo)}, ${tempColor(d.max ?? hi)})`,
                  }}
                />
                {nowPos != null && (
                  <span className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-900/60 bg-white" style={{ left: `${nowPos}%` }} />
                )}
              </span>
              <span className="font-semibold"><Temp c={d.max} /></span>
              <span className="sr-only">{label}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ----------------------- Batafsil ko'rsatkichlar ----------------------- */

function Metric({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="glass glass-hover flex min-h-[176px] flex-col p-5">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-2nd">
        <span aria-hidden className="text-white/85">{icon}</span>{title}
      </h3>
      <div className="flex flex-1 flex-col">{children}</div>
    </section>
  );
}

const ic = (d: string) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const ICONS = {
  humidity: ic("M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"),
  wind: ic("M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h8"),
  uv: ic("M12 3v2M12 19v2M5 12H3M21 12h-2M6.3 6.3 4.9 4.9M19.1 19.1l-1.4-1.4M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"),
  pressure: ic("M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM12 12l4-4"),
  visibility: ic("M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"),
  sun: ic("M3 18h18M7 18a5 5 0 0 1 10 0M12 6v3M5.6 10.6l1.4 1.4M18.4 10.6 17 12"),
  aqi: ic("M4 16c2-2 4-2 6 0s4 2 6 0 4-2 4-2M4 10c2-2 4-2 6 0s4 2 6 0 4-2 4-2"),
  precip: ic("M8 19v2M12 17v2M16 19v2M20 15.5A4.5 4.5 0 0 0 17.5 7a6 6 0 0 0-11.4 1.5A4 4 0 0 0 7 16h11"),
};

function Scale({ stops, pos, label }: { stops: string[]; pos: number; label: string }) {
  return (
    <div className="relative mt-auto h-2 rounded-full" style={{ background: `linear-gradient(90deg, ${stops.join(",")})` }} role="img" aria-label={label}>
      <span className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-900/70 bg-white shadow" style={{ left: `${Math.min(100, Math.max(0, pos))}%` }} />
    </div>
  );
}

function Compass({ deg, letters, label }: { deg: number; letters: [string, string, string, string]; label: string }) {
  const rot = (deg + 180) % 360; // strelka shamol esayotgan tomonga
  return (
    <svg viewBox="0 0 100 100" className="h-24 w-24 shrink-0" role="img" aria-label={label}>
      <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
      {Array.from({ length: 36 }, (_, i) => {
        const a = (i * 10 * Math.PI) / 180, r1 = i % 9 === 0 ? 36 : 40;
        return <line key={i} x1={50 + Math.sin(a) * r1} y1={50 - Math.cos(a) * r1} x2={50 + Math.sin(a) * 44} y2={50 - Math.cos(a) * 44} stroke="rgba(255,255,255,0.45)" strokeWidth={i % 9 === 0 ? 2 : 1} />;
      })}
      {letters.map((l, i) => {
        const a = (i * 90 * Math.PI) / 180;
        return <text key={l} x={50 + Math.sin(a) * 27} y={50 - Math.cos(a) * 27 + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">{l}</text>;
      })}
      <g transform={`rotate(${rot} 50 50)`}>
        <path d="M50 14 L56 30 L50 26 L44 30 Z" fill="#fcd34d" />
        <line x1="50" y1="26" x2="50" y2="78" stroke="#fcd34d" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <circle cx="50" cy="50" r="3.5" fill="#fff" />
    </svg>
  );
}

const COMPASS: Record<Lang, [string, string, string, string]> = {
  uz: ["Sh", "Shq", "J", "G'"],
  ru: ["С", "В", "Ю", "З"],
  en: ["N", "E", "S", "W"],
};

export function Details({ data, t, lang }: { data: SiteData; t: Dict; lang: Lang }) {
  const { now, days, pressureTrend, rainNext24 } = data;
  const today = days[0];
  const hum = now.humidity ?? 0;
  const uv = now.isDay ? (now.uv ?? 0) : (today?.uv ?? now.uv ?? 0);
  const aqi = now.aqi;
  const visKm = (now.visibility ?? 0) / 1000;
  const trend = pressureTrend == null ? 0 : pressureTrend > 0.5 ? 1 : pressureTrend < -0.5 ? -1 : 0;
  const dirName = now.windDir != null ? t.dirs[dirIndex(now.windDir)] : "–";

  return (
    <section aria-labelledby="details-title">
      <h2 id="details-title" className="sr-only">{t.details}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Metric title={t.humidity} icon={ICONS.humidity}>
          <div className="text-4xl font-light"><CountUp value={Math.round(hum)} />%</div>
          <p className="mt-1 text-sm text-2nd">{t.humidityHint(hum)}</p>
          <div className="mt-auto h-2 rounded-full bg-white/15" role="img" aria-label={`${t.humidity} ${Math.round(hum)}%`}>
            <div className="h-full rounded-full bg-sky-300" style={{ width: `${hum}%` }} />
          </div>
        </Metric>

        <Metric title={t.wind} icon={ICONS.wind}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-4xl font-light"><CountUp value={Math.round(now.windSpeed ?? 0)} /></div>
              <div className="text-sm text-2nd">{t.kmh}</div>
              <p className="mt-2 text-sm">{lang === "uz" ? `${dirName} ${t.windFrom}` : `${t.windFrom === "from" ? "From " : ""}${dirName}${lang === "ru" ? " ветер" : ""}`}</p>
            </div>
            <Compass deg={now.windDir ?? 0} letters={COMPASS[lang]} label={`${t.wind}: ${dirName}, ${Math.round(now.windSpeed ?? 0)} ${t.kmh}`} />
          </div>
        </Metric>

        <Metric title={t.uv} icon={ICONS.uv}>
          <div className="text-4xl font-light"><CountUp value={Math.round(uv)} /></div>
          <p className="mt-1 text-sm text-2nd">{t.uvCat[uvLevel(uv)]}</p>
          <Scale stops={["#4ade80", "#facc15", "#fb923c", "#ef4444", "#a855f7"]} pos={(uv / 11) * 100} label={`${t.uv} ${uv.toFixed(0)}: ${t.uvCat[uvLevel(uv)]}`} />
        </Metric>

        <Metric title={t.pressure} icon={ICONS.pressure}>
          <div className="text-4xl font-light"><CountUp value={Math.round(now.pressure ?? 0)} /> <span className="text-base text-2nd">hPa</span></div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-2nd">
            <span aria-hidden className="text-white">{trend > 0 ? "↗" : trend < 0 ? "↘" : "→"}</span>
            {trend > 0 ? t.pressureRising : trend < 0 ? t.pressureFalling : t.pressureSteady}
          </p>
          <Scale stops={["rgba(255,255,255,0.25)", "rgba(255,255,255,0.25)"]} pos={(((now.pressure ?? 1013) - 980) / 60) * 100} label={`${t.pressure} ${Math.round(now.pressure ?? 0)} hPa`} />
          <div className="mt-1 flex justify-between text-[11px] text-3rd"><span>980</span><span>1010</span><span>1040</span></div>
        </Metric>

        <Metric title={t.visibility} icon={ICONS.visibility}>
          <div className="text-4xl font-light"><CountUp value={Math.min(99, Math.round(visKm))} /> <span className="text-base text-2nd">{t.km}</span></div>
          <p className="mt-1 text-sm text-2nd">{t.visHint(visKm)}</p>
          <Scale stops={["rgba(255,255,255,0.15)", "rgba(255,255,255,0.75)"]} pos={(Math.min(visKm, 40) / 40) * 100} label={`${t.visibility} ${visKm.toFixed(0)} ${t.km}`} />
          <div className="mt-1 flex justify-between text-[11px] text-3rd"><span>0</span><span>10</span><span>20</span><span>40+ {t.km}</span></div>
        </Metric>

        <Metric title={t.sun} icon={ICONS.sun}>
          <SunArc sunrise={today?.sunrise ?? null} sunset={today?.sunset ?? null} fallbackNow={now.time}
            labels={{ sunrise: t.sunrise, sunset: t.sunset, daylight: t.daylight, h: t.hoursShort, m: t.minutesShort }} />
        </Metric>

        <Metric title={t.aqi} icon={ICONS.aqi}>
          {aqi == null ? <p className="text-sm text-2nd">–</p> : (
            <>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-light"><CountUp value={Math.round(aqi)} /></span>
                <span className="text-sm font-semibold">{t.aqiCat[aqiLevel(aqi)]}</span>
              </div>
              <p className="mt-1 text-xs text-2nd">PM2.5 {now.pm25?.toFixed(0) ?? "–"} · PM10 {now.pm10?.toFixed(0) ?? "–"} µg/m³</p>
              <div className="mt-auto">
                <div className="relative flex h-2 gap-0.5 overflow-visible" role="img" aria-label={`AQI ${Math.round(aqi)}: ${t.aqiCat[aqiLevel(aqi)]}`}>
                  {["#4ade80", "#facc15", "#fb923c", "#ef4444", "#a855f7", "#9f1239"].map((c, i) => (
                    <span key={c} className={`h-full flex-1 ${i === 0 ? "rounded-l-full" : ""} ${i === 5 ? "rounded-r-full" : ""}`} style={{ background: c }} />
                  ))}
                  <span className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-900/70 bg-white shadow" style={{ left: `${Math.min(100, (aqi / 300) * 100)}%` }} />
                </div>
                <div className="mt-1 flex justify-between text-[11px] text-3rd"><span>0</span><span>100</span><span>200</span><span>300+</span></div>
              </div>
            </>
          )}
        </Metric>

        <Metric title={t.precip} icon={ICONS.precip}>
          <div className="text-4xl font-light">
            <CountUp value={today?.precip ?? 0} decimals={1} /> <span className="text-base text-2nd">mm {t.precipToday}</span>
          </div>
          <p className="mt-1 text-sm text-2nd">{t.chanceOfRain}: {Math.round(today?.pop ?? 0)}%</p>
          <p className="mt-auto text-sm">{t.precipNext24((rainNext24 ?? 0).toFixed(1))}</p>
        </Metric>
      </div>
    </section>
  );
}

/* -------------------------------- Footer -------------------------------- */

export function SiteFooter({ t, lang, slug, demo, langs }: { t: Dict; lang: Lang; slug: string; demo: boolean; langs: { code: Lang; label: string }[] }) {
  const href = (l: Lang) => {
    const p = new URLSearchParams({ shahar: slug });
    if (l !== "uz") p.set("til", l);
    if (demo) p.set("demo", "1");
    return `/ob-havo?${p}`;
  };
  return (
    <footer className="mx-auto mt-6 flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-4 pb-8 text-sm text-2nd sm:flex-row sm:px-6">
      <p>{t.source}</p>
      <nav aria-label={t.language} className="glass flex rounded-full! p-1">
        {langs.map((l) => (
          <a
            key={l.code}
            href={href(l.code)}
            hrefLang={l.code}
            lang={l.code}
            aria-current={l.code === lang ? "true" : undefined}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${l.code === lang ? "bg-white text-slate-900" : "text-white hover:bg-white/10"}`}
          >
            {l.label}
          </a>
        ))}
      </nav>
    </footer>
  );
}
