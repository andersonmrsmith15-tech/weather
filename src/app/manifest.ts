import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/ob-havo",
    name: "O'zbekiston ob-havosi",
    short_name: "Ob-havo",
    description: "O'zbekiston shaharlari uchun bugungi, soatlik va 7 kunlik ob-havo prognozi",
    lang: "uz",
    dir: "ltr",
    start_url: "/ob-havo?manba=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#0e2746",
    theme_color: "#1b2a44",
    categories: ["weather", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Toshkent", url: "/ob-havo?shahar=toshkent", icons: [{ src: "/icons/shortcut-96.png", sizes: "96x96" }] },
      { name: "Samarqand", url: "/ob-havo?shahar=samarqand", icons: [{ src: "/icons/shortcut-96.png", sizes: "96x96" }] },
      { name: "Dashboard", url: "/", icons: [{ src: "/icons/shortcut-96.png", sizes: "96x96" }] },
    ],
  };
}
