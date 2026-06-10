// src/app/app/modo-carrera/jugar/GuideModal.tsx
// Guía "¿Cómo se juega?" del Modo Carrera. Aparece automáticamente la primera
// vez (la dispara CareerGame con un flag en localStorage) y queda accesible
// siempre desde el botón "Guía" de la cabecera. SVG-only, sin emojis.

"use client";

import { BG, BG2, BG3, GOLD, GOLD2, GREEN, MID, DIM } from "./fx";
import { useModalA11y } from "./useModalA11y";

function I(props: { children: React.ReactNode }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {props.children}
    </svg>
  );
}

type Step = { color: string; title: string; body: string; icon: React.ReactNode };

const STEPS: Step[] = [
  {
    color: GOLD2,
    title: "Eres el director técnico",
    body: "Tomas el banquillo de una selección y la llevas de un don nadie (overall 50) a leyenda. Tu carta estilo FIFA evoluciona con cada decisión: overall, rango y moral.",
    icon: <I><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4z" /></I>,
  },
  {
    color: GOLD,
    title: "Dos modalidades de temporada",
    body: "Modo Libre: un Mundial simulado que juegas a tu ritmo cuando quieras. Mundial en Vivo (Pase DT): tu carrera avanza al ritmo del Mundial real, con rivales y horarios reales; cada partido se desbloquea a la hora del saque.",
    icon: <I><path d="M8 2v4M16 2v4M3 10h18" /><rect x="3" y="4" width="18" height="17" rx="2" /></I>,
  },
  {
    color: "#ef4444",
    title: "Habilidades",
    body: "Subes de nivel y ganas puntos para tu árbol de habilidades (Ataque, Defensa, Mental y Gestión). Cada rama mejora cómo rinde tu equipo en los partidos.",
    icon: <I><path d="M12 2v6M12 22v-6M2 12h6M22 12h-6" /><circle cx="12" cy="12" r="3" /></I>,
  },
  {
    color: "#3b82f6",
    title: "Misiones",
    body: "Retos diarios, semanales y de torneo que te dan XP y reputación. La de entrenamiento se completa con un botón; el resto, jugando partidos. Reclama la recompensa al completarlas.",
    icon: <I><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></I>,
  },
  {
    color: "#a855f7",
    title: "Narrativa y decisiones",
    body: "Titulares de prensa, ruedas de prensa y dilemas que moldean tu historia y tu moral. Con Pase DT, la IA genera narrativa única para tu carrera.",
    icon: <I><path d="M4 4h16v16H4z" /><path d="M8 8h8M8 12h8M8 16h5" /></I>,
  },
  {
    color: GOLD2,
    title: "Reputación y Legado",
    body: "Tu prestigio crece con buenos resultados. En el Legado guardas la vitrina de trofeos y tus récords permanentes a lo largo de las temporadas.",
    icon: <I><path d="M6 4h12v3a6 6 0 0 1-12 0V4z" /><path d="M6 6H3v2a3 3 0 0 0 3 3M18 6h3v2a3 3 0 0 1-3 3M9 17h6M8 21h8M12 13v4" /></I>,
  },
];

export default function GuideModal({ onClose, onOpenFullGuide }: { onClose: () => void; onOpenFullGuide?: () => void }) {
  const dialogRef = useModalA11y<HTMLDivElement>(onClose);
  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        outline: "none",
        position: "fixed",
        inset: 0,
        zIndex: 95,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(6,11,20,0.9)",
        padding: 20,
        fontFamily: "'Outfit',sans-serif",
        animation: "mcGuideIn .25s ease both",
      }}
    >
      <style>{`@keyframes mcGuideIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 600,
          maxHeight: "88vh",
          overflowY: "auto",
          borderRadius: 20,
          background: BG2,
          border: `1px solid ${GOLD}44`,
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          padding: 26,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: GOLD }}>Cómo se juega</div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: "6px 0 8px" }}>Tu camino a la leyenda</h2>
          <p style={{ fontSize: 13.5, color: MID, lineHeight: 1.6, maxWidth: 460, margin: "0 auto" }}>
            Construye la historia de un DT desde cero. Esto es todo lo que puedes hacer en el Modo Carrera.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {STEPS.map((s) => (
            <div key={s.title} style={{ display: "flex", gap: 14, padding: 14, borderRadius: 14, background: BG3, border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ flexShrink: 0, width: 42, height: 42, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", background: `${s.color}1a`, color: s.color }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{s.title}</div>
                <div style={{ fontSize: 13, color: MID, lineHeight: 1.55, marginTop: 3 }}>{s.body}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 18, padding: 14, borderRadius: 14, background: "rgba(34,197,94,0.08)", border: `1px solid ${GREEN}33` }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: GREEN }}>Consejo</div>
          <div style={{ fontSize: 13, color: MID, lineHeight: 1.55, marginTop: 3 }}>
            Vuelve cada día: la racha y las misiones diarias te dan recompensas extra. Puedes reabrir esta guía
            cuando quieras desde el botón <strong style={{ color: GOLD2 }}>Guía</strong> de la cabecera.
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: 20,
            width: "100%",
            padding: "13px 24px",
            borderRadius: 12,
            border: "none",
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
            color: BG,
            fontWeight: 900,
            fontSize: 15,
            cursor: "pointer",
            boxShadow: "0 10px 30px rgba(201,168,76,0.32)",
          }}
        >
          Entendido, ¡a jugar!
        </button>

        {onOpenFullGuide && (
          <button
            type="button"
            onClick={onOpenFullGuide}
            style={{
              marginTop: 10,
              width: "100%",
              padding: "12px 24px",
              borderRadius: 12,
              border: `1px solid ${GOLD}55`,
              background: "transparent",
              color: GOLD2,
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Ver la guía completa (todas las reglas)
          </button>
        )}
      </div>
    </div>
  );
}
