"use client";

// Onboarding de bienvenida (primera visita). Explica en pocos pasos el objetivo,
// lo que diferencia a este Fantasy (Modo Underdog, power-ups, BPS) y ofrece
// arrancar con Auto-draft IA o construir el equipo manualmente.

import { useState } from "react";
import { BG, BG2, BG3, GOLD, GOLD2, MID, DIM } from "./fx";

interface Props {
  onClose: () => void;
  onAutoDraft: () => void;
}

interface Step { icon: string; title: string; body: React.ReactNode }

const STEPS: Step[] = [
  {
    icon: "🏆",
    title: "Bienvenido al Fantasy Mundial",
    body: (
      <>Monta tu selección con <b>jugadores reales</b> del Mundial 2026. Tienes <b>€100M</b> para fichar <b>15 jugadores</b> (11 titulares + 4 suplentes), máximo 3 por país, y compites durante <b>7 jornadas</b>.</>
    ),
  },
  {
    icon: "💎",
    title: "Modo Underdog: el giro táctico",
    body: (
      <>Cuanto mayor es la diferencia con el rival, más multiplica tu jugador: <b>Bronce ×1.25</b>, <b>Oro ×1.5</b>, <b>Diamante ×2</b>. Suma <b>power-ups</b> (Tridente, Muro, Joker…) y <b>puntos de bonificación (BPS)</b> para los mejores de cada partido. Pon bien tu <b>capitán</b> (×2) y exprime los multiplicadores.</>
    ),
  },
  {
    icon: "🤖",
    title: "Tu Coach IA y el mercado",
    body: (
      <>El <b>Coach IA</b> te sugiere capitán, detecta oportunidades «Diamante» y arma un once válido. En el <b>Mercado</b> verás probabilidad de titularidad, estado físico, tendencia de precio y la ruta proyectada de cada selección. ¿Empezamos?</>
    ),
  },
];

export default function Onboarding({ onClose, onAutoDraft }: Props) {
  const [i, setI] = useState(0);
  const last = i === STEPS.length - 1;
  const s = STEPS[i];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 440, background: BG, border: `1px solid ${GOLD}55`, borderRadius: 20, boxShadow: "0 24px 70px rgba(0,0,0,0.65)", overflow: "hidden" }}>
        <div style={{ background: `linear-gradient(135deg,${GOLD}22,transparent)`, padding: "22px 22px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 46, lineHeight: 1 }}>{s.icon}</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: GOLD2, marginTop: 10 }}>{s.title}</div>
        </div>
        <div style={{ padding: "4px 24px 18px", fontSize: 14, lineHeight: 1.6, color: "#dfe6f2", textAlign: "center" }}>{s.body}</div>

        {/* Puntos de progreso */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 16 }}>
          {STEPS.map((_, k) => (
            <span key={k} style={{ width: k === i ? 22 : 8, height: 8, borderRadius: 4, background: k === i ? GOLD2 : "rgba(255,255,255,0.2)", transition: "all .2s" }} />
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, padding: "0 22px 22px" }}>
          {i > 0 && (
            <button onClick={() => setI(i - 1)} style={{ padding: "11px 16px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.15)", background: BG2, color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>Atrás</button>
          )}
          <div style={{ flex: 1 }} />
          {!last ? (
            <>
              <button onClick={onClose} style={{ padding: "11px 16px", borderRadius: 11, border: "none", background: "transparent", color: DIM, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Saltar</button>
              <button onClick={() => setI(i + 1)} style={{ padding: "11px 20px", borderRadius: 11, border: "none", background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: BG, fontWeight: 800, fontSize: 14, cursor: "pointer" }}>Siguiente</button>
            </>
          ) : (
            <>
              <button onClick={onClose} style={{ padding: "11px 16px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.15)", background: BG3, color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>✏️ Construir yo</button>
              <button onClick={() => { onAutoDraft(); onClose(); }} style={{ padding: "11px 18px", borderRadius: 11, border: "none", background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: BG, fontWeight: 800, fontSize: 14, cursor: "pointer" }}>🤖 Auto-draft IA</button>
            </>
          )}
        </div>
        <div style={{ fontSize: 10, color: DIM, textAlign: "center", padding: "0 16px 16px" }}>
          <span style={{ color: MID }}>Paso {i + 1} de {STEPS.length}</span>
        </div>
      </div>
    </div>
  );
}
