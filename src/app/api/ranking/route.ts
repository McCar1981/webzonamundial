// src/app/api/ranking/route.ts
//
// GET /api/ranking → ranking de Fútcoins (la moneda única de la app).
//   · Sin ?module → ranking GLOBAL por SALDO (profiles.coins): "cuántas tienes".
//   · ?module=trivia|predicciones|fantasy|modo-carrera|micro → ranking de ESE
//     módulo por Fútcoins GENERADAS en él (desde el ledger): su competencia propia.
//   · ?country=xx (ISO-2) → ranking NACIONAL: top de jugadores DE ese país y,
//     con sesión, tu puesto dentro de tu país.
//   · ?creator=slug → ranking de COMUNIDAD: top de la comunidad de ese creador y,
//     con sesión, tu puesto en tu comunidad.
//   Prioridad: creator > country > module > global.
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
  getCreatorCoinRanking,
  getUserCreatorRank,
} from "@/lib/economy/ranking";
import { validateFavCreator } from "@/lib/profile-validation";
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

  const creator = validateFavCreator(url.searchParams.get("creator"));

  const user = await getCurrentUser();

  // Ranking de COMUNIDAD (por creador): top de la comunidad + mi puesto en ella.
  // Tiene prioridad sobre país/módulo. Su `me` es MyCreatorRank.
  if (creator) {
    const creatorMe = user ? await getUserCreatorRank(user.id) : null;
    const me = creatorMe && creatorMe.creator === creator ? creatorMe : null;
    if (onlyMe) {
      return NextResponse.json({ creator, me }, { headers: { "Cache-Control": "no-store" } });
    }
    const entries = await getCreatorCoinRanking(creator, limit);
    return NextResponse.json({ creator, entries, me }, { headers: { "Cache-Control": "no-store" } });
  }

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
