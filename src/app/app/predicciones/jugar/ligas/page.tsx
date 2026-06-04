"use client";

// Ligas privadas + duelos 1v1 de Predicciones.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Crown, Flame, Swords, Users } from "../icons";
import { PositionBadge, TitleChip, nameColorStyle, type CosmeticDisplay } from "../cosmetic-render";

const BG = "#060B14", BG2 = "#0F1D32", BG3 = "#0B1825";
const GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a", GREEN = "#22c55e";
const CARD_BORDER = "1px solid rgba(255,255,255,0.07)";

interface League { id: string; name: string; code: string; owner_id: string; member_count: number }
interface Standing { position: number; user_id: string; display_name: string; avatar_url: string | null; points: number; match_points?: number; bracket_points?: number; cosmetics?: CosmeticDisplay | null }
interface Duel { id: string; match_id: string; status: string; challenger_id: string; opponent_id: string; challenger_points: number | null; opponent_points: number | null; winner_id: string | null }
interface Rivalry {
  opponent: { id: string; name: string; avatar_url: string | null; cosmetics: CosmeticDisplay | null };
  duels_count: number; my_wins: number; their_wins: number; draws: number;
  my_points: number; their_points: number;
  lead: "me" | "them" | "even";
  streak: { holder: "me" | "them" | null; len: number };
  last_match_id: string | null; last_duel_at: string | null;
}

export default function LigasPage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [duels, setDuels] = useState<Duel[]>([]);
  const [rivalries, setRivalries] = useState<Rivalry[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [standings, setStandings] = useState<Record<string, Standing[]>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Duelo
  const [oppName, setOppName] = useState("");
  const [duelMatch, setDuelMatch] = useState("");

  const loadLeagues = useCallback(async () => {
    const r = await fetch("/api/predictions/leagues");
    if (r.ok) setLeagues((await r.json()).leagues ?? []);
  }, []);
  const loadDuels = useCallback(async () => {
    const r = await fetch("/api/predictions/duels");
    if (r.ok) setDuels((await r.json()).duels ?? []);
  }, []);
  const loadRivalries = useCallback(async () => {
    const r = await fetch("/api/predictions/rivalries");
    if (r.ok) setRivalries((await r.json()).rivalries ?? []);
  }, []);
  useEffect(() => { void loadLeagues(); void loadDuels(); void loadRivalries(); }, [loadLeagues, loadDuels, loadRivalries]);
  useEffect(() => { if (toast) { const id = setTimeout(() => setToast(null), 3000); return () => clearTimeout(id); } }, [toast]);

  const create = useCallback(async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const r = await fetch("/api/predictions/leagues", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      if (r.ok) { setName(""); setToast("Liga creada"); await loadLeagues(); } else setToast("No se pudo crear");
    } finally { setBusy(false); }
  }, [name, loadLeagues]);

  const join = useCallback(async () => {
    if (!code.trim()) return;
    setBusy(true);
    try {
      const r = await fetch("/api/predictions/leagues", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) { setCode(""); setToast("Te uniste a la liga"); await loadLeagues(); } else setToast(j.error === "league_not_found" ? "Código no encontrado" : "No se pudo unir");
    } finally { setBusy(false); }
  }, [code, loadLeagues]);

  const viewStandings = useCallback(async (id: string) => {
    if (standings[id]) { setStandings((s) => { const n = { ...s }; delete n[id]; return n; }); return; }
    const r = await fetch(`/api/predictions/leagues/${id}`);
    if (r.ok) {
      const j = await r.json();
      setStandings((s) => ({ ...s, [id]: j.standings ?? [] }));
    }
  }, [standings]);

  const challenge = useCallback(async () => {
    if (!oppName.trim() || !duelMatch.trim()) return;
    setBusy(true);
    try {
      const r = await fetch("/api/predictions/duels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ opponent: oppName, match_id: duelMatch }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) { setOppName(""); setDuelMatch(""); setToast("Reto enviado"); await loadDuels(); } else setToast(j.error === "opponent_not_found" ? "Usuario no encontrado" : "No se pudo retar");
    } finally { setBusy(false); }
  }, [oppName, duelMatch, loadDuels]);

  const respond = useCallback(async (duelId: string, accept: boolean) => {
    setBusy(true);
    try {
      const r = await fetch("/api/predictions/duels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ duel_id: duelId, accept }) });
      if (r.ok) { setToast(accept ? "Duelo aceptado" : "Duelo rechazado"); await loadDuels(); }
    } finally { setBusy(false); }
  }, [loadDuels]);

  const input = { background: BG3, border: CARD_BORDER, borderRadius: 9, color: "#fff", padding: "9px 12px", fontSize: 14, flex: 1, minWidth: 0 } as const;
  const btn = (disabled: boolean) => ({ cursor: disabled ? "default" : "pointer", background: disabled ? BG3 : `linear-gradient(135deg,${GOLD},${GOLD2})`, color: disabled ? DIM : "#1a1206", border: CARD_BORDER, borderRadius: 9, fontWeight: 800, fontSize: 13, padding: "9px 16px" });

  return (
    <div style={{ background: BG, color: "#fff", fontFamily: "'Outfit',sans-serif", minHeight: "100vh", padding: "20px 16px 60px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link href="/app/predicciones/jugar" style={{ color: MID, fontSize: 13, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}><ArrowLeft size={14} /> Volver</Link>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}><Users size={24} color={GOLD2} /> Ligas y Duelos</h1>

        {/* Crear / unirse */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          <div style={{ flex: "1 1 280px", background: BG2, border: CARD_BORDER, borderRadius: 12, padding: 14 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Crear liga privada</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de la liga" style={input} maxLength={60} />
              <button onClick={create} disabled={busy || !name.trim()} style={btn(busy || !name.trim())}>Crear</button>
            </div>
          </div>
          <div style={{ flex: "1 1 280px", background: BG2, border: CARD_BORDER, borderRadius: 12, padding: 14 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Unirse con código</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABC123" style={{ ...input, letterSpacing: 2, textTransform: "uppercase" }} maxLength={6} />
              <button onClick={join} disabled={busy || !code.trim()} style={btn(busy || !code.trim())}>Unirse</button>
            </div>
          </div>
        </div>

        {/* Mis ligas */}
        <h2 style={{ fontSize: 18, fontWeight: 900, marginTop: 24 }}>Mis ligas</h2>
        {leagues.length === 0 ? (
          <p style={{ color: DIM, marginTop: 8, fontSize: 14 }}>Aún no estás en ninguna liga. Crea una e invita a tus amigos con el código.</p>
        ) : (
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
            {leagues.map((l) => (
              <div key={l.id} style={{ background: BG2, border: CARD_BORDER, borderRadius: 12, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{l.name}</div>
                    <div style={{ color: MID, fontSize: 12.5 }}>Código <b style={{ color: GOLD2, letterSpacing: 1 }}>{l.code}</b> · {l.member_count} miembros</div>
                  </div>
                  <button onClick={() => viewStandings(l.id)} style={{ cursor: "pointer", background: BG3, border: CARD_BORDER, borderRadius: 99, color: GOLD2, fontWeight: 700, fontSize: 12.5, padding: "7px 14px" }}>
                    {standings[l.id] ? "Ocultar" : "Ver clasificación"}
                  </button>
                </div>
                {standings[l.id] && (
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                    {standings[l.id].length === 0 && <span style={{ color: DIM, fontSize: 13 }}>Sin puntos todavía.</span>}
                    {standings[l.id].map((s) => (
                      <div key={s.user_id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
                        <PositionBadge position={s.position} cosmetics={s.cosmetics} top3color={GOLD} baseColor={MID} innerBg={BG3} />
                        <span style={{ flex: 1, display: "inline-flex", alignItems: "center", gap: 7, flexWrap: "wrap", minWidth: 0 }}>
                          <span style={nameColorStyle(s.cosmetics)}>{s.display_name}</span>
                          <TitleChip title={s.cosmetics?.title} />
                        </span>
                        {(s.bracket_points ?? 0) > 0 && (
                          <span style={{ color: DIM, fontWeight: 600, fontSize: 11.5 }}>
                            {s.match_points ?? 0} + {s.bracket_points} bracket
                          </span>
                        )}
                        <span style={{ color: GOLD, fontWeight: 800 }}>{s.points} pts</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Duelos 1v1 */}
        <h2 style={{ fontSize: 18, fontWeight: 900, marginTop: 28, display: "flex", alignItems: "center", gap: 8 }}><Swords size={20} color={GOLD2} /> Duelos 1v1</h2>
        <div style={{ background: BG2, border: CARD_BORDER, borderRadius: 12, padding: 14, marginTop: 10 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Retar a alguien</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input value={oppName} onChange={(e) => setOppName(e.target.value)} placeholder="Usuario rival" style={input} />
            <input value={duelMatch} onChange={(e) => setDuelMatch(e.target.value.replace(/\D/g, ""))} placeholder="Nº de partido" style={{ ...input, flex: "0 0 120px" }} />
            <button onClick={challenge} disabled={busy || !oppName.trim() || !duelMatch.trim()} style={btn(busy || !oppName.trim() || !duelMatch.trim())}>Retar</button>
          </div>
        </div>

        {duels.length > 0 && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {duels.map((d) => (
              <div key={d.id} style={{ background: BG2, border: d.status === "resolved" ? `1px solid ${GREEN}` : CARD_BORDER, borderRadius: 12, padding: "11px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div style={{ fontSize: 13.5 }}>
                  <b>Partido #{d.match_id}</b> · <span style={{ color: MID }}>{statusLabel(d.status)}</span>
                  {d.status === "resolved" && <span style={{ color: GOLD2 }}> — {d.challenger_points} vs {d.opponent_points}</span>}
                </div>
                {d.status === "pending" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => respond(d.id, true)} disabled={busy} style={{ ...btn(busy), padding: "6px 12px" }}>Aceptar</button>
                    <button onClick={() => respond(d.id, false)} disabled={busy} style={{ cursor: "pointer", background: BG3, border: CARD_BORDER, borderRadius: 9, color: MID, fontWeight: 700, fontSize: 13, padding: "6px 12px" }}>Rechazar</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Rivalidades 1v1 persistentes (cara a cara acumulado) */}
        {rivalries.length > 0 && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 900, marginTop: 28, display: "flex", alignItems: "center", gap: 8 }}><Crown size={20} color={GOLD2} /> Tus rivalidades</h2>
            <p style={{ color: DIM, fontSize: 13, marginTop: 4 }}>Historial cara a cara de tus duelos resueltos. Cada victoria define quién manda.</p>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {rivalries.map((r) => {
                const leadColor = r.lead === "me" ? GREEN : r.lead === "them" ? "#e5604d" : MID;
                return (
                  <div key={r.opponent.id} style={{ background: BG2, border: CARD_BORDER, borderRadius: 12, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                        <Swords size={16} color={GOLD2} />
                        <span style={{ fontWeight: 800, fontSize: 14.5, ...nameColorStyle(r.opponent.cosmetics) }}>{r.opponent.name}</span>
                        <TitleChip title={r.opponent.cosmetics?.title} />
                      </span>
                      <span style={{ fontSize: 12.5, color: MID }}>{r.duels_count} {r.duels_count === 1 ? "duelo" : "duelos"}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 900, fontSize: 20, color: leadColor }}>
                        {r.my_wins}<span style={{ color: DIM, fontWeight: 700, fontSize: 15 }}> – </span>{r.their_wins}
                      </span>
                      {r.draws > 0 && <span style={{ fontSize: 12, color: DIM }}>{r.draws} {r.draws === 1 ? "empate" : "empates"}</span>}
                      <span style={{ fontSize: 12.5, color: leadColor, fontWeight: 700 }}>
                        {r.lead === "me" ? "Vas por delante" : r.lead === "them" ? "Vas por detrás" : "Empatados"}
                      </span>
                      {r.streak.holder && r.streak.len >= 2 && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: r.streak.holder === "me" ? GREEN : "#e5604d" }}>
                          <Flame size={13} /> {r.streak.holder === "me" ? "Racha tuya" : "Racha rival"} de {r.streak.len}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11.5, color: DIM }}>Puntos acumulados: {r.my_points} vs {r.their_points}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: BG2, border: `1px solid ${GOLD}`, color: GOLD2, borderRadius: 12, padding: "11px 18px", fontWeight: 700, fontSize: 13.5, zIndex: 50 }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function statusLabel(s: string): string {
  return s === "pending" ? "Pendiente de aceptar"
    : s === "active" ? "En juego"
    : s === "resolved" ? "Resuelto"
    : "Rechazado";
}
