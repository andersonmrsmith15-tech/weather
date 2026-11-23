// PWA ikonkalarini yaratish: node scripts/make-icons.mjs
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const art = (scale) => `
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
    <circle cx="206" cy="196" r="78" fill="#fcd34d"/>
    <g stroke="#fcd34d" stroke-width="22" stroke-linecap="round">
      <line x1="206" y1="70" x2="206" y2="92"/><line x1="96" y1="196" x2="118" y2="196"/>
      <line x1="128" y1="118" x2="144" y2="134"/><line x1="284" y1="118" x2="268" y2="134"/>
    </g>
    <path d="M178 404a62 62 0 0 1-5.6-123.7A94 94 0 0 1 354 268a66 66 0 0 1 4 136z" fill="#fff"/>
  </g>`;

const bg = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#1b5aa0"/><stop offset="0.55" stop-color="#3577b8"/><stop offset="1" stop-color="#c9743f"/>
</linearGradient></defs>`;

// "any": yumaloq burchakli; "maskable": to'liq fon, rasm xavfsiz zonada (80%)
const any = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${bg}<rect width="512" height="512" rx="112" fill="url(#g)"/>${art(1)}</svg>`;
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${bg}<rect width="512" height="512" fill="url(#g)"/>${art(0.72)}</svg>`;

mkdirSync("public/icons", { recursive: true });
writeFileSync("src/app/icon.svg", any);
for (const s of [192, 512]) {
  await sharp(Buffer.from(any)).resize(s, s).png().toFile(`public/icons/icon-${s}.png`);
  await sharp(Buffer.from(maskable)).resize(s, s).png().toFile(`public/icons/maskable-${s}.png`);
}
await sharp(Buffer.from(maskable)).resize(180, 180).png().toFile("src/app/apple-icon.png");
await sharp(Buffer.from(any)).resize(96, 96).png().toFile("public/icons/shortcut-96.png");
console.log("Ikonkalar tayyor");
