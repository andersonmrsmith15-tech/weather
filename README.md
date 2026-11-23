# O'zbekiston ob-havo dashboardi

O'zbekistonning barcha viloyat markazlari va yirik shaharlari (60 ta) uchun **bugungi**, **haftalik** va **oylik** ob-havo ma'lumotlarini ko'rsatadigan dashboard.

- **Next.js 16** (App Router, Cache Components) + **Tailwind CSS 4** + **Recharts**
- Barcha ma'lumotlar **PostgreSQL**'dan o'qiladi
- **Vercel**'ga moslashtirilgan: serverless ulanish, kunlik **Vercel Cron**

## Qanday ishlaydi

```
Open-Meteo API ──(cron / db:setup)──▶ PostgreSQL ──▶ Next.js dashboard
```

Dashboard tashqi API'ga hech qachon murojaat qilmaydi — faqat PostgreSQL'dan o'qiydi.
Bazani to'ldirish uchun bepul [Open-Meteo](https://open-meteo.com) (kalit kerak emas) ishlatiladi:

- `npm run db:setup` — sxema, shaharlar, ~1 yillik arxiv va 16 kunlik prognozni yuklaydi (bir martalik, ~3 daqiqa)
- `/api/cron/sync` — har kuni joriy holat, so'nggi 31 kun va 16 kunlik prognozni yangilaydi, so'nggi 2 haftani arxiv ma'lumoti bilan tasdiqlaydi

## Sahifalar

| Sahifa | Mazmuni |
|---|---|
| `/` | KPI'lar (o'rtacha, eng issiq/sovuq, yog'in), hududlar bo'yicha shahar kartalari |
| `/?view=hafta` | Barcha shaharlar uchun 7 kunlik prognoz jadvali |
| `/?view=oy` | So'nggi 30 kun yoki tanlangan oy: hududlar bo'yicha grafiklar + shaharlar statistikasi |
| `/shahar/[slug]` | Shahar: joriy holat, haftalik prognoz, 30 kun + prognoz grafigi, 12 oylik statistika |
| `/ob-havo` | Foydalanuvchilar uchun ob-havo sayti (glassmorphism): hero, 24 soatlik lenta, 7 kunlik prognoz, 8 ta ko'rsatkich kartasi (namlik, shamol kompasi, UV, bosim, ko'rinish, quyosh yoyi, AQI, yog'in), interaktiv xarita |

`/ob-havo` parametrlari: `?shahar=samarqand`, `?til=uz|ru|en`, `?demo=1` (namuna ma'lumot: Toshkent, +18°C, qisman bulutli).
°C/°F va kun/tun tanlovi brauzerda (localStorage) saqlanadi.

Barcha ko'rinishlarda **hudud filtri** bor (`?region=Samarqand viloyati`).

## Baza sxemasi

`db/schema.sql`:

- `cities` — shaharlar (nom, viloyat, koordinata)
- `daily_weather` — kunlik ma'lumot (maks/min/o'rtacha harorat, yog'in, qor, shamol, namlik, quyosh chiqishi/botishi); `source` = `archive` | `forecast`
- `current_weather` — har bir shaharning joriy holati
- `hourly_weather` — 72 soatlik prognoz + havo sifati (US AQI, PM2.5, PM10); saytdagi "hozirgi" holat joriy soat qatoridan olinadi
- `sync_log` — sinxronizatsiya jurnali

## Lokal ishga tushirish

```bash
npm install
cp .env.example .env.local     # DATABASE_URL va CRON_SECRET ni to'ldiring
npm run db:setup               # bazani yaratib, ma'lumot bilan to'ldiradi
npm run db:sync                # (ixtiyoriy) prognoz, soatlik va AQI ni qo'lda yangilash
npm run dev                    # http://localhost:3000
```

## Vercel'ga joylash

1. **PostgreSQL oling** — Vercel Marketplace'dagi Neon (Storage → Create Database) yoki Supabase va boshqalar.
   Neon integratsiyasi `DATABASE_URL` ni avtomatik qo'shadi (`POSTGRES_URL` ham qo'llab-quvvatlanadi).
2. **Loyihani import qiling** (GitHub → Vercel → New Project). Framework avtomatik aniqlanadi.
3. **Environment Variables**:
   - `DATABASE_URL` — PostgreSQL ulanish manzili (pooled ulanish tavsiya etiladi)
   - `CRON_SECRET` — ixtiyoriy uzun tasodifiy satr (`openssl rand -hex 32`)
4. **Bazani to'ldiring** (bir marta, o'z kompyuteringizdan):
   ```bash
   DATABASE_URL="postgres://...neon.tech/..." npm run db:setup
   ```
5. **Deploy**. `vercel.json` dagi cron har kuni 01:00 UTC (06:00 Toshkent) da `/api/cron/sync` ni chaqiradi.

Qo'lda yangilash:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<domeningiz>/api/cron/sync
```

> **Eslatma:** Vercel Hobby rejasida cron kuniga faqat bir marta ishlaydi. Pro rejada `vercel.json` dagi jadvalni
> masalan `"0 * * * *"` (har soat) ga o'zgartirib, joriy holatni tez-tez yangilash mumkin.

## Shahar qo'shish

`src/lib/cities.ts` ga shahar qo'shing va `npm run db:setup` ni qayta ishga tushiring (mavjud ma'lumotlar saqlanadi, yangilari qo'shiladi).

## Litsenziya / manba

Ob-havo ma'lumotlari: [Open-Meteo.com](https://open-meteo.com) — CC BY 4.0. Xarita: © OpenStreetMap hissadorlari (Leaflet).
