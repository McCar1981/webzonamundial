// src/app/pago/comodin/page.tsx
//
// Página de retorno tras pagar un comodín en Stripe Checkout. El efecto lo
// aplica el webhook server-side; aquí solo consultamos el estado de la compra
// (?pid=...) con un pequeño polling y orientamos al usuario de vuelta al juego
// (?back=/app/predicciones/jugar o /trivia).

"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

const BG = "#060B14";
const CARD = "#0F1D32";
const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const TEXT = "#E2E8F0";
const MID = "#94A3B8";
const GREEN = "#22c55e";
const RED = "#ef4444";

type Status = "checking" | "applied" | "failed" | "slow";

function ComodinReturnInner() {
  const params = useSearchParams();
  const pid = params.get("pid");
  const back = params.get("back") || "/app";
  const isTrivia = back.startsWith("/trivia");

  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState<string | null>(null);
  const [isPack, setIsPack] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const tries = useRef(0);

  useEffect(() => {
    if (!pid) {
      setStatus("failed");
      setMessage("Falta la referencia de la compra.");
      return;
    }
    let stopped = false;
    const poll = async () => {
      if (stopped) return;
      tries.current += 1;
      try {
        const r = await fetch(`/api/powerups/status?pid=${encodeURIComponent(pid)}`);
        if (r.ok) {
          const j = (await r.json()) as { status: string; sku?: string; error?: string | null; credits?: number };
          if (j.status === "applied" || j.status === "consumed") {
            setIsPack(j.sku === "pack3");
            if (typeof j.credits === "number") setCredits(j.credits);
            setStatus("applied");
            return;
          }
          if (j.status === "failed" || j.status === "refunded") {
            setStatus("failed");
            setMessage(
              "No se pudo aplicar el comodín (la ventana se cerró durante el pago). Te hemos devuelto el importe automáticamente.",
            );
            return;
          }
        }
      } catch {
        /* siguiente intento */
      }
      if (tries.current >= 30) {
        // ~75s sin confirmación: el webhook va lento, pero el pago está hecho.
        setStatus("slow");
        return;
      }
      setTimeout(poll, 2500);
    };
    void poll();
    return () => {
      stopped = true;
    };
  }, [pid]);

  return (
    <main style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: CARD, border: `1px solid color-mix(in srgb, ${GOLD} 30%, transparent)`, borderRadius: 20, padding: "32px 26px", maxWidth: 420, width: "100%", textAlign: "center" }}>
        {status === "checking" && (
          <>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🕐</div>
            <h1 style={{ color: TEXT, fontSize: 19, fontWeight: 900, margin: "0 0 8px" }}>Confirmando tu pago…</h1>
            <p style={{ color: MID, fontSize: 14, lineHeight: 1.55, margin: 0 }}>
              Unos segundos. Estamos aplicando tu comodín.
            </p>
          </>
        )}
        {status === "applied" && (
          <>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <h1 style={{ color: GREEN, fontSize: 19, fontWeight: 900, margin: "0 0 8px" }}>
              {isPack ? "¡Pack de comodines acreditado!" : "¡Comodín aplicado!"}
            </h1>
            <p style={{ color: MID, fontSize: 14, lineHeight: 1.55, margin: 0 }}>
              {isPack && (
                <>
                  Tu comodín se ha aplicado{credits !== null ? <> y te quedan <b style={{ color: GOLD2 }}>{credits} usos</b> para lo que quieras</> : null}.{" "}
                </>
              )}
              {isTrivia
                ? "Vuelve a la pestaña de tu partida: tu racha te está esperando."
                : "Ya está activo en tu partido. ¡Suerte!"}
            </p>
          </>
        )}
        {status === "slow" && (
          <>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🕐</div>
            <h1 style={{ color: GOLD2, fontSize: 19, fontWeight: 900, margin: "0 0 8px" }}>Pago recibido</h1>
            <p style={{ color: MID, fontSize: 14, lineHeight: 1.55, margin: 0 }}>
              La confirmación está tardando un poco más de lo normal. Tu comodín se aplicará en breve; si no, te devolvemos el importe automáticamente.
            </p>
          </>
        )}
        {status === "failed" && (
          <>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h1 style={{ color: RED, fontSize: 19, fontWeight: 900, margin: "0 0 8px" }}>No se pudo aplicar</h1>
            <p style={{ color: MID, fontSize: 14, lineHeight: 1.55, margin: 0 }}>
              {message ?? "Algo salió mal con esta compra."}
            </p>
          </>
        )}
        <a
          href={back}
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
            marginTop: 22, width: "100%", padding: "12px 16px", borderRadius: 12, boxSizing: "border-box",
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`, color: "#0B1220",
            fontWeight: 900, fontSize: 14.5, textDecoration: "none",
          }}
        >
          {isTrivia ? "Volver a la Trivia" : "Volver al juego"}
        </a>
      </div>
    </main>
  );
}

export default function ComodinReturnPage() {
  return (
    <Suspense fallback={null}>
      <ComodinReturnInner />
    </Suspense>
  );
}
