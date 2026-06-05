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
import type { CareerState } from "@/lib/modo-carrera/types";
import { fetchServerCareer, saveServerCareer } from "./api";
import { BG, GOLD, MID } from "./fx";
import OnboardingDT from "./OnboardingDT";
import HubView from "./HubView";

export default function CareerGame() {
  const [career, setCareer] = useState<CareerState | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const hydrated = useRef(false);

  // Carga inicial + sincronización con servidor.
  useEffect(() => {
    const local = loadCareer() ?? defaultCareer();
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
          setCareer(server);
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

  return (
    <div style={{ background: BG, minHeight: "100vh", color: "#fff", fontFamily: "'Outfit',sans-serif", padding: "32px 20px 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: "clamp(22px,3vw,30px)", fontWeight: 900 }}>Modo Carrera</h1>
        {authed === false && (
          <span style={{ fontSize: 12, color: GOLD, border: "1px solid rgba(201,168,76,0.4)", borderRadius: 999, padding: "6px 12px" }}>
            Inicia sesión para guardar tu carrera
          </span>
        )}
      </div>
      <HubView career={career} />
    </div>
  );
}
