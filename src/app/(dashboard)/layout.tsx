import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "O'zbekiston ob-havosi — Dashboard",
  description: "O'zbekistonning barcha viloyat markazlari va yirik shaharlari uchun haftalik va oylik ob-havo ma'lumotlari",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span aria-hidden className="text-xl">🌤️</span>
            <span>O&apos;zbekiston ob-havosi</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/ob-havo" className="rounded-lg border border-line px-3 py-1.5 font-medium hover:bg-surface-2">
              Ob-havo sayti →
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">{children}</main>
      <footer className="border-t border-line py-4 text-center text-xs text-muted">
        Ob-havo ma&apos;lumotlari: Open-Meteo.com (CC BY 4.0) · Ma&apos;lumotlar manbai: PostgreSQL
      </footer>
    </>
  );
}
