"use client";

import "leaflet/dist/leaflet.css";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Map as LMap, LayerGroup } from "leaflet";
import type { MapPoint } from "@/lib/site-data";
import { toUnit, useIsNight, useUnit, type Unit } from "./prefs";

type Layer = "temp" | "precip" | "wind";

// Harorat: sovuq (ko'k) → issiq (qizil) — divergent shkala, 10°C atrofida neytral
const TEMP_STOPS: [number, string][] = [[-10, "#93c5fd"], [0, "#bfdbfe"], [10, "#e5e7eb"], [20, "#fdba74"], [30, "#f87171"], [40, "#ef4444"]];
const RAIN_STOPS: [number, string][] = [[0, "#e2e8f0"], [1, "#bae6fd"], [5, "#7dd3fc"], [15, "#38bdf8"]];
const WIND_STOPS: [number, string][] = [[0, "#e2e8f0"], [10, "#a7f3d0"], [20, "#6ee7b7"], [35, "#fcd34d"], [50, "#fb923c"]];

function pick(stops: [number, string][], v: number) {
  let c = stops[0][1];
  for (const [t, col] of stops) if (v >= t) c = col;
  return c;
}

function pinHtml(p: MapPoint, layer: Layer, unit: Unit, active: boolean) {
  let text = "–", bg = "#e2e8f0", extra = "";
  if (layer === "temp" && p.temp != null) {
    const v = Math.round(toUnit(p.temp, unit));
    text = `${v > 0 ? "+" : ""}${v}°`;
    bg = pick(TEMP_STOPS, p.temp);
  } else if (layer === "precip" && p.precip != null) {
    text = `${p.precip.toFixed(1)} mm`;
    bg = pick(RAIN_STOPS, p.precip);
  } else if (layer === "wind" && p.windSpeed != null) {
    text = `${Math.round(p.windSpeed)}`;
    bg = pick(WIND_STOPS, p.windSpeed);
    const rot = ((p.windDir ?? 0) + 180) % 360; // shamol esayotgan tomonga
    extra = `<svg viewBox="0 0 12 12" width="11" height="11" style="transform:rotate(${rot}deg)"><path d="M6 1 L10 10 L6 8 L2 10 Z" fill="#0b1220"/></svg>`;
  }
  return `<span class="map-pin${active ? " is-active" : ""}" style="background:${bg}">${extra}${text}</span>`;
}

export function WeatherMap({
  points, activeSlug, lang, labels,
}: {
  points: MapPoint[];
  activeSlug: string;
  lang: string;
  labels: { temp: string; precip: string; wind: string; title: string; hint: string; zoomHint: string; kmh: string };
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LMap | null>(null);
  const group = useRef<LayerGroup | null>(null);
  const tiles = useRef<import("leaflet").TileLayer | null>(null);
  const [layer, setLayer] = useState<Layer>("temp");
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(0);
  const unit = useUnit();
  const night = useIsNight(true);
  const router = useRouter();

  // Xaritani yaratish (faqat klientda)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current || map.current) return;
      const m = L.map(el.current, { zoomControl: true, scrollWheelZoom: false, attributionControl: true })
        .fitBounds([[37.2, 58.2], [44.6, 73.2]], { padding: [8, 8] });
      map.current = m;
      group.current = L.layerGroup().addTo(m);
      m.on("zoomend", () => setZoom(m.getZoom()));
      setZoom(m.getZoom());
      setReady(true);
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Fon xaritasi (kun/tun)
  useEffect(() => {
    if (!ready || !map.current) return;
    (async () => {
      const L = (await import("leaflet")).default;
      tiles.current?.remove();
      tiles.current = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 12,
        className: night ? "tiles-night" : "tiles-day",
      }).addTo(map.current!);
    })();
  }, [ready, night]);

  // Belgilar
  useEffect(() => {
    if (!ready || !group.current) return;
    (async () => {
      const L = (await import("leaflet")).default;
      const g = group.current!;
      g.clearLayers();
      // Uzoqlashtirilganda faqat viloyat markazlari (va tanlangan shahar) — belgilar ustma-ust tushmasligi uchun
      const visible = zoom >= 7 ? points : points.filter((p) => p.center || p.slug === activeSlug);
      for (const p of visible) {
        const label =
          layer === "temp" ? `${p.name}: ${p.temp != null ? Math.round(toUnit(p.temp, unit)) + "°" + unit : "–"}`
          : layer === "precip" ? `${p.name}: ${p.precip?.toFixed(1) ?? "–"} mm`
          : `${p.name}: ${p.windSpeed != null ? Math.round(p.windSpeed) : "–"} ${labels.kmh}`;
        const marker = L.marker([p.lat, p.lon], {
          icon: L.divIcon({ className: "", html: pinHtml(p, layer, unit, p.slug === activeSlug), iconSize: [0, 0] }),
          title: label,
          alt: label,
          keyboard: true,
          zIndexOffset: p.slug === activeSlug ? 1000 : 0,
        });
        marker.bindTooltip(label, { direction: "top", offset: [0, -14] });
        marker.on("click", () => {
          const qs = new URLSearchParams({ shahar: p.slug });
          if (lang !== "uz") qs.set("til", lang);
          router.push(`/ob-havo?${qs}`, { scroll: false });
        });
        marker.on("keypress", (e) => {
          const k = (e as unknown as { originalEvent: KeyboardEvent }).originalEvent.key;
          if (k === "Enter" || k === " ") marker.fire("click");
        });
        g.addLayer(marker);
      }
    })();
  }, [ready, points, layer, unit, activeSlug, lang, router, labels.kmh, zoom]);

  const layers: { id: Layer; label: string }[] = [
    { id: "temp", label: labels.temp },
    { id: "precip", label: labels.precip },
    { id: "wind", label: labels.wind },
  ];
  const legend =
    layer === "temp" ? TEMP_STOPS.map(([t, c]) => [`${Math.round(toUnit(t, unit))}°`, c])
    : layer === "precip" ? RAIN_STOPS.map(([t, c]) => [`${t} mm`, c])
    : WIND_STOPS.map(([t, c]) => [`${t}`, c]);

  return (
    <section className="glass p-4 sm:p-5" aria-labelledby="map-title">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="map-title" className="text-base font-semibold">{labels.title}</h2>
          <p className="text-xs text-2nd">{labels.hint}</p>
          <p className="text-xs text-3rd">{labels.zoomHint}</p>
        </div>
        <div role="radiogroup" aria-label={labels.title} className="flex rounded-full bg-white/10 p-1">
          {layers.map((l) => (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={layer === l.id}
              onClick={() => setLayer(l.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${layer === l.id ? "bg-white text-slate-900" : "text-white hover:bg-white/10"}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
      <div ref={el} className="h-[380px] w-full overflow-hidden rounded-[20px]" />
      <ul className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-2nd" aria-label="Legend">
        {legend.map(([t, c]) => (
          <li key={t} className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full border border-white/70" style={{ background: c }} aria-hidden />
            {t}{layer === "wind" && t === legend.at(-1)![0] ? `+ ${labels.kmh}` : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}
