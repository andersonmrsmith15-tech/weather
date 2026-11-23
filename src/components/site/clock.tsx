"use client";

import { useSyncExternalStore } from "react";

const TZ = "Asia/Tashkent";

function subscribe(cb: () => void) {
  const id = setInterval(cb, 15_000);
  return () => clearInterval(id);
}
const minuteNow = () => Math.floor(Date.now() / 60_000);

/** Toshkent vaqti: "YYYY-MM-DDTHH:MM" (har daqiqada yangilanadi). Serverda null. */
export function useTashkentNow(): string | null {
  const m = useSyncExternalStore(subscribe, minuteNow, () => null);
  if (m == null) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(m * 60_000));
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}`;
}

/** "Dushanba, 23-noyabr · 14:32" */
export function Clock({ fallback, weekdays, months, lang }: { fallback: string; weekdays: string[]; months: string[]; lang: string }) {
  const now = useTashkentNow() ?? fallback;
  const d = new Date(`${now.slice(0, 10)}T00:00:00Z`);
  const day = d.getUTCDate();
  const month = months[d.getUTCMonth()];
  const date = lang === "en" ? `${day} ${month}` : lang === "ru" ? `${day} ${month}` : `${day}-${month}`;
  return (
    <time dateTime={now}>
      {weekdays[d.getUTCDay()]}, {date} · {now.slice(11, 16)}
    </time>
  );
}

const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** Quyosh chiqishi/botishi yoy grafigi. */
export function SunArc({ sunrise, sunset, fallbackNow, labels }: {
  sunrise: string | null; sunset: string | null; fallbackNow: string;
  labels: { sunrise: string; sunset: string; daylight: string; h: string; m: string };
}) {
  const now = useTashkentNow() ?? fallbackNow;
  if (!sunrise || !sunset) return <p className="text-sm text-2nd">–</p>;
  const rise = toMin(sunrise), set = toMin(sunset), cur = toMin(now.slice(11, 16));
  const p = Math.min(1, Math.max(0, (cur - rise) / (set - rise)));
  const up = cur >= rise && cur <= set;
  // Yarim aylana: markaz (60,60), radius 48
  const a = Math.PI * (1 - p);
  const sx = 60 + 48 * Math.cos(a), sy = 60 - 48 * Math.sin(a);
  const len = set - rise;
  return (
    <div>
      <svg viewBox="0 0 120 70" className="w-full" role="img"
        aria-label={`${labels.sunrise} ${sunrise}, ${labels.sunset} ${sunset}`}>
        <path d="M12 60 A48 48 0 0 1 108 60" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeDasharray="3 4" />
        {up && <path d={`M12 60 A48 48 0 0 1 ${sx.toFixed(2)} ${sy.toFixed(2)}`} fill="none" stroke="#fcd34d" strokeWidth="2.5" strokeLinecap="round" />}
        <line x1="4" y1="60" x2="116" y2="60" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
        {up && <circle cx={sx} cy={sy} r="5" fill="#fcd34d" stroke="#fff" strokeWidth="1.5" />}
      </svg>
      <div className="mt-1 flex justify-between text-sm">
        <div><div className="text-xs text-3rd">{labels.sunrise}</div><div className="font-semibold">{sunrise}</div></div>
        <div className="text-center"><div className="text-xs text-3rd">{labels.daylight}</div><div className="font-semibold">{Math.floor(len / 60)} {labels.h} {len % 60} {labels.m}</div></div>
        <div className="text-right"><div className="text-xs text-3rd">{labels.sunset}</div><div className="font-semibold">{sunset}</div></div>
      </div>
    </div>
  );
}
