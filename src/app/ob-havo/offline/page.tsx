import type { Metadata } from "next";
import { RetryButton } from "@/components/site/pwa";

export const metadata: Metadata = { title: "Internet aloqasi yo'q — Ob-havo" };

export default function OfflinePage() {
  return (
    <>
      <div className="sky-night-cloudy fixed inset-0 -z-10" aria-hidden />
      <main className="mx-auto flex min-h-[80svh] w-full max-w-md flex-1 items-center px-4">
        <div className="glass w-full p-8 text-center">
          <svg aria-hidden viewBox="0 0 64 64" className="mx-auto h-16 w-16" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 47a9.5 9.5 0 0 1-.9-18.96A14.5 14.5 0 0 1 46 27.2 10 10 0 0 1 46.5 47z" fill="rgba(255,255,255,0.15)" />
            <path d="M10 10l44 44" stroke="#fca5a5" />
          </svg>
          <h1 className="mt-4 text-xl font-semibold">Internet aloqasi yo&apos;q</h1>
          <p className="mt-2 text-sm text-2nd">
            Bu sahifa hali saqlanmagan. Avval ochilgan shaharlar internetsiz ham ko&apos;rinadi.
            Aloqa tiklangach, qaytadan urinib ko&apos;ring.
          </p>
          <p className="mt-1 text-xs text-3rd" lang="ru">Нет подключения к интернету · No internet connection</p>
          <RetryButton />
        </div>
      </main>
    </>
  );
}
