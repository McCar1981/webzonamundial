// src/app/app/modo-carrera/jugar/ReputationView.tsx
// Pilar 5 — Reputación. Radar hexagonal de los 6 stats, lista de rivalidades y
// rejilla de títulos/insignias (obtenidos vs bloqueados). SVG-only.

"use client";

import { BG2, BG3, GOLD, GOLD2, MID, DIM } from "./fx";
import { LockIcon, StarIcon } from "./icons";
import { TITLES } from "@/lib/modo-carrera/constants";
import type { CareerState } from "@/lib/modo-carrera/types";

const AXES: { key: keyof CareerState["reputation"]["stats"]; label: string }[] = [
  { key: "prestigio", label: "Prestigio" },
  { key: "carisma", label: "Carisma" },
  { key: "tactica", label: "Táctica" },
  { key: "disciplina", label: "Disciplina" },
  { key: "mediatico", label: "Mediático" },
  { key: "cantera", label: "Cantera" },
];

function Radar({ stats }: { stats: CareerState["reputation"]["stats"] }) {
  const size = 260;
  const c = size / 2;
  const r = c - 44;
  const n = AXES.length;
  const pt = (i: number, radius: number) => {
    const ang = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [c + radius * Math.cos(ang), c + radius * Math.sin(ang)];
  };
  const grid = [0.25, 0.5, 0.75, 1].map((f) =>
    AXES.map((_, i) => pt(i, r * f).join(",")).join(" "),
  );
  const poly = AXES.map((a, i) => pt(i, r * (stats[a.key] / 100)).join(",")).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: "100%" }}>
      {grid.map((g, i) => (
        <polygon key={i} points={g} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      ))}
      {AXES.map((_, i) => {
        const [x, y] = pt(i, r);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />;
      })}
      <polygon points={poly} fill="rgba(201,168,76,0.28)" stroke={GOLD} strokeWidth={2} />
      {AXES.map((a, i) => {
        const [x, y] = pt(i, r + 22);
        return (
          <text key={a.key} x={x} y={y} fill={MID} fontSize={11} fontWeight={700} textAnchor="middle" dominantBaseline="middle">
            {a.label}
          </text>
        );
      })}
    </svg>
  );
}

export default function ReputationView({ career }: { career: CareerState }) {
  const { reputation } = career;
  const unlocked = new Set(reputation.titles);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>Reputación</h2>
        <p style={{ fontSize: 13, color: MID, marginTop: 4 }}>
          Tu perfil público como DT. Reputación total: <strong style={{ color: GOLD2 }}>{reputation.total}</strong>
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
        {/* Radar */}
        <div style={{ padding: 18, borderRadius: 16, background: BG2, border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: GOLD, marginBottom: 8, alignSelf: "flex-start" }}>Perfil</h3>
          <Radar stats={reputation.stats} />
        </div>

        {/* Rivalidades */}
        <div style={{ padding: 18, borderRadius: 16, background: BG2, border: "1px solid rgba(255,255,255,0.05)" }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: GOLD, marginBottom: 12 }}>Rivalidades</h3>
          {reputation.rivalries.length === 0 ? (
            <div style={{ color: DIM, fontSize: 13 }}>Aún no tienes rivalidades. Surgirán al enfrentarte a otros seleccionadores.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {reputation.rivalries.map((rv) => (
                <div key={rv.rival}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                    <span style={{ color: "#fff" }}>{rv.rival}</span>
                    <span style={{ color: DIM }}>{rv.wins}-{rv.losses}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: BG3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${rv.intensity}%`, background: "#ef4444", borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Títulos / insignias */}
      <div style={{ marginTop: 16, padding: 18, borderRadius: 16, background: BG2, border: "1px solid rgba(255,255,255,0.05)" }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: GOLD, marginBottom: 14 }}>Títulos</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
          {TITLES.map((t) => {
            const has = unlocked.has(t.id);
            return (
              <div
                key={t.id}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: BG3,
                  border: `1px solid ${has ? GOLD : "rgba(255,255,255,0.06)"}`,
                  opacity: has ? 1 : 0.6,
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <span style={{ color: has ? GOLD2 : MID, marginTop: 2 }}>{has ? <StarIcon size={18} /> : <LockIcon size={16} />}</span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: has ? "#fff" : MID }}>{t.name}</div>
                  <div style={{ fontSize: 11.5, color: DIM, marginTop: 2, lineHeight: 1.4 }}>{t.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
