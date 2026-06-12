"use client";

// src/components/pro/FreeWeekendConversion.tsx
//
// Embudo POSTERIOR al popup del "Fin de semana Pro gratis". Monta una vez en el
// layout. Recorrido: Gratis → USO → valor → miedo a perderlo → precio fundador.
//
//  1. Registra qué funciones Pro toca el usuario (por ruta) mientras la ventana
//     está abierta. (El paywall del lunes vive en PaywallModal.)
//  2. Hito de valor: tras usar 2+ funciones, una tarjeta NO intrusiva
//     "Ya estás usando ZonaMundial Pro" (una sola vez).
//  3. Recta final (domingo tarde/noche): popup de urgencia
//     "Tu acceso Pro gratis termina pronto".
//
// Todo gateado por la ventana del finde: fuera de la campaña no renderiza nada.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import { isFreeWeekendActive, isFreeWeekendUrgency } from "@/lib/pro/free-weekend";
import { featureForPath, getFeaturesUsed, recordFeatureUse } from "@/lib/pro/free-weekend-usage";

const NAVY = "#0F1D32", BG = "#060B14", GOLD = "#c9a84c", GOLD2 = "#e8d48b", GREEN = "#22c55e", MID = "#8a94b0", RED = "#f0727a";
const MILESTONE_KEY = "zm:fw-milestone-shown";
const URGENCY_KEY = "zm:fw-urgency-shown";

const CSS = `
@keyframes zmFcUp { from { opacity: 0; transform: translate(-50%, 18px) } to { opacity: 1; transform: translate(-50%, 0) } }
@keyframes zmFcIn { from { opacity: 0; transform: translateY(14px) scale(.96) } to { opacity: 1; transform: none } }
.zm-fc-cta { transition: transform .12s ease, filter .12s ease; }
.zm-fc-cta:hover { transform: translateY(-1px); filter: brightness(1.05); }
.zm-fc-cta:active { transform: scale(.99); }
`;

export default function FreeWeekendConversion() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState(0);
  const [showMilestone, setShowMilestone] = useState(false);
  const [showUrgency, setShowUrgency] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCount(getFeaturesUsed().length);
  }, []);

  // 1. Registrar uso por ruta mientras la ventana está abierta.
  useEffect(() => {
    if (!isFreeWeekendActive()) return;
    const f = featureForPath(pathname);
    if (f) setCount(recordFeatureUse(f));
  }, [pathname]);

  // 2. Hito de valor a las 2+ funciones (una sola vez de por vida).
  useEffect(() => {
    if (!isFreeWeekendActive() || count < 2) return;
    let shown = false;
    try {
      shown = localStorage.getItem(MILESTONE_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (!shown) setShowMilestone(true);
  }, [count]);

  // 3. Urgencia en la recta final (revisa al montar y cada minuto).
  useEffect(() => {
    const check = () => {
      if (!isFreeWeekendUrgency()) return;
      let shown = false;
      try {
        shown = localStorage.getItem(URGENCY_KEY) === "1";
      } catch {
        /* ignore */
      }
      if (!shown) setShowUrgency(true);
    };
    check();
    const id = window.setInterval(check, 60_000);
    return () => window.clearInterval(id);
  }, []);

  if (!mounted) return null;

  const closeMilestone = () => {
    setShowMilestone(false);
    try {
      localStorage.setItem(MILESTONE_KEY, "1");
    } catch {
      /* ignore */
    }
  };
  const closeUrgency = () => {
    setShowUrgency(false);
    try {
      localStorage.setItem(URGENCY_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* 2. Tarjeta de hito de valor (no intrusiva, encima de la píldora) */}
      {showMilestone &&
        !showUrgency &&
        createPortal(
          <div
            style={{
              position: "fixed", left: "50%", transform: "translateX(-50%)",
              bottom: "calc(140px + env(safe-area-inset-bottom, 0px))", zIndex: 9991,
              width: "min(420px, calc(100vw - 24px))",
              borderRadius: 16, border: "1px solid rgba(201,168,76,0.35)",
              background: `linear-gradient(180deg, ${NAVY}, ${BG})`,
              boxShadow: "0 16px 50px rgba(0,0,0,0.55)", padding: "14px 14px 14px 16px",
              animation: "zmFcUp .3s ease both",
            }}
          >
            <button
              onClick={closeMilestone}
              aria-label="Cerrar"
              style={{ position: "absolute", top: 9, right: 9, background: "none", border: "none", cursor: "pointer", color: MID, padding: 4, lineHeight: 0 }}
            >
              <X size={16} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
              <span style={{ fontSize: 14.5, fontWeight: 900, color: "#fff" }}>Ya estás usando ZonaMundial Pro</span>
            </div>
            <p style={{ margin: "0 0 11px", fontSize: 12.5, color: MID, lineHeight: 1.5, paddingRight: 12 }}>
              Has probado <strong style={{ color: GOLD2 }}>{count} funciones premium</strong> este finde. Puedes
              mantenerlas activas con <strong style={{ color: "#fff" }}>precio fundador</strong> cuando termine la campaña.
            </p>
            <Link
              href="/pro"
              onClick={closeMilestone}
              className="zm-fc-cta"
              style={{ display: "block", textAlign: "center", padding: "11px 14px", borderRadius: 12, background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`, color: "#0A1422", fontSize: 14, fontWeight: 900, textDecoration: "none" }}
            >
              Mantener Pro con precio fundador
            </Link>
          </div>,
          document.body,
        )}

      {/* 3. Popup de urgencia (domingo tarde/noche) */}
      {showUrgency &&
        createPortal(
          <div
            onClick={closeUrgency}
            style={{
              position: "fixed", inset: 0, zIndex: 9998,
              background: "rgba(4,8,15,0.82)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center", padding: 18,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "relative", width: "100%", maxWidth: 400, overflow: "hidden",
                borderRadius: 22, border: `1px solid ${RED}55`,
                background: `radial-gradient(120% 70% at 50% 0%, rgba(240,114,122,0.14), transparent 55%), linear-gradient(180deg, ${NAVY}, ${BG})`,
                boxShadow: "0 30px 90px rgba(0,0,0,0.7)", animation: "zmFcIn .26s cubic-bezier(.2,.8,.2,1) both",
              }}
            >
              <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${RED}, #ffd2a8, ${RED}, transparent)` }} />
              <button
                onClick={closeUrgency}
                aria-label="Cerrar"
                style={{ position: "absolute", top: 11, right: 11, background: "rgba(0,0,0,0.3)", border: "none", borderRadius: 999, cursor: "pointer", color: MID, padding: 7, lineHeight: 0 }}
              >
                <X size={18} />
              </button>

              <div style={{ padding: "26px 20px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 34, marginBottom: 6 }}>⏳</div>
                <h2 style={{ margin: "0 0 8px", fontSize: 23, fontWeight: 900, color: "#fff", lineHeight: 1.15 }}>
                  Tu acceso Pro gratis termina pronto
                </h2>
                <p style={{ margin: "0 auto 18px", maxWidth: 320, fontSize: 13.5, color: MID, lineHeight: 1.55 }}>
                  Mañana volverás al plan Free. Mantén predicciones ilimitadas, IA Coach, Fantasy, Modo Carrera y ligas
                  privadas con <strong style={{ color: GOLD2 }}>precio fundador</strong>.
                </p>

                <Link
                  href="/pro"
                  onClick={closeUrgency}
                  className="zm-fc-cta"
                  style={{ display: "block", padding: "15px 18px", borderRadius: 14, background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`, color: "#0A1422", fontSize: 16, fontWeight: 900, textDecoration: "none", boxShadow: "0 10px 34px rgba(201,168,76,0.3)" }}
                >
                  Mantener Pro ahora
                </Link>
                <button
                  onClick={closeUrgency}
                  style={{ marginTop: 10, background: "none", border: "none", cursor: "pointer", color: MID, fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}
                >
                  Seguir probando gratis
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
