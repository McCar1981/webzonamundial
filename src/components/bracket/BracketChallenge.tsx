// src/components/bracket/BracketChallenge.tsx
// Componente principal que orquesta HUD + vista (clásica/cósmica) + modal + overlays.

"use client";

import { useEffect, useRef, useState } from "react";
import { useBracketStore } from "@/lib/bracket/useBracketStore";
import { PHASES, type BracketMatch } from "@/lib/bracket/types";
import BracketHUD, { type BracketView } from "./BracketHUD";
import MatchModal from "./MatchModal";
import ClassicBracket from "./ClassicBracket";
import CosmicBracket from "./CosmicBracket";
import CosmosBackground from "./CosmosBackground";
import PhaseCompleteOverlay from "./PhaseCompleteOverlay";
import CelebrationOverlay from "./CelebrationOverlay";
import ViewErrorBoundary from "./ViewErrorBoundary";
import styles from "./bracket.module.css";

const VIEW_KEY = "zm:bracket:view";

function loadView(): BracketView {
  if (typeof window === "undefined") return "classic";
  const v = window.localStorage.getItem(VIEW_KEY);
  return v === "cosmic" ? "cosmic" : "classic";
}

export default function BracketChallenge() {
  const { state, pick, undo, reset, canUndo, hydrated } = useBracketStore();
  const [view, setView] = useState<BracketView>("classic");
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [phaseToast, setPhaseToast] = useState<{ title: string; sub: string } | null>(null);
  const [celebShown, setCelebShown] = useState(false);
  const [celebDismissed, setCelebDismissed] = useState(false);

  // Track previous phase index to detect phase completions
  const prevPhaseIdxRef = useRef<number>(0);
  const prevChampionRef = useRef<string | null>(null);

  // Hidratar preferencia de vista (sólo una vez al montar)
  const viewLoadedRef = useRef(false);
  useEffect(() => {
    if (viewLoadedRef.current) return;
    viewLoadedRef.current = true;
    const stored = loadView();
    if (stored !== view) setView(stored);
  }, [view]);
  // Persistir cuando el usuario cambia la vista (post-hidratación)
  useEffect(() => {
    if (!viewLoadedRef.current) return;
    if (typeof window === "undefined") return;
    window.localStorage.setItem(VIEW_KEY, view);
  }, [view]);

  // Detect phase complete + celebration triggers
  useEffect(() => {
    if (!hydrated) {
      prevPhaseIdxRef.current = state.currentPhaseIdx;
      prevChampionRef.current = state.champion;
      return;
    }
    const prev = prevPhaseIdxRef.current;
    if (state.currentPhaseIdx > prev) {
      const completedPhase = PHASES[prev];
      const nextPhase = PHASES[state.currentPhaseIdx];
      if (completedPhase) {
        setPhaseToast({
          title: completedPhase.name,
          sub: nextPhase ? `Avance a ${nextPhase.name}` : "Mundial completo",
        });
      }
    }
    prevPhaseIdxRef.current = state.currentPhaseIdx;

    // Champion just got predicted
    if (state.champion && state.champion !== prevChampionRef.current && !celebDismissed) {
      setCelebShown(true);
    }
    if (!state.champion) {
      setCelebShown(false);
      setCelebDismissed(false);
    }
    prevChampionRef.current = state.champion;
  }, [state.currentPhaseIdx, state.champion, hydrated, celebDismissed]);

  const activeMatch: BracketMatch | null = activeMatchId
    ? state.matches.find((m) => m.id === activeMatchId) ?? null
    : null;
  const initialPick = activeMatchId ? state.picks[activeMatchId] : undefined;

  const handleConfirm = (data: { winner: string | null; scoreA: number; scoreB: number }) => {
    if (!activeMatchId) return;
    pick(activeMatchId, data);
    setActiveMatchId(null);
  };

  const handleShare = () => {
    // Placeholder hasta C2 (KV + share). Por ahora copia URL al clipboard.
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: "Mi Bracket Mundial 2026",
          text: state.champion
            ? `Predigo que ${state.champion} gana el Mundial 2026.`
            : "Construyendo mi bracket del Mundial 2026 en zonamundial.app",
          url: typeof window !== "undefined" ? window.location.href : "https://zonamundial.app/bracket",
        })
        .catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard
        .writeText(typeof window !== "undefined" ? window.location.href : "https://zonamundial.app/bracket")
        .then(() => alert("Link copiado al portapapeles"));
    }
  };

  const handleReset = () => {
    reset();
    setCelebShown(false);
    setCelebDismissed(false);
    prevPhaseIdxRef.current = 0;
    prevChampionRef.current = null;
  };

  return (
    <div className={styles.scope}>
      {view === "cosmic" && <CosmosBackground />}

      <div style={{ position: "relative", zIndex: 10 }}>
        <BracketHUD
          state={state}
          view={view}
          onViewChange={setView}
          canUndo={canUndo}
          onUndo={undo}
          onReset={handleReset}
        />

        <ViewErrorBoundary viewName={view}>
          {view === "classic" ? (
            <ClassicBracket key="classic" state={state} onOpenMatch={setActiveMatchId} />
          ) : (
            <CosmicBracket key="cosmic" state={state} onOpenMatch={setActiveMatchId} />
          )}
        </ViewErrorBoundary>
      </div>

      <MatchModal
        match={activeMatch}
        initialPick={initialPick ? { winner: initialPick.winner, scoreA: initialPick.scoreA, scoreB: initialPick.scoreB } : null}
        onClose={() => setActiveMatchId(null)}
        onConfirm={handleConfirm}
      />

      <PhaseCompleteOverlay trigger={phaseToast} onClear={() => setPhaseToast(null)} />

      <CelebrationOverlay
        state={state}
        show={celebShown}
        onEdit={() => {
          setCelebShown(false);
          setCelebDismissed(true);
        }}
        onShare={handleShare}
      />
    </div>
  );
}
