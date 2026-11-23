"use client";

import { useState } from "react";
import type { Condition } from "@/lib/site-i18n";
import { useIsNight } from "./prefs";

type Group = "clear" | "cloudy" | "rain" | "snow";
const groupOf = (c: Condition): Group =>
  c === "clear" || c === "partly" ? "clear" : c === "cloudy" || c === "fog" ? "cloudy" : c === "snow" ? "snow" : "rain";

// Deterministik "tasodifiy" qiymatlar (server va klient bir xil chizishi uchun)
const rnd = (i: number, s: number) => {
  const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

function Particles({ group, night }: { group: Group; night: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {night && group !== "rain" &&
        Array.from({ length: group === "clear" ? 90 : 30 }, (_, i) => (
          <span key={`s${i}`} className="star" style={{
            left: `${rnd(i, 1) * 100}%`, top: `${rnd(i, 2) * 70}%`,
            width: rnd(i, 3) > 0.85 ? 2.5 : 1.5, height: rnd(i, 3) > 0.85 ? 2.5 : 1.5,
            animationDuration: `${2 + rnd(i, 4) * 4}s`, animationDelay: `${-rnd(i, 5) * 6}s`,
          }} />
        ))}
      {group === "cloudy" &&
        [0, 1, 2].map((i) => (
          <span key={`c${i}`} className="cloud-blob" style={{
            left: `${[-10, 35, 65][i]}%`, top: `${[8, 22, 4][i]}%`, width: "45vw", height: "22vw",
            animationDelay: `${-i * 15}s`,
          }} />
        ))}
      {group === "rain" &&
        Array.from({ length: 90 }, (_, i) => (
          <span key={`r${i}`} className="drop" style={{
            left: `${rnd(i, 6) * 110}%`, opacity: 0.35 + rnd(i, 7) * 0.5,
            animationDuration: `${0.7 + rnd(i, 8) * 0.6}s`, animationDelay: `${-rnd(i, 9) * 2}s`,
          }} />
        ))}
      {group === "snow" &&
        Array.from({ length: 70 }, (_, i) => {
          const s = 2 + rnd(i, 10) * 4;
          return (
            <span key={`f${i}`} className="flake" style={{
              left: `${rnd(i, 11) * 100}%`, width: s, height: s, opacity: 0.4 + rnd(i, 12) * 0.5,
              animationDuration: `${8 + rnd(i, 13) * 10}s`, animationDelay: `${-rnd(i, 14) * 18}s`,
            }} />
          );
        })}
    </div>
  );
}

/** Ob-havoga qarab dinamik fon; shahar/holat almashganda 1s silliq o'tish. */
export function Backdrop({ cond, isDay }: { cond: Condition; isDay: boolean }) {
  const night = useIsNight(isDay);
  const key = `${night ? "night" : "day"}-${groupOf(cond)}`;
  const [layers, setLayers] = useState<{ key: string; id: number }[]>([{ key, id: 0 }]);
  const [lastKey, setLastKey] = useState(key);

  // Kalit o'zgarsa — yangi qatlam qo'shamiz (render paytida hosila holat)
  if (key !== lastKey) {
    setLastKey(key);
    setLayers((prev) => [...prev.slice(-1), { key, id: (prev.at(-1)?.id ?? 0) + 1 }]);
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {layers.map((l, i) => {
        const isTop = i === layers.length - 1;
        const [sky, group] = l.key.split("-") as ["day" | "night", Group];
        return (
          <div
            key={l.id}
            className={`sky-layer sky-${l.key} ${isTop ? (layers.length > 1 ? "sky-in" : "") : "sky-out"}`}
            onAnimationEnd={(e) => {
              if (!isTop && e.target === e.currentTarget) setLayers((prev) => prev.filter((p) => p.id !== l.id));
            }}
          >
            <Particles group={group} night={sky === "night"} />
          </div>
        );
      })}
      <div className="sky-scrim" />
    </div>
  );
}
