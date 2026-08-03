// Invariantes del vigilante de crons (src/lib/ops). Existe porque un fallo aquí
// es SILENCIOSO: el sistema que debe avisar de una caída se queda callado, que
// es exactamente lo que dejó la home con 500 durante 8 días sin alerta.
//
// Comprueba dos cosas que, rotas, dejan ciego al monitor:
//   1) El TTL del latido supera con holgura el mayor umbral vigilado. Si no,
//      la key expira antes de poder considerarse obsoleta y la caída se lee
//      como "sin datos" = OK (el bug original: TTL 1h < umbrales de horas).
//   2) Toda ruta vigilada existe de verdad en src/app. Un watch a una ruta
//      fantasma (p. ej. el viejo poll-friendlies del Mundial) está siempre en
//      verde y no vigila nada.
//
// Uso: npx tsx scripts/test-ops-watches.ts

import { existsSync } from "node:fs";
import { join } from "node:path";
import { CRON_WATCHES } from "../src/lib/ops/config";
import { HEARTBEAT_TTL_S } from "../src/lib/ops/store";

const RAIZ = join(__dirname, "..");
let fallos = 0;
const ok = (cond: boolean, msg: string) => {
  console.log(`${cond ? "  ok " : "  X  "}${msg}`);
  if (!cond) fallos++;
};

// ── 1) El TTL debe superar el mayor umbral, o el latido caduca antes de tiempo.
const maxUmbralMin = Math.max(...CRON_WATCHES.map((w) => w.maxAgeMinutes));
const ttlMin = HEARTBEAT_TTL_S / 60;
ok(
  ttlMin > maxUmbralMin * 2,
  `TTL del latido (${Math.round(ttlMin)}min) supera con holgura el mayor umbral (${maxUmbralMin}min)`,
);

// ── 2) Toda ruta vigilada existe como route.ts en src/app.
for (const w of CRON_WATCHES) {
  // "/api/cron/x" -> src/app/api/cron/x/route.ts
  const rel = w.path.replace(/^\//, "").split("/").join("/");
  const existe =
    existsSync(join(RAIZ, "src/app", rel, "route.ts")) ||
    existsSync(join(RAIZ, "src/app", rel, "route.tsx"));
  ok(existe, `watch "${w.job}" apunta a una ruta que existe (${w.path})`);
}

console.log("");
if (fallos > 0) {
  console.log(`${fallos} invariante(s) del monitor roto(s): el vigilante quedaría ciego.`);
  process.exit(1);
}
console.log("Invariantes del vigilante de crons OK.");
