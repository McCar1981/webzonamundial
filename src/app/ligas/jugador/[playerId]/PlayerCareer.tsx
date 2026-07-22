"use client";

// Sección "Carrera completa" de la ficha de jugador: COLAPSADA por defecto (para
// no ensuciar la vista de la temporada) y BAJO DEMANDA (al abrir, pide
// /api/ligas/jugador/[id]/carrera, que es caro: 1 llamada por temporada). Muestra
// los totales de carrera separados en CLUB y SELECCIÓN, y el año a año.

import { useState } from "react";

const GOLD = "#c9a84c";
const DIM = "#a69a82";
const LINE = "1px solid rgba(255,255,255,0.06)";

type CareerSeason = { season: number; teams: string[]; appearances: number; goals: number; assists: number; minutes: number; hasNational: boolean };
type Career = {
  seasons: CareerSeason[];
  totals: { appearances: number; goals: number; assists: number; minutes: number };
  club: { appearances: number; goals: number; assists: number };
  national: { appearances: number; goals: number; assists: number; teams: string[] };
};

function Tot({ label, value, gold = false }: { label: string; value: React.ReactNode; gold?: boolean }) {
  return (
    <div style={{ textAlign: "center", padding: "4px 2px" }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: gold ? GOLD : "#fff", fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 10, color: DIM, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</div>
    </div>
  );
}

function Block({ title, apps, goals, assists, extra }: { title: string; apps: number; goals: number; assists: number; extra?: string }) {
  return (
    <div style={{ padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.16)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: GOLD, marginBottom: 6 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
        <Tot label="Partidos" value={apps} />
        <Tot label="Goles" value={goals} gold={goals > 0} />
        <Tot label="Asist." value={assists} gold={assists > 0} />
      </div>
      {extra ? <div style={{ fontSize: 11.5, color: DIM, marginTop: 8, textAlign: "center", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{extra}</div> : null}
    </div>
  );
}

export default function PlayerCareer({ playerId }: { playerId: number }) {
  const [open, setOpen] = useState(false);
  const [career, setCareer] = useState<Career | null | undefined>(undefined); // undefined = sin cargar
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && career === undefined && !loading) {
      setLoading(true);
      try {
        const r = await fetch(`/api/ligas/jugador/${playerId}/carrera`);
        const j = r.ok ? await r.json() : null;
        setCareer((j?.career as Career) ?? null);
      } catch {
        setCareer(null);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <section style={{ marginTop: 24 }}>
      <button
        onClick={toggle}
        aria-expanded={open}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, border: "1px solid rgba(201,168,76,0.28)", background: "rgba(201,168,76,0.05)", borderRadius: 12, padding: "12px 14px", cursor: "pointer" }}
      >
        <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Carrera completa</span>
        <span aria-hidden style={{ color: GOLD, fontSize: 13, transform: open ? "rotate(90deg)" : "none", transition: "transform .15s" }}>&rsaquo;</span>
      </button>

      {open && (
        <div style={{ marginTop: 12 }}>
          {loading ? (
            <p style={{ fontSize: 13, color: DIM, textAlign: "center", padding: "10px 0" }}>Cargando carrera…</p>
          ) : !career ? (
            <p style={{ fontSize: 13, color: DIM, textAlign: "center", padding: "10px 0" }}>No hay histórico disponible para este jugador.</p>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: career.national.appearances > 0 ? "1fr 1fr" : "1fr", gap: 8 }}>
                <Block title="Club" apps={career.club.appearances} goals={career.club.goals} assists={career.club.assists} />
                {career.national.appearances > 0 && (
                  <Block title="Selección" apps={career.national.appearances} goals={career.national.goals} assists={career.national.assists} extra={career.national.teams.join(", ")} />
                )}
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: DIM, marginBottom: 4 }}>Año a año</div>
                {/* Cabecera */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", fontSize: 10.5, color: DIM, textTransform: "uppercase", letterSpacing: 0.3 }}>
                  <span style={{ width: 42, flexShrink: 0 }}>Temp.</span>
                  <span style={{ flex: 1, minWidth: 0 }}>Equipo(s)</span>
                  <span style={{ width: 32, textAlign: "right", flexShrink: 0 }}>PJ</span>
                  <span style={{ width: 28, textAlign: "right", flexShrink: 0 }}>G</span>
                  <span style={{ width: 28, textAlign: "right", flexShrink: 0 }}>A</span>
                </div>
                {career.seasons.map((s) => (
                  <div key={s.season} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 4px", borderTop: LINE, fontSize: 12.5 }}>
                    <span style={{ width: 42, flexShrink: 0, color: "#fff", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                      {s.season}
                      {s.hasNational ? <span title="Con selección" style={{ display: "inline-block", width: 5, height: 5, borderRadius: 99, background: GOLD, marginLeft: 4, verticalAlign: "middle" }} /> : null}
                    </span>
                    <span style={{ flex: 1, minWidth: 0, color: "#e6decb", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{s.teams.join(", ")}</span>
                    <span style={{ width: 32, textAlign: "right", flexShrink: 0, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{s.appearances}</span>
                    <span style={{ width: 28, textAlign: "right", flexShrink: 0, color: s.goals > 0 ? GOLD : DIM, fontVariantNumeric: "tabular-nums", fontWeight: s.goals > 0 ? 600 : 400 }}>{s.goals}</span>
                    <span style={{ width: 28, textAlign: "right", flexShrink: 0, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{s.assists}</span>
                  </div>
                ))}
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 4px", borderTop: "1px solid rgba(201,168,76,0.3)", fontSize: 12.5, fontWeight: 700 }}>
                  <span style={{ width: 42, flexShrink: 0, color: GOLD }}>Total</span>
                  <span style={{ flex: 1, minWidth: 0, color: DIM, fontSize: 11 }}>{career.seasons.length} temporadas</span>
                  <span style={{ width: 32, textAlign: "right", flexShrink: 0, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{career.totals.appearances}</span>
                  <span style={{ width: 28, textAlign: "right", flexShrink: 0, color: GOLD, fontVariantNumeric: "tabular-nums" }}>{career.totals.goals}</span>
                  <span style={{ width: 28, textAlign: "right", flexShrink: 0, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{career.totals.assists}</span>
                </div>
                <p style={{ fontSize: 10.5, color: DIM, marginTop: 8 }}>· El punto dorado marca las temporadas con partidos de selección.</p>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
