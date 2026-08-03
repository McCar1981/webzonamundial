// src/app/api/draft/guardar/route.ts
//
// POST /api/draft/guardar
// Guarda un resultado de Draft Mundial y, si el usuario está autenticado,
// acredita Fútcoins + XP a la billetera única.
//
// Body: {
//   formacion: string,
//   estilo: string,
//   modo: string,
//   puntaje: number,
//   calificacion: string,
//   fuerza: number,
//   balance: number,
//   coherencia: number,
//   bonusEstilo: number,
//   equipo: Array<{posicion,nombre,seleccion,year,fuerza}>,
//   coins: number,   -- monedas a acreditar
//   xp: number       -- xp a acreditar
// }

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { adminClient } from "@/lib/predictions/admin";
import { grantCoins } from "@/lib/economy/wallet";
import { isPro } from "@/lib/pro/entitlement";
import { consumeDailyQuota } from "@/lib/pro/quota";
import { FREE_LIMITS } from "@/lib/pro/limits";
import { monedasPorCalificacion, puntosPorCalificacion, calificacionPorPuntaje, calcularResultado } from "@/lib/draft/simulacion";
import { poolForLeague } from "@/lib/draft/plantillas-ligas";
import type { JugadorSeleccionado, Estilo, DraftResultado } from "@/lib/draft/types";

// ── Recálculo AUTORITATIVO del puntaje en servidor ──────────────────────────
// El anti-falsificación anterior solo ACOTABA el puntaje del cliente a 0-100;
// nunca lo recalculaba. Un POST autenticado con `puntaje: 100` clampaba a 100,
// daba calificación "Leyenda" y colocaba al que lo mandara en el nº1 del
// ranking (que ordena por MAX(puntaje)) sin haber jugado. El daño no era la
// moneda (ya acotada) sino el envenenamiento permanente del ranking y del XP.
//
// Ahora el cliente solo elige QUÉ once monta; la fuerza de cada jugador la pone
// el SERVIDOR desde el pool de la liga (la misma fuente que dibuja el juego),
// así que mandar 11 jugadores con fuerza 99 no sirve: se ignora la del cliente.
const RANGO_DIACRITICOS = /[̀-ͯ]/g; // marcas combinantes (tildes) tras NFD
const normNombre = (s: unknown) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(RANGO_DIACRITICOS, "");

type RecalculoOnce =
  | { estado: "ok"; res: DraftResultado }
  | { estado: "invalido" } // había pool real pero el once no casa → forjado/roto
  | { estado: "sin_pool" }; // sin liga fiable → no se puede validar (legado)

function recalcularDesdeOnce(
  equipo: unknown,
  estilo: string,
  ligaSlug: string | null
): RecalculoOnce {
  // Sin liga no se puede reconstruir el pool exacto que usó el cliente: se cae
  // al camino de acotado (comportamiento anterior) en vez de rechazar, para no
  // romper guardados legítimos de clientes que no manden `liga`.
  if (!ligaSlug || !Array.isArray(equipo) || equipo.length !== 11) {
    return { estado: "sin_pool" };
  }
  const pool = poolForLeague(ligaSlug);
  // Índice del pool por (nombre|club|año): la clave incluye club y año para que
  // dos jugadores homónimos de equipos distintos no colisionen.
  const idx = new Map<string, JugadorSeleccionado>();
  for (const p of pool) {
    for (const j of p.jugadores) {
      idx.set(`${normNombre(j.nombre)}|${normNombre(p.seleccion)}|${p.year}`, {
        ...j,
        seleccion: p.seleccion,
        year: p.year,
        bandera: p.bandera,
        logo: p.logo ?? null,
      });
    }
  }
  const validado: JugadorSeleccionado[] = [];
  for (const e of equipo as Array<Record<string, unknown>>) {
    const hit = idx.get(`${normNombre(e.nombre)}|${normNombre(e.seleccion)}|${Number(e.year)}`);
    if (!hit) return { estado: "invalido" };
    validado.push(hit);
  }
  const res = calcularResultado(validado, estilo as Estilo, pool);
  return { estado: "ok", res };
}

// Tope de recompensa por partida que sostiene la economía única de Fútcoins.
// El cliente manda `coins`/`xp`, pero NUNCA se acreditan a ciegas: se acotan al
// máximo legítimo derivado de la calificación (server-authoritative), igual que
// hacen el resto de módulos. calcularBonusCampana da como mucho 30 (campeón) y
// solo la campaña SUMA monedas; el XP solo se reduce por penalización, así que
// el techo de XP es puntosPorCalificacion. Con esto, minar Fútcoins infinitas
// vía POST deja de ser posible: el peor caso es el máximo de un jugador legítimo.
const MAX_BONUS_CAMPANA_COINS = 30;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "body_invalid" }, { status: 400 });
  }

  const {
    formacion,
    estilo,
    modo,
    puntaje,
    calificacion,
    fuerza,
    balance,
    coherencia,
    bonusEstilo,
    equipo,
    liga = null,
    coins = 0,
    xp = 0,
  } = body;

  // Validaciones mínimas
  if (!formacion || !estilo || !modo || typeof puntaje !== "number") {
    return NextResponse.json({ error: "campos_requeridos" }, { status: 400 });
  }

  // `liga` alimenta el ranking POR liga (2026-55) y, sobre todo, es la que deja
  // reconstruir el pool exacto para recalcular el puntaje en servidor.
  const ligaSlug = typeof liga === "string" && liga.length > 0 && liga.length < 40 ? liga : null;

  // ANTI-FALSIFICACIÓN en dos capas:
  //   1) Se RECALCULA el puntaje desde el once real (recalcularDesdeOnce): la
  //      fuerza de cada jugador la pone el servidor desde el pool de la liga,
  //      no el cliente. Es el camino normal y hace la nota a prueba de POSTs.
  //   2) Si no se puede reconstruir el pool (sin `liga`), se cae al acotado
  //      0-100 de siempre, que al menos frena el `puntaje: 999`.
  const stat = (v: unknown) => Math.min(100, Math.max(0, Math.round(Number(v) || 0)));
  const recalc = recalcularDesdeOnce(equipo, estilo, ligaSlug);

  if (recalc.estado === "invalido") {
    // Había pool real y el once no casa con él: o es un cliente roto o un POST
    // forjado. No se guarda: no queremos esa fila envenenando el ranking.
    return NextResponse.json({ error: "once_no_valido" }, { status: 400 });
  }

  const autoritativo = recalc.estado === "ok";
  const safePuntaje = autoritativo ? recalc.res.puntaje : stat(puntaje);
  const safeCalificacion = autoritativo
    ? recalc.res.calificacion
    : calificacionPorPuntaje(safePuntaje);
  // Los cuatro desgloses también salen del recálculo cuando es autoritativo,
  // para que la fila guardada sea coherente con el puntaje y no una mezcla.
  const safeFuerza = autoritativo ? recalc.res.fuerza : stat(fuerza);
  const safeBalance = autoritativo ? recalc.res.balance : stat(balance);
  const safeCoherencia = autoritativo ? recalc.res.coherencia : stat(coherencia);
  const safeBonusEstilo = autoritativo ? recalc.res.bonusEstilo : stat(bonusEstilo);

  // ── 0) Invitado: no se guarda nada, pero la partida NO se pierde ────────
  // Antes se intentaba insertar con user_id NULL contra una columna NOT NULL:
  // la fila fallaba, la ruta devolvía 500 y el invitado perdía la partida justo
  // después de invertir cuatro minutos. Ahora se responde en claro cuántas
  // monedas tendría, para que la UI le proponga crear la cuenta y cobrarlas.
  if (!user) {
    const potenciales = Math.min(
      Math.max(0, Math.floor(Number(coins) || 0)),
      monedasPorCalificacion(safeCalificacion) + MAX_BONUS_CAMPANA_COINS
    );
    return NextResponse.json({
      ok: true,
      resultId: null,
      invitado: true,
      guardado: false,
      limiteAgotado: false,
      grant: null,
      coinsPendientes: potenciales,
      xpPendiente: Math.min(Math.max(0, Math.floor(Number(xp) || 0)), puntosPorCalificacion(safeCalificacion)),
    });
  }

  const admin = adminClient();

  // ── 1) Guardar resultado ────────────────────────────────────────────────
  // La `liga` (ya calculada como ligaSlug arriba) alimenta el ranking POR liga
  // (migración 2026-55). El insert es fail-soft: si la columna todavía no existe
  // (migración sin aplicar), se reintenta sin ella para no perder la partida.
  const baseRow = {
    user_id: user.id,
    formacion,
    estilo,
    modo,
    puntaje: safePuntaje,
    calificacion: safeCalificacion,
    fuerza: safeFuerza,
    balance: safeBalance,
    coherencia: safeCoherencia,
    bonus_estilo: safeBonusEstilo,
    equipo: Array.isArray(equipo) ? equipo : [],
  };

  let resultRow: { id: string } | null = null;
  let resultErr: unknown = null;
  {
    const r = await admin.from("draft_results").insert({ ...baseRow, liga: ligaSlug }).select("id").single();
    resultRow = r.data;
    resultErr = r.error;
    // 42703 = undefined_column → la migración de `liga` aún no está aplicada.
    if (r.error && (r.error.code === "42703" || /liga/.test(r.error.message || ""))) {
      const retry = await admin.from("draft_results").insert(baseRow).select("id").single();
      resultRow = retry.data;
      resultErr = retry.error;
    }
  }

  if (resultErr || !resultRow) {
    console.error("[draft/guardar] error insertando resultado:", resultErr);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  const resultId = resultRow.id;

  // ── 1b) Tope diario Free (5 partidas/día). Pro: ilimitado. ─────────────
  // Consumimos una unidad por partida COMPLETADA. Si el Free ya agotó su cupo,
  // el resultado se guarda igual (estadística/ranking) pero NO se acreditan
  // monedas. La UI ya debería haber bloqueado el inicio; esto es la red de
  // seguridad server-side.
  let limiteAgotado = false;
  const pro = await isPro(user.id, user.email);
  if (!pro) {
    const q = await consumeDailyQuota(user.id, "draft", FREE_LIMITS.draft.dailyGames);
    limiteAgotado = !q.allowed;
  }

  // ── 2) Acreditar monedas (solo usuarios autenticados y dentro del tope) ─
  // Anti-exploit: se acotan las monedas/XP entrantes al máximo legítimo de la
  // calificación server-side. Nunca se confía en el `coins`/`xp` del cliente.
  const maxCoins = monedasPorCalificacion(safeCalificacion) + MAX_BONUS_CAMPANA_COINS;
  const maxXp = puntosPorCalificacion(safeCalificacion);
  const safeCoins = Math.min(Math.max(0, Math.floor(Number(coins) || 0)), maxCoins);
  const safeXp = Math.min(Math.max(0, Math.floor(Number(xp) || 0)), maxXp);

  let grant: { coinsAwarded: number; xpAwarded: number } | null = null;

  if (!limiteAgotado && safeCoins > 0) {
    // Idempotencia: un solo claim por resultado
    const { data: existingClaim } = await admin
      .from("draft_claims")
      .select("result_id")
      .eq("user_id", user.id)
      .eq("result_id", resultId)
      .maybeSingle();

    if (!existingClaim) {
      // Acreditar (importe acotado server-side, no el del cliente)
      grant = await grantCoins(user.id, safeCoins, safeXp, {
        module: "draft-mundial",
        seasonXp: true,
      });

      // Marcar como cobrado
      await admin.from("draft_claims").insert({
        user_id: user.id,
        result_id: resultId,
        coins: grant.coinsAwarded,
        xp: grant.xpAwarded,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    resultId,
    invitado: false,
    guardado: true,
    limiteAgotado,
    grant: grant
      ? { coins: grant.coinsAwarded, xp: grant.xpAwarded }
      : null,
  });
}
