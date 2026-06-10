"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Globe, Star, Trophy } from "../icons";
import { PositionBadge, TitleChip, nameColorStyle, type CosmeticDisplay } from "../cosmetic-render";

const BG = "#060B14", BG2 = "#0F1D32", BG3 = "#0B1825", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a";
const CARD_BORDER = "1px solid rgba(255,255,255,0.07)";

interface Entry {
  position: number;
  user: { id: string; display_name: string; avatar_url: string | null; is_premium: boolean; cosmetics: CosmeticDisplay | null };
  total_points: number;
  predictions_count: number;
  // En el ranking semanal el backend no calcula precisión (la manda 0/null);
  // por eso aceptamos null y la ocultamos en ese periodo.
  accuracy_pct: number | null;
}

export default function RankingPage() {
  const [rankings, setRankings] = useState<Entry[]>([]);
  const [myPos, setMyPos] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"tournament" | "weekly">("tournament");

  useEffect(() => {
    setLoading(true);
    const q = period === "weekly" ? "?limit=100&period=weekly" : "?limit=100";
    fetch(`/api/predictions/leaderboard${q}`)
      .then((r) => r.json())
      .then((d) => { setRankings(d.rankings ?? []); setMyPos(d.my_position ?? null); })
      .finally(() => setLoading(false));
  }, [period]);

  const tabStyle = (active: boolean) => ({
    cursor: "pointer", background: active ? "rgba(201,168,76,0.15)" : BG2,
    border: active ? `1px solid ${GOLD}` : CARD_BORDER, borderRadius: 99,
    color: active ? GOLD2 : MID, fontWeight: 700, fontSize: 13, padding: "7px 16px",
    display: "inline-flex", alignItems: "center", gap: 6,
  });

  return (
    <div style={{ background: BG, color: "#fff", fontFamily: "'Outfit',sans-serif", minHeight: "100vh", padding: "20px 16px 60px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link href="/app/predicciones/jugar" style={{ color: MID, fontSize: 13, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}><ArrowLeft size={14} /> Volver</Link>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}><Trophy size={24} color={GOLD2} /> Ranking de Predictores</h1>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={() => setPeriod("tournament")} style={tabStyle(period === "tournament")}><Globe size={14} /> Mundial</button>
          <button onClick={() => setPeriod("weekly")} style={tabStyle(period === "weekly")}><Calendar size={14} /> Esta semana</button>
        </div>
        {myPos && <p style={{ color: GOLD, fontSize: 13, marginTop: 8 }}>Tu posición: #{myPos}</p>}

        {loading ? (
          <p style={{ color: DIM, marginTop: 24 }}>Cargando…</p>
        ) : rankings.length === 0 ? (
          <p style={{ color: DIM, marginTop: 24 }}>Aún no hay predicciones resueltas. ¡Sé el primero en sumar puntos!</p>
        ) : (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {rankings.map((e) => (
              <div key={e.user.id} style={{ display: "flex", alignItems: "center", gap: 12, background: BG2, border: CARD_BORDER, borderRadius: 12, padding: "10px 14px" }}>
                <PositionBadge position={e.position} cosmetics={e.user.cosmetics} top3color={GOLD} baseColor={MID} innerBg={BG3} />
                <span style={{ flex: 1, display: "inline-flex", alignItems: "center", gap: 7, flexWrap: "wrap", minWidth: 0 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 5, ...nameColorStyle(e.user.cosmetics) }}>
                    {e.user.display_name}{e.user.is_premium && <Star size={13} color={GOLD2} fill={GOLD2} />}
                  </span>
                  <TitleChip title={e.user.cosmetics?.title} />
                </span>
                <span style={{ fontSize: 12, color: DIM }}>
                  {/* Semanal: el backend no aporta precisión real (0/null) → mostramos
                      solo el nº de predicciones. En "Mundial" sí enseñamos el %. */}
                  {period === "weekly" || e.accuracy_pct == null
                    ? `${e.predictions_count} predicciones`
                    : `${e.accuracy_pct}% · ${e.predictions_count}`}
                </span>
                <span style={{ fontWeight: 800, color: GOLD, minWidth: 56, textAlign: "right" }}>{e.total_points} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
