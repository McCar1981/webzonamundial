// src/lib/ligas/boost.ts
//
// Boost de predicción de Zona de Ligas: el SUMIDERO de Fútcoins que cierra el
// bucle (gastas para amplificar). Pagas BOOST_COST antes del saque y, si aciertas,
// el premio sube de 10 a BOOST_REWARD (una apuesta de confianza: si fallas, has
// gastado los coins). Estado en KV por (usuario, fixture) — sin migración; el cron
// de resolución lo consume al pagar.

import { kv } from "@/lib/kv";

export const BOOST_COST = 10; // Fútcoins que cuesta activar el boost (tunable)
export const BASE_REWARD = 10; // premio normal por acierto
export const BOOST_REWARD = 30; // premio por acierto CON boost (x3, tunable)

const BOOST_TTL_S = 60 * 60 * 24 * 30; // 30 días
const boostKey = (uid: string, fixtureId: number) => `zl:boost:${uid}:${fixtureId}`;

export async function isBoosted(uid: string, fixtureId: number): Promise<boolean> {
  try {
    return !!(await kv.get(boostKey(uid, fixtureId)));
  } catch {
    return false;
  }
}

// Reclama el boost de forma atómica (SET NX): devuelve true si lo reclamó ahora,
// false si ya estaba (concurrencia / doble clic) o si KV falla (fail-closed: no
// dejamos cobrar sin poder registrar el boost).
export async function claimBoost(uid: string, fixtureId: number): Promise<boolean> {
  try {
    const set = await kv.set(boostKey(uid, fixtureId), 1, { nx: true, ex: BOOST_TTL_S });
    return Boolean(set); // "OK" (o truthy) si lo reclamó; null si ya existía
  } catch {
    return false;
  }
}

// Libera el boost (rollback si el cobro de Fútcoins falla tras reclamarlo).
export async function releaseBoost(uid: string, fixtureId: number): Promise<void> {
  try {
    await kv.del(boostKey(uid, fixtureId));
  } catch {
    // best-effort
  }
}

// Consume el boost al liquidar (lo lee y borra atómicamente-ish). Devuelve true si
// la predicción estaba boosteada -> el cron paga BOOST_REWARD en vez de BASE_REWARD.
export async function consumeBoost(uid: string, fixtureId: number): Promise<boolean> {
  try {
    const k = boostKey(uid, fixtureId);
    const v = await kv.get(k);
    if (v) {
      await kv.del(k);
      return true;
    }
  } catch {
    // sin KV: se paga premio base
  }
  return false;
}
