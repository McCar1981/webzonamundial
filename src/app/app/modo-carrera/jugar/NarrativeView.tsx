// src/app/app/modo-carrera/jugar/NarrativeView.tsx
// Pilar 6 — Narrativa viva. Muestra el historial de entradas narrativas
// (titulares, briefings, ruedas de prensa) y resuelve las decisiones pendientes.
// La generación con IA (Claude) llega en F4; aquí se renderiza lo ya almacenado
// (p.ej. el titular de apertura sembrado por el onboarding). SVG-only.

"use client";

import { useState } from "react";
import { BG2, BG3, GOLD, GOLD2, MID, DIM } from "./fx";
import type { CareerState, NarrativeEntry, NarrativeKind } from "@/lib/modo-carrera/types";

const KIND_LABEL: Record<NarrativeEntry["kind"], string> = {
  briefing: "Briefing",
  titular: "Titular",
  rueda_prensa: "Rueda de prensa",
  evento: "Evento",
};

const GENERATE_BUTTONS: { kind: NarrativeKind; label: string }[] = [
  { kind: "briefing", label: "Briefing semanal" },
  { kind: "titular", label: "Titular de prensa" },
  { kind: "rueda_prensa", label: "Rueda de prensa" },
];

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function NarrativeView({
  career,
  onChoose,
  onGenerate,
}: {
  career: CareerState;
  onChoose: (entryId: string, choiceId: string) => void;
  onGenerate: (kind: NarrativeKind) => Promise<void>;
}) {
  const entries = [...career.narrative].reverse();
  const [busy, setBusy] = useState<NarrativeKind | null>(null);

  const generate = async (kind: NarrativeKind) => {
    if (busy) return;
    setBusy(kind);
    try {
      await onGenerate(kind);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <style>{`
        @keyframes mcDots { 0%,80%,100%{opacity:.2} 40%{opacity:1} }
        .mc-dot { animation: mcDots 1.2s infinite both; }
      `}</style>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>Narrativa</h2>
        <p style={{ fontSize: 13, color: MID, marginTop: 4 }}>
          La historia de tu carrera: titulares, briefings y ruedas de prensa.
        </p>
      </div>

      {/* Barra de generación (IA con respaldo de plantillas) */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
        {GENERATE_BUTTONS.map((b) => {
          const isBusy = busy === b.kind;
          return (
            <button
              key={b.kind}
              type="button"
              disabled={!!busy}
              onClick={() => generate(b.kind)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                borderRadius: 10,
                border: `1px solid ${isBusy ? GOLD : "rgba(255,255,255,0.12)"}`,
                background: isBusy ? "rgba(201,168,76,0.14)" : BG2,
                color: busy && !isBusy ? DIM : isBusy ? GOLD2 : "#fff",
                fontSize: 13.5,
                fontWeight: 700,
                cursor: busy ? "default" : "pointer",
                opacity: busy && !isBusy ? 0.5 : 1,
              }}
            >
              {isBusy ? (
                <>
                  El periodista escribe
                  <span className="mc-dot">.</span>
                  <span className="mc-dot" style={{ animationDelay: ".2s" }}>.</span>
                  <span className="mc-dot" style={{ animationDelay: ".4s" }}>.</span>
                </>
              ) : (
                b.label
              )}
            </button>
          );
        })}
      </div>

      {entries.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center", borderRadius: 14, background: BG2, border: "1px dashed rgba(255,255,255,0.08)" }}>
          <div style={{ color: MID, fontWeight: 700 }}>Tu historia empieza ahora</div>
          <div style={{ color: DIM, fontSize: 13, marginTop: 6 }}>Los titulares y ruedas de prensa aparecerán según avances.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {entries.map((e) => {
            const pending = e.choices && e.choices.length > 0 && !e.chosen;
            return (
              <article key={e.id} style={{ padding: 18, borderRadius: 14, background: BG2, border: `1px solid ${pending ? GOLD : "rgba(255,255,255,0.06)"}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: GOLD, border: `1px solid ${GOLD}55`, borderRadius: 999, padding: "2px 8px" }}>
                    {KIND_LABEL[e.kind]}
                  </span>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: DIM }}>{fmtDate(e.createdAt)}</span>
                </div>
                <p style={{ fontSize: 15, color: "#fff", lineHeight: 1.6, fontWeight: e.kind === "titular" ? 800 : 500 }}>{e.body}</p>

                {e.choices && e.choices.length > 0 && (
                  <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                    {e.choices.map((ch) => {
                      const chosen = e.chosen === ch.id;
                      const dimmed = !!e.chosen && !chosen;
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          disabled={!!e.chosen}
                          onClick={() => onChoose(e.id, ch.id)}
                          style={{
                            textAlign: "left",
                            padding: "10px 14px",
                            borderRadius: 10,
                            background: chosen ? "rgba(201,168,76,0.16)" : BG3,
                            border: `1px solid ${chosen ? GOLD : "rgba(255,255,255,0.08)"}`,
                            color: chosen ? GOLD2 : dimmed ? DIM : "#fff",
                            opacity: dimmed ? 0.5 : 1,
                            cursor: e.chosen ? "default" : "pointer",
                            fontSize: 13.5,
                            fontWeight: 600,
                          }}
                        >
                          {ch.label}
                          {chosen && <span style={{ display: "block", fontSize: 11, color: MID, marginTop: 3 }}>{ch.effect}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

    </div>
  );
}
