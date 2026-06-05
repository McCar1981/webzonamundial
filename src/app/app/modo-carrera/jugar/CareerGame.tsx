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
import type { CareerState, CareerTab, SkillBranch } from "@/lib/modo-carrera/types";
import { unlockSkill } from "@/lib/modo-carrera/engine";
import { ensureMissions, advanceMission, claimMission } from "@/lib/modo-carrera/missions";
import { fetchServerCareer, saveServerCareer } from "./api";
import { BG, BG2, GOLD, GOLD2, MID } from "./fx";
import OnboardingDT from "./OnboardingDT";
import HubView from "./HubView";
import SkillTreeView from "./SkillTreeView";
import MissionsView from "./MissionsView";
import ReputationView from "./ReputationView";
import NarrativeView from "./NarrativeView";
import LegacyView from "./LegacyView";

const TABS: { id: CareerTab; label: string }[] = [
  { id: "hub", label: "Hub" },
  { id: "habilidades", label: "Habilidades" },
  { id: "misiones", label: "Misiones" },
  { id: "reputacion", label: "Reputación" },
  { id: "narrativa", label: "Narrativa" },
  { id: "legado", label: "Legado" },
];

export default function CareerGame() {
  const [career, setCareer] = useState<CareerState | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<CareerTab>("hub");
  const hydrated = useRef(false);

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
  const handleChoose = (entryId: string, choiceId: string) =>
    setCareer((c) =>
      c
        ? {
            ...c,
            narrative: c.narrative.map((e) =>
              e.id === entryId && !e.chosen ? { ...e, chosen: choiceId } : e,
            ),
            updatedAt: new Date().toISOString(),
          }
        : c,
    );

  return (
    <div style={{ background: BG, minHeight: "100vh", color: "#fff", fontFamily: "'Outfit',sans-serif", padding: "32px 20px 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: "clamp(22px,3vw,30px)", fontWeight: 900 }}>Modo Carrera</h1>
        {authed === false && (
          <span style={{ fontSize: 12, color: GOLD, border: "1px solid rgba(201,168,76,0.4)", borderRadius: 999, padding: "6px 12px" }}>
            Inicia sesión para guardar tu carrera
          </span>
        )}
      </div>

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

      {tab === "hub" && <HubView career={career} />}
      {tab === "habilidades" && <SkillTreeView career={career} onUnlock={handleUnlock} />}
      {tab === "misiones" && <MissionsView career={career} onAdvance={handleAdvance} onClaim={handleClaim} />}
      {tab === "reputacion" && <ReputationView career={career} />}
      {tab === "narrativa" && <NarrativeView career={career} onChoose={handleChoose} />}
      {tab === "legado" && <LegacyView career={career} />}
    </div>
  );
}
