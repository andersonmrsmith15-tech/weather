import type { Metadata, Viewport } from "next";
import "./site.css";

export const metadata: Metadata = {
  title: "Ob-havo — O'zbekiston shaharlari",
  description: "Bugungi ob-havo, soatlik va 7 kunlik prognoz, havo sifati va interaktiv xarita",
};

export const viewport: Viewport = { themeColor: "#1b2a44" };

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site relative flex min-h-screen flex-1 flex-col">
      {/* Ma'lumot yuklanguncha ko'rinadigan fon */}
      <div className="sky-day-cloudy fixed inset-0 -z-20" aria-hidden />
      {children}
    </div>
  );
}
