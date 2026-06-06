// src/app/app/modo-carrera/jugar/CareerGame.tsx
// Orquestador cliente del Modo Carrera. Igual que FantasyGame:
//   - Carga la partida de localStorage (modo invitado).
//   - Si hay sesión, sincroniza con Supabase (/api/modo-carrera/save):
//       · si el servidor tiene partida, la adopta;
//       · si no, sube la local (migración invitado → cuenta).
//   - Autoguarda en localStorage y, si hay sesión, en el servidor.
// Muestra el Onboarding (Pilar 1) hasta que el DT está creado; luego el Hub.

"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { defaultCareer, loadCareer, saveCareer, isCareerStarted } from "@/lib/modo-carrera/store";
import type { CareerState, CareerTab, SkillBranch, NarrativeKind, Trophy } from "@/lib/modo-carrera/types";
import { unlockSkill, applyDecision } from "@/lib/modo-carrera/engine";
import { beginSeason, resolveMatch, startNextSeason, type PlayResult } from "@/lib/modo-carrera/season";
import { beginLiveSeason, hasLiveFixtures } from "@/lib/modo-carrera/live-season";
import { ensureMissions, advanceMission, claimMission } from "@/lib/modo-carrera/missions";
import { claimStreak } from "@/lib/modo-carrera/streak";
import { templateEntry, type NarrativeContext } from "@/lib/modo-carrera/narrative";
import { PHILOSOPHIES } from "@/lib/modo-carrera/constants";
import { SELECCIONES } from "@/data/selecciones";
import { fetchServerCareer, saveServerCareer, requestNarrative, fetchEntitlement } from "./api";
import { BG, BG2, GOLD, GOLD2, MID } from "./fx";
import OnboardingDT from "./OnboardingDT";
import HubView from "./HubView";
import SeasonView from "./SeasonView";
import LevelUpOverlay from "./LevelUpOverlay";
import TrophyReveal from "./TrophyReveal";
import SkillTreeView from "./SkillTreeView";
import MissionsView from "./MissionsView";
import ReputationView from "./ReputationView";
import NarrativeView from "./NarrativeView";
import LegacyView from "./LegacyView";
import RankingView from "./RankingView";
import GuideModal from "./GuideModal";

const GUIDE_SEEN_KEY = "zm_mc_guide_seen";

const TABS: { id: CareerTab; label: string }[] = [
  { id: "hub", label: "Hub" },
  { id: "temporada", label: "Temporada" },
  { id: "habilidades", label: "Habilidades" },
  { id: "misiones", label: "Misiones" },
  { id: "reputacion", label: "Reputación" },
  { id: "narrativa", label: "Narrativa" },
  { id: "legado", label: "Legado" },
  { id: "ranking", label: "Ranking" },
];

export default function CareerGame() {
  const [career, setCareer] = useState<CareerState | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [paseDT, setPaseDT] = useState(false);
  const [tab, setTab] = useState<CareerTab>("hub");
  const [levelUp, setLevelUp] = useState<{ overall: number; levels: number } | null>(null);
  const [trophyReveal, setTrophyReveal] = useState<Trophy | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [narrativeQuota, setNarrativeQuota] = useState<{ remaining: number | null; exceeded: boolean }>({ remaining: null, exceeded: false });
  const hydrated = useRef(false);
  const prevOverall = useRef<number | null>(null);
  const prevTrophies = useRef<number | null>(null);

  // Carga inicial + sincronización con servidor.
  useEffect(() => {
    const local = ensureMissions(loadCareer() ?? defaultCareer());
    setCareer(local);

    (async () => {
      try {
        const supa = createSupabaseBrowserClient();
        const { data } = await supa.auth.getUser();
        if (!data.user) {
          setAuthed(false);
          return;
        }
        setAuthed(true);
        void fetchEntitlement().then((e) => setPaseDT(e.paseDT));
        const server = await fetchServerCareer();
        if (server) {
          setCareer(ensureMissions(server));
        } else if (isCareerStarted(local)) {
          // Migra la partida de invitado a la cuenta.
          await saveServerCareer(local);
        }
      } catch {
        setAuthed(false);
      } finally {
        hydrated.current = true;
      }
    })();
  }, []);

  // Autoguardado (local + servidor si hay sesión).
  useEffect(() => {
    if (!career || !hydrated.current) return;
    saveCareer(career);
    if (authed) void saveServerCareer(career);
  }, [career, authed]);

  // Celebración de subida de nivel: dispara el overlay cuando crece el overall.
  useEffect(() => {
    const cur = career?.progression.overall;
    if (typeof cur !== "number") return;
    if (prevOverall.current !== null && hydrated.current && cur > prevOverall.current) {
      setLevelUp({ overall: cur, levels: cur - prevOverall.current });
    }
    prevOverall.current = cur;
  }, [career?.progression.overall]);

  // Reveal de trofeo a pantalla completa al GANAR uno nuevo, estés en la pestaña
  // que estés (momento de máxima euforia → upsell del Pase DT en TrophyReveal).
  useEffect(() => {
    const trophies = career?.legacy.trophies;
    if (!trophies) return;
    if (prevTrophies.current !== null && hydrated.current && trophies.length > prevTrophies.current) {
      setTrophyReveal(trophies[trophies.length - 1]);
    }
    prevTrophies.current = trophies.length;
  }, [career?.legacy.trophies]);

  // Guía automática la primera vez que el DT ya está creado (tras el onboarding).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!career || !isCareerStarted(career) || !career.identity.createdAt) return;
    if (localStorage.getItem(GUIDE_SEEN_KEY)) return;
    localStorage.setItem(GUIDE_SEEN_KEY, "1");
    setShowGuide(true);
  }, [career]);

  if (!career) {
    return (
      <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: MID, fontFamily: "'Outfit',sans-serif" }}>
        <span>Cargando tu carrera…</span>
      </div>
    );
  }

  if (!isCareerStarted(career) || !career.identity.createdAt) {
    return (
      <OnboardingDT
        career={career}
        onChange={setCareer}
        onFinish={() => {
          // createdAt lo marca el propio wizard; forzamos hidratación para guardar.
          hydrated.current = true;
          setCareer((c) => (c ? { ...c, updatedAt: new Date().toISOString() } : c));
        }}
      />
    );
  }

  // ─── Handlers de juego (mutaciones inmutables del estado) ──────────────────
  const handleUnlock = (branch: SkillBranch) =>
    setCareer((c) => (c ? unlockSkill(c, branch) : c));
  const handleAdvance = (id: string) =>
    setCareer((c) => (c ? advanceMission(c, id) : c));
  const handleClaim = (id: string) =>
    setCareer((c) => (c ? claimMission(c, id).state : c));
  const handleClaimStreak = () =>
    setCareer((c) => (c ? claimStreak(c).state : c));
  // Motor de temporada.
  const handleStartSeason = () =>
    setCareer((c) => (c ? beginSeason(c) : c));
  const handleStartLiveSeason = () =>
    setCareer((c) => (c ? beginLiveSeason(c) ?? beginSeason(c) : c));
  const handleNextSeason = () =>
    setCareer((c) => (c ? startNextSeason(c) : c));
  const handleResolveMatch = (gf: number, ga: number, wasBehind?: boolean): PlayResult | null => {
    if (!career) return null;
    const res = resolveMatch(career, gf, ga, { wasBehind });
    if (res.match) setCareer(res.career);
    return res;
  };
  const handleChoose = (entryId: string, choiceId: string) =>
    setCareer((c) => (c ? applyDecision(c, entryId, choiceId) : c));

  // Genera una entrada de narrativa (IA en el servidor; si falla, plantilla local).
  const handleGenerate = async (kind: NarrativeKind) => {
    if (!career) return;
    const ctx: NarrativeContext = {
      dtName: career.identity.name.trim() || "El nuevo DT",
      philosophyName: PHILOSOPHIES.find((p) => p.id === career.identity.philosophy)?.name ?? "su estilo",
      nationName: SELECCIONES.find((s) => s.slug === career.identity.nationSlug)?.nombre ?? "su selección",
      overall: career.progression.overall,
      season: career.progression.season,
      morale: career.progression.morale,
      reputationTotal: career.reputation.total,
    };
    const res = await requestNarrative(kind, ctx);
    const entry = res.entry ?? templateEntry(kind, ctx);
    setNarrativeQuota({ remaining: res.remaining, exceeded: res.exceeded });
    setCareer((c) => (c ? { ...c, narrative: [entry, ...c.narrative], updatedAt: new Date().toISOString() } : c));
  };

  return (
    <div style={{ position: "relative", background: BG, minHeight: "100vh", color: "#fff", fontFamily: "'Outfit',sans-serif", padding: "32px 20px 80px" }}>
      {/* Fondo de marca: cancha + escudo ZonaMundial, muy sutil tras la interfaz. */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          backgroundImage:
            "linear-gradient(rgba(6,11,20,0.84), rgba(6,11,20,0.93)), url('/img/modo-carrera/hub-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      />
      {levelUp && <LevelUpOverlay overall={levelUp.overall} levels={levelUp.levels} onClose={() => setLevelUp(null)} />}
      {trophyReveal && <TrophyReveal trophy={trophyReveal} paseDT={paseDT} onClose={() => setTrophyReveal(null)} />}
      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: "clamp(22px,3vw,30px)", fontWeight: 900 }}>Modo Carrera</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {authed === false && (
            <span style={{ fontSize: 12, color: GOLD, border: "1px solid rgba(201,168,76,0.4)", borderRadius: 999, padding: "6px 12px" }}>
              Inicia sesión para guardar tu carrera
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowGuide(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              fontSize: 13,
              fontWeight: 800,
              color: GOLD2,
              background: BG2,
              border: "1px solid rgba(201,168,76,0.4)",
              borderRadius: 999,
              padding: "6px 14px",
              cursor: "pointer",
            }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
            Guía
          </button>
        </div>
      </div>

      {/* Contenido por encima del fondo de marca */}
      <div style={{ position: "relative", zIndex: 1 }}>
      {/* Navegación por pestañas */}
      <nav
        style={{
          maxWidth: 1100,
          margin: "0 auto 28px",
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          paddingBottom: 12,
        }}
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                border: `1px solid ${active ? GOLD : "rgba(255,255,255,0.1)"}`,
                background: active ? "rgba(201,168,76,0.14)" : BG2,
                color: active ? GOLD2 : MID,
                fontSize: 13.5,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </nav>

      {tab === "hub" && <HubView career={career} paseDT={paseDT} onClaimStreak={handleClaimStreak} />}
      {tab === "temporada" && (
        <SeasonView
          career={career}
          paseDT={paseDT}
          canLive={hasLiveFixtures(career.identity.nationSlug)}
          onStart={handleStartSeason}
          onStartLive={handleStartLiveSeason}
          onResolveMatch={handleResolveMatch}
          onNextSeason={handleNextSeason}
        />
      )}
      {tab === "habilidades" && <SkillTreeView career={career} onUnlock={handleUnlock} />}
      {tab === "misiones" && <MissionsView career={career} onAdvance={handleAdvance} onClaim={handleClaim} />}
      {tab === "reputacion" && <ReputationView career={career} />}
      {tab === "narrativa" && (
        <NarrativeView
          career={career}
          paseDT={paseDT}
          remaining={narrativeQuota.remaining}
          exceeded={narrativeQuota.exceeded}
          onChoose={handleChoose}
          onGenerate={handleGenerate}
        />
      )}
      {tab === "legado" && <LegacyView career={career} paseDT={paseDT} />}
      {tab === "ranking" && <RankingView />}
      </div>
    </div>
  );
}
