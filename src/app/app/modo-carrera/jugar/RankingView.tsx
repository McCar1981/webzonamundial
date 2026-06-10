// src/app/app/modo-carrera/jugar/RankingView.tsx
// Ranking global de DTs (cruza usuarios) por reputación, con desempate por
// overall. Consume /api/modo-carrera/leaderboard. SVG-only, sin emojis.

"use client";

import { useEffect, useState } from "react";
import { BG2, BG3, GOLD, GOLD2, MID, DIM, flagUrl } from "./fx";
import { fetchLeaderboard } from "./api";
import { SELECCIONES } from "@/data/selecciones";
import type { CareerRankEntry } from "@/lib/modo-carrera/types";

function nationFlag(slug: string | null): string | null {
  if (!slug) return null;
  const s = SELECCIONES.find((x) => x.slug === slug);
  return s ? flagUrl(s.flagCode) : null;
}

const MEDAL = ["rgba(201,168,76,0.18)", "rgba(192,192,192,0.14)", "rgba(205,127,50,0.14)"];
const MEDAL_TEXT = [GOLD, "#d1d5db", "#d97706"];

export default function RankingView() {
  const [entries, setEntries] = useState<CareerRankEntry[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetchLeaderboard().then((e) => {
      if (alive) setEntries(e);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>Ranking de DT</h2>
        <p style={{ fontSize: 13, color: MID, marginTop: 4 }}>
          Los mejores directores técnicos por reputación. Gana torneos y misiones para escalar.
        </p>
      </div>

      {entries === null ? (
        <div style={{ padding: "40px 20px", textAlign: "center", color: DIM }}>Cargando ranking…</div>
      ) : entries.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center", borderRadius: 14, background: BG2, border: "1px dashed rgba(255,255,255,0.08)" }}>
          <div style={{ color: MID, fontWeight: 700 }}>Aún no hay clasificación</div>
          <div style={{ color: DIM, fontSize: 13, marginTop: 6 }}>
            Inicia sesión y juega tu carrera para aparecer en el ranking global.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {entries.map((e, i) => {
            const flag = nationFlag(e.nation_slug);
            const top = i < 3;
            return (
              <div
                key={e.position}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: top ? MEDAL[i] : BG2,
                  border: `1px solid ${top ? "rgba(201,168,76,0.18)" : "rgba(255,255,255,0.05)"}`,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: 14,
                    background: top ? MEDAL[i] : "rgba(255,255,255,0.04)",
                    color: top ? MEDAL_TEXT[i] : DIM,
                  }}
                >
                  {e.position}
                </div>
                {flag && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={flag} alt="" style={{ width: 26, height: 18, borderRadius: 2, objectFit: "cover" }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {e.dt_name}
                  </div>
                  <div style={{ fontSize: 12, color: DIM }}>
                    {e.display_name} · {e.rank}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: DIM }}>OVR {e.overall}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: top ? GOLD2 : "#fff" }}>{e.reputation}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
