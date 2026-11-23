"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useRef, useState, useTransition } from "react";
import type { CityOption } from "@/lib/site-data";
import { skyStore, unitStore, useIsNight, useUnit } from "./prefs";

type Strings = {
  siteName: string; dashboard: string; searchPlaceholder: string; searchLabel: string; noResults: string;
  unitToggle: string; toDay: string; toNight: string;
};

const norm = (s: string) => s.toLowerCase().replace(/['ʻʼ’`‘]/g, "").normalize("NFKD").replace(/[̀-ͯ]/g, "");

function CitySearch({ cities, lang, t }: { cities: CityOption[]; lang: string; t: Strings }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pending, startTransition] = useTransition();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const n = norm(q.trim());
    if (!n) return cities.slice(0, 8);
    return cities
      .filter((c) => norm(c.name).includes(n) || norm(c.region).includes(n))
      .sort((a, b) => Number(!norm(a.name).startsWith(n)) - Number(!norm(b.name).startsWith(n)))
      .slice(0, 8);
  }, [q, cities]);

  const go = (c: CityOption) => {
    setOpen(false);
    setQ("");
    inputRef.current?.blur();
    const p = new URLSearchParams({ shahar: c.slug });
    if (lang !== "uz") p.set("til", lang);
    startTransition(() => router.push(`/ob-havo?${p}`, { scroll: false }));
  };

  return (
    <div className="relative w-full max-w-sm">
      <label htmlFor={`${listId}-input`} className="sr-only">{t.searchLabel}</label>
      <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/80" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
      </svg>
      <input
        ref={inputRef}
        id={`${listId}-input`}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && results[active] ? `${listId}-${results[active].slug}` : undefined}
        autoComplete="off"
        placeholder={t.searchPlaceholder}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, results.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          else if (e.key === "Enter" && open && results[active]) { e.preventDefault(); go(results[active]); }
          else if (e.key === "Escape") { setOpen(false); }
        }}
        className={`glass h-11 w-full rounded-full! pl-10 pr-4 text-sm text-white placeholder:text-white/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${pending ? "opacity-70" : ""}`}
      />
      {open && (
        <ul id={listId} role="listbox" className="glass absolute z-[1000] mt-2 max-h-80 w-full overflow-auto rounded-2xl! bg-slate-900/80! p-1.5">
          {results.length === 0 && <li className="px-3 py-2 text-sm text-2nd">{t.noResults}</li>}
          {results.map((c, i) => (
            <li
              key={c.slug}
              id={`${listId}-${c.slug}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); go(c); }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer rounded-xl px-3 py-2 ${i === active ? "bg-white/15" : ""}`}
            >
              <div className="text-sm font-semibold">{c.name}</div>
              <div className="text-xs text-2nd">{c.region}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SiteHeader({ cities, lang, isDay, t }: { cities: CityOption[]; lang: string; isDay: boolean; t: Strings }) {
  const unit = useUnit();
  const night = useIsNight(isDay);
  return (
    <header className="relative z-[500] mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-4 sm:flex-nowrap sm:px-6">
      <Link href={lang === "uz" ? "/ob-havo" : `/ob-havo?til=${lang}`} className="flex items-center gap-2 text-lg font-bold tracking-tight">
        <svg aria-hidden viewBox="0 0 32 32" className="h-8 w-8">
          <circle cx="13" cy="13" r="6" fill="#fcd34d" />
          <path d="M11 25a5 5 0 0 1-.4-9.98A7.5 7.5 0 0 1 25 15.5 4.75 4.75 0 0 1 24.5 25z" fill="#fff" fillOpacity="0.92" />
        </svg>
        <span>{t.siteName}</span>
      </Link>

      <div className="order-3 w-full sm:order-none sm:ml-6 sm:flex-1">
        <CitySearch cities={cities} lang={lang} t={t} />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div role="group" aria-label={t.unitToggle} className="glass flex rounded-full! p-1">
          {(["C", "F"] as const).map((u) => (
            <button
              key={u}
              type="button"
              aria-pressed={unit === u}
              onClick={() => unitStore.set(u)}
              className={`h-8 w-9 rounded-full text-sm font-semibold transition-colors ${unit === u ? "bg-white text-slate-900" : "text-white hover:bg-white/10"}`}
            >
              °{u}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => skyStore.set(night ? "day" : "night")}
          aria-label={night ? t.toDay : t.toNight}
          title={night ? t.toDay : t.toNight}
          className="glass grid h-10 w-10 place-items-center rounded-full! transition-colors hover:bg-white/15"
        >
          {night ? (
            <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          ) : (
            <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
              <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
            </svg>
          )}
        </button>
        <Link href="/" className="glass hidden h-10 items-center rounded-full! px-4 text-sm font-semibold hover:bg-white/15 md:flex">
          {t.dashboard}
        </Link>
      </div>
    </header>
  );
}
