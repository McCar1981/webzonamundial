// src/components/bracket/BracketCoachPanel.tsx
//
// IA Coach MODO 3: Entrenador Personal. Panel que analiza la quiniela COMPLETA
// del usuario. Reenvía el estado del bracket (picks + matches resueltos +
// campeón) a POST /api/ia-coach/coach y pinta la lectura del modelo.

"use client";

import { useCallback, useState } from "react";
import type { BracketState } from "@/lib/bracket/types";
import { TEAM_BY_ID } from "@/lib/bracket/teams";
import { IconWhistle } from "@/components/ia-coach/icons";
import type {
  IACoachBracketAnalysis,
  IACoachBracketResponse,
  IACoachBracketErrorResponse,
  BracketStateInput,
} from "@/lib/ia-coach/coach-types";

// Paleta alineada con el resto del bracket (dorado ZonaMundial).
const BG2 = "#12161D";
const BG3 = "#1A2029";
const GOLD = "#C9A84C";
const GOLD2 = "#FDE68A";
const MID = "#C7CEDA";
const DIM = "#8A93A3";
const RED = "#E5604D";
const GREEN = "#4EC28A";

const STYLE_LABEL: Record<IACoachBracketAnalysis["predictionStyle"], string> = {
  conservador: "Conservador",
  equilibrado: "Equilibrado",
  atrevido: "Atrevido",
};

const REALISM_COLOR: Record<IACoachBracketAnalysis["championVerdict"]["realism"], string> = {
  solido: GREEN,
  defendible: GOLD2,
  arriesgado: RED,
};

function teamName(id: string): string {
  return TEAM_BY_ID[id]?.name ?? id;
}

function coachError(code: string): string {
  switch (code) {
    case "bracket_too_incomplete":
      return "Tu quiniela está muy incompleta. Pronostica más cruces y vuelve a intentarlo.";
    case "missing_state":
      return "No se pudo leer tu quiniela.";
    case "anthropic_failed":
      return "El entrenador no está disponible ahora mismo. Inténtalo en un momento.";
    default:
      return "No se pudo analizar tu quiniela. Inténtalo de nuevo.";
  }
}

export default function BracketCoachPanel({
  state,
  userName = null,
}: {
  state: BracketState;
  /** Nombre de registro del usuario, para personalizar el copy del panel. */
  userName?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<IACoachBracketAnalysis | null>(null);
  const [cached, setCached] = useState(false);

  const pickCount = Object.keys(state.picks).length;
  const ready = pickCount >= 8;

  const analyze = useCallback(async () => {
    setLoading(true);
    setError(null);

    const payload: BracketStateInput = {
      champion: state.champion,
      picks: Object.fromEntries(
        Object.entries(state.picks).map(([id, p]) => [
          id,
          { matchId: p.matchId, winner: p.winner, scoreA: p.scoreA, scoreB: p.scoreB },
        ]),
      ),
      matches: state.matches.map((m) => ({
        id: m.id,
        phase: m.phase,
        groupIdx: m.groupIdx,
        a: m.a,
        b: m.b,
      })),
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 62_000);
    try {
      const res = await fetch("/api/ia-coach/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: payload }),
        signal: controller.signal,
      });
      const data = (await res.json()) as
        | IACoachBracketResponse
        | IACoachBracketErrorResponse;
      if (data.ok) {
        setAnalysis(data.analysis);
        setCached(data.cached);
      } else {
        setError(coachError("error" in data ? data.error : "unknown"));
        setAnalysis(null);
      }
    } catch (err) {
      setError(
        (err as Error).name === "AbortError"
          ? "El análisis tardó demasiado. Inténtalo de nuevo."
          : "Error de red al contactar al entrenador.",
      );
      setAnalysis(null);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, [state]);

  return (
    <div
      style={{
        marginTop: 18,
        background: BG2,
        border: `1px solid ${GOLD}33`,
        borderRadius: 14,
        padding: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ color: GOLD2, display: "inline-flex" }}>
          <IconWhistle size={20} />
        </span>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontWeight: 700, color: GOLD2, fontSize: 15 }}>
            Entrenador Personal
          </div>
          <div style={{ color: DIM, fontSize: 12 }}>
            {userName
              ? `Análisis IA de la quiniela de ${userName}`
              : "Análisis IA de tu quiniela completa"}
          </div>
        </div>
        <button
          onClick={analyze}
          disabled={loading || !ready}
          style={{
            background: ready ? GOLD : "#3A3F49",
            color: ready ? "#0C0F14" : DIM,
            border: "none",
            borderRadius: 9,
            padding: "9px 16px",
            fontWeight: 700,
            fontSize: 13,
            cursor: loading || !ready ? "default" : "pointer",
            opacity: loading ? 0.7 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "Analizando…" : analysis ? "Volver a analizar" : "Analiza mi quiniela"}
        </button>
      </div>

      {!ready && (
        <div style={{ color: DIM, fontSize: 12.5, marginTop: 10 }}>
          Pronostica al menos 8 partidos para que el entrenador pueda leerte ({pickCount}/8).
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: 12,
            background: `${RED}1A`,
            border: `1px solid ${RED}55`,
            borderRadius: 9,
            padding: "10px 12px",
            color: RED,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {analysis && !loading && (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Titular + nota */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ color: GOLD2, fontWeight: 700, fontSize: 17, lineHeight: 1.25 }}>
                {analysis.coachTitle}
              </div>
              <div style={{ color: MID, fontSize: 13.5, marginTop: 6, lineHeight: 1.45 }}>
                {analysis.profile}
              </div>
            </div>
            <div
              style={{
                background: BG3,
                border: `1px solid ${GOLD}55`,
                borderRadius: 12,
                padding: "8px 14px",
                textAlign: "center",
                minWidth: 64,
              }}
            >
              <div style={{ color: DIM, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>
                Nota
              </div>
              <div style={{ color: GOLD2, fontWeight: 800, fontSize: 22 }}>{analysis.grade}</div>
            </div>
          </div>

          {/* Estilo + riesgo */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                color: DIM,
                marginBottom: 4,
              }}
            >
              <span>
                Estilo: <strong style={{ color: MID }}>{STYLE_LABEL[analysis.predictionStyle]}</strong>
              </span>
              <span>Riesgo {analysis.riskScore}/100</span>
            </div>
            <div style={{ height: 8, background: BG3, borderRadius: 99, overflow: "hidden" }}>
              <div
                style={{
                  width: `${analysis.riskScore}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${GREEN}, ${GOLD2}, ${RED})`,
                }}
              />
            </div>
          </div>

          {/* Veredicto del campeón */}
          <div
            style={{
              background: BG3,
              borderRadius: 11,
              padding: "11px 13px",
              borderLeft: `3px solid ${REALISM_COLOR[analysis.championVerdict.realism]}`,
            }}
          >
            <div style={{ fontSize: 11, color: DIM, textTransform: "uppercase", letterSpacing: 1 }}>
              Tu campeón · {teamName(analysis.championVerdict.team)}
            </div>
            <div style={{ color: MID, fontSize: 13.5, marginTop: 5, lineHeight: 1.45 }}>
              {analysis.championVerdict.take}
            </div>
          </div>

          {/* Fortalezas */}
          {analysis.strengths.length > 0 && (
            <Section title="Lo que haces bien" color={GREEN}>
              {analysis.strengths.map((s, i) => (
                <Bullet key={i} color={GREEN}>{s}</Bullet>
              ))}
            </Section>
          )}

          {/* Riesgos */}
          {analysis.risks.length > 0 && (
            <Section title="Dónde te la juegas" color={RED}>
              {analysis.risks.map((r, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ color: MID, fontSize: 13.5, fontWeight: 600 }}>{r.label}</div>
                  <div style={{ color: DIM, fontSize: 12.5, marginTop: 2 }}>{r.why}</div>
                </div>
              ))}
            </Section>
          )}

          {/* Sesgos */}
          {analysis.biases.length > 0 && (
            <Section title="Tus sesgos" color={GOLD2}>
              {analysis.biases.map((b, i) => (
                <Bullet key={i} color={GOLD2}>{b}</Bullet>
              ))}
            </Section>
          )}

          {/* Sugerencias */}
          {analysis.suggestions.length > 0 && (
            <Section title="Consejos del entrenador" color={GOLD}>
              {analysis.suggestions.map((s, i) => (
                <Bullet key={i} color={GOLD}>{s}</Bullet>
              ))}
            </Section>
          )}

          {/* Datos que faltaban (transparencia) */}
          {analysis.missingData.length > 0 && (
            <Section title="Lo que me faltó para afinar" color={DIM}>
              {analysis.missingData.map((m, i) => (
                <Bullet key={i} color={DIM}>{m}</Bullet>
              ))}
            </Section>
          )}

          <div style={{ color: DIM, fontSize: 11, textAlign: "right" }}>
            Confianza: {analysis.confidence}
            {cached ? " · lectura en caché" : ""}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ color, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Bullet({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 5 }}>
      <span style={{ color, flexShrink: 0 }}>•</span>
      <span style={{ color: MID, fontSize: 13.5, lineHeight: 1.4 }}>{children}</span>
    </div>
  );
}
