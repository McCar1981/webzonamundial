// scripts/gen-pwa-icons.cjs
// Genera los iconos de la PWA a partir del logo del escudo.
// - icon-192.png / icon-512.png  → purpose "any" (logo sobre fondo de marca)
// - icon-maskable-512.png        → purpose "maskable" (logo en zona segura 60%)
// - apple-touch-icon.png (180)   → iOS (fondo sólido, sin transparencia)
// - favicon-32.png / favicon-16.png + favicon.ico
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SRC = "public/img/email/logo-zonamundial.png";
const OUT = "public/icons";
const BG = { r: 11, g: 11, b: 15, alpha: 1 }; // #0b0b0f marca

fs.mkdirSync(OUT, { recursive: true });

async function iconOnBg(size, logoRatio, file, flatten) {
  const logoTarget = Math.round(size * logoRatio);
  const logo = await sharp(SRC)
    .resize(logoTarget, logoTarget, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  let img = sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  }).composite([{ input: logo, gravity: "center" }]);
  if (flatten) img = img.flatten({ background: BG });
  await img.png().toFile(path.join(OUT, file));
  console.log("  ✓", file, `(${size}x${size})`);
}

function pngToIco(pngBuffer, size) {
  // Contenedor ICO con un único PNG embebido (soportado por navegadores modernos).
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type = icon
  header.writeUInt16LE(1, 4); // count
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 = 256)
  entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2); // palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(pngBuffer.length, 8); // size of png data
  entry.writeUInt32LE(6 + 16, 12); // offset
  return Buffer.concat([header, entry, pngBuffer]);
}

(async () => {
  console.log("Generando iconos PWA…");
  await iconOnBg(192, 0.78, "icon-192.png", false);
  await iconOnBg(512, 0.78, "icon-512.png", false);
  await iconOnBg(512, 0.6, "icon-maskable-512.png", true); // maskable: zona segura + fondo lleno
  await iconOnBg(180, 0.8, "apple-touch-icon.png", true);  // iOS: sin alpha
  await iconOnBg(32, 0.82, "favicon-32.png", true);
  await iconOnBg(16, 0.82, "favicon-16.png", true);

  // favicon.ico (PNG 32x32 embebido) → raíz de public/
  const fav32 = await sharp(path.join(OUT, "favicon-32.png")).png().toBuffer();
  fs.writeFileSync("public/favicon.ico", pngToIco(fav32, 32));
  console.log("  ✓ favicon.ico (raíz public/)");
  console.log("Listo.");
})().catch((e) => { console.error(e); process.exit(1); });
