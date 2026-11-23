// Open-Meteo (bepul, kalit talab qilmaydi) — faqat bazani to'ldirish uchun ishlatiladi.
// Dashboard ma'lumotlarni faqat PostgreSQL'dan o'qiydi.

const DAILY_VARS = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "temperature_2m_mean",
  "precipitation_sum",
  "snowfall_sum",
  "wind_speed_10m_max",
  "relative_humidity_2m_mean",
  "sunrise",
  "sunset",
].join(",");

const CURRENT_VARS = [
  "temperature_2m",
  "relative_humidity_2m",
  "apparent_temperature",
  "weather_code",
  "wind_speed_10m",
  "pressure_msl",
].join(",");

export const TZ = "Asia/Tashkent";

type Num = number | null;

export type DailyBlock = {
  time: string[];
  weather_code: Num[];
  temperature_2m_max: Num[];
  temperature_2m_min: Num[];
  temperature_2m_mean: Num[];
  precipitation_sum: Num[];
  snowfall_sum: Num[];
  wind_speed_10m_max: Num[];
  relative_humidity_2m_mean: Num[];
  sunrise: (string | null)[];
  sunset: (string | null)[];
};

export type CurrentBlock = {
  time: string;
  temperature_2m: Num;
  relative_humidity_2m: Num;
  apparent_temperature: Num;
  weather_code: Num;
  wind_speed_10m: Num;
  pressure_msl: Num;
};

export type LocationResponse = { daily: DailyBlock; current?: CurrentBlock };

type Coord = { lat: number; lon: number };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getJson(url: string): Promise<LocationResponse[]> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.status === 429 && attempt < 3 && process.env.OPEN_METEO_WAIT !== "0") {
        // Daqiqalik limit — keyingi daqiqani kutamiz
        lastErr = new Error(`Open-Meteo 429: ${await res.text()}`);
        console.warn("Open-Meteo limiti: 65 soniya kutilmoqda...");
        await sleep(65_000);
        continue;
      }
      if (!res.ok) throw new Error(`Open-Meteo ${res.status}: ${await res.text()}`);
      const json = await res.json();
      return Array.isArray(json) ? json : [json];
    } catch (err) {
      lastErr = err;
      await sleep(1000 * (attempt + 1));
    }
  }
  throw lastErr;
}

function coordParams(coords: Coord[]) {
  return (
    `latitude=${coords.map((c) => c.lat).join(",")}` +
    `&longitude=${coords.map((c) => c.lon).join(",")}`
  );
}

/** O'tgan `pastDays` kun + 16 kunlik prognoz va joriy holat (bir so'rovda barcha shaharlar). */
export function fetchForecast(coords: Coord[], pastDays = 31) {
  const url =
    `https://api.open-meteo.com/v1/forecast?${coordParams(coords)}` +
    `&daily=${DAILY_VARS}&current=${CURRENT_VARS}&timezone=${encodeURIComponent(TZ)}` +
    `&past_days=${pastDays}&forecast_days=16`;
  return getJson(url);
}

/** Tarixiy (arxiv) kunlik ma'lumotlar. */
export function fetchArchive(coords: Coord[], startDate: string, endDate: string) {
  const url =
    `https://archive-api.open-meteo.com/v1/archive?${coordParams(coords)}` +
    `&start_date=${startDate}&end_date=${endDate}` +
    `&daily=${DAILY_VARS}&timezone=${encodeURIComponent(TZ)}`;
  return getJson(url);
}

const HOURLY_VARS = [
  "temperature_2m", "apparent_temperature", "relative_humidity_2m",
  "precipitation_probability", "precipitation", "weather_code", "pressure_msl",
  "visibility", "wind_speed_10m", "wind_direction_10m", "uv_index", "is_day",
].join(",");

export type HourlyBlock = {
  time: string[];
  temperature_2m: Num[];
  apparent_temperature: Num[];
  relative_humidity_2m: Num[];
  precipitation_probability: Num[];
  precipitation: Num[];
  weather_code: Num[];
  pressure_msl: Num[];
  visibility: Num[];
  wind_speed_10m: Num[];
  wind_direction_10m: Num[];
  uv_index: Num[];
  is_day: Num[];
};

export type AirBlock = { time: string[]; us_aqi: Num[]; pm2_5: Num[]; pm10: Num[] };

/** Soatlik prognoz (bugun + 2 kun) va kunlik ehtimollik/UV. */
export async function fetchHourly(coords: Coord[]) {
  const url =
    `https://api.open-meteo.com/v1/forecast?${coordParams(coords)}` +
    `&hourly=${HOURLY_VARS}&daily=precipitation_probability_max,uv_index_max` +
    `&timezone=${encodeURIComponent(TZ)}&forecast_days=16`;
  return (await getJson(url)) as unknown as {
    hourly: HourlyBlock;
    daily: { time: string[]; precipitation_probability_max: Num[]; uv_index_max: Num[] };
  }[];
}

/** Havo sifati (US AQI, PM2.5, PM10) — soatlik. */
export async function fetchAirQuality(coords: Coord[]) {
  const url =
    `https://air-quality-api.open-meteo.com/v1/air-quality?${coordParams(coords)}` +
    `&hourly=us_aqi,pm2_5,pm10&timezone=${encodeURIComponent(TZ)}&forecast_days=3`;
  return (await getJson(url)) as unknown as { hourly: AirBlock }[];
}
