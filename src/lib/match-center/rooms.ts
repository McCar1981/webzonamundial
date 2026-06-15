// src/lib/match-center/rooms.ts
//
// "SALA CON AMIGOS" (watch party) por partido. Sala EFÍMERA en KV (sin tabla
// Supabase, para no tocar auth/SQL en caliente durante el Mundial): código de
// invitación de 6 chars (reusa leagueCode), miembros en un HASH, y chat (texto
// + GIF de GIPHY) en una lista, todo con TTL ~12h. Grupos pequeños → el coste
// KV está acotado (no es polling masivo como el Estadio en Vivo).

import { kv } from "@/lib/kv";
import { leagueCode } from "@/lib/predictions/gamification";

const TTL = 12 * 60 * 60; // la sala vive el día del partido
const MAX_MSGS = 80;
const MAX_MEMBERS = 60;

function kvEnabled(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

/** Rate-limit por IP (ventana fija de 1 min) para los endpoints anónimos de la
 *  sala. `kind` separa cubos (create/msg/get). fail-open si KV falla. */
export async function roomRateLimited(ip: string, kind: string, max: number): Promise<boolean> {
  if (!kvEnabled() || !ip) return false;
  try {
    const key = `mc:room:rl:${kind}:${ip}:${Math.floor(Date.now() / 60_000)}`;
    const n = await kv.incr(key);
    if (n === 1) await kv.expire(key, 90);
    return n > max;
  } catch {
    return false;
  }
}

const roomKey = (code: string) => `mc:room:${code}`;
const membersKey = (code: string) => `mc:room:${code}:m`;
const chatKey = (code: string) => `mc:room:${code}:chat`;

export interface RoomMeta {
  code: string;
  matchId: number;
  createdAt: number;
}
export interface RoomMessage {
  id: string;
  name: string;
  text?: string;
  gif?: string; // URL de GIPHY (validada)
  ts: number;
}
export interface RoomView {
  room: RoomMeta;
  members: string[]; // nombres
  messages: RoomMessage[]; // cronológico ascendente
}

function normCode(raw: string | undefined): string | null {
  if (!raw) return null;
  const c = String(raw).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  return c.length === 6 ? c : null;
}
function cleanName(raw: string | undefined): string {
  const n = String(raw ?? "").trim().slice(0, 24);
  return n || "Invitado";
}
function safeMemberId(raw: string | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).slice(0, 64);
  return /^[a-zA-Z0-9_-]{4,64}$/.test(s) ? s : null;
}
/** Solo aceptamos GIFs servidos por GIPHY (los que devuelve nuestro proxy). */
export function isGiphyUrl(u: string | undefined): u is string {
  if (!u) return false;
  try {
    const url = new URL(u);
    return url.protocol === "https:" && /(^|\.)giphy\.com$/.test(url.hostname);
  } catch {
    return false;
  }
}

/** Crea una sala para un partido y mete al creador. Devuelve el código. */
export async function createRoom(
  matchId: number,
  memberRaw: string | undefined,
  nameRaw: string | undefined,
): Promise<{ code: string } | null> {
  if (!kvEnabled()) return null;
  const mid = safeMemberId(memberRaw);
  if (!mid) return null;
  const name = cleanName(nameRaw);
  // Código único (reintenta si colisiona con una sala viva).
  let code = leagueCode(`room:${matchId}:${mid}:${Date.now()}`);
  for (let i = 0; i < 5; i++) {
    const exists = await kv.get(roomKey(code));
    if (!exists) break;
    code = leagueCode(`room:${matchId}:${mid}:${Date.now()}:${i}`);
  }
  const meta: RoomMeta = { code, matchId, createdAt: Date.now() };
  try {
    await kv.set(roomKey(code), meta, { ex: TTL });
    await kv.hset(membersKey(code), { [mid]: name });
    await kv.expire(membersKey(code), TTL);
    return { code };
  } catch {
    return null;
  }
}

/** Une a un miembro a una sala existente. */
export async function joinRoom(
  codeRaw: string | undefined,
  memberRaw: string | undefined,
  nameRaw: string | undefined,
): Promise<{ ok: boolean; error?: string }> {
  if (!kvEnabled()) return { ok: false, error: "kv" };
  const code = normCode(codeRaw);
  const mid = safeMemberId(memberRaw);
  if (!code || !mid) return { ok: false, error: "bad_input" };
  const meta = await kv.get<RoomMeta>(roomKey(code));
  if (!meta) return { ok: false, error: "not_found" };
  try {
    const keys = await kv.hkeys(membersKey(code));
    if ((keys?.length ?? 0) >= MAX_MEMBERS) return { ok: false, error: "full" };
    await kv.hset(membersKey(code), { [mid]: cleanName(nameRaw) });
    await kv.expire(membersKey(code), TTL);
    return { ok: true };
  } catch {
    return { ok: false, error: "kv" };
  }
}

/** Estado de la sala para el sondeo del cliente. */
export async function getRoomView(codeRaw: string | undefined): Promise<RoomView | null> {
  if (!kvEnabled()) return null;
  const code = normCode(codeRaw);
  if (!code) return null;
  const meta = await kv.get<RoomMeta>(roomKey(code));
  if (!meta) return null;
  try {
    const [membersMap, msgs] = await Promise.all([
      kv.hgetall<Record<string, string>>(membersKey(code)),
      kv.lrange<RoomMessage>(chatKey(code), 0, MAX_MSGS - 1),
    ]);
    const members = Object.values(membersMap ?? {});
    const messages = (msgs ?? []).slice().reverse(); // lpush => invertir a ascendente
    return { room: meta, members, messages };
  } catch {
    return null;
  }
}

/** Publica un mensaje (texto y/o GIF) en la sala. */
export async function postMessage(
  codeRaw: string | undefined,
  memberRaw: string | undefined,
  nameRaw: string | undefined,
  text: string | undefined,
  gif: string | undefined,
): Promise<{ ok: boolean; error?: string }> {
  if (!kvEnabled()) return { ok: false, error: "kv" };
  const code = normCode(codeRaw);
  const mid = safeMemberId(memberRaw);
  if (!code || !mid) return { ok: false, error: "bad_input" };
  const meta = await kv.get<RoomMeta>(roomKey(code));
  if (!meta) return { ok: false, error: "not_found" };
  const cleanText = String(text ?? "").trim().slice(0, 300);
  const gifOk = isGiphyUrl(gif) ? gif : undefined;
  if (!cleanText && !gifOk) return { ok: false, error: "empty" };
  const msg: RoomMessage = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: cleanName(nameRaw),
    text: cleanText || undefined,
    gif: gifOk,
    ts: Date.now(),
  };
  try {
    await kv.lpush(chatKey(code), msg);
    await kv.ltrim(chatKey(code), 0, MAX_MSGS - 1);
    await kv.expire(chatKey(code), TTL);
    // Mantén viva la membresía/sala al participar.
    await kv.expire(membersKey(code), TTL);
    await kv.expire(roomKey(code), TTL);
    return { ok: true };
  } catch {
    return { ok: false, error: "kv" };
  }
}
