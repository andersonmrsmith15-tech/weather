"use client";

import { useSyncExternalStore } from "react";

function persisted<T extends string>(key: string, fallback: T, valid: readonly T[]) {
  const listeners = new Set<() => void>();
  const get = (): T => {
    try {
      const v = localStorage.getItem(key) as T | null;
      return v && valid.includes(v) ? v : fallback;
    } catch {
      return fallback;
    }
  };
  return {
    get,
    set(v: T) {
      try { localStorage.setItem(key, v); } catch {}
      listeners.forEach((l) => l());
    },
    subscribe(l: () => void) {
      listeners.add(l);
      const onStorage = (e: StorageEvent) => e.key === key && l();
      window.addEventListener("storage", onStorage);
      return () => { listeners.delete(l); window.removeEventListener("storage", onStorage); };
    },
    fallback,
  };
}

export type Unit = "C" | "F";
export type Sky = "auto" | "day" | "night";

export const unitStore = persisted<Unit>("wx-unit", "C", ["C", "F"]);
export const skyStore = persisted<Sky>("wx-sky", "auto", ["auto", "day", "night"]);

export const useUnit = () => useSyncExternalStore(unitStore.subscribe, unitStore.get, () => unitStore.fallback);
export const useSky = () => useSyncExternalStore(skyStore.subscribe, skyStore.get, () => skyStore.fallback);

export const toUnit = (c: number, unit: Unit) => (unit === "F" ? (c * 9) / 5 + 32 : c);

/** Kun/tun: foydalanuvchi tanlovi yoki ma'lumotdagi is_day */
export function useIsNight(isDay: boolean) {
  const sky = useSky();
  return sky === "auto" ? !isDay : sky === "night";
}
