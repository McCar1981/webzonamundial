"use client";

// src/app/app/eliminatorias/predecir/page.tsx
// PREDICTOR del cuadro REAL de eliminatorias (16avos → Final). El usuario elige
// el ganador de cada cruce y el resultado se PROPAGA a la siguiente ronda usando
// la estructura real (etiquetas W##/L## de matches.ts que devuelve el endpoint).
// Distinto del simulador /bracket (que parte de la fase de grupos, ya jugada).
// Las selecciones de 16avos vienen ya resueltas (clasificadas); de ahí en
// adelante el cuadro lo arma el usuario. Se guarda en el dispositivo.

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const NAVY = "#0a1729";
const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const PURP = "#a279f0";
const TXT = "#eef2fb";
const TXT_MUT = "#93a1bd";
const LINE = "rgba(255,255,255,0.08)";

type Side = { name: string; flag: string | null; slot: string };
type KoMatch = { matchId: number; phase: string; finished?: boolean; home: Side; away: Side };
type Team = { name: string; flag: string };

const ROUNDS: { key: string; label: string }[] = [
  { key: "Dieciseisavos", label: "Dieciseisavos de final" },
  { key: "Octavos de final", label: "Octavos de final" },
  { key: "Cuartos de final", label: "Cuartos de final" },
  { key: "Semifinal", label: "Semifinales" },
  { key: "Tercer puesto", label: "Tercer puesto" },
  { key: "FINAL", label: "Final" },
];

const STORE_KEY = "zm-cruces-pred-v1";
const FINAL_ID = 104;

// Resuelve cada cruce a sus dos selecciones a partir de las decisiones del
// usuario (picks: matchId → flagCode del ganador elegido). Procesa en orden de
// matchId ascendente: una ronda siempre depende de partidos de id menor.
function buildResolved(matches: KoMatch[], picks: Record<number, string>) {
  const byId = new Map<number, KoMatch>();
  matches.forEach((m) => byId.set(m.matchId, m));
  const resolved = new Map<number, { home: Team | null; away: Team | null }>();

  const winnerOf = (id: number): Team | null => {
    const f = picks[id];
    const r = resolved.get(id);
    if (!f || !r) return null;
    if (r.home && r.home.flag === f) return r.home;
    if (r.away && r.away.flag === f) return r.away;
    return null; // pick obsoleto (cambió un resultado anterior): se invalida solo
  };
  const loserOf = (id: number): Team | null => {
    const w = winnerOf(id);
    const r = resolved.get(id);
    if (!w || !r || !r.home || !r.away) return null;
    return w.flag === r.home.flag ? r.away : r.home;
  };
  const sideTeam = (s: Side): Team | null => {
    if (s.flag) return { name: s.name, flag: s.flag }; // 16avos: clasificado real
    const mw = /^W(\d+)$/.exec(s.slot);
    if (mw) return winnerOf(Number(mw[1]));
    const ml = /^L(\d+)$/.exec(s.slot);
    if (ml) return loserOf(Number(ml[1]));
    return null;
  };

  for (const id of [...byId.keys()].sort((a, b) => a - b)) {
    const m = byId.get(id)!;
    resolved.set(id, { home: sideTeam(m.home), away: sideTeam(m.away) });
  }
  return resolved;
}

function Flag({ flag, size = 22 }: { flag: string | null; size?: number }) {
  if (!flag) return <span aria-hidden style={{ width: size, height: size * 0.7, borderRadius: 3, background: "rgba(255,255,255,0.08)", flexShrink: 0, display: "inline-block" }} />;
  return <img src={`https://flagcdn.com/w40/${flag}.png`} alt="" width={size} height={size * 0.7} style={{ borderRadius: 3, flexShrink: 0, boxShadow: "0 2px 6px rgba(0,0,0,0.4)" }} />;
}

export default function PredecirCrucesPage() {
  const [matches, setMatches] = useState<KoMatch[] | null>(null);
  const [picks, setPicks] = useState<Record<number, string>>({});
  const [loaded, setLoaded] = useState(false);

  // Al abrir, saltar a la RONDA ACTIVA que se predice (la primera con partidos sin
  // terminar): hoy Octavos, luego Cuartos… Se hace una vez tras cargar el cuadro.
  const jumpedRef = useRef(false);
  useEffect(() => {
    if (jumpedRef.current || !matches || matches.length === 0) return;
    jumpedRef.current = true;
    const active = ROUNDS.find((r) => matches.some((m) => m.phase === r.key && !m.finished));
    if (!active) { window.scrollTo(0, 0); return; }
    setTimeout(() => {
      document.getElementById(`pred-ronda-${active.key.replace(/\s+/g, "-")}`)?.scrollIntoView({ block: "start", behavior: "auto" });
    }, 90);
  }, [matches]);

  // Cargar picks guardados.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) setPicks(JSON.parse(raw));
    } catch { /* sin persistencia */ }
    setLoaded(true);
  }, []);

  // Guardar picks.
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(picks)); } catch { /* noop */ }
  }, [picks, loaded]);

  // Estructura del cuadro real.
  useEffect(() => {
    let on = true;
    fetch("/api/match-center/knockout")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { matches?: KoMatch[] } | null) => { if (on && d) setMatches(d.matches ?? []); })
      .catch(() => { if (on) setMatches([]); });
    return () => { on = false; };
  }, []);

  const resolved = useMemo(() => (matches ? buildResolved(matches, picks) : new Map()), [matches, picks]);

  const champion = useMemo(() => {
    const r = resolved.get(FINAL_ID);
    const f = picks[FINAL_ID];
    if (!r || !f) return null;
    if (r.home && r.home.flag === f) return r.home as Team;
    if (r.away && r.away.flag === f) return r.away as Team;
    return null;
  }, [resolved, picks]);

  const pickCount = Object.keys(picks).length;
  const r32Ready = !!matches && matches.some((m) => m.phase === "Dieciseisavos" && (m.home.flag || m.away.flag));

  function choose(matchId: number, team: Team | null) {
    if (!team) return;
    setPicks((prev) => {
      const next = { ...prev };
      if (next[matchId] === team.flag) delete next[matchId]; // re-tap = deseleccionar
      else next[matchId] = team.flag;
      return next;
    });
  }

  function resetAll() { setPicks({}); }

  const byRound = (key: string) => (matches ?? []).filter((m) => m.phase === key);

  return (
    <div style={{ position: "relative", minHeight: "100vh", backgroundColor: NAVY, backgroundImage: `radial-gradient(1200px 600px at 50% -10%, #16133a 0%, ${NAVY} 55%)`, color: TXT, fontFamily: "'Outfit',sans-serif", overflowX: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      <span aria-hidden style={{ position: "fixed", top: 0, left: 0, right: 0, height: 2, zIndex: 60, background: `linear-gradient(90deg, transparent, ${PURP}aa 30%, #cdb2ff 50%, ${PURP}aa 70%, transparent)`, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 760, margin: "0 auto", padding: "18px 14px 130px" }}>
        {/* Cabecera */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Link href="/app/eliminatorias" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${LINE}`, color: TXT, textDecoration: "none", flexShrink: 0 }} aria-label="Volver a Cruces">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              Predice los <span style={{ color: "#cdb2ff" }}>cruces</span>
            </h1>
            <p style={{ fontSize: 12.5, color: TXT_MUT, marginTop: 2 }}>Elige los ganadores de 16avos a la final</p>
          </div>
          {pickCount > 0 && (
            <button onClick={resetAll} style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: TXT_MUT, background: "rgba(255,255,255,0.05)", border: `1px solid ${LINE}`, borderRadius: 9, padding: "7px 11px", cursor: "pointer" }}>Reiniciar</button>
          )}
        </div>

        {/* Campeón elegido */}
        {champion && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", marginBottom: 18, borderRadius: 16, background: `linear-gradient(135deg, ${GOLD}22, rgba(255,255,255,0.02))`, border: `1px solid ${GOLD}55` }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}><path d="M6 4h12v3a6 6 0 0 1-12 0V4ZM6 6H3v1a3 3 0 0 0 3 3M18 6h3v1a3 3 0 0 1-3 3M9 16h6M8 20h8M10 16v-2M14 16v-2" stroke={GOLD2} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: GOLD2 }}>Tu campeón</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                <Flag flag={champion.flag} size={26} />
                <span style={{ fontSize: 18, fontWeight: 900 }}>{champion.name}</span>
              </div>
            </div>
          </div>
        )}

        {/* Estado de carga / aviso si los 16avos aún no están resueltos */}
        {matches === null && (
          <div style={{ textAlign: "center", color: TXT_MUT, fontSize: 13, padding: "40px 0" }}>Cargando el cuadro…</div>
        )}
        {matches !== null && !r32Ready && (
          <div style={{ textAlign: "center", color: TXT_MUT, fontSize: 13, padding: "30px 14px", lineHeight: 1.5 }}>
            Los 16avos se resolverán al cerrar la fase de grupos. Vuelve entonces para armar tu cuadro.
          </div>
        )}

        {/* Rondas */}
        {matches !== null && r32Ready && ROUNDS.map(({ key, label }) => {
          const list = byRound(key);
          if (list.length === 0) return null;
          return (
            <section key={key} id={`pred-ronda-${key.replace(/\s+/g, "-")}`} style={{ marginBottom: 24, scrollMarginTop: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 11 }}>
                <span style={{ width: 5, height: 22, borderRadius: 3, background: `linear-gradient(180deg, ${PURP}, #cdb2ff)`, flexShrink: 0, boxShadow: `0 0 10px ${PURP}66` }} />
                <h2 style={{ fontSize: 16, fontWeight: 800 }}>{label}</h2>
                <span aria-hidden style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${PURP}44, transparent)` }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 9 }}>
                {list.map((m) => {
                  const r = resolved.get(m.matchId) ?? { home: null, away: null };
                  const picked = picks[m.matchId];
                  const row = (team: Team | null, slot: string) => {
                    const isPicked = !!team && picked === team.flag;
                    const selectable = !!team;
                    return (
                      <button
                        onClick={() => choose(m.matchId, team)}
                        disabled={!selectable}
                        style={{
                          display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left",
                          padding: "10px 12px", borderRadius: 10, cursor: selectable ? "pointer" : "default",
                          background: isPicked ? `linear-gradient(135deg, ${GOLD}33, ${GOLD}14)` : "rgba(255,255,255,0.03)",
                          border: `1px solid ${isPicked ? GOLD : LINE}`,
                          color: team ? TXT : TXT_MUT, transition: "background .15s,border .15s",
                        }}
                      >
                        <Flag flag={team?.flag ?? null} />
                        <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: isPicked ? 900 : 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {team ? team.name : "Por definir"}
                        </span>
                        {isPicked && (
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" fill={GOLD} /><path d="M7 12.5l3.2 3.2L17 9" stroke="#0a1729" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        )}
                      </button>
                    );
                  };
                  return (
                    <div key={m.matchId} style={{ padding: 5, borderRadius: 13, background: "rgba(255,255,255,0.015)", border: `1px solid ${LINE}`, display: "flex", flexDirection: "column", gap: 5 }}>
                      {row(r.home, m.home.slot)}
                      {row(r.away, m.away.slot)}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Enlace al cuadro real (resultados) */}
        {matches !== null && r32Ready && (
          <Link href="/app/eliminatorias" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", marginTop: 6, borderRadius: 12, textDecoration: "none", color: GOLD2, fontSize: 13.5, fontWeight: 800, background: "rgba(255,255,255,0.04)", border: `1px solid ${LINE}` }}>
            Ver el cuadro real con resultados
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
        )}
      </div>
    </div>
  );
}
