"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TYPE_META, type PredictionType } from "@/lib/predictions/types";
import { ArrowLeft, TrendingUp, TYPE_ICON } from "../icons";

const BG = "#060B14", BG2 = "#0F1D32", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a";
const CARD_BORDER = "1px solid rgba(255,255,255,0.07)";

interface ByType { type: PredictionType; total: number; correct: number; accuracy: number; avg_points: number }
interface Stats {
  total_points: number;
  total_predictions: number;
  correct_predictions: number;
  accuracy_pct: number;
  by_type: ByType[];
  perfect_matches: number;
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauth, setUnauth] = useState(false);

  useEffect(() => {
    fetch("/api/predictions/stats/me")
      .then((r) => { if (r.status === 401) { setUnauth(true); return null; } return r.json(); })
      .then((d) => d && setStats(d))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: BG, color: "#fff", fontFamily: "'Outfit',sans-serif", minHeight: "100vh", padding: "20px 16px 60px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link href="/app/predicciones/jugar" style={{ color: MID, fontSize: 13, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}><ArrowLeft size={14} /> Volver</Link>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}><TrendingUp size={24} color={GOLD2} /> Mis Estadísticas</h1>

        {loading ? (
          <p style={{ color: DIM, marginTop: 24 }}>Cargando…</p>
        ) : unauth ? (
          <p style={{ color: DIM, marginTop: 24 }}>Inicia sesión para ver tus estadísticas.</p>
        ) : !stats || stats.total_predictions === 0 ? (
          <p style={{ color: DIM, marginTop: 24 }}>Aún no tienes predicciones resueltas.</p>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, marginTop: 16 }}>
              <Stat label="Puntos totales" value={stats.total_points} />
              <Stat label="Precisión" value={`${stats.accuracy_pct}%`} />
              <Stat label="Aciertos" value={`${stats.correct_predictions}/${stats.total_predictions}`} />
              <Stat label="Partidos perfectos" value={stats.perfect_matches} />
            </div>

            <h2 style={{ fontSize: 16, fontWeight: 800, marginTop: 28, marginBottom: 12 }}>Por tipo de predicción</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {stats.by_type.map((t) => {
                const TypeIcon = TYPE_ICON[t.type];
                return (
                <div key={t.type} style={{ display: "flex", alignItems: "center", gap: 12, background: BG2, border: CARD_BORDER, borderRadius: 12, padding: "10px 14px" }}>
                  <TypeIcon size={18} color={TYPE_META[t.type].color} />
                  <span style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{TYPE_META[t.type].label}</span>
                  <span style={{ fontSize: 12, color: DIM }}>{t.correct}/{t.total} · {t.accuracy}%</span>
                  <span style={{ fontWeight: 800, color: GOLD, minWidth: 60, textAlign: "right" }}>{t.avg_points} pts/u</span>
                </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: BG2, border: CARD_BORDER, borderRadius: 12, padding: 14, textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: GOLD }}>{value}</div>
      <div style={{ fontSize: 11, color: MID, marginTop: 4 }}>{label}</div>
    </div>
  );
}
