"use client";

// Botón "Entrar en la porra" de la página pública del bar.
// - Si el usuario está logado: lo une a la porra y lo lleva a predecir.
// - Si no: lo manda al login con intención de unirse (?join=1) y, al volver
//   autenticado, completa la unión automáticamente y lleva a predecir.
// Si llega con ?qr=, intenta unirlo en silencio al cargar (atribución del QR).

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";

interface Props {
  slug: string;
  qr?: string;
  label: string;
  primary: string;
  primaryInk: string;
  radius: number;
  // true cuando se vuelve del login con intención explícita de unirse (?join=1).
  autoJoin?: boolean;
}

export default function JoinButton({ slug, qr, label, primary, primaryInk, radius, autoJoin }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "joined">(autoJoin ? "loading" : "idle");
  const autoTried = useRef(false);

  const join = useCallback(async (silent: boolean) => {
    if (!silent) setState("loading");
    try {
      const res = await fetch("/api/bars/join", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, qr }),
      });
      if (res.status === 401) {
        if (silent) return; // aún no logado: esperamos al click del CTA
        // Conservamos la intención de unirse (y el qr, si vino) para
        // completar la unión automáticamente al volver autenticado.
        const params = new URLSearchParams();
        if (qr) params.set("qr", qr);
        params.set("join", "1");
        const here = `/b/${slug}?${params.toString()}`;
        window.location.href = `/login?next=${encodeURIComponent(here)}`;
        return;
      }
      if (res.ok) {
        setState("joined");
        if (!silent) window.location.href = "/app/predicciones/jugar";
      } else if (!silent) {
        setState("idle");
      }
    } catch {
      if (!silent) setState("idle");
    }
  }, [slug, qr]);

  useEffect(() => {
    if (autoTried.current) return;
    // Vuelta del login con intención de unirse: completa la unión y entra a
    // predecir (mismo desenlace que un click manual).
    if (autoJoin) { autoTried.current = true; void join(false); return; }
    // Llegada por QR: unión silenciosa para atribuir el origen.
    if (qr) { autoTried.current = true; void join(true); }
  }, [qr, autoJoin, join]);

  return (
    <button
      onClick={() => void join(false)}
      disabled={state === "loading"}
      style={{
        width: "100%", cursor: state === "loading" ? "default" : "pointer",
        background: primary, color: primaryInk, border: "none", borderRadius: radius,
        fontWeight: 800, fontSize: 16, padding: "14px 18px",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}
    >
      {state === "loading" ? <Loader2 size={18} className="spin" />
        : state === "joined" ? <><Check size={18} /> ¡Dentro! Ir a predecir</>
        : <>{label} <ArrowRight size={18} /></>}
    </button>
  );
}
