// src/components/ia-coach/IACoachWidget.tsx
//
// IA Coach: módulo INDEPENDIENTE. Ventana flotante disponible en TODA la web
// (se monta una vez en el RootLayoutClient). NO tiene nada que ver con la IA por
// partido del bracket (esa vive en el MatchModal).
//
// Hospeda los modos autocontenidos del IA Coach:
//   - Entrenador Personal (analiza tu quiniela)
//   - Oráculo / Monte Carlo (simula el torneo)
//   - Debate / Reto IA vs Humanos (premium)
//
// La quiniela se lee de localStorage vía useBracketStore, así el coach conoce
// tu campeón y tus picks aunque no estés en la página del bracket.

"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useBracketStore } from "@/lib/bracket/useBracketStore";
import BracketCoachPanel from "@/components/bracket/BracketCoachPanel";
import OraclePanel from "@/components/bracket/OraclePanel";
import DebatePanel from "@/components/bracket/DebatePanel";
import { useCoachIdentity } from "./useCoachIdentity";
import { IconRobot, IconWhistle, IconCrystalBall, IconDebate } from "./icons";

// Paleta alineada con el resto de la web (dorado ZonaMundial).
const BG = "#0A0E15";
const BG2 = "#12161D";
const GOLD = "#C9A84C";
const GOLD2 = "#FDE68A";
const MID = "#C7CEDA";
const DIM = "#8A93A3";

type ModeId = "coach" | "oracle" | "debate";

const MODES: Array<{ id: ModeId; label: string; icon: ReactNode }> = [
  { id: "coach", label: "Entrenador", icon: <IconWhistle size={17} /> },
  { id: "oracle", label: "Oráculo", icon: <IconCrystalBall size={17} /> },
  { id: "debate", label: "Debate", icon: <IconDebate size={17} /> },
];

export default function IACoachWidget() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ModeId>("coach");
  const { state, hydrated } = useBracketStore();
  const { name, ready: identityReady } = useCoachIdentity();

  return (
    <>
      {/* ── Launcher flotante ── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir IA Coach"
          style={{
            position: "fixed",
            bottom: 22,
            right: 22,
            zIndex: 1200,
            width: 58,
            height: 58,
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
            color: "#0C0F14",
            fontSize: 26,
            boxShadow: "0 10px 30px rgba(0,0,0,0.45), 0 0 0 1px rgba(201,168,76,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconRobot size={28} />
        </button>
      )}

      {/* ── Ventana flotante ── */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 22,
            right: 22,
            zIndex: 1200,
            width: "min(400px, calc(100vw - 32px))",
            maxHeight: "min(82vh, 760px)",
            background: BG,
            border: `1px solid ${GOLD}44`,
            borderRadius: 18,
            boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Cabecera */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              borderBottom: `1px solid ${GOLD}22`,
              background: BG2,
              flexShrink: 0,
            }}
          >
            <span style={{ color: GOLD2, display: "inline-flex" }}>
              <IconRobot size={20} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, color: GOLD2, fontSize: 14 }}>IA Coach</div>
              <div style={{ color: DIM, fontSize: 11 }}>
                {identityReady && name
                  ? `Hola, ${name} · Mundial 2026`
                  : "Tu asistente del Mundial 2026"}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              style={{
                background: "transparent",
                border: "none",
                color: MID,
                cursor: "pointer",
                fontSize: 22,
                lineHeight: 1,
                padding: 4,
              }}
            >
              ×
            </button>
          </div>

          {/* Selector de modos */}
          <div
            style={{
              display: "flex",
              gap: 6,
              padding: "10px 12px",
              borderBottom: `1px solid ${GOLD}1A`,
              background: BG2,
              flexShrink: 0,
            }}
          >
            {MODES.map((m) => {
              const active = m.id === mode;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  style={{
                    flex: 1,
                    background: active ? GOLD : "transparent",
                    color: active ? "#0C0F14" : MID,
                    border: active ? "none" : `1px solid ${GOLD}33`,
                    borderRadius: 9,
                    padding: "7px 4px",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <span style={{ display: "inline-flex" }}>{m.icon}</span>
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Cuerpo (scrollable) */}
          <div style={{ overflowY: "auto", padding: "4px 14px 16px", flex: 1 }}>
            {hydrated && mode === "coach" && <BracketCoachPanel state={state} userName={name} />}
            {hydrated && mode === "oracle" && <OraclePanel state={state} />}
            {hydrated && mode === "debate" && <DebatePanel state={state} userName={name} />}
          </div>
        </div>
      )}
    </>
  );
}
