"use client";

// src/components/bracket/MatchAIAnalysis.tsx
//
// Sección "Análisis IA" dentro del MatchModal. El usuario hace click en
// el botón "Pedir análisis al Coach IA" y se muestra:
//   - Verdict (titular del análisis)
//   - Probabilidades home/draw/away con barras
//   - Marcador sugerido
//   - Análisis editorial (300-500 palabras)
//   - Factores clave (3-5)
//   - Jugador a seguir
//   - Botón "Aplicar al pick" que rellena el modal con la predicción
//
// El componente cachea localmente la respuesta para que cambiar de pestaña
// no re-pegue al API.

import { useState } from "react";
import type { BracketMatch } from "@/lib/bracket/types";
import type { BracketTeam } from "@/lib/bracket/teams";
import type {
  IACoachAnalysis,
  IACoachResponse,
  IACoachErrorResponse,
} from "@/lib/ia-coach/types";
import styles from "./MatchAIAnalysis.module.css";

interface Props {
  match: BracketMatch;
  teamA: BracketTeam;
  teamB: BracketTeam;
  /** Si el usuario aplica la predicción del coach, esto carga el modal. */
  onApplyPrediction?: (data: {
    winner: string | null;
    scoreA: number;
    scoreB: number;
  }) => void;
}

export default function MatchAIAnalysis({
  match,
  teamA,
  teamB,
  onApplyPrediction,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<IACoachAnalysis | null>(null);
  const [cached, setCached] = useState(false);

  async function requestAnalysis() {
    if (loading || analysis) {
      setOpen(true);
      return;
    }
    setLoading(true);
    setError(null);
    setOpen(true);
    try {
      const r = await fetch("/api/ia-coach/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id, match }),
      });
      const data = (await r.json()) as IACoachResponse | IACoachErrorResponse;
      if (data.ok === false) {
        setError(humanError(data.error));
      } else if (data.ok === true) {
        setAnalysis(data.analysis);
        setCached(data.cached);
      } else {
        setError("Respuesta inválida del servidor.");
      }
    } catch {
      setError("Error de red. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (!open && !analysis) {
    // Botón inicial
    return (
      <button
        type="button"
        className={styles.requestButton}
        onClick={requestAnalysis}
        disabled={loading}
        aria-label="Pedir análisis al Coach IA"
      >
        <SparkleIcon />
        <span>{loading ? "Analizando…" : "Análisis Coach IA"}</span>
      </button>
    );
  }

  return (
    <section className={styles.wrap} aria-live="polite">
      <header className={styles.header}>
        <span className={styles.eyebrow}>
          <SparkleIcon />
          {"// Análisis Coach IA"}
        </span>
        {cached ? <span className={styles.cachedTag}>Cache</span> : null}
      </header>

      {loading ? <LoadingState /> : null}

      {error ? (
        <div className={styles.errorBox}>
          <p>{error}</p>
          <button
            type="button"
            className={styles.retryBtn}
            onClick={() => {
              setError(null);
              setAnalysis(null);
              setOpen(false);
              void requestAnalysis();
            }}
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {analysis && !loading ? (
        <AnalysisBody
          analysis={analysis}
          teamA={teamA}
          teamB={teamB}
          onApply={onApplyPrediction}
        />
      ) : null}
    </section>
  );
}

/* ─────────── SUBCOMPONENTES ─────────── */

function LoadingState() {
  return (
    <div className={styles.loadingBox}>
      <div className={styles.spinner} aria-hidden />
      <p>
        Analizando el partido… <br />
        <small>Plantillas, DT, sede, forma histórica</small>
      </p>
    </div>
  );
}

function AnalysisBody({
  analysis,
  teamA,
  teamB,
  onApply,
}: {
  analysis: IACoachAnalysis;
  teamA: BracketTeam;
  teamB: BracketTeam;
  onApply?: Props["onApplyPrediction"];
}) {
  const { home, draw, away } = analysis.probabilities;

  // Decide winner code para destacar en la UI
  const winnerCode = analysis.winnerPrediction.toUpperCase();
  const winnerIsA = winnerCode === teamA.id;
  const winnerIsB = winnerCode === teamB.id;
  const isDraw = winnerCode === "DRAW";

  // Marcador sugerido (split "N-N")
  const [scoreAStr, scoreBStr] = (analysis.scoreSuggestion || "0-0").split("-");
  const scoreA = parseInt(scoreAStr || "0", 10);
  const scoreB = parseInt(scoreBStr || "0", 10);

  const applyDisabled =
    Number.isNaN(scoreA) ||
    Number.isNaN(scoreB) ||
    (!winnerIsA && !winnerIsB && !isDraw);

  const confidenceLabel: Record<typeof analysis.confidence, string> = {
    baja: "Confianza baja",
    media: "Confianza media",
    alta: "Confianza alta",
  };

  return (
    <div>
      <p className={styles.verdict}>{analysis.verdict}</p>

      <div className={styles.predictionRow}>
        <div className={styles.scoreSuggestion}>
          <span className={styles.scoreLabel}>Marcador sugerido</span>
          <span className={styles.scoreValue}>
            {scoreA}–{scoreB}
          </span>
        </div>
        <div className={styles.confidenceTag} data-level={analysis.confidence}>
          {confidenceLabel[analysis.confidence]}
        </div>
      </div>

      <div className={styles.probBars}>
        <ProbBar
          label={teamA.name}
          value={home}
          highlight={winnerIsA}
          color={teamA.color}
        />
        <ProbBar
          label="Empate"
          value={draw}
          highlight={isDraw}
          color="#94a3b8"
        />
        <ProbBar
          label={teamB.name}
          value={away}
          highlight={winnerIsB}
          color={teamB.color}
        />
      </div>

      <div className={styles.analysisText}>
        {analysis.analysis.split(/\n\n+/).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {analysis.keyFactors.length > 0 ? (
        <div className={styles.keyFactors}>
          <div className={styles.keyFactorsTitle}>{"// Factores clave"}</div>
          <ul>
            {analysis.keyFactors.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {analysis.watchPlayer ? (
        <div className={styles.watchPlayer}>
          <div className={styles.watchPlayerLabel}>
            {"// Jugador a seguir"}
          </div>
          <div className={styles.watchPlayerName}>
            {analysis.watchPlayer.name}
            <span className={styles.watchPlayerTeam}>
              {analysis.watchPlayer.team}
            </span>
          </div>
          <p className={styles.watchPlayerReason}>
            {analysis.watchPlayer.reason}
          </p>
        </div>
      ) : null}

      {onApply ? (
        <button
          type="button"
          className={styles.applyBtn}
          onClick={() => {
            const winnerId = winnerIsA
              ? teamA.id
              : winnerIsB
                ? teamB.id
                : null;
            onApply({
              winner: winnerId,
              scoreA: Number.isNaN(scoreA) ? 0 : scoreA,
              scoreB: Number.isNaN(scoreB) ? 0 : scoreB,
            });
          }}
          disabled={applyDisabled}
        >
          Aplicar predicción del Coach
        </button>
      ) : null}

      <p className={styles.disclaimer}>
        Análisis generado por IA. Decisión final del usuario.
      </p>
    </div>
  );
}

function ProbBar({
  label,
  value,
  highlight,
  color,
}: {
  label: string;
  value: number;
  highlight: boolean;
  color?: string;
}) {
  const pct = Math.round(value * 100);
  return (
    <div className={styles.probRow} data-highlight={highlight}>
      <span className={styles.probLabel}>{label}</span>
      <div
        className={styles.probTrack}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${pct}%`}
      >
        <span
          className={styles.probFill}
          style={{
            width: `${Math.max(2, pct)}%`,
            background: highlight && color ? color : undefined,
          }}
        />
      </div>
      <span className={styles.probPct}>{pct}%</span>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3l1.8 4.7L18 9l-4.2 1.3L12 15l-1.8-4.7L6 9l4.2-1.3L12 3z" />
      <path d="M5 17l.9 2.3 2.3.9-2.3.9L5 23l-.9-2.3-2.3-.9 2.3-.9L5 17z" />
    </svg>
  );
}

function humanError(code: string): string {
  switch (code) {
    case "invalid_json":
      return "Petición inválida. Intenta de nuevo.";
    case "missing_matchId_or_match":
      return "Faltan datos del partido.";
    case "match_not_ready":
      return "Aún no hay equipos definidos para este partido.";
    case "context_build_failed":
      return "No pudimos preparar los datos del análisis.";
    case "teams_not_found":
      return "No encontramos información de las selecciones.";
    case "anthropic_failed":
      return "El Coach IA no respondió. Inténtalo en unos segundos.";
    default:
      return "Algo falló. Inténtalo de nuevo.";
  }
}
