// src/components/bracket/ClassicBracket.tsx
// Vista clásica del bracket: tabs por fase, grid de grupos con standings + matches,
// y árbol "champions mirror" en knockouts. Responsive: en mobile colapsa a stack.

"use client";

import { useMemo, useState } from "react";
import { GROUPS, TEAM_BY_ID, type BracketTeam } from "@/lib/bracket/teams";
import { groupStandings } from "@/lib/bracket/engine";
import { PHASES, type BracketMatch, type BracketState, type PhaseId } from "@/lib/bracket/types";
import styles from "./ClassicBracket.module.css";

interface Props {
  state: BracketState;
  onOpenMatch: (matchId: string) => void;
}

const flagSrc = (iso: string) => `https://flagcdn.com/${iso}.svg`;

const PHASE_TABS: Array<{ id: PhaseId | "GROUPS_TAB"; label: string; matches: number }> = [
  { id: "GROUPS_TAB", label: "Grupos", matches: 72 },
  { id: "R32", label: "32avos", matches: 16 },
  { id: "R16", label: "Octavos", matches: 8 },
  { id: "QF", label: "Cuartos", matches: 4 },
  { id: "SF", label: "Semis", matches: 2 },
  { id: "FINAL", label: "Final", matches: 1 },
];

export default function ClassicBracket({ state, onOpenMatch }: Props) {
  const [activeTab, setActiveTab] = useState<PhaseId | "GROUPS_TAB">("GROUPS_TAB");

  // Cuántos picks llevamos en cada fase (para badges)
  const phaseProgress = useMemo(() => {
    const out: Record<string, { done: number; total: number; ready: boolean }> = {};
    out["GROUPS_TAB"] = {
      done: state.matches.filter((m) => m.phase === "GROUP" && state.picks[m.id]).length,
      total: 72,
      ready: true,
    };
    (["R32", "R16", "QF", "SF", "FINAL"] as PhaseId[]).forEach((p) => {
      const ms = state.matches.filter((m) => m.phase === p);
      const ready = ms.some((m) => m.a !== null && m.b !== null);
      out[p] = {
        done: ms.filter((m) => state.picks[m.id]).length,
        total: ms.length,
        ready,
      };
    });
    return out;
  }, [state]);

  return (
    <div className={styles.root}>
      <div className={styles.phaseNav} role="tablist" aria-label="Fases del torneo">
        {PHASE_TABS.map((tab) => {
          const prog = phaseProgress[tab.id];
          const locked = !prog.ready;
          return (
            <button
              key={tab.id}
              type="button"
              className={styles.phaseTab}
              data-active={activeTab === tab.id}
              data-locked={locked}
              onClick={() => !locked && setActiveTab(tab.id)}
              disabled={locked}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              {tab.label}
              <span className={styles.phaseTabBadge}>
                {prog.done}/{prog.total}
              </span>
            </button>
          );
        })}
      </div>

      {activeTab === "GROUPS_TAB" ? (
        <GroupsView state={state} onOpenMatch={onOpenMatch} />
      ) : (
        <KnockoutView state={state} phase={activeTab} onOpenMatch={onOpenMatch} />
      )}
    </div>
  );
}

// ============== GROUPS VIEW ==============
function GroupsView({ state, onOpenMatch }: Props) {
  return (
    <div className={styles.groupsGrid}>
      {GROUPS.map((g, gi) => (
        <GroupCard key={g} state={state} groupIdx={gi} onOpenMatch={onOpenMatch} />
      ))}
    </div>
  );
}

function GroupCard({
  state,
  groupIdx,
  onOpenMatch,
}: {
  state: BracketState;
  groupIdx: number;
  onOpenMatch: (id: string) => void;
}) {
  const [showStandings, setShowStandings] = useState(false);
  const group = GROUPS[groupIdx];
  const standings = groupStandings(state, groupIdx);
  const matches = state.matches.filter((m) => m.phase === "GROUP" && m.groupIdx === groupIdx);
  const done = matches.filter((m) => state.picks[m.id]).length;

  return (
    <div className={styles.groupCard}>
      <div className={styles.groupHead}>
        <div className={styles.groupName}>
          Grupo <b>{group}</b>
        </div>
        <div className={styles.groupCount}>{done}/6 partidos</div>
      </div>

      {/* PARTIDOS — protagonistas */}
      <div className={styles.groupMatches}>
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} state={state} onOpenMatch={onOpenMatch} />
        ))}
      </div>

      {/* TABLA DE POSICIONES — colapsable, secundaria */}
      <button
        type="button"
        className={styles.standingsToggle}
        aria-expanded={showStandings}
        onClick={() => setShowStandings((s) => !s)}
      >
        <span>Tabla de posiciones</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {showStandings && (
        <ol className={styles.standings}>
          {standings.map((s, rank) => (
            <li key={s.team.id} className={styles.standingRow} data-rank={rank}>
              <span className={styles.standingPos}>{rank + 1}</span>
              <span className={styles.standingFlag}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={flagSrc(s.team.iso)} alt="" />
              </span>
              <span className={styles.standingName}>{s.team.name}</span>
              <span className={styles.standingStats}>
                <b>{s.pts}</b> pts · {s.gd >= 0 ? `+${s.gd}` : s.gd} GD
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** Card grande clickable: dos banderas + nombres + casillas de marcador estilo input. */
function MatchCard({
  match,
  state,
  onOpenMatch,
}: {
  match: BracketMatch;
  state: BracketState;
  onOpenMatch: (id: string) => void;
}) {
  if (!match.a || !match.b) return null;
  const teamA = TEAM_BY_ID[match.a];
  const teamB = TEAM_BY_ID[match.b];
  const pick = state.picks[match.id];
  const winnerA = pick && pick.winner === teamA.id;
  const winnerB = pick && pick.winner === teamB.id;
  const draw = pick && pick.winner === null;

  return (
    <button
      type="button"
      className={styles.matchCard}
      data-picked={!!pick}
      onClick={() => onOpenMatch(match.id)}
      aria-label={`Predecir ${teamA.name} contra ${teamB.name}`}
    >
      <div
        className={styles.matchTeam}
        data-winner={winnerA}
        data-loser={pick && !winnerA && !draw}
      >
        <span className={styles.matchTeamFlag}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={flagSrc(teamA.iso)} alt="" />
        </span>
        <span className={styles.matchTeamName}>{teamA.name}</span>
      </div>

      <div className={styles.matchScoreBox} aria-hidden>
        <span className={styles.matchScoreSlot}>{pick ? pick.scoreA : ""}</span>
        <span className={styles.matchScoreColon}>:</span>
        <span className={styles.matchScoreSlot}>{pick ? pick.scoreB : ""}</span>
      </div>

      <div
        className={`${styles.matchTeam} ${styles.matchTeamRight}`}
        data-winner={winnerB}
        data-loser={pick && !winnerB && !draw}
      >
        <span className={styles.matchTeamFlag}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={flagSrc(teamB.iso)} alt="" />
        </span>
        <span className={styles.matchTeamName}>{teamB.name}</span>
      </div>
    </button>
  );
}

// ============== KNOCKOUT VIEW ==============
function KnockoutView({
  state,
  phase,
  onOpenMatch,
}: {
  state: BracketState;
  phase: PhaseId | "GROUPS_TAB";
  onOpenMatch: (id: string) => void;
}) {
  // Cada fase decisiva tiene su pantalla propia con su presencia editorial.
  // R32 / R16 / QF / SF → grid con header de fase.
  // FINAL → pantalla hero con copa, final centro y 3er puesto debajo.
  if (phase === "FINAL") {
    return <FinalShowcase state={state} onOpenMatch={onOpenMatch} />;
  }
  return <SingleRoundList state={state} phase={phase as PhaseId} onOpenMatch={onOpenMatch} />;
}

/* ─────────── PHASE INTRO HEADER ───────────
   Header editorial encima de cada ronda decisiva. Le da peso visual
   a las eliminatorias para que NO se sientan como "una pantalla más". */

const PHASE_INTRO: Record<
  PhaseId,
  { eyebrow: string; title: string; tagline: string }
> = {
  GROUP: { eyebrow: "FASE DE GRUPOS", title: "Fase de Grupos", tagline: "" },
  R32: {
    eyebrow: "RONDA DE 32avos",
    title: "32avos de Final",
    tagline: "Comienza la eliminación directa.",
  },
  R16: {
    eyebrow: "OCTAVOS DE FINAL",
    title: "Octavos",
    tagline: "16 selecciones. La mitad ya está fuera.",
  },
  QF: {
    eyebrow: "CUARTOS DE FINAL",
    title: "Cuartos",
    tagline: "Los 8 mejores. Una derrota y se acaba el sueño.",
  },
  SF: {
    eyebrow: "SEMIFINALES",
    title: "Semis",
    tagline: "A un paso de la final del Mundial.",
  },
  THIRD: {
    eyebrow: "TERCER PUESTO",
    title: "3er Puesto",
    tagline: "El último partido del Mundial.",
  },
  FINAL: {
    eyebrow: "LA FINAL",
    title: "Final",
    tagline: "El partido más importante del fútbol.",
  },
};

function PhaseHeader({ phase }: { phase: PhaseId }) {
  const info = PHASE_INTRO[phase];
  if (!info) return null;
  return (
    <header className={styles.phaseHeader}>
      <div className={styles.phaseHeaderEyebrow}>{`// ${info.eyebrow}`}</div>
      <h2 className={styles.phaseHeaderTitle}>{info.title}</h2>
      {info.tagline ? (
        <p className={styles.phaseHeaderTagline}>{info.tagline}</p>
      ) : null}
    </header>
  );
}

/* ─────────── FINAL SHOWCASE ───────────
   Pantalla hero exclusiva para la final + 3er puesto. La copa al centro,
   partido final ENORME arriba, tercer puesto como nota secundaria abajo. */

function FinalShowcase({
  state,
  onOpenMatch,
}: {
  state: BracketState;
  onOpenMatch: (id: string) => void;
}) {
  const finalM = state.matches.find((m) => m.phase === "FINAL");
  const thirdM = state.matches.find((m) => m.phase === "THIRD");

  const championId = state.champion;
  const champion = championId ? TEAM_BY_ID[championId] : null;

  return (
    <div className={styles.knockoutWrap}>
      <div className={styles.finalShowcase}>
        <header className={styles.phaseHeader}>
          <div className={styles.phaseHeaderEyebrow}>{"// LA FINAL"}</div>
          <h2 className={styles.phaseHeaderTitle}>Final del Mundial 2026</h2>
          <p className={styles.phaseHeaderTagline}>
            El partido más importante del fútbol.
          </p>
        </header>

        <div className={styles.finalTrophyWrap} aria-hidden>
          <div className={styles.finalTrophyGlow} />
          <svg
            className={styles.finalTrophySvg}
            width="96"
            height="96"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
            <path d="M5 4H3v3a3 3 0 0 0 3 3M19 4h2v3a3 3 0 0 1-3 3" />
          </svg>
        </div>

        <div className={styles.finalMatchCard}>
          {finalM ? (
            <KnockoutCard
              match={finalM}
              state={state}
              onOpenMatch={onOpenMatch}
              highlight
            />
          ) : null}
        </div>

        <div className={styles.bracketChampion}>
          <div className={styles.bracketChampionLabel}>{"// CAMPEÓN PREDICHO"}</div>
          {champion ? (
            <div className={styles.bracketChampionName}>{champion.name}</div>
          ) : (
            <div className={styles.bracketChampionPending}>—</div>
          )}
        </div>

        <div className={styles.thirdPlaceBlock}>
          <div className={styles.thirdPlaceLabel}>{"// 3er Puesto"}</div>
          {thirdM ? (
            <KnockoutCard
              match={thirdM}
              state={state}
              onOpenMatch={onOpenMatch}
              highlight={false}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ─────────── SINGLE ROUND LIST ───────────
   Usado para R32, R16, QF y SF. Renderiza header de fase + grid
   responsive con los partidos. La diferencia de QF y SF respecto a
   R32/R16 es el ancho mínimo del card (más generoso para fases altas). */

function SingleRoundList({
  state,
  phase,
  onOpenMatch,
}: {
  state: BracketState;
  phase: PhaseId;
  onOpenMatch: (id: string) => void;
}) {
  const matches = state.matches
    .filter((m) => m.phase === phase)
    .sort((a, b) => a.slotIdx - b.slotIdx);

  // Ancho mínimo creciente para fases más decisivas → cards más grandes.
  const minCard =
    phase === "SF" ? 320 : phase === "QF" ? 280 : 240;
  // Máximo de columnas: SF=2, QF=4, otros: auto
  const maxCols =
    phase === "SF" ? 2 : phase === "QF" ? 4 : undefined;

  return (
    <div className={styles.knockoutWrap}>
      <PhaseHeader phase={phase} />
      <div
        className={styles.roundGrid}
        style={{
          gridTemplateColumns: maxCols
            ? `repeat(auto-fit, minmax(${minCard}px, 1fr))`
            : `repeat(auto-fill, minmax(${minCard}px, 1fr))`,
          maxWidth:
            phase === "SF" ? 760 : phase === "QF" ? 1200 : 1200,
        }}
      >
        {matches.map((m) => (
          <KnockoutCard
            key={m.id}
            match={m}
            state={state}
            onOpenMatch={onOpenMatch}
            highlight={phase === "QF" || phase === "SF"}
          />
        ))}
      </div>
    </div>
  );
}

function KnockoutCard({
  match,
  state,
  onOpenMatch,
  highlight,
}: {
  match: BracketMatch;
  state: BracketState;
  onOpenMatch: (id: string) => void;
  highlight: boolean;
}) {
  const teamA: BracketTeam | null = match.a ? TEAM_BY_ID[match.a] : null;
  const teamB: BracketTeam | null = match.b ? TEAM_BY_ID[match.b] : null;
  const pick = state.picks[match.id];
  const ready = teamA !== null && teamB !== null;
  const winnerA = pick && teamA && pick.winner === teamA.id;
  const winnerB = pick && teamB && pick.winner === teamB.id;

  return (
    <button
      type="button"
      className={styles.koCard}
      data-picked={!!pick}
      data-highlight={highlight}
      onClick={() => onOpenMatch(match.id)}
      disabled={!ready}
      aria-label={
        ready ? `Predecir ${teamA!.name} vs ${teamB!.name}` : "Partido pendiente — fase anterior incompleta"
      }
    >
      <div className={styles.koCardSlot} data-empty={!teamA} data-winner={winnerA} data-loser={pick && !winnerA && pick.winner !== null}>
        <span className={styles.standingFlag}>
          {teamA && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={flagSrc(teamA.iso)} alt="" />
          )}
        </span>
        <span className={styles.koCardName}>{teamA ? teamA.name : "Por definir"}</span>
        <span className={styles.koCardGoals}>{pick ? pick.scoreA : ""}</span>
      </div>
      <div className={styles.koCardSlot} data-empty={!teamB} data-winner={winnerB} data-loser={pick && !winnerB && pick.winner !== null}>
        <span className={styles.standingFlag}>
          {teamB && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={flagSrc(teamB.iso)} alt="" />
          )}
        </span>
        <span className={styles.koCardName}>{teamB ? teamB.name : "Por definir"}</span>
        <span className={styles.koCardGoals}>{pick ? pick.scoreB : ""}</span>
      </div>
    </button>
  );
}
