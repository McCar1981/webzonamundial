// scripts/check-formaciones.ts
// Comprueba qué formaciones son imposibles en cada liga del Draft.
//   npx tsx scripts/check-formaciones.ts

import { poolForLeague, DRAFT_LEAGUES } from "../src/lib/draft/plantillas-ligas";
import { formacionPosible } from "../src/lib/draft/formaciones";
import type { FormacionKey } from "../src/lib/draft/types";

const F: FormacionKey[] = ["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "5-3-2", "4-5-1", "3-4-3", "4-2-4"];

for (const l of DRAFT_LEAGUES) {
  const pool = poolForLeague(l.slug);
  const malas = F.map((f) => ({ f, r: formacionPosible(pool, f) })).filter((x) => !x.r.posible);
  if (malas.length) {
    console.log(`${l.slug.padEnd(20)} (${pool.length} clubes)  BLOQUEADAS:`);
    malas.forEach((m) => console.log(`   ${m.f}  →  ${(m.r as { motivo: string }).motivo}`));
  } else {
    console.log(`${l.slug.padEnd(20)} (${pool.length} clubes)  todas OK`);
  }
}
