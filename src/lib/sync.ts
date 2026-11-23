import type postgres from "postgres";
import { CITIES } from "./cities";
import { fetchAirQuality, fetchArchive, fetchForecast, fetchHourly, type DailyBlock } from "./openmeteo";

type CityRow = { id: number; slug: string; latitude: number; longitude: number };

type DailyRow = {
  city_id: number;
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
  source: "archive" | "forecast";
};

const DAILY_COLS = [
  "city_id", "date", "weather_code", "temp_max", "temp_min", "temp_mean",
  "precipitation", "snowfall", "wind_speed_max", "humidity_mean",
  "sunrise", "sunset", "source",
] as const;

const hhmm = (iso: string | null) => (iso ? iso.slice(11, 16) : null);

function toRows(cityId: number, d: DailyBlock, source: DailyRow["source"]): DailyRow[] {
  return d.time
    .map((date, i) => ({
      city_id: cityId,
      date,
      weather_code: d.weather_code[i],
      temp_max: d.temperature_2m_max[i],
      temp_min: d.temperature_2m_min[i],
      temp_mean: d.temperature_2m_mean[i],
      precipitation: d.precipitation_sum[i],
      snowfall: d.snowfall_sum[i],
      wind_speed_max: d.wind_speed_10m_max[i],
      humidity_mean: d.relative_humidity_2m_mean[i],
      sunrise: hhmm(d.sunrise[i]),
      sunset: hhmm(d.sunset[i]),
      source,
    }))
    .filter((r) => r.temp_max !== null || r.temp_min !== null);
}

async function upsertDaily(sql: postgres.Sql, rows: DailyRow[]) {
  const CHUNK = 2000; // Postgres parametr limiti (65535) dan oshmaslik uchun
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    await sql`
      insert into daily_weather ${sql(chunk, ...DAILY_COLS)}
      on conflict (city_id, date) do update set
        weather_code   = excluded.weather_code,
        temp_max       = excluded.temp_max,
        temp_min       = excluded.temp_min,
        temp_mean      = excluded.temp_mean,
        precipitation  = excluded.precipitation,
        snowfall       = excluded.snowfall,
        wind_speed_max = excluded.wind_speed_max,
        humidity_mean  = excluded.humidity_mean,
        sunrise        = excluded.sunrise,
        sunset         = excluded.sunset,
        source         = excluded.source,
        updated_at     = now()
      -- arxiv (tasdiqlangan) ma'lumotni prognoz bilan almashtirmaymiz
      where daily_weather.source = 'forecast' or excluded.source = 'archive'
    `;
  }
}

async function loadCities(sql: postgres.Sql): Promise<CityRow[]> {
  return sql<CityRow[]>`select id, slug, latitude, longitude from cities order by id`;
}

/** Shaharlar jadvalini kod ichidagi ro'yxat bilan moslashtiradi. */
export async function seedCities(sql: postgres.Sql) {
  const rows = CITIES.map((c) => ({
    slug: c.slug, name: c.name, region: c.region,
    latitude: c.lat, longitude: c.lon, is_center: !!c.center,
  }));
  await sql`
    insert into cities ${sql(rows, "slug", "name", "region", "latitude", "longitude", "is_center")}
    on conflict (slug) do update set
      name = excluded.name, region = excluded.region,
      latitude = excluded.latitude, longitude = excluded.longitude,
      is_center = excluded.is_center
  `;
  return rows.length;
}

async function withLog<T extends number>(sql: postgres.Sql, kind: string, fn: () => Promise<T>) {
  const [{ id }] = await sql<{ id: number }[]>`insert into sync_log (kind) values (${kind}) returning id`;
  try {
    const n = await fn();
    await sql`update sync_log set finished_at = now(), rows = ${n}, ok = true where id = ${id}`;
    return n;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await sql`update sync_log set finished_at = now(), ok = false, error = ${msg} where id = ${id}`;
    throw err;
  }
}

const BATCH = 25; // prognoz: bir so'rovdagi shaharlar soni
// Arxiv so'rovining "og'irligi" ≈ shaharlar × kunlar/14; daqiqalik limit 600
const archiveBatchSize = (days: number) => Math.max(1, Math.min(BATCH, Math.floor(400 / Math.ceil(days / 14))));

/** Joriy holat + o'tgan 31 kun + 16 kunlik prognozni yangilaydi. */
export async function syncForecast(sql: postgres.Sql) {
  return withLog(sql, "forecast", async () => {
    const cities = await loadCities(sql);
    let total = 0;
    for (let i = 0; i < cities.length; i += BATCH) {
      const batch = cities.slice(i, i + BATCH);
      const data = await fetchForecast(batch.map((c) => ({ lat: c.latitude, lon: c.longitude })));
      const daily: DailyRow[] = [];
      const current = [];
      for (let j = 0; j < batch.length; j++) {
        const loc = data[j];
        daily.push(...toRows(batch[j].id, loc.daily, "forecast"));
        const c = loc.current;
        if (c) {
          current.push({
            city_id: batch[j].id,
            observed_at: `${c.time}:00+05:00`,
            temperature: c.temperature_2m,
            apparent_temperature: c.apparent_temperature,
            humidity: c.relative_humidity_2m,
            weather_code: c.weather_code,
            wind_speed: c.wind_speed_10m,
            pressure: c.pressure_msl,
          });
        }
      }
      await upsertDaily(sql, daily);
      if (current.length) {
        await sql`
          insert into current_weather ${sql(current)}
          on conflict (city_id) do update set
            observed_at = excluded.observed_at,
            temperature = excluded.temperature,
            apparent_temperature = excluded.apparent_temperature,
            humidity = excluded.humidity,
            weather_code = excluded.weather_code,
            wind_speed = excluded.wind_speed,
            pressure = excluded.pressure,
            updated_at = now()
        `;
      }
      total += daily.length;
    }
    return total;
  });
}

/** Arxivdan [startDate, endDate] oralig'idagi kunlik ma'lumotlarni yuklaydi. */
export async function syncArchive(
  sql: postgres.Sql,
  startDate: string,
  endDate: string,
  onProgress?: (done: number, total: number) => void,
) {
  return withLog(sql, "archive", async () => {
    const cities = await loadCities(sql);
    const days = (Date.parse(endDate) - Date.parse(startDate)) / 86400_000 + 1;
    const size = archiveBatchSize(days);
    let total = 0;
    for (let i = 0; i < cities.length; i += size) {
      const batch = cities.slice(i, i + size);
      const data = await fetchArchive(
        batch.map((c) => ({ lat: c.latitude, lon: c.longitude })),
        startDate,
        endDate,
      );
      const rows = batch.flatMap((c, j) => toRows(c.id, data[j].daily, "archive"));
      await upsertDaily(sql, rows);
      total += rows.length;
      onProgress?.(Math.min(i + size, cities.length), cities.length);
    }
    return total;
  });
}

const HOURS_TO_KEEP = 72; // bugundan boshlab 3 kun

/** Soatlik prognoz + havo sifati; kunlik yog'in ehtimoli va UV maksimumi. */
export async function syncHourly(sql: postgres.Sql) {
  return withLog(sql, "hourly", async () => {
    const cities = await loadCities(sql);
    let total = 0;
    for (let i = 0; i < cities.length; i += BATCH) {
      const batch = cities.slice(i, i + BATCH);
      const coords = batch.map((c) => ({ lat: c.latitude, lon: c.longitude }));
      const [wx, air] = await Promise.all([fetchHourly(coords), fetchAirQuality(coords).catch(() => null)]);

      const rows: Record<string, string | number | boolean | null>[] = [];
      const dailyExtra: { city_id: number; date: string; precipitation_probability_max: number | null; uv_index_max: number | null }[] = [];
      for (let j = 0; j < batch.length; j++) {
        const h = wx[j].hourly;
        const a = air?.[j]?.hourly;
        const aqiAt = new Map((a?.time ?? []).map((t, k) => [t, k]));
        for (let k = 0; k < Math.min(h.time.length, HOURS_TO_KEEP); k++) {
          const ai = aqiAt.get(h.time[k]);
          rows.push({
            city_id: batch[j].id,
            time: `${h.time[k]}:00+05:00`,
            temperature: h.temperature_2m[k],
            apparent_temperature: h.apparent_temperature[k],
            humidity: h.relative_humidity_2m[k],
            precipitation_probability: h.precipitation_probability[k],
            precipitation: h.precipitation[k],
            weather_code: h.weather_code[k],
            pressure: h.pressure_msl[k],
            visibility: h.visibility[k],
            wind_speed: h.wind_speed_10m[k],
            wind_direction: h.wind_direction_10m[k],
            uv_index: h.uv_index[k],
            is_day: h.is_day[k] == null ? null : h.is_day[k] === 1,
            us_aqi: ai != null ? a!.us_aqi[ai] : null,
            pm2_5: ai != null ? a!.pm2_5[ai] : null,
            pm10: ai != null ? a!.pm10[ai] : null,
          });
        }
        const d = wx[j].daily;
        d.time.forEach((date, k) =>
          dailyExtra.push({
            city_id: batch[j].id,
            date,
            precipitation_probability_max: d.precipitation_probability_max[k],
            uv_index_max: d.uv_index_max[k],
          }),
        );
      }

      const CHUNK = 3000;
      for (let k = 0; k < rows.length; k += CHUNK) {
        await sql`
          insert into hourly_weather ${sql(rows.slice(k, k + CHUNK))}
          on conflict (city_id, time) do update set
            temperature = excluded.temperature,
            apparent_temperature = excluded.apparent_temperature,
            humidity = excluded.humidity,
            precipitation_probability = excluded.precipitation_probability,
            precipitation = excluded.precipitation,
            weather_code = excluded.weather_code,
            pressure = excluded.pressure,
            visibility = excluded.visibility,
            wind_speed = excluded.wind_speed,
            wind_direction = excluded.wind_direction,
            uv_index = excluded.uv_index,
            is_day = excluded.is_day,
            us_aqi = coalesce(excluded.us_aqi, hourly_weather.us_aqi),
            pm2_5 = coalesce(excluded.pm2_5, hourly_weather.pm2_5),
            pm10 = coalesce(excluded.pm10, hourly_weather.pm10),
            updated_at = now()
        `;
      }
      // Kunlik qatorlarga ehtimollik va UV ni qo'shamiz (qator mavjud bo'lsa)
      await sql`
        update daily_weather d set
          precipitation_probability_max = v.p::real,
          uv_index_max = v.u::real
        from (values ${sql(dailyExtra.map((r) => [r.city_id, r.date, r.precipitation_probability_max, r.uv_index_max]))})
          as v(city_id, date, p, u)
        where d.city_id = v.city_id::int and d.date = v.date::date
      `;
      total += rows.length;
    }
    await sql`delete from hourly_weather where time < now() - interval '1 day'`;
    return total;
  });
}
