import { cacheLife, cacheTag } from "next/cache";
import { getSql } from "./db";

// Barcha o'qishlar faqat PostgreSQL'dan. Natijalar keshlanadi va
// /api/cron/sync ishlaganda "weather" tegi orqali yangilanadi.
function cached() {
  cacheTag("weather");
  cacheLife({ stale: 300, revalidate: 900, expire: 86400 });
}

// postgres.js Result massivini oddiy obyektlarga aylantiramiz (kesh serializatsiyasi uchun)
const plain = <T extends object>(rows: readonly T[]): T[] => rows.map((r) => ({ ...r }));

const TODAY = `(now() at time zone 'Asia/Tashkent')::date`;

export type City = {
  id: number;
  slug: string;
  name: string;
  region: string;
  is_center: boolean;
};

export type OverviewRow = City & {
  temperature: number | null;
  apparent_temperature: number | null;
  humidity: number | null;
  wind_speed: number | null;
  current_code: number | null;
  observed: string | null;
  temp_max: number | null;
  temp_min: number | null;
  precipitation: number | null;
  day_code: number | null;
};

export async function getOverview(): Promise<OverviewRow[]> {
  "use cache";
  cached();
  const sql = getSql();
  return plain(await sql.unsafe<OverviewRow[]>(`
    select c.id, c.slug, c.name, c.region, c.is_center,
           cw.temperature, cw.apparent_temperature, cw.humidity, cw.wind_speed,
           cw.weather_code as current_code,
           to_char(cw.observed_at at time zone 'Asia/Tashkent', 'DD.MM.YYYY HH24:MI') as observed,
           d.temp_max, d.temp_min, d.precipitation, d.weather_code as day_code
    from cities c
    left join current_weather cw on cw.city_id = c.id
    left join daily_weather d on d.city_id = c.id and d.date = ${TODAY}
    order by c.region = 'Toshkent shahri' desc, c.region, c.is_center desc, c.name
  `));
}

export type DayCell = {
  city_id: number;
  date: string;
  weather_code: number | null;
  temp_max: number | null;
  temp_min: number | null;
  precipitation: number | null;
};

/** Barcha shaharlar uchun bugundan boshlab 7 kunlik prognoz. */
export async function getWeekly(): Promise<DayCell[]> {
  "use cache";
  cached();
  return plain(await getSql().unsafe<DayCell[]>(`
    select city_id, date::text as date, weather_code, temp_max, temp_min, precipitation
    from daily_weather
    where date between ${TODAY} and ${TODAY} + 6
    order by city_id, date
  `));
}

export type PeriodStats = {
  city_id: number;
  days: number;
  avg_temp: number | null;
  avg_max: number | null;
  avg_min: number | null;
  max_temp: number | null;
  min_temp: number | null;
  precipitation: number | null;
  rainy_days: number;
  snow_days: number;
  humidity: number | null;
  max_wind: number | null;
};

const STATS_COLS = `
  count(*)::int as days,
  avg(temp_mean)::real as avg_temp,
  avg(temp_max)::real as avg_max,
  avg(temp_min)::real as avg_min,
  max(temp_max) as max_temp,
  min(temp_min) as min_temp,
  sum(precipitation)::real as precipitation,
  count(*) filter (where precipitation >= 1)::int as rainy_days,
  count(*) filter (where snowfall > 0)::int as snow_days,
  avg(humidity_mean)::real as humidity,
  max(wind_speed_max) as max_wind
`;

/** Barcha shaharlar uchun oylik statistika. month = "YYYY-MM" yoki null (so'nggi 30 kun). */
export async function getMonthlyStats(month: string | null): Promise<PeriodStats[]> {
  "use cache";
  cached();
  const sql = getSql();
  if (month) {
    const start = `${month}-01`;
    return plain(await sql<PeriodStats[]>`
      select city_id, ${sql.unsafe(STATS_COLS)}
      from daily_weather
      where date >= ${start}::date
        and date < (${start}::date + interval '1 month')
        and date <= ${sql.unsafe(TODAY)}
      group by city_id
    `);
  }
  return plain(await sql.unsafe<PeriodStats[]>(`
    select city_id, ${STATS_COLS}
    from daily_weather
    where date between ${TODAY} - 29 and ${TODAY}
    group by city_id
  `));
}

/** Bazada mavjud oylar ro'yxati (yangi → eski). */
export async function getAvailableMonths(): Promise<string[]> {
  "use cache";
  cached();
  const rows = await getSql().unsafe<{ m: string }[]>(`
    select distinct to_char(date, 'YYYY-MM') as m
    from daily_weather where date <= ${TODAY}
    order by m desc limit 13
  `);
  return rows.map((r) => r.m);
}

export type CityDetail = City & {
  latitude: number;
  longitude: number;
  temperature: number | null;
  apparent_temperature: number | null;
  humidity: number | null;
  wind_speed: number | null;
  pressure: number | null;
  current_code: number | null;
  observed: string | null;
};

export async function getCity(slug: string): Promise<CityDetail | null> {
  "use cache";
  cached();
  const sql = getSql();
  const rows = await sql<CityDetail[]>`
    select c.id, c.slug, c.name, c.region, c.is_center, c.latitude, c.longitude,
           cw.temperature, cw.apparent_temperature, cw.humidity, cw.wind_speed, cw.pressure,
           cw.weather_code as current_code,
           to_char(cw.observed_at at time zone 'Asia/Tashkent', 'DD.MM.YYYY HH24:MI') as observed
    from cities c
    left join current_weather cw on cw.city_id = c.id
    where c.slug = ${slug}
  `;
  return rows[0] ? { ...rows[0] } : null;
}

export type DailyRow = {
  date: string;
  weather_code: number | null;
  temp_max: number | null;
  temp_min: number | null;
  temp_mean: number | null;
  precipitation: number | null;
  snowfall: number | null;
  wind_speed_max: number | null;
  humidity_mean: number | null;
  sunrise: string | null;
  sunset: string | null;
  is_forecast: boolean;
};

/** Shahar uchun so'nggi 30 kun + 15 kunlik prognoz. */
export async function getCityDaily(cityId: number): Promise<DailyRow[]> {
  "use cache";
  cached();
  const sql = getSql();
  return plain(await sql<DailyRow[]>`
    select date::text as date, weather_code, temp_max, temp_min, temp_mean, precipitation,
           snowfall, wind_speed_max, humidity_mean, sunrise, sunset,
           date > ${sql.unsafe(TODAY)} as is_forecast
    from daily_weather
    where city_id = ${cityId}
      and date between ${sql.unsafe(TODAY)} - 29 and ${sql.unsafe(TODAY)} + 15
    order by date
  `);
}

export type MonthRow = Omit<PeriodStats, "city_id"> & { month: string };

/** Shahar uchun oylar kesimida statistika (so'nggi 13 oy). */
export async function getCityMonthly(cityId: number): Promise<MonthRow[]> {
  "use cache";
  cached();
  const sql = getSql();
  return plain(await sql<MonthRow[]>`
    select to_char(date, 'YYYY-MM') as month, ${sql.unsafe(STATS_COLS)}
    from daily_weather
    where city_id = ${cityId}
      and date <= ${sql.unsafe(TODAY)}
      and date >= date_trunc('month', ${sql.unsafe(TODAY)}) - interval '12 months'
    group by 1
    order by 1
  `);
}

export async function getLastSync(): Promise<string | null> {
  "use cache";
  cached();
  const rows = await getSql().unsafe<{ t: string | null }[]>(`
    select to_char(max(finished_at) at time zone 'Asia/Tashkent', 'DD.MM.YYYY HH24:MI') as t
    from sync_log where ok
  `);
  return rows[0]?.t ?? null;
}
