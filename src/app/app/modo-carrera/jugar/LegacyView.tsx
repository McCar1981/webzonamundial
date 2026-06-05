// src/app/app/modo-carrera/jugar/LegacyView.tsx
// Pilar 7 — Legado DT. Vitrina de trofeos y tabla de récords permanentes. La
// copa a pantalla completa y los assets de trofeo llegan en F5/F6; aquí se
// muestran con fallback (placeholder dorado) hasta entonces. SVG-only.

"use client";

import { BG2, BG3, GOLD, GOLD2, MID, DIM } from "./fx";
import type { CareerState } from "@/lib/modo-carrera/types";

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div style={{ padding: 14, borderRadius: 12, background: BG3, textAlign: "center" }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: accent ?? "#fff" }}>{value}</div>
      <div style={{ fontSize: 11, color: DIM, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700, marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default function LegacyView({ career }: { career: CareerState }) {
  const { legacy } = career;
  const { records } = legacy;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>Legado</h2>
        <p style={{ fontSize: 13, color: MID, marginTop: 4 }}>Tu huella como director técnico a lo largo de las temporadas.</p>
      </div>

      {/* Vitrina de trofeos */}
      <div style={{ padding: 18, borderRadius: 16, background: BG2, border: "1px solid rgba(255,255,255,0.05)", marginBottom: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: GOLD, marginBottom: 14 }}>Vitrina</h3>
        {legacy.trophies.length === 0 ? (
          <div style={{ color: DIM, fontSize: 14, padding: "20px 0", textAlign: "center" }}>
            La vitrina está vacía. Gana torneos para llenarla de gloria.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 14 }}>
            {legacy.trophies.map((t) => (
              <div key={t.id} style={{ padding: 16, borderRadius: 12, background: BG3, textAlign: "center", border: `1px solid ${GOLD}33` }}>
                <div
                  aria-hidden
                  style={{
                    width: 54,
                    height: 54,
                    margin: "0 auto 10px",
                    borderRadius: "50%",
                    background: `radial-gradient(circle at 35% 30%, ${GOLD2}, ${GOLD} 60%, #8a6f28)`,
                    boxShadow: "0 6px 18px rgba(201,168,76,0.35)",
                  }}
                />
                <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{t.name}</div>
                <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>Temporada {t.season}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Récords */}
      <div style={{ padding: 18, borderRadius: 16, background: BG2, border: "1px solid rgba(255,255,255,0.05)" }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: GOLD, marginBottom: 14 }}>Récords</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(96px,1fr))", gap: 10 }}>
          <Stat label="Partidos" value={records.matchesPlayed} />
          <Stat label="Victorias" value={records.wins} accent={GOLD2} />
          <Stat label="Empates" value={records.draws} />
          <Stat label="Derrotas" value={records.losses} />
          <Stat label="GF" value={records.goalsFor} />
          <Stat label="GC" value={records.goalsAgainst} />
          <Stat label="Títulos" value={records.titlesWon} accent={GOLD2} />
        </div>
      </div>
    </div>
  );
}
