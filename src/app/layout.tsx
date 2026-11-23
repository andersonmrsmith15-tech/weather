import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "O'zbekiston ob-havosi — Dashboard",
  description: "O'zbekistonning barcha viloyat markazlari va yirik shaharlari uchun haftalik va oylik ob-havo ma'lumotlari",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uz" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span aria-hidden className="text-xl">🌤️</span>
              <span>O&apos;zbekiston ob-havosi</span>
            </Link>
            <span className="hidden text-sm text-muted sm:block">Ma&apos;lumotlar manbai: PostgreSQL</span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">{children}</main>
        <footer className="border-t border-line py-4 text-center text-xs text-muted">
          Ob-havo ma&apos;lumotlari: Open-Meteo.com (CC BY 4.0) · Kunlik sinxronizatsiya
        </footer>
      </body>
    </html>
  );
}
