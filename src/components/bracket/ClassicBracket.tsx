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
  // Para QF, SF y FINAL preferimos mostrar el mirror (todas las rondas hasta esa).
  // Para R32 / R16 mostramos solo esa ronda en columnas.
  const showMirror = phase === "QF" || phase === "SF" || phase === "FINAL";

  if (showMirror) return <ChampionsMirror state={state} highlight={phase as PhaseId} onOpenMatch={onOpenMatch} />;
  return <SingleRoundList state={state} phase={phase as PhaseId} onOpenMatch={onOpenMatch} />;
}

function ChampionsMirror({
  state,
  highlight,
  onOpenMatch,
}: {
  state: BracketState;
  highlight: PhaseId;
  onOpenMatch: (id: string) => void;
}) {
  const qfL = state.matches.filter((m) => m.phase === "QF" && m.slotIdx < 2).sort((a, b) => a.slotIdx - b.slotIdx);
  const qfR = state.matches.filter((m) => m.phase === "QF" && m.slotIdx >= 2).sort((a, b) => a.slotIdx - b.slotIdx);
  const sfL = state.matches.find((m) => m.phase === "SF" && m.slotIdx === 0);
  const sfR = state.matches.find((m) => m.phase === "SF" && m.slotIdx === 1);
  const finalM = state.matches.find((m) => m.phase === "FINAL");
  const thirdM = state.matches.find((m) => m.phase === "THIRD");

  const championId = state.champion;
  const champion = championId ? TEAM_BY_ID[championId] : null;

  return (
    <div className={styles.knockoutWrap}>
      <div className={styles.knockoutGrid}>
        <div className={styles.bracketColumn}>
          <div className={styles.bracketColumnHead}>// CUARTOS</div>
          {qfL.map((m) => (
            <KnockoutCard key={m.id} match={m} state={state} onOpenMatch={onOpenMatch} highlight={highlight === "QF"} />
          ))}
          <div className={styles.bracketColumnHead}>// SEMIS</div>
          {sfL && <KnockoutCard match={sfL} state={state} onOpenMatch={onOpenMatch} highlight={highlight === "SF"} />}
        </div>

        <div className={styles.bracketCenter}>
          <div className={styles.bracketColumnHead}>// FINAL</div>
          {finalM && <KnockoutCard match={finalM} state={state} onOpenMatch={onOpenMatch} highlight={highlight === "FINAL"} />}
          <div className={styles.bracketTrophy} aria-hidden>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
              <path d="M5 4H3v3a3 3 0 0 0 3 3M19 4h2v3a3 3 0 0 1-3 3" />
            </svg>
          </div>
          <div className={styles.bracketChampion}>
            <div className={styles.bracketChampionLabel}>// CAMPEÓN PREDICHO</div>
            {champion ? (
              <div className={styles.bracketChampionName}>{champion.name}</div>
            ) : (
              <div className={styles.bracketChampionPending}>—</div>
            )}
          </div>
          <div className={styles.bracketColumnHead} style={{ marginTop: 8 }}>
            // 3ER PUESTO
          </div>
          {thirdM && <KnockoutCard match={thirdM} state={state} onOpenMatch={onOpenMatch} highlight={false} />}
        </div>

        <div className={styles.bracketColumn}>
          <div className={styles.bracketColumnHead}>// CUARTOS</div>
          {qfR.map((m) => (
            <KnockoutCard key={m.id} match={m} state={state} onOpenMatch={onOpenMatch} highlight={highlight === "QF"} />
          ))}
          <div className={styles.bracketColumnHead}>// SEMIS</div>
          {sfR && <KnockoutCard match={sfR} state={state} onOpenMatch={onOpenMatch} highlight={highlight === "SF"} />}
        </div>
      </div>
    </div>
  );
}

function SingleRoundList({
  state,
  phase,
  onOpenMatch,
}: {
  state: BracketState;
  phase: PhaseId;
  onOpenMatch: (id: string) => void;
}) {
  const matches = state.matches.filter((m) => m.phase === phase).sort((a, b) => a.slotIdx - b.slotIdx);
  const phaseLabel = PHASES.find((p) => p.id === phase)?.short ?? "RONDA";

  return (
    <div className={styles.knockoutWrap}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 14,
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <div className={styles.bracketColumnHead} style={{ gridColumn: "1 / -1", fontSize: 11, marginBottom: 6 }}>
          // {phaseLabel}
        </div>
        {matches.map((m) => (
          <KnockoutCard key={m.id} match={m} state={state} onOpenMatch={onOpenMatch} highlight={false} />
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
