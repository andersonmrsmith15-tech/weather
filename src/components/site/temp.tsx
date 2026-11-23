"use client";

import { useEffect, useRef, useState } from "react";
import { toUnit, useUnit } from "./prefs";

/** Harorat (°C yoki °F, foydalanuvchi tanloviga ko'ra). */
export function Temp({ c, sign = false }: { c: number | null | undefined; sign?: boolean }) {
  const unit = useUnit();
  if (c == null) return <>–</>;
  const v = Math.round(toUnit(c, unit));
  return <>{sign && v > 0 ? "+" : ""}{v}°</>;
}

/** Yuklanganda sanab chiqadigan raqam. */
export function CountUp({ value, decimals = 0, duration = 900 }: { value: number; decimals?: number; duration?: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = from.current;
    from.current = value;
    if (reduce || start === value) {
      const id = requestAnimationFrame(() => setShown(value));
      return () => cancelAnimationFrame(id);
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(start + (value - start) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{shown.toFixed(decimals)}</>;
}

/** Katta harorat raqami (count-up + birlik). */
export function BigTemp({ c }: { c: number | null }) {
  const unit = useUnit();
  if (c == null) return <>–</>;
  return (
    <>
      <span aria-hidden><CountUp value={Math.round(toUnit(c, unit))} /></span>
      <span aria-hidden className="align-top text-[0.45em] font-extralight">°{unit}</span>
      <span className="sr-only">{Math.round(toUnit(c, unit))}°{unit}</span>
    </>
  );
}
