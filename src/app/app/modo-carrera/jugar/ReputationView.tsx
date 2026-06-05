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
      {/* El polígono de stats se expande desde el centro al entrar. */}
      <g style={{ transformOrigin: `${c}px ${c}px`, animation: "mcRadarIn .9s cubic-bezier(.2,.8,.2,1) both" }}>
        <polygon points={poly} fill="rgba(201,168,76,0.28)" stroke={GOLD} strokeWidth={2} />
        {AXES.map((a, i) => {
          const [x, y] = pt(i, r * (stats[a.key] / 100));
          return <circle key={a.key} cx={x} cy={y} r={3} fill={GOLD2} />;
        })}
      </g>
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
      <style>{`
        @keyframes mcRadarIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes mcRivalIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes mcBadgeReveal { 0% { opacity: 0; transform: rotateY(90deg); } 60% { transform: rotateY(-8deg); } 100% { opacity: 1; transform: rotateY(0); } }
        @keyframes mcBadgeShine { 0% { transform: translateX(-130%); } 100% { transform: translateX(130%); } }
        .mc-rival-in { animation: mcRivalIn .5s ease both; }
        .mc-badge-reveal { animation: mcBadgeReveal .7s cubic-bezier(.2,.8,.2,1) both; }
      `}</style>
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
              {reputation.rivalries.map((rv, i) => (
                <div key={rv.rival} className="mc-rival-in" style={{ animationDelay: `${i * 0.08}s` }}>
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
          {TITLES.map((t, i) => {
            const has = unlocked.has(t.id);
            return (
              <div
                key={t.id}
                className={has ? "mc-badge-reveal" : undefined}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  padding: 14,
                  borderRadius: 12,
                  background: BG3,
                  border: `1px solid ${has ? GOLD : "rgba(255,255,255,0.06)"}`,
                  boxShadow: has ? `0 0 0 1px ${GOLD}33, 0 8px 22px rgba(201,168,76,0.18)` : "none",
                  opacity: has ? 1 : 0.6,
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  animationDelay: has ? `${i * 0.1}s` : undefined,
                }}
              >
                <span style={{ color: has ? GOLD2 : MID, marginTop: 2 }}>{has ? <StarIcon size={18} /> : <LockIcon size={16} />}</span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: has ? "#fff" : MID }}>{t.name}</div>
                  <div style={{ fontSize: 11.5, color: DIM, marginTop: 2, lineHeight: 1.4 }}>{t.description}</div>
                </div>
                {/* Barrido de brillo al revelar la insignia obtenida. */}
                {has && (
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      width: "55%",
                      background: "linear-gradient(115deg, transparent, rgba(255,255,255,0.22), transparent)",
                      animation: `mcBadgeShine 1.1s ease-in-out ${0.4 + i * 0.1}s 1 both`,
                      pointerEvents: "none",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
