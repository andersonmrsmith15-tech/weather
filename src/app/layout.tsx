import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegister } from "@/components/site/pwa";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin", "cyrillic"], weight: ["200", "300", "400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "O'zbekiston ob-havosi",
  description: "O'zbekiston shaharlari uchun ob-havo: bugun, soatlik, haftalik va oylik prognoz",
  applicationName: "Ob-havo",
  appleWebApp: { capable: true, title: "Ob-havo", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // iPhone "chiqib turgan" qismlari uchun safe-area
  themeColor: "#1b2a44",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uz" className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
