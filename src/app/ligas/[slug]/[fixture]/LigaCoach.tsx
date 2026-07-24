"use client";

// IA Coach del Match Center de ligas: análisis del partido (favorito,
// probabilidades, marcador, factores clave, jugador a seguir) generado por el
// modelo con datos de club (forma + tabla). Bajo demanda (botón) para no gastar
// cuota sin que el usuario lo pida. Pro/Free gestionado en el endpoint.

import { useState } from "react";
import Link from "next/link";
import type { IACoachAnalysis } from "@/lib/ia-coach/types";

const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const DIM = "#a69a82";

type Props = {
  fixtureId: number;
  slug: string;
  homeId: number;
  homeName: string;
  awayId: number;
  awayName: string;
  kickoff?: string | null;
};

const CONF_LABEL: Record<string, string> = { baja: "Confianza baja", media: "Confianza media", alta: "Confianza alta" };

export default function LigaCoach({ fixtureId, slug, homeId, homeName, awayId, awayName, kickoff }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error" | "pro">("idle");
  const [a, setA] = useState<IACoachAnalysis | null>(null);
  const [errMsg, setErrMsg] = useState<string>("");

  const run = async () => {
    if (state === "loading") return;
    setState("loading"); setErrMsg("");
    try {
      const r = await fetch("/api/ia-coach/analyze-liga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixtureId, slug, homeId, homeName, awayId, awayName, kickoff }),
      });
      if (r.status === 402) { setState("pro"); return; }
      if (!r.ok) { setState("error"); setErrMsg(r.status === 429 ? "Demasiadas consultas. Espera un momento." : "No se pudo generar el análisis ahora."); return; }
      const d = await r.json();
      if (d?.ok && d.analysis) { setA(d.analysis as IACoachAnalysis); setState("done"); }
      else { setState("error"); setErrMsg("No se pudo generar el análisis."); }
    } catch {
      setState("error"); setErrMsg("Fallo de red. Reinténtalo.");
    }
  };

  const wrap = { marginTop: 16, borderRadius: 14, border: "1px solid rgba(201,168,76,0.3)", background: "linear-gradient(180deg,#17120b,#0f0c07)", padding: 16 } as const;

  if (state === "idle" || state === "error" || state === "pro") {
    return (
      <div style={wrap}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: GOLD2 }}>Análisis IA del partido</span>
        </div>
        <p style={{ fontSize: 12.5, color: DIM, lineHeight: 1.5, marginBottom: 12 }}>
          El Analista Jefe lee la forma y la tabla de {homeName} y {awayName} y te da su pronóstico.
        </p>
        {state === "pro" ? (
          <Link href="/pro" style={{ display: "inline-block", padding: "10px 18px", borderRadius: 11, background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: "#0a0906", fontWeight: 800, fontSize: 13.5, textDecoration: "none" }}>
            Ya usaste tu análisis de hoy · Hazte Pro
          </Link>
        ) : (
          <button onClick={run} style={{ padding: "10px 18px", borderRadius: 11, border: "none", background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: "#0a0906", fontWeight: 800, fontSize: 13.5, cursor: "pointer" }}>
            Analizar con IA
          </button>
        )}
        {state === "error" && <p style={{ fontSize: 12, color: "#e0574f", marginTop: 10 }}>{errMsg}</p>}
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div style={{ ...wrap, textAlign: "center", color: DIM, fontSize: 13 }}>
        El Analista está estudiando el partido… <span style={{ color: GOLD2 }}>(20-40 s)</span>
      </div>
    );
  }

  // done
  if (!a) return null;
  const winnerName = a.winnerPrediction === "HOME" ? homeName : a.winnerPrediction === "AWAY" ? awayName : "Empate";
  const bars: { label: string; v: number; hot: boolean }[] = [
    { label: homeName, v: a.probabilities.home, hot: a.winnerPrediction === "HOME" },
    { label: "Empate", v: a.probabilities.draw, hot: a.winnerPrediction === "DRAW" },
    { label: awayName, v: a.probabilities.away, hot: a.winnerPrediction === "AWAY" },
  ];
  const watchTeam = a.watchPlayer ? (a.watchPlayer.team === "HOME" ? homeName : a.watchPlayer.team === "AWAY" ? awayName : "") : "";

  return (
    <div style={wrap}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: GOLD }}>Análisis IA</span>
        <span style={{ fontSize: 10.5, color: DIM }}>{CONF_LABEL[a.confidence] ?? ""}</span>
      </div>
      <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginTop: 6, lineHeight: 1.2 }}>{a.verdict}</div>
      <div style={{ fontSize: 13, color: "#e6decb", marginTop: 8, lineHeight: 1.4 }}>{a.analysis}</div>

      {/* Probabilidades */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14 }}>
        {bars.map((b, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: "34%", fontSize: 12, fontWeight: b.hot ? 800 : 600, color: b.hot ? GOLD2 : "#cbd2dc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.label}</span>
            <span style={{ flex: 1, height: 8, borderRadius: 6, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
              <span style={{ display: "block", height: "100%", width: `${Math.round(b.v * 100)}%`, background: b.hot ? `linear-gradient(90deg,${GOLD},${GOLD2})` : "rgba(201,168,76,0.35)" }} />
            </span>
            <span style={{ width: 38, textAlign: "right", fontSize: 12, fontWeight: 700, color: b.hot ? GOLD2 : DIM, fontVariantNumeric: "tabular-nums" }}>{Math.round(b.v * 100)}%</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#0a0906", background: `linear-gradient(135deg,${GOLD},${GOLD2})`, borderRadius: 7, padding: "4px 10px" }}>Favorito: {winnerName}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#e6decb", background: "rgba(255,255,255,0.05)", borderRadius: 7, padding: "4px 10px" }}>Marcador: {a.scoreSuggestion}</span>
      </div>

      {a.keyFactors.length > 0 && (
        <ul style={{ margin: "14px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
          {a.keyFactors.map((k, i) => (
            <li key={i} style={{ fontSize: 12.5, color: "#cbd2dc", display: "flex", gap: 8 }}>
              <span style={{ color: GOLD, flexShrink: 0 }}>▸</span><span>{k}</span>
            </li>
          ))}
        </ul>
      )}

      {a.watchPlayer && (
        <div style={{ marginTop: 12, padding: "9px 12px", borderRadius: 10, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: GOLD, textTransform: "uppercase", letterSpacing: 0.5 }}>Jugador a seguir</span>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", marginTop: 2 }}>{a.watchPlayer.name}{watchTeam ? ` · ${watchTeam}` : ""}</div>
          <div style={{ fontSize: 12, color: DIM, marginTop: 2, lineHeight: 1.4 }}>{a.watchPlayer.reason}</div>
        </div>
      )}

      <p style={{ fontSize: 10.5, color: DIM, marginTop: 12, lineHeight: 1.4 }}>Análisis generado por IA a partir de datos públicos (forma y tabla). Orientativo, sin apuestas.</p>
    </div>
  );
}
