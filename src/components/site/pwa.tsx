"use client";

import Image from "next/image";
import { useOffline } from "next/offline";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

/* ------------------------- Service worker ------------------------- */

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}

export function RetryButton() {
  return (
    <button
      type="button"
      onClick={() => location.reload()}
      className="mt-6 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-white/90"
    >
      Qayta urinish
    </button>
  );
}

/* ------------------------- Rejim aniqlash ------------------------- */

const noop = () => () => {};
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;
export const useStandalone = () => useSyncExternalStore(noop, isStandalone, () => false);

/* --------------------- Ilova xatti-harakatlari --------------------- */

const LAST_CITY = "wx-last-city";
const STALE_MS = 10 * 60_000;

/**
 * - Oxirgi ko'rilgan shaharni eslab qoladi (ilova ochilganda o'sha shahar chiqadi)
 * - Ilovaga 10 daqiqadan keyin qaytilsa ma'lumotni yangilaydi
 */
export function AppBehaviors({ slug, explicit, lang }: { slug: string; explicit: boolean; lang: string }) {
  const router = useRouter();

  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem(LAST_CITY); } catch {}
    if (!explicit && stored && stored !== slug) {
      const p = new URLSearchParams({ shahar: stored });
      if (lang !== "uz") p.set("til", lang);
      router.replace(`/ob-havo?${p}`, { scroll: false });
      return;
    }
    try { localStorage.setItem(LAST_CITY, slug); } catch {}
  }, [slug, explicit, lang, router]);

  useEffect(() => {
    let hiddenAt = 0;
    const onVis = () => {
      if (document.visibilityState === "hidden") hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > STALE_MS) router.refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [router]);

  return null;
}

/* -------------------------- Offline xabari -------------------------- */

export function OfflineBanner({ text }: { text: string }) {
  const offline = useOffline();
  if (!offline) return null;
  return (
    <div role="status" className="fixed inset-x-0 top-[calc(env(safe-area-inset-top)_+_0.5rem)] z-[1200] flex justify-center px-4">
      <span className="glass flex items-center gap-2 rounded-full! bg-amber-950/60! px-4 py-2 text-xs font-semibold">
        <span aria-hidden className="h-2 w-2 rounded-full bg-amber-300" />
        {text}
      </span>
    </div>
  );
}

/* -------------------------- O'rnatish taklifi -------------------------- */

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const DISMISS_KEY = "wx-install-dismissed";
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
const wasDismissed = () => {
  try { return Date.now() - Number(localStorage.getItem(DISMISS_KEY) ?? 0) < 14 * 86400_000; } catch { return false; }
};

export function InstallPrompt({ t }: { t: { title: string; body: string; install: string; later: string; ios: string } }) {
  const standalone = useStandalone();
  const ios = useSyncExternalStore(noop, isIos, () => false);
  const dismissedInit = useSyncExternalStore(noop, wasDismissed, () => true);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e as BeforeInstallPromptEvent); };
    const onInstalled = () => setDeferred(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (standalone || dismissed || dismissedInit || (!deferred && !ios)) return null;

  const close = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setDismissed(true);
  };

  return (
    <div
      role="dialog"
      aria-labelledby="install-title"
      className="glass fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)_+_5.25rem)] z-[1100] flex items-center gap-3 rounded-3xl! bg-slate-900/70! p-4 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:w-[380px]"
    >
      <Image src="/icons/icon-192.png" alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <h2 id="install-title" className="text-sm font-semibold">{t.title}</h2>
        <p className="mt-0.5 text-xs text-2nd">{ios && !deferred ? t.ios : t.body}</p>
      </div>
      <div className="flex shrink-0 flex-col gap-1.5">
        {deferred && (
          <button
            type="button"
            onClick={async () => { await deferred.prompt(); await deferred.userChoice; setDeferred(null); }}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-900"
          >
            {t.install}
          </button>
        )}
        <button type="button" onClick={close} className="rounded-full px-3 py-1.5 text-xs font-semibold text-2nd hover:bg-white/10">
          {t.later}
        </button>
      </div>
    </div>
  );
}

/* --------------------------- Pastki tab-bar --------------------------- */

const TAB_ICONS: Record<string, string> = {
  hozir: "M12 3v2M12 19v2M5 12H3M21 12h-2M6.3 6.3 4.9 4.9M19.1 19.1l-1.4-1.4M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
  soatlik: "M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM12 7v5l3 2",
  hafta: "M4 6h16M4 12h16M4 18h10",
  xarita: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14",
};

export function BottomTabs({ tabs }: { tabs: { id: string; label: string }[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  useEffect(() => {
    const els = tabs.map((t) => document.getElementById(t.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) setActive(vis.target.id);
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [tabs]);

  return (
    <nav
      aria-label="Bo'limlar"
      className="glass fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)_+_0.75rem)] z-[1000] rounded-[26px]! bg-slate-900/55! lg:hidden"
    >
      <ul className="grid grid-cols-4">
        {tabs.map((t) => (
          <li key={t.id}>
            <a
              href={`#${t.id}`}
              aria-current={active === t.id ? "true" : undefined}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(t.id);
                const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
                history.replaceState(null, "", `${location.pathname}${location.search}#${t.id}`);
                setActive(t.id);
              }}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${active === t.id ? "text-white" : "text-white/70"}`}
            >
              <span className={`grid h-7 w-12 place-items-center rounded-full transition-colors ${active === t.id ? "bg-white/20" : ""}`}>
                <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={TAB_ICONS[t.id]} />
                </svg>
              </span>
              {t.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
