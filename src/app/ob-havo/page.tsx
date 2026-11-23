import { Suspense } from "react";
import { Backdrop } from "@/components/site/backdrop";
import { SiteHeader } from "@/components/site/header";
import { AppBehaviors, BottomTabs, InstallPrompt, OfflineBanner } from "@/components/site/pwa";
import { Daily, Details, Hero, Hourly, SiteFooter } from "@/components/site/sections";
import { WeatherMap } from "@/components/site/weather-map";
import { getDemoData, getSiteData, type SiteData } from "@/lib/site-data";
import { DICTS, LANGS, parseLang, wxCondition } from "@/lib/site-i18n";

export default function WeatherPage({ searchParams }: PageProps<"/ob-havo">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      {searchParams.then((sp) => (
        <WeatherContent
          slug={typeof sp.shahar === "string" ? sp.shahar : "toshkent"}
          explicit={typeof sp.shahar === "string"}
          lang={parseLang(sp.til)}
          demo={sp.demo === "1"}
        />
      ))}
    </Suspense>
  );
}

async function WeatherContent({ slug, explicit, lang, demo }: { slug: string; explicit: boolean; lang: ReturnType<typeof parseLang>; demo: boolean }) {
  const t = DICTS[lang];
  let data: SiteData | null = null;
  let fallback = demo;
  if (!demo) {
    try {
      data = await getSiteData(slug);
      if (!data && slug === "toshkent") fallback = true; // baza bo'sh
    } catch {
      fallback = true; // baza bilan ulanish yo'q
    }
  }
  if (fallback) data = getDemoData();

  if (!data) {
    return (
      <div className="mx-auto mt-24 max-w-md px-4 text-center">
        <div className="glass p-8">
          <h1 className="text-xl font-semibold">{t.notFound}</h1>
          <a href="/ob-havo" className="mt-4 inline-block rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900">Toshkent</a>
        </div>
      </div>
    );
  }

  const headerStrings = {
    siteName: t.siteName, dashboard: t.dashboard, searchPlaceholder: t.searchPlaceholder, searchLabel: t.searchLabel,
    noResults: t.noResults, unitToggle: t.unitToggle, toDay: t.toDay, toNight: t.toNight,
  };

  return (
    <div lang={lang} className="flex flex-1 flex-col">
      <Backdrop cond={wxCondition(data.now.code)} isDay={data.now.isDay} />
      <SiteHeader cities={data.cities} lang={lang} isDay={data.now.isDay} t={headerStrings} />

      {data.demo && (
        <p className="mx-auto mb-2 w-full max-w-7xl px-4 sm:px-6">
          <span className="glass inline-block rounded-full! px-3 py-1 text-xs font-semibold">{t.demoBanner}</span>
        </p>
      )}

      <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 content-start items-start gap-4 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-5">
        <div id="hozir" className="scroll-mt-4 lg:col-start-1"><Hero data={data} t={t} lang={lang} /></div>
        <aside className="flex flex-col gap-4 lg:col-start-2 lg:row-span-3 lg:row-start-1" aria-label={t.week}>
          <div className="flex flex-col gap-4 lg:sticky lg:top-4">
            <div id="soatlik" className="scroll-mt-4"><Hourly data={data} t={t} lang={lang} /></div>
            <div id="hafta" className="scroll-mt-4"><Daily data={data} t={t} lang={lang} /></div>
          </div>
        </aside>
        <div className="lg:col-start-1"><Details data={data} t={t} lang={lang} /></div>
        <div id="xarita" className="scroll-mt-4 lg:col-start-1">
          <WeatherMap
            points={data.map}
            activeSlug={data.city.slug}
            lang={lang}
            labels={{ temp: t.layerTemp, precip: t.layerPrecip, wind: t.layerWind, title: t.map, hint: t.mapHint, zoomHint: t.mapZoomHint, kmh: t.kmh }}
          />
        </div>
      </main>

      <SiteFooter t={t} lang={lang} slug={data.city.slug} demo={data.demo && demo} langs={LANGS} />

      <BottomTabs tabs={[
        { id: "hozir", label: t.tabNow },
        { id: "soatlik", label: t.tabHourly },
        { id: "hafta", label: t.tabWeek },
        { id: "xarita", label: t.tabMap },
      ]} />
      <InstallPrompt t={{ title: t.installTitle, body: t.installBody, install: t.installBtn, later: t.installLater, ios: t.installIos }} />
      <OfflineBanner text={t.offline} />
      {!data.demo && <AppBehaviors slug={data.city.slug} explicit={explicit} lang={lang} />}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="flex flex-1 flex-col" aria-busy="true" aria-live="polite">
      <span className="sr-only">Yuklanmoqda…</span>
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-4 sm:px-6">
        <div className="skel h-9 w-28" /><div className="skel ml-6 hidden h-11 flex-1 rounded-full! sm:block" /><div className="skel ml-auto h-10 w-32 rounded-full!" />
      </div>
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-5">
        <div className="skel h-[calc(100svh-9rem)] lg:h-80" />
        <div className="flex flex-col gap-4 lg:row-span-2"><div className="skel h-44" /><div className="skel h-96" /></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{Array.from({ length: 8 }, (_, i) => <div key={i} className="skel h-44" />)}</div>
      </div>
    </div>
  );
}
