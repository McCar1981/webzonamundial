"use client";

// Sección "Carrera completa" de la ficha: COLAPSADA por defecto y BAJO DEMANDA
// (al abrir pide /api/ligas/jugador/[id]/carrera, caro: 1 llamada por temporada).
// Inspirada en las fichas de mlb.com: totales de carrera arriba y, debajo, la
// trayectoria año a año SEPARADA en CLUB y SELECCIÓN, en tablas ricas
// (PJ, minutos, goles, asist., tarjetas, nota) con scroll horizontal en móvil.

import { useState, type CSSProperties } from "react";

const GOLD = "#c9a84c";
const DIM = "#a69a82";
const LINE = "1px solid rgba(255,255,255,0.06)";

type CareerRow = { season: number; teams: string[]; appearances: number; minutes: number; goals: number; assists: number; yellow: number; red: number; rating: number | null };
type CareerTotals = { appearances: number; minutes: number; goals: number; assists: number; yellow: number; red: number };
type Career = {
  club: { seasons: CareerRow[]; totals: CareerTotals };
  national: { seasons: CareerRow[]; totals: CareerTotals; teams: string[] };
};

const int = (n: number) => n.toLocaleString("es");

function Tot({ label, value, gold = false }: { label: string; value: React.ReactNode; gold?: boolean }) {
  return (
    <div style={{ textAlign: "center", padding: "4px 2px" }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: gold ? GOLD : "#fff", fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 10, color: DIM, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</div>
    </div>
  );
}

function Block({ title, t, extra }: { title: string; t: CareerTotals; extra?: string }) {
  return (
    <div style={{ padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.16)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: GOLD, marginBottom: 6 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
        <Tot label="Partidos" value={t.appearances} />
        <Tot label="Goles" value={t.goals} gold={t.goals > 0} />
        <Tot label="Asist." value={t.assists} gold={t.assists > 0} />
      </div>
      {extra ? <div style={{ fontSize: 11.5, color: DIM, marginTop: 8, textAlign: "center", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{extra}</div> : null}
    </div>
  );
}

const thBase: CSSProperties = { fontSize: 10, color: DIM, textTransform: "uppercase", letterSpacing: 0.3, fontWeight: 700, padding: "6px 8px", whiteSpace: "nowrap" };
const tdBase: CSSProperties = { fontSize: 12.5, padding: "8px 8px", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", borderTop: LINE };

function CareerTable({ title, rows, totals, variant }: { title: string; rows: CareerRow[]; totals: CareerTotals; variant: "club" | "national" }) {
  const isClub = variant === "club";
  if (rows.length === 0) return null;
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: GOLD, marginBottom: 6 }}>{title}</div>
      <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)" }}>
        <table style={{ width: "100%", minWidth: isClub ? 480 : 300, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...thBase, textAlign: "left", position: "sticky", left: 0, background: "#0a0906" }}>Temp.</th>
              <th style={{ ...thBase, textAlign: "left", minWidth: 130 }}>{isClub ? "Equipo(s)" : "Selección"}</th>
              <th style={{ ...thBase, textAlign: "right" }}>PJ</th>
              <th style={{ ...thBase, textAlign: "right" }}>Min</th>
              <th style={{ ...thBase, textAlign: "right" }}>G</th>
              <th style={{ ...thBase, textAlign: "right" }}>A</th>
              {isClub && <th style={{ ...thBase, textAlign: "right" }}>TA</th>}
              {isClub && <th style={{ ...thBase, textAlign: "right" }}>TR</th>}
              {isClub && <th style={{ ...thBase, textAlign: "right" }}>Nota</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.season}>
                <td style={{ ...tdBase, textAlign: "left", color: "#fff", fontWeight: 700, position: "sticky", left: 0, background: "#000" }}>{r.season}</td>
                <td style={{ ...tdBase, textAlign: "left", color: "#e6decb", maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis" }}>{r.teams.join(", ")}</td>
                <td style={{ ...tdBase, textAlign: "right", color: "#fff" }}>{r.appearances}</td>
                <td style={{ ...tdBase, textAlign: "right", color: "#cdbf9f" }}>{int(r.minutes)}</td>
                <td style={{ ...tdBase, textAlign: "right", color: r.goals > 0 ? GOLD : DIM, fontWeight: r.goals > 0 ? 700 : 400 }}>{r.goals}</td>
                <td style={{ ...tdBase, textAlign: "right", color: "#fff" }}>{r.assists}</td>
                {isClub && <td style={{ ...tdBase, textAlign: "right", color: "#cdbf9f" }}>{r.yellow}</td>}
                {isClub && <td style={{ ...tdBase, textAlign: "right", color: r.red > 0 ? "#cf5b5b" : DIM }}>{r.red}</td>}
                {isClub && <td style={{ ...tdBase, textAlign: "right", color: (r.rating ?? 0) >= 7 ? GOLD : "#fff" }}>{r.rating != null ? r.rating.toFixed(2) : "—"}</td>}
              </tr>
            ))}
            <tr>
              <td style={{ ...tdBase, textAlign: "left", color: GOLD, fontWeight: 800, borderTop: "1px solid rgba(201,168,76,0.3)", position: "sticky", left: 0, background: "#000" }}>Total</td>
              <td style={{ ...tdBase, textAlign: "left", color: DIM, fontSize: 11, borderTop: "1px solid rgba(201,168,76,0.3)" }}>{rows.length} temp.</td>
              <td style={{ ...tdBase, textAlign: "right", color: "#fff", fontWeight: 700, borderTop: "1px solid rgba(201,168,76,0.3)" }}>{totals.appearances}</td>
              <td style={{ ...tdBase, textAlign: "right", color: "#cdbf9f", borderTop: "1px solid rgba(201,168,76,0.3)" }}>{int(totals.minutes)}</td>
              <td style={{ ...tdBase, textAlign: "right", color: GOLD, fontWeight: 700, borderTop: "1px solid rgba(201,168,76,0.3)" }}>{totals.goals}</td>
              <td style={{ ...tdBase, textAlign: "right", color: "#fff", fontWeight: 700, borderTop: "1px solid rgba(201,168,76,0.3)" }}>{totals.assists}</td>
              {isClub && <td style={{ ...tdBase, textAlign: "right", color: "#cdbf9f", borderTop: "1px solid rgba(201,168,76,0.3)" }}>{totals.yellow}</td>}
              {isClub && <td style={{ ...tdBase, textAlign: "right", color: DIM, borderTop: "1px solid rgba(201,168,76,0.3)" }}>{totals.red}</td>}
              {isClub && <td style={{ ...tdBase, textAlign: "right", color: DIM, borderTop: "1px solid rgba(201,168,76,0.3)" }}>—</td>}
            </tr>
          </tbody>
        </table>
      </div>
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

  const hasNat = !!career && career.national.seasons.length > 0;

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
              <div style={{ display: "grid", gridTemplateColumns: hasNat ? "1fr 1fr" : "1fr", gap: 8 }}>
                <Block title="Club" t={career.club.totals} />
                {hasNat && <Block title="Selección" t={career.national.totals} extra={career.national.teams.join(", ")} />}
              </div>

              <CareerTable title="Trayectoria en clubes" rows={career.club.seasons} totals={career.club.totals} variant="club" />
              {hasNat && <CareerTable title="Con la selección" rows={career.national.seasons} totals={career.national.totals} variant="national" />}

              <p style={{ fontSize: 10.5, color: DIM, marginTop: 10 }}>Desliza las tablas para ver todas las columnas. Datos de api-football.</p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
