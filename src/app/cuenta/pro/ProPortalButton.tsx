"use client";

// Botón hacia el Stripe Billing Portal (gestionar tarjeta, facturas, cancelar).

import { useState } from "react";

export default function ProPortalButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/pro/portal", { method: "POST" });
      const data = await r.json();
      if (r.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error || "No pudimos abrir el portal. Inténtalo en unos segundos.");
    } catch {
      setError("Error de red. Comprueba tu conexión.");
    }
    setLoading(false);
  }

  return (
    <div>
      <button
        onClick={openPortal}
        disabled={loading}
        className="rounded-xl border border-[#C9A84C]/40 px-5 py-2.5 text-sm font-bold text-[#C9A84C] disabled:opacity-60"
        style={{ background: "transparent", cursor: loading ? "wait" : "pointer", fontFamily: "inherit" }}
      >
        {loading ? "Abriendo portal…" : "Gestionar suscripción"}
      </button>
      {error && <div className="mt-2 text-xs text-red-400">{error}</div>}
    </div>
  );
}
