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

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
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
  const [showTip, setShowTip] = useState(false);
  const { state, hydrated } = useBracketStore();
  const { name, ready: identityReady } = useCoachIdentity();

  // Dentro de la webapp hay barra inferior fija en móvil → subimos el launcher
  // para que no la tape ni compita con la navegación.
  const pathname = usePathname() || "";
  const inApp = pathname.startsWith("/app");

  // Tooltip inicial "IA Coach": aparece unos segundos al cargar y se va solo.
  useEffect(() => {
    const t1 = setTimeout(() => setShowTip(true), 900);
    const t2 = setTimeout(() => setShowTip(false), 6500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Apertura externa: cualquier parte de la app (p.ej. la card "IA Coach" del
  // lobby) abre el widget disparando en `window` el evento "zm:open-coach".
  // Opcional `detail.mode` para entrar directo en un modo (coach/oracle/…).
  useEffect(() => {
    const onOpen = (e: Event) => {
      const m = (e as CustomEvent<{ mode?: ModeId }>).detail?.mode;
      if (m) setMode(m);
      setShowTip(false);
      setOpen(true);
    };
    window.addEventListener("zm:open-coach", onOpen);
    return () => window.removeEventListener("zm:open-coach", onOpen);
  }, []);

  return (
    <>
      {/* ── Launcher flotante ── */}
      {!open && (
        <div
          className={inApp ? "zm-coach-launcher zm-coach-launcher--inapp" : "zm-coach-launcher"}
          style={{ position: "fixed", bottom: 22, right: 18, zIndex: 1200, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}
        >
          {showTip && (
            <span
              style={{
                background: BG2,
                color: GOLD2,
                border: `1px solid ${GOLD}44`,
                borderRadius: 10,
                padding: "6px 10px",
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: "nowrap",
                boxShadow: "0 8px 22px rgba(0,0,0,0.4)",
                marginRight: 4,
              }}
            >
              IA Coach
            </span>
          )}
          <button
            onClick={() => { setOpen(true); setShowTip(false); }}
            aria-label="Abrir IA Coach"
            title="IA Coach"
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              border: "none",
              cursor: "pointer",
              background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
              color: "#0C0F14",
              fontSize: 22,
              boxShadow: "0 6px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,168,76,0.28)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconRobot size={26} />
          </button>
          <style>{`
            @media(max-width:768px){
              .zm-coach-launcher--inapp{ bottom: calc(108px + env(safe-area-inset-bottom)) !important; }
            }
          `}</style>
        </div>
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

          {/* Cuerpo (scrollable). Los 3 paneles se mantienen MONTADOS y se ocultan
              con display:none al cambiar de modo, para no perder el chat del Debate
              ni la narración/interrogatorio del Oráculo al alternar pestañas. */}
          <div style={{ overflowY: "auto", padding: "4px 14px 16px", flex: 1 }}>
            {hydrated && (
              <>
                <div style={{ display: mode === "coach" ? "block" : "none" }}>
                  <BracketCoachPanel state={state} userName={name} />
                </div>
                <div style={{ display: mode === "oracle" ? "block" : "none" }}>
                  <OraclePanel state={state} />
                </div>
                <div style={{ display: mode === "debate" ? "block" : "none" }}>
                  <DebatePanel state={state} userName={name} />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
