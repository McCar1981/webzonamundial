"use client";

// Botón "Entrar en la porra" de la página pública del bar.
// - Si el usuario está logado: lo une a la porra y lo lleva a predecir.
// - Si no: lo manda al login y vuelve aquí para completar la unión.
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
}

export default function JoinButton({ slug, qr, label, primary, primaryInk, radius }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "joined">("idle");
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
        const here = `/b/${slug}${qr ? `?qr=${encodeURIComponent(qr)}` : ""}`;
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
    if (qr && !autoTried.current) { autoTried.current = true; void join(true); }
  }, [qr, join]);

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
