"use client";

// src/components/pro/FreeWeekendCampaign.tsx
//
// Campaña "Fin de semana Pro gratis": anuncio de que TODAS las funciones Pro
// están abiertas hasta el lunes a mediodía. Mobile-first, estética premium
// deportiva (navy/dorado). Se monta una vez en el layout y solo se pinta
// mientras la ventana está activa (isFreeWeekendActive).
//
//  · POPUP: 1 vez por sesión (sessionStorage). Jerarquía: "probar gratis" es el
//    mensaje principal; "mantener Pro con precio fundador" es secundario y suave.
//  · PÍLDORA flotante: persiste toda la ventana; al pulsarla reabre el popup.
//    Se eleva sobre la barra inferior para no tapar la navegación.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Target, Sparkles, Zap, Trophy, Gamepad2, Users, type LucideIcon } from "lucide-react";
import { isFreeWeekendActive, freeWeekendEnd } from "@/lib/pro/free-weekend";
import { featureForPath } from "@/lib/pro/free-weekend-usage";

const BG = "#060B14", NAVY = "#0F1D32", GOLD = "#c9a84c", GOLD2 = "#e8d48b", GREEN = "#22c55e", MID = "#8a94b0";
const SHOWN_KEY = "zm:fw-popup-day"; // guarda el día (YYYY-MM-DD): máx. 1 popup/día

const UNLOCKED: { Icon: LucideIcon; t: string }[] = [
  { Icon: Target, t: "Predicciones ilimitadas" },
  { Icon: Sparkles, t: "IA Coach desbloqueado" },
  { Icon: Zap, t: "Fantasy en vivo" },
  { Icon: Trophy, t: "Modo Carrera completo" },
  { Icon: Gamepad2, t: "Trivia sin límites" },
  { Icon: Users, t: "Ligas privadas" },
];

const CSS = `
@keyframes zmFwBg { from { opacity: 0 } to { opacity: 1 } }
@keyframes zmFwIn { from { opacity: 0; transform: translateY(14px) scale(.96) } to { opacity: 1; transform: none } }
@keyframes zmFwOut { to { opacity: 0; transform: translateY(8px) scale(.97) } }
@keyframes zmFwPill { from { opacity: 0; transform: translate(-50%, 16px) } to { opacity: 1; transform: translate(-50%, 0) } }
.zm-fw-cta { transition: transform .12s ease, filter .12s ease, box-shadow .12s ease; }
.zm-fw-cta:hover { transform: translateY(-1px); filter: brightness(1.05); box-shadow: 0 16px 44px rgba(201,168,76,.42); }
.zm-fw-cta:active { transform: scale(.99); }
.zm-fw-chip { transition: border-color .2s ease, background .2s ease, transform .15s ease; }
.zm-fw-chip:hover { border-color: rgba(201,168,76,.35); transform: translateY(-1px); }
.zm-fw-pill { transition: transform .14s ease, box-shadow .14s ease; }
.zm-fw-pill:hover { transform: translate(-50%, -2px); box-shadow: 0 14px 38px rgba(0,0,0,.6); }
`;

export default function FreeWeekendCampaign() {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [left, setLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const pathname = usePathname();
  const onProRoute = !!featureForPath(pathname);

  useEffect(() => {
    setMounted(true);
    if (!isFreeWeekendActive()) return;
    setActive(true);

    // Máximo 1 popup por día natural: recuerda al visitante que vuelve cada día
    // sin repetírselo en cada visita de la misma jornada.
    const today = new Date().toISOString().slice(0, 10);
    let lastShownDay: string | null = null;
    try {
      lastShownDay = localStorage.getItem(SHOWN_KEY);
    } catch {
      /* modo privado: lo mostramos igual */
    }
    if (lastShownDay !== today) setOpen(true);

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

  const pad = (n: number) => String(n).padStart(2, "0");
  const countdownValid = left.d + left.h + left.m + left.s > 0;

  const closePopup = () => {
    setClosing(true);
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
      try {
        localStorage.setItem(SHOWN_KEY, new Date().toISOString().slice(0, 10));
      } catch {
        /* ignore */
      }
    }, 180);
  };

  const Chip = ({ v, l }: { v: number; l: string }) => (
    <div style={{ minWidth: 52, borderRadius: 12, padding: "7px 4px", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.28)" }}>
      <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{pad(v)}</div>
      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, color: GOLD, textTransform: "uppercase", marginTop: 4 }}>{l}</div>
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Píldora flotante (sobre la barra inferior) */}
      {!open &&
        createPortal(
          <button
            className="zm-fw-pill"
            onClick={() => setOpen(true)}
            style={{
              position: "fixed", left: "50%", transform: "translateX(-50%)",
              bottom: "calc(92px + env(safe-area-inset-bottom, 0px))", zIndex: 9990,
              display: "flex", alignItems: "center", gap: 8, maxWidth: "calc(100vw - 24px)",
              padding: "10px 16px", borderRadius: 999, border: "1px solid rgba(201,168,76,0.5)",
              background: "linear-gradient(135deg, #11233a, #0A1422)", cursor: "pointer",
              color: "#fff", fontSize: 13, fontWeight: 800, fontFamily: "inherit", whiteSpace: "nowrap",
              boxShadow: "0 8px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.15)",
              animation: "zmFwPill .3s ease both",
            }}
          >
            {onProRoute ? (
              <>
                <span style={{ fontSize: 15 }}>🔓</span>
                <span>PRO desbloqueado este finde</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: 15 }}>🔥</span>
                <span>Pro gratis este finde</span>
                <span style={{ color: GOLD, fontWeight: 900 }}>· Ver funciones</span>
              </>
            )}
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
              display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
              animation: "zmFwBg .2s ease",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "relative", width: "100%", maxWidth: 412, maxHeight: "92vh", overflowY: "auto",
                borderRadius: 22, border: "1px solid rgba(201,168,76,0.35)",
                background: `radial-gradient(120% 70% at 50% 0%, rgba(201,168,76,0.15), transparent 55%), linear-gradient(180deg, ${NAVY}, ${BG})`,
                boxShadow: "0 30px 90px rgba(0,0,0,0.7)",
                animation: closing ? "zmFwOut .18s ease forwards" : "zmFwIn .26s cubic-bezier(.2,.8,.2,1) both",
              }}
            >
              <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${GOLD}, ${GOLD2}, ${GOLD}, transparent)` }} />

              <button
                onClick={closePopup}
                aria-label="Cerrar"
                style={{ position: "absolute", top: 11, right: 11, zIndex: 2, background: "rgba(0,0,0,0.3)", border: "none", borderRadius: 999, cursor: "pointer", color: MID, padding: 7, lineHeight: 0 }}
              >
                <X size={18} />
              </button>

              <div style={{ padding: "22px 18px 18px", textAlign: "center" }}>
                {/* Badge de estado */}
                <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 12px", borderRadius: 999, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.4)", color: GREEN, fontSize: 10.5, fontWeight: 900, letterSpacing: 1.3, textTransform: "uppercase" }}>
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
                  Fin de semana Pro gratis
                </div>

                {/* Titular: el mensaje principal es PROBAR GRATIS */}
                <h2 style={{ margin: "14px 0 8px", lineHeight: 1.05 }}>
                  <span style={{ display: "block", fontSize: 16, fontWeight: 800, color: "#fff" }}>ZonaMundial Pro</span>
                  <span style={{ display: "block", fontSize: 38, fontWeight: 900, letterSpacing: "-0.02em", background: `linear-gradient(135deg, ${GOLD}, ${GOLD2}, #fff7dd, ${GOLD})`, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    gratis este finde
                  </span>
                </h2>
                <p style={{ margin: "0 auto 12px", maxWidth: 330, fontSize: 13, color: MID, lineHeight: 1.5 }}>
                  Prueba todas las funciones premium sin pagar, sin tarjeta y sin compromiso. Disponible{" "}
                  <strong style={{ color: "#fff" }}>hasta el lunes a mediodía.</strong>
                </p>

                {/* Sello de confianza */}
                <div style={{ display: "inline-flex", flexWrap: "wrap", justifyContent: "center", gap: 6, marginBottom: 16 }}>
                  {["Sin tarjeta", "Sin cobros", "Sin compromiso"].map((t) => (
                    <span key={t} style={{ fontSize: 11, fontWeight: 700, color: "#cdd6e6", padding: "3px 9px", borderRadius: 999, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      ✓ {t}
                    </span>
                  ))}
                </div>

                {/* Cuenta atrás (si corre) o cápsula informativa */}
                {countdownValid ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "center", gap: 7, marginBottom: 7 }}>
                      <Chip v={left.d} l="Días" />
                      <Chip v={left.h} l="Horas" />
                      <Chip v={left.m} l="Min" />
                      <Chip v={left.s} l="Seg" />
                    </div>
                    <div style={{ fontSize: 11, color: MID, marginBottom: 16 }}>Termina el lunes · 12:00</div>
                  </>
                ) : (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 999, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.28)", color: GOLD2, fontSize: 13, fontWeight: 800, marginBottom: 16 }}>
                    Termina el lunes · 12:00
                  </div>
                )}

                {/* Beneficios en chips premium */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, textAlign: "left", marginBottom: 18 }}>
                  {UNLOCKED.map(({ Icon, t }) => (
                    <div key={t} className="zm-fw-chip" style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 12, background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, flexShrink: 0, borderRadius: 8, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.22)" }}>
                        <Icon size={15} color={GOLD} />
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#dde4f0", lineHeight: 1.2 }}>{t}</span>
                    </div>
                  ))}
                </div>

                {/* CTA principal: PROBAR */}
                <button
                  className="zm-fw-cta"
                  onClick={closePopup}
                  style={{ width: "100%", padding: "15px 18px", borderRadius: 14, border: "none", cursor: "pointer", background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`, color: "#0A1422", fontSize: 16.5, fontWeight: 900, fontFamily: "inherit", boxShadow: "0 10px 34px rgba(201,168,76,0.3)" }}
                >
                  Entrar gratis este finde
                </button>
                <p style={{ margin: "10px 0 0", fontSize: 11, color: "#7a8696" }}>
                  Cuando termine la campaña, volverás automáticamente al plan Free. Sin cobros.
                </p>

                {/* Conversión secundaria, suave */}
                <div style={{ marginTop: 14, paddingTop: 13, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <Link href="/pro" onClick={closePopup} style={{ color: MID, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                    ¿Te gusta la experiencia? El lunes podrás mantener Pro con{" "}
                    <span style={{ color: GOLD2, fontWeight: 700 }}>precio fundador</span> →
                  </Link>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
