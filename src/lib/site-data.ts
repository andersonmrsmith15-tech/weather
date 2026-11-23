import { cacheLife, cacheTag } from "next/cache";
import { CITIES } from "./cities";
import { getSql } from "./db";

export type SiteNow = {
  time: string; // "YYYY-MM-DDTHH:MM" (Toshkent vaqti)
  temp: number | null;
  feels: number | null;
  humidity: number | null;
  pop: number | null;
  precip: number | null;
  code: number | null;
  pressure: number | null;
  visibility: number | null; // m
  windSpeed: number | null;
  windDir: number | null;
  uv: number | null;
  isDay: boolean;
  aqi: number | null;
  pm25: number | null;
  pm10: number | null;
};

export type SiteHour = {
  time: string;
  temp: number | null;
  code: number | null;
  pop: number | null;
  precip: number | null;
  isDay: boolean;
};

export type SiteDay = {
  date: string;
  code: number | null;
  max: number | null;
  min: number | null;
  pop: number | null;
  precip: number | null;
  uv: number | null;
  sunrise: string | null;
  sunset: string | null;
};

export type MapPoint = {
  slug: string;
  center: boolean;
  name: string;
  lat: number;
  lon: number;
  temp: number | null;
  windSpeed: number | null;
  windDir: number | null;
  precip: number | null;
  code: number | null;
};

export type CityOption = { slug: string; name: string; region: string };

export type SiteData = {
  city: CityOption & { lat: number; lon: number };
  now: SiteNow;
  hours: SiteHour[];
  days: SiteDay[];
  pressureTrend: number | null; // 3 soatdan keyingi farq, hPa
  rainNext24: number | null; // mm
  map: MapPoint[];
  cities: CityOption[];
  demo: boolean;
};

const TZ = "Asia/Tashkent";
const TODAY = `(now() at time zone '${TZ}')::date`;
const LOCAL = (col: string) => `to_char(${col} at time zone '${TZ}', 'YYYY-MM-DD"T"HH24:MI')`;

const plain = <T extends object>(rows: readonly T[]): T[] => rows.map((r) => ({ ...r }));

/** Sayt sahifasi uchun barcha ma'lumot — faqat PostgreSQL'dan. Topilmasa null. */
export async function getSiteData(slug: string): Promise<SiteData | null> {
  "use cache";
  cacheTag("weather");
  cacheLife({ stale: 300, revalidate: 600, expire: 86400 });

  const sql = getSql();
  const [city] = await sql<{ id: number; slug: string; name: string; region: string; lat: number; lon: number }[]>`
    select id, slug, name, region, latitude as lat, longitude as lon from cities where slug = ${slug}
  `;
  if (!city) return null;

  const hourCols = `
    ${LOCAL("time")} as time, temperature as temp, apparent_temperature as feels, humidity,
    precipitation_probability as pop, precipitation as precip, weather_code as code, pressure,
    visibility, wind_speed as "windSpeed", wind_direction as "windDir", uv_index as uv,
    coalesce(is_day, true) as "isDay", us_aqi as aqi, pm2_5 as pm25, pm10`;

  const [nowRows, hours, days, later, rain, map, cities] = await Promise.all([
    sql.unsafe<SiteNow[]>(
      `select ${hourCols} from hourly_weather where city_id = $1 and time <= now() order by time desc limit 1`,
      [city.id],
    ),
    sql.unsafe<SiteHour[]>(
      `select ${LOCAL("time")} as time, temperature as temp, weather_code as code,
              precipitation_probability as pop, precipitation as precip, coalesce(is_day, true) as "isDay"
       from hourly_weather where city_id = $1 and time >= date_trunc('hour', now())
       order by time limit 24`,
      [city.id],
    ),
    sql.unsafe<SiteDay[]>(
      `select date::text as date, weather_code as code, temp_max as max, temp_min as min,
              precipitation_probability_max as pop, precipitation as precip, uv_index_max as uv, sunrise, sunset
       from daily_weather where city_id = $1 and date between ${TODAY} and ${TODAY} + 6 order by date`,
      [city.id],
    ),
    sql.unsafe<{ pressure: number | null }[]>(
      `select pressure from hourly_weather where city_id = $1 and time >= now() + interval '3 hours'
       order by time limit 1`,
      [city.id],
    ),
    sql.unsafe<{ mm: number | null }[]>(
      `select sum(precipitation)::real as mm from hourly_weather
       where city_id = $1 and time >= date_trunc('hour', now()) and time < now() + interval '24 hours'`,
      [city.id],
    ),
    sql.unsafe<MapPoint[]>(`
      select c.slug, c.is_center as center, c.name, c.latitude as lat, c.longitude as lon,
             h.temperature as temp, h.wind_speed as "windSpeed", h.wind_direction as "windDir",
             h.weather_code as code, d.precipitation as precip
      from cities c
      left join lateral (
        select * from hourly_weather h where h.city_id = c.id and h.time <= now() order by h.time desc limit 1
      ) h on true
      left join daily_weather d on d.city_id = c.id and d.date = ${TODAY}
      order by c.name
    `),
    sql<CityOption[]>`select slug, name, region from cities order by name`,
  ]);

  const now = nowRows[0];
  if (!now) return null;

  return {
    city: { slug: city.slug, name: city.name, region: city.region, lat: city.lat, lon: city.lon },
    now: { ...now },
    hours: plain(hours),
    days: plain(days),
    pressureTrend: later[0]?.pressure != null && now.pressure != null ? later[0].pressure - now.pressure : null,
    rainNext24: rain[0]?.mm ?? null,
    map: plain(map),
    cities: plain(cities),
    demo: false,
  };
}

/* ------------------------------------------------------------------ */
/* Namuna ma'lumotlar: ?demo=1 yoki baza mavjud bo'lmaganda             */
/* ------------------------------------------------------------------ */

const pad = (n: number) => String(n).padStart(2, "0");

export function getDemoData(): SiteData {
  const base = "2026-11-23";
  const hourTemps = [18, 18, 17, 16, 14, 12, 11, 10, 9, 9, 8, 8, 8, 7, 7, 7, 8, 10, 12, 14, 15, 16, 17, 17];
  const hourCodes = [2, 2, 2, 3, 3, 3, 2, 1, 0, 0, 0, 0, 1, 1, 2, 2, 2, 3, 3, 61, 61, 3, 2, 2];
  const hourPop = [0, 0, 5, 10, 10, 15, 10, 5, 0, 0, 0, 0, 0, 0, 5, 10, 15, 25, 40, 60, 55, 30, 15, 10];
  const hours: SiteHour[] = hourTemps.map((t, i) => {
    const h = (14 + i) % 24;
    const day = i < 10 ? base : "2026-11-24";
    return { time: `${day}T${pad(h)}:00`, temp: t, code: hourCodes[i], pop: hourPop[i], precip: hourPop[i] > 40 ? 0.6 : 0, isDay: h >= 8 && h < 17 };
  });
  const days: SiteDay[] = [
    { date: "2026-11-23", code: 2, max: 19, min: 7, pop: 5, precip: 0, uv: 3, sunrise: "07:20", sunset: "16:58" },
    { date: "2026-11-24", code: 61, max: 16, min: 7, pop: 60, precip: 2.4, uv: 2, sunrise: "07:21", sunset: "16:57" },
    { date: "2026-11-25", code: 3, max: 14, min: 5, pop: 20, precip: 0.2, uv: 2, sunrise: "07:22", sunset: "16:57" },
    { date: "2026-11-26", code: 1, max: 15, min: 4, pop: 0, precip: 0, uv: 3, sunrise: "07:23", sunset: "16:56" },
    { date: "2026-11-27", code: 0, max: 17, min: 5, pop: 0, precip: 0, uv: 3, sunrise: "07:24", sunset: "16:56" },
    { date: "2026-11-28", code: 80, max: 12, min: 3, pop: 45, precip: 3.1, uv: 1, sunrise: "07:25", sunset: "16:55" },
    { date: "2026-11-29", code: 71, max: 6, min: -1, pop: 55, precip: 1.8, uv: 1, sunrise: "07:26", sunset: "16:55" },
  ];
  const map: MapPoint[] = CITIES.map((c, i) => ({
    slug: c.slug, center: !!c.center, name: c.name, lat: c.lat, lon: c.lon,
    temp: Math.round((18 + (41.3 - c.lat) * 2.2 + ((i * 7) % 5) - 2) * 10) / 10,
    windSpeed: 4 + ((i * 13) % 20),
    windDir: (i * 47) % 360,
    precip: (i * 11) % 6 === 0 ? ((i * 3) % 7) * 0.8 : 0,
    code: [2, 1, 3, 0, 2, 61][i % 6],
  }));
  map.find((m) => m.slug === "toshkent")!.temp = 18;
  return {
    city: { slug: "toshkent", name: "Toshkent", region: "Toshkent shahri", lat: 41.2995, lon: 69.2401 },
    now: {
      time: `${base}T14:00`, temp: 18, feels: 17, humidity: 52, pop: 5, precip: 0, code: 2,
      pressure: 1016, visibility: 24000, windSpeed: 11, windDir: 315, uv: 3, isDay: true,
      aqi: 72, pm25: 22, pm10: 41,
    },
    hours,
    days,
    pressureTrend: -1.4,
    rainNext24: 1.2,
    map,
    cities: CITIES.map((c) => ({ slug: c.slug, name: c.name, region: c.region })).sort((a, b) => a.name.localeCompare(b.name)),
    demo: true,
  };
}
