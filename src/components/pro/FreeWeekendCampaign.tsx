"use client";

// src/components/pro/FreeWeekendCampaign.tsx
//
// Campaña "Fin de semana abierto": anuncio visual de que TODO está gratis hasta
// el lunes a mediodía. Se monta una vez en el layout y solo se pinta mientras la
// ventana está activa (isFreeWeekendActive).
//
//  · POPUP: aparece una vez por sesión (sessionStorage) — el golpe visual.
//  · PÍLDORA flotante: persiste toda la ventana con la cuenta atrás; al pulsarla
//    se reabre el popup. No empuja el layout (position: fixed).
//
// Cuando la ventana cierra, el componente deja de renderizar nada solo.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X } from "lucide-react";
import { isFreeWeekendActive, freeWeekendEnd } from "@/lib/pro/free-weekend";

const GOLD = "#C9A84C", GOLD2 = "#e8d48b", BG = "#0A1422", BG2 = "#0F1D32", GREEN = "#22c55e", MID = "#8a94b0";
const SHOWN_KEY = "zm:free-weekend-popup-shown";

const UNLOCKED = [
  { e: "🎯", t: "Predicciones sin límites" },
  { e: "🧠", t: "IA Coach ilimitada" },
  { e: "⚡", t: "Fantasy en vivo" },
  { e: "🏆", t: "Modo Carrera infinito" },
  { e: "🎮", t: "Trivia sin tope" },
  { e: "👥", t: "Ligas privadas" },
];

export default function FreeWeekendCampaign() {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [open, setOpen] = useState(false);
  const [left, setLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    setMounted(true);
    if (!isFreeWeekendActive()) return;
    setActive(true);

    let shown = false;
    try {
      shown = sessionStorage.getItem(SHOWN_KEY) === "1";
    } catch {
      /* modo privado: lo mostramos igual */
    }
    if (!shown) setOpen(true);

    const tick = () => {
      const ms = freeWeekendEnd().getTime() - Date.now();
      if (ms <= 0) {
        setActive(false);
        setOpen(false);
        return;
      }
      setLeft({
        d: Math.floor(ms / 86_400_000),
        h: Math.floor((ms % 86_400_000) / 3_600_000),
        m: Math.floor((ms % 3_600_000) / 60_000),
        s: Math.floor((ms % 60_000) / 1000),
      });
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!mounted || !active) return null;

  const closePopup = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(SHOWN_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const pad = (n: number) => String(n).padStart(2, "0");

  const Chip = ({ v, l }: { v: number; l: string }) => (
    <div
      style={{
        minWidth: 56, borderRadius: 12, padding: "8px 4px",
        background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)",
      }}
    >
      <div style={{ fontSize: 26, fontWeight: 900, color: "#fff", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
        {pad(v)}
      </div>
      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, color: GOLD, textTransform: "uppercase", marginTop: 4 }}>
        {l}
      </div>
    </div>
  );

  return (
    <>
      {/* Píldora flotante persistente */}
      {!open &&
        mounted &&
        createPortal(
          <button
            onClick={() => setOpen(true)}
            style={{
              position: "fixed", left: "50%", transform: "translateX(-50%)",
              bottom: "calc(16px + env(safe-area-inset-bottom, 0px))", zIndex: 9990,
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 16px", borderRadius: 999, border: "1px solid rgba(201,168,76,0.5)",
              background: "linear-gradient(135deg, #11233a, #0A1422)", cursor: "pointer",
              color: "#fff", fontSize: 13, fontWeight: 800, fontFamily: "inherit",
              boxShadow: "0 8px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.15)",
            }}
          >
            <span style={{ fontSize: 15 }}>🔥</span>
            <span>
              Todo gratis · termina en{" "}
              <span style={{ color: GOLD2, fontVariantNumeric: "tabular-nums" }}>
                {left.d > 0 ? `${left.d}d ` : ""}{pad(left.h)}h {pad(left.m)}m
              </span>
            </span>
            <span style={{ color: GOLD, fontWeight: 900 }}>Ver →</span>
          </button>,
          document.body,
        )}

      {/* Popup */}
      {open &&
        createPortal(
          <div
            onClick={closePopup}
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              background: "rgba(4,8,15,0.82)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center", padding: 18,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "relative", width: "100%", maxWidth: 440, overflow: "hidden",
                borderRadius: 24, border: "1px solid rgba(201,168,76,0.35)",
                background: `radial-gradient(120% 80% at 50% 0%, rgba(201,168,76,0.16), transparent 55%), linear-gradient(180deg, ${BG2}, ${BG})`,
                boxShadow: "0 30px 90px rgba(0,0,0,0.7)",
              }}
            >
              {/* Línea dorada superior */}
              <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${GOLD}, ${GOLD2}, ${GOLD}, transparent)` }} />

              <button
                onClick={closePopup}
                aria-label="Cerrar"
                style={{
                  position: "absolute", top: 12, right: 12, zIndex: 2,
                  background: "rgba(0,0,0,0.3)", border: "none", borderRadius: 999, cursor: "pointer",
                  color: MID, padding: 7, lineHeight: 0,
                }}
              >
                <X size={18} />
              </button>

              <div style={{ padding: "26px 22px 22px", textAlign: "center" }}>
                {/* Eyebrow */}
                <div
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    padding: "5px 13px", borderRadius: 999,
                    background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.4)",
                    color: GREEN, fontSize: 11, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase",
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
                  Fin de semana abierto
                </div>

                {/* Titular */}
                <h2 style={{ margin: "16px 0 6px", lineHeight: 1.02 }}>
                  <span style={{ display: "block", fontSize: 17, fontWeight: 800, color: "#fff" }}>Este finde,</span>
                  <span
                    style={{
                      display: "block", fontSize: 52, fontWeight: 900, letterSpacing: "-0.03em",
                      background: `linear-gradient(135deg, ${GOLD}, ${GOLD2}, #fff7dd, ${GOLD})`,
                      WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent",
                    }}
                  >
                    TODO GRATIS
                  </span>
                </h2>
                <p style={{ margin: "0 auto 16px", maxWidth: 340, fontSize: 13.5, color: MID, lineHeight: 1.5 }}>
                  Todas las funciones Pro desbloqueadas para todo el mundo. Sin tarjeta, sin truco.
                  <strong style={{ color: "#fff" }}> Hasta el lunes a mediodía.</strong>
                </p>

                {/* Cuenta atrás */}
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 18 }}>
                  <Chip v={left.d} l="Días" />
                  <Chip v={left.h} l="Horas" />
                  <Chip v={left.m} l="Min" />
                  <Chip v={left.s} l="Seg" />
                </div>

                {/* Lo que se desbloquea */}
                <div
                  style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7,
                    textAlign: "left", marginBottom: 20,
                  }}
                >
                  {UNLOCKED.map((u) => (
                    <div
                      key={u.t}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "8px 10px", borderRadius: 11,
                        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{u.e}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#dbe3f0", lineHeight: 1.2 }}>{u.t}</span>
                    </div>
                  ))}
                </div>

                {/* CTA principal */}
                <button
                  onClick={closePopup}
                  style={{
                    width: "100%", padding: "15px 18px", borderRadius: 14, border: "none", cursor: "pointer",
                    background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`, color: "#0A1422",
                    fontSize: 16, fontWeight: 900, fontFamily: "inherit",
                    boxShadow: "0 10px 34px rgba(201,168,76,0.3)",
                  }}
                >
                  ¡Entrar y jugarlo todo gratis!
                </button>

                {/* Secundario: conversión */}
                <Link
                  href="/pro"
                  onClick={closePopup}
                  style={{ display: "block", marginTop: 11, color: GOLD2, fontSize: 12.5, fontWeight: 700, textDecoration: "none" }}
                >
                  ¿No quieres perderlo el lunes? Hazte Pro y bloquea el precio fundador →
                </Link>
                <p style={{ margin: "12px 0 0", fontSize: 10.5, color: "#566177" }}>
                  Cuando termine la campaña, vuelve el plan Free. Sin cobros.
                </p>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
