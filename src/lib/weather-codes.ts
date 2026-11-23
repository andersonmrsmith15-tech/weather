// WMO ob-havo kodlari → o'zbekcha tavsif va belgi
const CODES: Record<number, [string, string]> = {
  0: ["Ochiq osmon", "☀️"],
  1: ["Asosan ochiq", "🌤️"],
  2: ["Qisman bulutli", "⛅"],
  3: ["Bulutli", "☁️"],
  45: ["Tuman", "🌫️"],
  48: ["Qirovli tuman", "🌫️"],
  51: ["Yengil shivalama", "🌦️"],
  53: ["Shivalama", "🌦️"],
  55: ["Kuchli shivalama", "🌧️"],
  56: ["Muzli shivalama", "🌧️"],
  57: ["Kuchli muzli shivalama", "🌧️"],
  61: ["Yengil yomg'ir", "🌦️"],
  63: ["Yomg'ir", "🌧️"],
  65: ["Kuchli yomg'ir", "🌧️"],
  66: ["Muzli yomg'ir", "🌧️"],
  67: ["Kuchli muzli yomg'ir", "🌧️"],
  71: ["Yengil qor", "🌨️"],
  73: ["Qor", "🌨️"],
  75: ["Kuchli qor", "❄️"],
  77: ["Qor donachalari", "🌨️"],
  80: ["Yengil jala", "🌦️"],
  81: ["Jala", "🌧️"],
  82: ["Kuchli jala", "⛈️"],
  85: ["Qor aralash jala", "🌨️"],
  86: ["Kuchli qor jalasi", "❄️"],
  95: ["Momaqaldiroq", "⛈️"],
  96: ["Do'l bilan momaqaldiroq", "⛈️"],
  99: ["Kuchli do'l, momaqaldiroq", "⛈️"],
};

export function weatherInfo(code: number | null | undefined) {
  const [label, icon] = (code != null && CODES[code]) || ["Ma'lumot yo'q", "–"];
  return { label, icon };
}
