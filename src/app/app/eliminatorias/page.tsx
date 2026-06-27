"use client";

// src/app/app/eliminatorias/page.tsx
// CUADRO DE ELIMINATORIAS (fase final real): muestra los 32 partidos de
// 16avos → Final con su fecha y, en cuanto api-football los cubre, marcador y
// estado en vivo. Los rivales salen como etiqueta de slot ("2.º A", "Mejor 3.º",
// "Por definir") y se resuelven a la selección real conforme avanza el cuadro.
// Distinto del simulador /bracket (ahí el usuario PREDICE; aquí es lo REAL).

import Link from "next/link";
import { useEffect, useState } from "react";

const NAVY = "#0a1729";
const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const TXT = "#eef2fb";
const TXT_MUT = "#93a1bd";
const LINE = "rgba(255,255,255,0.08)";
const CORAL = "#ff6b5a";

type KoMatch = {
  matchId: number;
  slug: string;
  phase: string;
  status: string;
  live: boolean;
  finished: boolean;
  elapsed: number;
  score: [number | null, number | null];
  kickoff: string | null;
  venue: string | null;
  city: string | null;
  home: KoTeam;
  away: KoTeam;
};

// El servidor ya resuelve el slot al equipo real cuando puede: `name` y `flag`
// (flagCode) vienen rellenos y `provisional` avisa si el cruce aún puede cambiar
// (queda jornada por jugar). Si no se ha podido resolver, `flag` es null y `slot`
// trae la etiqueta cruda ("2A", "3ABCDF", "W74") que humanizamos.
type KoTeam = { name: string; flag: string | null; slot: string; provisional: boolean };

// Orden y etiqueta de las rondas (las claves coinciden con matches.ts `p`).
const ROUNDS: { key: string; label: string }[] = [
  { key: "Dieciseisavos", label: "Dieciseisavos de final" },
  { key: "Octavos de final", label: "Octavos de final" },
  { key: "Cuartos de final", label: "Cuartos de final" },
  { key: "Semifinal", label: "Semifinales" },
  { key: "Tercer puesto", label: "Tercer puesto" },
  { key: "FINAL", label: "Final" },
];

// Hay bandera real cuando el servidor resolvió el slot a una selección.
function isReal(t: KoTeam): boolean {
  return !!t.flag;
}
function humanizeSlot(label: string): string {
  let m = label.match(/^1([A-L])$/);
  if (m) return `Ganador ${m[1]}`;
  m = label.match(/^2([A-L])$/);
  if (m) return `2.º ${m[1]}`;
  if (/^3[A-L]+$/.test(label)) return "Mejor 3.º";
  if (/^[WL]\d+$/.test(label)) return "Por definir"; // ganador/perdedor de ronda previa
  return label;
}

function teamLabel(t: KoTeam): string {
  return t.flag ? t.name : humanizeSlot(t.slot);
}

function fmtKickoff(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-ES", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function EliminatoriasPage() {
  const [matches, setMatches] = useState<KoMatch[] | null>(null);

  useEffect(() => {
    let on = true;
    const load = () =>
      fetch("/api/match-center/knockout")
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { matches?: KoMatch[] } | null) => { if (on && d) setMatches(d.matches ?? []); })
        .catch(() => { if (on && matches === null) setMatches([]); });
    load();
    // Polling suave para marcadores en vivo durante la fase final.
    const id = setInterval(load, 30_000);
    return () => { on = false; clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byRound = (key: string) => (matches ?? []).filter((m) => m.phase === key);

  return (
    <div style={{ position: "relative", minHeight: "100vh", backgroundColor: NAVY, backgroundImage: `radial-gradient(1200px 600px at 50% -10%, #12284a 0%, ${NAVY} 55%)`, color: TXT, fontFamily: "'Outfit',sans-serif", overflowX: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      <span aria-hidden style={{ position: "fixed", top: 0, left: 0, right: 0, height: 2, zIndex: 60, background: `linear-gradient(90deg, transparent, ${GOLD}aa 30%, ${GOLD2} 50%, ${GOLD}aa 70%, transparent)`, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 760, margin: "0 auto", padding: "18px 14px 120px" }}>
        {/* Cabecera */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Link href="/app" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${LINE}`, color: TXT, textDecoration: "none", flexShrink: 0 }} aria-label="Volver al inicio">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              Cuadro de <span style={{ color: GOLD2 }}>eliminatorias</span>
            </h1>
            <p style={{ fontSize: 12.5, color: TXT_MUT, marginTop: 2 }}>Fase final del Mundial 2026 · resultados reales</p>
          </div>
        </div>

        {/* CTA al simulador (lo otro, predicción) */}
        <Link href="/bracket" style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", marginBottom: 18, borderRadius: 14, textDecoration: "none", color: TXT, background: "linear-gradient(135deg, rgba(162,121,240,0.18), rgba(255,255,255,0.02))", border: "1px solid rgba(162,121,240,0.4)" }}>
          <span aria-hidden style={{ fontSize: 18 }}>🔮</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800 }}>¿Y tú? Predice el cuadro completo</div>
            <div style={{ fontSize: 11.5, color: TXT_MUT }}>Simulador: arma las llaves y elige tu campeón</div>
          </div>
          <span style={{ flexShrink: 0, color: GOLD2 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
        </Link>

        {/* Estado de carga */}
        {matches === null && (
          <div style={{ textAlign: "center", color: TXT_MUT, fontSize: 13, padding: "40px 0" }}>Cargando el cuadro…</div>
        )}

        {/* Aviso: cruce calculado en vivo, provisional hasta cerrar los grupos */}
        {matches !== null && (matches.some((m) => m.home.provisional || m.away.provisional)) && (
          <div style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "10px 12px", marginBottom: 18, borderRadius: 12, background: "rgba(201,168,76,0.1)", border: `1px solid ${GOLD}3a` }}>
            <span aria-hidden style={{ color: GOLD2, flexShrink: 0, marginTop: 1 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" /><path d="M12 8h.01M11 12h1v4h1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <p style={{ fontSize: 11.5, color: TXT_MUT, lineHeight: 1.5 }}>
              Cruce calculado con las <strong style={{ color: TXT }}>clasificaciones en vivo</strong>. Los marcados con <span style={{ color: GOLD, fontWeight: 800 }}>*</span> son <strong style={{ color: TXT }}>provisionales</strong>: aún queda jornada y pueden cambiar. Se confirman al cerrar la fase de grupos.
            </p>
          </div>
        )}

        {/* Rondas */}
        {matches !== null && ROUNDS.map(({ key, label }) => {
          const list = byRound(key);
          if (list.length === 0) return null;
          return (
            <section key={key} style={{ marginBottom: 26 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 12 }}>
                <span style={{ width: 5, height: 22, borderRadius: 3, background: `linear-gradient(180deg, ${GOLD}, ${GOLD2})`, flexShrink: 0, boxShadow: `0 0 10px ${GOLD}66` }} />
                <h2 style={{ fontSize: 16, fontWeight: 800 }}>{label}</h2>
                <span aria-hidden style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${GOLD}44, transparent)` }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {list.map((m) => {
                  const showScore = m.live || m.finished;
                  const ko = fmtKickoff(m.kickoff);
                  return (
                    <Link key={m.matchId} href={`/app/matchcenter/${m.slug}`} style={{ position: "relative", display: "block", textDecoration: "none", color: TXT, borderRadius: 14, padding: "12px 13px", background: m.live ? "linear-gradient(160deg,#221526 0%,#0a1a31 62%)" : "linear-gradient(160deg,#102a4d 0%,#0a1a31 70%)", border: `1px solid ${m.live ? CORAL + "77" : LINE}`, boxShadow: "0 10px 26px rgba(0,0,0,0.32)" }}>
                      {/* fila superior: estado + hora */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9, gap: 8 }}>
                        {m.live ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 900, color: "#fff", padding: "3px 8px", borderRadius: 999, background: "linear-gradient(135deg,#f25a50,#dc3f36)" }}>
                            <span style={{ width: 5, height: 5, borderRadius: 99, background: "#fff" }} />EN VIVO {m.elapsed}&apos;
                          </span>
                        ) : m.finished ? (
                          <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4, color: TXT_MUT, padding: "3px 8px", borderRadius: 999, background: "rgba(255,255,255,0.05)", border: `1px solid ${LINE}` }}>Final</span>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 700, color: TXT_MUT }}>{ko || "Por programar"}</span>
                        )}
                        {(m.venue || m.city) && (
                          <span style={{ fontSize: 10.5, color: TXT_MUT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "45%" }}>
                            {[m.venue, m.city].filter(Boolean).join(" · ")}
                          </span>
                        )}
                      </div>

                      {/* equipos + marcador/vs */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8 }}>
                          {isReal(m.home)
                            ? <img src={`https://flagcdn.com/w40/${m.home.flag}.png`} alt="" width={24} height={16} style={{ borderRadius: 3, flexShrink: 0, boxShadow: "0 2px 6px rgba(0,0,0,0.4)" }} />
                            : <span aria-hidden style={{ width: 24, height: 16, borderRadius: 3, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />}
                          <span style={{ fontSize: 13.5, fontWeight: 800, color: isReal(m.home) ? TXT : TXT_MUT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {teamLabel(m.home)}{m.home.provisional && <span style={{ color: GOLD, fontWeight: 700 }}>*</span>}
                          </span>
                        </div>
                        {showScore ? (
                          <span style={{ flexShrink: 0, fontSize: 20, fontWeight: 900, letterSpacing: 1, color: "#fff" }}>{m.score[0] ?? 0}<span style={{ color: TXT_MUT, margin: "0 5px" }}>-</span>{m.score[1] ?? 0}</span>
                        ) : (
                          <span style={{ flexShrink: 0, fontSize: 15, fontWeight: 900, color: GOLD2 }}>VS</span>
                        )}
                        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                          <span style={{ fontSize: 13.5, fontWeight: 800, color: isReal(m.away) ? TXT : TXT_MUT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "right" }}>
                            {m.away.provisional && <span style={{ color: GOLD, fontWeight: 700 }}>*</span>}{teamLabel(m.away)}
                          </span>
                          {isReal(m.away)
                            ? <img src={`https://flagcdn.com/w40/${m.away.flag}.png`} alt="" width={24} height={16} style={{ borderRadius: 3, flexShrink: 0, boxShadow: "0 2px 6px rgba(0,0,0,0.4)" }} />
                            : <span aria-hidden style={{ width: 24, height: 16, borderRadius: 3, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}

        {matches !== null && matches.length === 0 && (
          <div style={{ textAlign: "center", color: TXT_MUT, fontSize: 13, padding: "30px 0" }}>El cuadro de eliminatorias se publicará al cerrar la fase de grupos.</div>
        )}
      </div>
    </div>
  );
}
