// src/app/app/modo-carrera/jugar/NarrativeView.tsx
// Pilar 6 — Narrativa viva. Muestra el historial de entradas narrativas
// (titulares, briefings, ruedas de prensa) y resuelve las decisiones pendientes.
// La generación con IA (Claude) está gateada por cupo diario / Pase DT; al agotarse
// se cae a plantillas. Los titulares se imprimen sobre textura de periódico.

"use client";

import { useState } from "react";
import Link from "next/link";
import { BG2, BG3, GOLD, GOLD2, MID, DIM } from "./fx";
import { CoinIcon, InjuryIcon, TransferIcon } from "./icons";
import type { CareerState, NarrativeEntry, NarrativeKind } from "@/lib/modo-carrera/types";
import { CAREER_NARRATIVE_REFILL } from "@/lib/economy/spend";

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

// Los eventos no llevan subtipo en los datos; elegimos el icono por palabras
// clave del cuerpo (lesión / oferta-fichaje). Sin coincidencia → sin icono.
// SVG inline (antes eran webp pintados de blanco con filter, contra la regla
// de iconos SVG del proyecto).
function eventIcon(body: string): React.ReactNode {
  const t = body.toLowerCase();
  if (/lesi[óo]n|lesionad|baja|recae/.test(t)) return <InjuryIcon size={20} />;
  if (/oferta|fichaj|fichar|traspaso|interes/.test(t)) return <TransferIcon size={20} />;
  return null;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function NarrativeView({
  career,
  paseDT = false,
  remaining = null,
  exceeded = false,
  onChoose,
  onGenerate,
  onRefill,
}: {
  career: CareerState;
  paseDT?: boolean;
  remaining?: number | null;
  exceeded?: boolean;
  onChoose: (entryId: string, choiceId: string) => void;
  onGenerate: (kind: NarrativeKind) => Promise<void>;
  /** Compra una recarga de cupo IA con Fútcoins. Ausente si no hay sesión. */
  onRefill?: () => Promise<{ ok: boolean; error?: string }>;
}) {
  const entries = [...career.narrative].reverse();
  const [busy, setBusy] = useState<NarrativeKind | null>(null);
  const [refilling, setRefilling] = useState(false);
  const [refillErr, setRefillErr] = useState<string | null>(null);

  const refill = async () => {
    if (!onRefill || refilling) return;
    setRefilling(true);
    setRefillErr(null);
    try {
      const res = await onRefill();
      if (!res.ok) {
        setRefillErr(
          res.error === "insufficient_coins"
            ? "No te alcanzan las Fútcoins."
            : "No se pudo recargar. Inténtalo de nuevo.",
        );
      }
    } finally {
      setRefilling(false);
    }
  };

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
        .mc-prensa-head {
          background-image: linear-gradient(180deg, rgba(6,11,20,0.55), rgba(6,11,20,0.88)), url('/img/modo-carrera/narrativa/prensa-bg.webp');
          background-size: cover; background-position: center;
        }
        .mc-titular-paper {
          background-image: linear-gradient(180deg, rgba(231,224,205,0.92), rgba(214,205,180,0.95)), url('/img/modo-carrera/narrativa/periodico-texture.webp');
          background-size: cover; background-position: center;
        }
        @media (max-width: 640px) {
          .mc-prensa-head {
            background-image: linear-gradient(180deg, rgba(6,11,20,0.55), rgba(6,11,20,0.88)), url('/img/modo-carrera/narrativa/prensa-bg-mobile.webp');
          }
          .mc-titular-paper {
            background-image: linear-gradient(180deg, rgba(231,224,205,0.92), rgba(214,205,180,0.95)), url('/img/modo-carrera/narrativa/periodico-texture-mobile.webp');
          }
        }
      `}</style>
      <div
        className="mc-prensa-head"
        style={{
          position: "relative",
          overflow: "hidden",
          marginBottom: 20,
          padding: "26px 22px",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff", position: "relative" }}>Narrativa</h2>
        <p style={{ fontSize: 13, color: MID, marginTop: 4, position: "relative" }}>
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

      {/* Estado de cupo IA + upsell del Pase DT (gate por coste de tokens, no por poder) */}
      {paseDT ? (
        <div style={{ marginBottom: 20, fontSize: 12.5, color: GOLD2, display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: GOLD, display: "inline-block" }} />
          Pase DT activo · narrativa con IA ilimitada
        </div>
      ) : exceeded ? (
        <div style={{ marginBottom: 20, padding: "14px 16px", borderRadius: 12, background: "rgba(201,168,76,0.10)", border: `1px solid ${GOLD}44` }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: GOLD2 }}>Cupo de narrativa IA agotado por hoy</div>
          <div style={{ fontSize: 12.5, color: MID, marginTop: 4, lineHeight: 1.5 }}>
            Las nuevas entradas se escriben por plantilla. Recarga el cupo con Fútcoins o consigue el <strong style={{ color: GOLD2 }}>Pase DT</strong> para IA sin límite.
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10, alignItems: "center" }}>
            {onRefill && (
              <button
                type="button"
                disabled={refilling}
                onClick={refill}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", borderRadius: 999,
                  background: "rgba(201,168,76,0.14)", border: `1px solid ${GOLD}`,
                  color: GOLD2, fontSize: 13, fontWeight: 800,
                  cursor: refilling ? "default" : "pointer", opacity: refilling ? 0.6 : 1,
                }}
              >
                <CoinIcon size={15} />
                {refilling ? "Recargando…" : `Recargar IA (${CAREER_NARRATIVE_REFILL})`}
              </button>
            )}
            <Link
              href="/pro"
              style={{ display: "inline-block", padding: "8px 16px", borderRadius: 999, background: GOLD, color: "#1a1407", fontSize: 13, fontWeight: 800, textDecoration: "none" }}
            >
              Conseguir Pase DT
            </Link>
          </div>
          {refillErr && <div style={{ fontSize: 12, color: "#fca5a5", marginTop: 8 }}>{refillErr}</div>}
        </div>
      ) : remaining !== null ? (
        <div style={{ marginBottom: 20, fontSize: 12.5, color: MID }}>
          Te quedan <strong style={{ color: GOLD2 }}>{remaining}</strong> generaciones con IA hoy ·{" "}
          <Link href="/pro" style={{ color: GOLD, textDecoration: "none", fontWeight: 700 }}>
            Pase DT = ilimitada
          </Link>
        </div>
      ) : null}

      {entries.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center", borderRadius: 14, background: BG2, border: "1px dashed rgba(255,255,255,0.08)" }}>
          <div style={{ color: MID, fontWeight: 700 }}>Tu historia empieza ahora</div>
          <div style={{ color: DIM, fontSize: 13, marginTop: 6 }}>Los titulares y ruedas de prensa aparecerán según avances.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {entries.map((e) => {
            const pending = e.choices && e.choices.length > 0 && !e.chosen;
            const isTitular = e.kind === "titular";
            const isPrensa = e.kind === "rueda_prensa";
            // Titulares → textura de periódico (tinta oscura). Ruedas de prensa →
            // fondo de podio de prensa (texto claro). El resto, tarjeta oscura.
            const ink = "#1a1610";
            const baseStyle: React.CSSProperties = isTitular
              ? {
                  padding: 20,
                  borderRadius: 14,
                  border: `1px solid ${pending ? GOLD : "rgba(26,22,16,0.25)"}`,
                  boxShadow: "inset 0 0 60px rgba(0,0,0,0.08)",
                }
              : isPrensa
                ? {
                    padding: 18,
                    borderRadius: 14,
                    backgroundImage:
                      "linear-gradient(180deg, rgba(6,11,20,0.72), rgba(6,11,20,0.92)), url('/img/modo-carrera/narrativa/prensa-podio.webp')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    border: `1px solid ${pending ? GOLD : "rgba(255,255,255,0.08)"}`,
                  }
                : { padding: 18, borderRadius: 14, background: BG2, border: `1px solid ${pending ? GOLD : "rgba(255,255,255,0.06)"}` };
            return (
              <article key={e.id} className={isTitular ? "mc-titular-paper" : undefined} style={baseStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  {e.kind === "evento" && eventIcon(e.body) && (
                    <span aria-hidden style={{ display: "inline-flex", color: "#fff", opacity: 0.92 }}>
                      {eventIcon(e.body)}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      color: isTitular ? ink : GOLD,
                      border: `1px solid ${isTitular ? "rgba(26,22,16,0.4)" : `${GOLD}55`}`,
                      borderRadius: 999,
                      padding: "2px 8px",
                    }}
                  >
                    {KIND_LABEL[e.kind]}
                  </span>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: isTitular ? "rgba(26,22,16,0.55)" : DIM }}>{fmtDate(e.createdAt)}</span>
                </div>
                <p
                  style={{
                    fontSize: isTitular ? 17 : 15,
                    color: isTitular ? ink : "#fff",
                    lineHeight: 1.6,
                    fontWeight: isTitular ? 800 : 500,
                    fontFamily: isTitular ? "Georgia, 'Times New Roman', serif" : undefined,
                  }}
                >
                  {e.body}
                </p>

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
