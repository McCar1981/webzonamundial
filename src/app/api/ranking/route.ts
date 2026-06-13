// src/app/api/ranking/route.ts
//
// GET /api/ranking → ranking de Fútcoins (la moneda única de la app).
//   · Sin ?module → ranking GLOBAL por SALDO (profiles.coins): "cuántas tienes".
//   · ?module=trivia|predicciones|fantasy|modo-carrera|micro → ranking de ESE
//     módulo por Fútcoins GENERADAS en él (desde el ledger): su competencia propia.
//   · ?country=xx (ISO-2) → ranking NACIONAL: top de jugadores DE ese país y,
//     con sesión, tu puesto dentro de tu país. Tiene prioridad sobre ?module.
//
//   · entries: top (por defecto 50, máx 200 vía ?limit=).
//   · me: posición del usuario autenticado (null si no hay sesión / no compite).
//
// ?only=me  → omite el top y devuelve solo la posición del usuario. Lo usa la
//             cabecera, que solo necesita el saldo + el puesto y no la lista.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import {
  getGlobalCoinRanking,
  getUserRank,
  getModuleCoinRanking,
  getModuleUserRank,
  getCountryCoinRanking,
  getUserCountryRank,
} from "@/lib/economy/ranking";
import type { CoinModule } from "@/lib/economy/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODULES: CoinModule[] = ["predicciones", "trivia", "fantasy", "modo-carrera", "micro", "draft-mundial"];
function parseModule(v: string | null): CoinModule | null {
  return v && (MODULES as string[]).includes(v) ? (v as CoinModule) : null;
}

/** ?country= válido solo si parece un ISO-2 (no ensuciamos la consulta si no). */
function parseCountry(v: string | null): string | null {
  if (!v) return null;
  const c = v.trim().toLowerCase();
  return /^[a-z]{2}$/.test(c) ? c : null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const onlyMe = url.searchParams.get("only") === "me";
  const limit = Number(url.searchParams.get("limit")) || 50;
  const mod = parseModule(url.searchParams.get("module"));
  const country = parseCountry(url.searchParams.get("country"));

  const user = await getCurrentUser();

  // Ranking NACIONAL (por país): top del país + mi puesto nacional. Su `me`
  // tiene forma distinta (MyCountryRank), así que lo resolvemos por separado.
  if (country) {
    const countryMe = user ? await getUserCountryRank(user.id) : null;
    // Solo es "mi país" si coincide con el que pido (evita marcar puesto ajeno).
    const me = countryMe && countryMe.country === country ? countryMe : null;
    if (onlyMe) {
      return NextResponse.json({ country, me }, { headers: { "Cache-Control": "no-store" } });
    }
    const entries = await getCountryCoinRanking(country, limit);
    return NextResponse.json({ country, entries, me }, { headers: { "Cache-Control": "no-store" } });
  }

  const me = user
    ? mod
      ? await getModuleUserRank(mod, user.id)
      : await getUserRank(user.id)
    : null;

  if (onlyMe) {
    return NextResponse.json({ module: mod, me }, { headers: { "Cache-Control": "no-store" } });
  }

  const entries = mod
    ? await getModuleCoinRanking(mod, limit)
    : await getGlobalCoinRanking(limit);
  return NextResponse.json({ module: mod, entries, me }, { headers: { "Cache-Control": "no-store" } });
}
