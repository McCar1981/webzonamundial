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

import { useEffect, useState } from "react";
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
    // AbortController para timeout en cliente (65s, un poco más que el
    // maxDuration del endpoint para que el server gane si está cerca del límite).
    const ac = new AbortController();
    const timeoutId = setTimeout(() => ac.abort(), 65_000);
    try {
      const r = await fetch("/api/ia-coach/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id, match }),
        signal: ac.signal,
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
    } catch (err) {
      const e = err as Error;
      if (e.name === "AbortError") {
        setError("El análisis está tardando más de lo normal. Vuelve a intentarlo.");
      } else {
        setError("No se pudo conectar con el coach. Inténtalo de nuevo.");
      }
    } finally {
      clearTimeout(timeoutId);
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

// 30 curiosidades del Mundial — rotan cada 2.8s mientras el coach piensa.
// Cubre rangos: historia (1930-2026), récords, anécdotas, datos técnicos.
const FUN_FACTS = [
  "¿Sabías que el primer Mundial fue en 1930 en Uruguay y solo participaron 13 selecciones?",
  "Brasil es la única selección que ha jugado los 22 Mundiales disputados hasta 2022.",
  "El Mundial 2026 será el primero con 48 selecciones y 104 partidos.",
  "Estados Unidos, Canadá y México coorganizan el Mundial 2026 — 3 países por primera vez.",
  "Estadio Azteca albergará su 3ª Final Mundial: 1970, 1986 y 2026.",
  "Pelé es el único futbolista que ha ganado 3 Mundiales (1958, 1962 y 1970).",
  "El gol más rápido en un Mundial: Hakan Şükür (Turquía) en 10,8 segundos vs Corea del Sur, 2002.",
  "Miroslav Klose es el máximo goleador histórico del Mundial con 16 goles.",
  "Argentina ganó su tercera estrella en Qatar 2022 venciendo a Francia en penaltis.",
  "El Mundial 1950 en Brasil tuvo la final más triste para los locales: Maracanazo de Uruguay.",
  "Lionel Messi disputó su quinto Mundial en 2022 y lo ganó a los 35 años.",
  "El Mundial 2026 inaugura en Estadio Azteca, México el 11 de junio.",
  "La FIFA registró su primer 'Joven Promesa' en 2006: ganó Lukas Podolski (Alemania).",
  "Cabo Verde y Curazao debutan en Mundial en 2026, son los países más pequeños jamás clasificados.",
  "El partido más goleado: Hungría 10 - El Salvador 1, Mundial 1982.",
  "MetLife Stadium, Nueva York/NJ, albergará la Final del Mundial 2026.",
  "España ganó su primer Mundial en Sudáfrica 2010 con gol de Iniesta en la prórroga.",
  "Mundial 2026: 16 sedes — 11 en EE.UU., 3 en México, 2 en Canadá.",
  "La final de 1950 (Brasil-Uruguay) tuvo 173.850 espectadores: récord absoluto.",
  "Marcelo Bielsa, DT de Uruguay, ya dirigió a Argentina (1998-2004) y Chile (2007-2011).",
  "Croacia ha jugado dos finales consecutivas: subcampeón 2018, 3º en 2022.",
  "El balón oficial del Mundial 2026 se llama 'Trionda' (Adidas).",
  "Italia (4) y Brasil (5) son las dos selecciones con más Mundiales ganados solo en Europa y Sudamérica respectivamente.",
  "Estados Unidos jugará su 12º Mundial en 2026, su mejor resultado fue 3º en 1930.",
  "Marruecos hizo historia en Qatar 2022: primer país africano semifinalista.",
  "El sistema de 48 selecciones repartirá 12 grupos de 4 equipos cada uno.",
  "Hugo Broos, DT belga de Sudáfrica, ganó la Copa Africana de Naciones con Camerún en 2017.",
  "Mbappé es el segundo jugador en marcar hat-trick en una final (2022), tras Geoff Hurst en 1966.",
  "El Mundial 2026 será el último con 48 selecciones antes de evaluar volver a 32 en 2030.",
  "Diego Maradona protagonizó la 'Mano de Dios' y el 'Gol del Siglo' contra Inglaterra en 1986.",
];

function LoadingState() {
  const [factIdx, setFactIdx] = useState(() =>
    Math.floor(Math.random() * FUN_FACTS.length),
  );
  useEffect(() => {
    const id = setInterval(() => {
      setFactIdx((i) => (i + 1) % FUN_FACTS.length);
    }, 2800);
    return () => clearInterval(id);
  }, []);
  return (
    <div className={styles.loadingBox}>
      <div className={styles.spinner} aria-hidden />
      <p>
        Analizando el partido… <br />
        <small className={styles.funFact} key={factIdx}>
          <strong>¿Sabías que…?</strong> {FUN_FACTS[factIdx].replace(/^¿Sabías que /, "")}
        </small>
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
