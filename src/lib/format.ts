export const WEEKDAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
export const WEEKDAYS_SHORT = ["Yak", "Du", "Se", "Chor", "Pay", "Ju", "Sha"];
export const MONTHS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

const parse = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`);

export const weekday = (iso: string) => WEEKDAYS[parse(iso).getUTCDay()];
export const weekdayShort = (iso: string) => WEEKDAYS_SHORT[parse(iso).getUTCDay()];

/** "23-noyabr" */
export function dayMonth(iso: string) {
  const d = parse(iso);
  return `${d.getUTCDate()}-${MONTHS[d.getUTCMonth()].toLowerCase()}`;
}

/** "23.11" */
export function shortDate(iso: string) {
  const d = parse(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** "2026-10" → "Oktabr 2026" */
export function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

const MONTHS_SHORT = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];

export function monthShort(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS_SHORT[m - 1]} ${String(y).slice(2)}`;
}

export function temp(v: number | null | undefined, digits = 0) {
  if (v == null) return "–";
  const r = Number(v.toFixed(digits));
  return `${r > 0 ? "+" : ""}${r === 0 ? 0 : r}°`;
}

export function num(v: number | null | undefined, digits = 0, unit = "") {
  if (v == null) return "–";
  return `${v.toFixed(digits)}${unit}`;
}
