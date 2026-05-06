"use client";

import { useState } from "react";

interface Props {
  hasFounderPass: boolean;
  /** Si está disponible, número de orden del Founder (1, 2, 3…). */
  founderNumber?: number;
  /** Nombre/email a mostrar en la insignia compartible. */
  founderName?: string;
}

export default function FoundersActions({ hasFounderPass, founderNumber, founderName }: Props) {
  const [refundState, setRefundState] = useState<{ status: "idle" | "loading" | "ok" | "error"; message?: string }>({ status: "idle" });
  const [shareCopied, setShareCopied] = useState(false);

  function shareFounderUrl(): string {
    const params = new URLSearchParams();
    if (founderNumber) params.set("n", String(founderNumber));
    if (founderName) params.set("name", founderName);
    return `/api/og/founder?${params.toString()}`;
  }

  async function handleShare() {
    const url = `${window.location.origin}/founders`;
    const text = `Soy Founder de ZonaMundial 🏆 Apoyando el Mundial 2026 desde el primer día.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Soy Founder · ZonaMundial 2026", text, url });
      } catch {
        /* user canceled */
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  }

  async function handleRefund() {
    if (!confirm("¿Solicitar reembolso del Founders Pass? Perderás el acceso a las ventajas Founders en cuanto Stripe procese la devolución.")) return;
    setRefundState({ status: "loading" });
    try {
      const r = await fetch("/api/cuenta/cancelar", { method: "POST" });
      const data = await r.json();
      if (r.ok) {
        setRefundState({ status: "ok", message: data.message });
      } else {
        setRefundState({ status: "error", message: data.error || "Error desconocido" });
      }
    } catch (e) {
      setRefundState({ status: "error", message: "Error de red" });
    }
  }

  if (!hasFounderPass) return null;

  return (
    <div className="mt-6 pt-6 border-t border-white/5">
      {/* Compartir insignia */}
      <div className="mb-5 p-4 rounded-xl" style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.18)" }}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-sm font-bold text-white mb-1">Comparte tu insignia</div>
            <div className="text-xs text-gray-400">Imagen 1200×630 lista para X, Instagram y WhatsApp.</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <a
              href={shareFounderUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium px-4 py-2 rounded-full no-underline"
              style={{ border: "1px solid rgba(201,168,76,0.35)", color: "#FDE68A" }}
            >
              Ver imagen
            </a>
            <button
              type="button"
              onClick={handleShare}
              className="text-xs font-bold px-4 py-2 rounded-full"
              style={{
                background: "linear-gradient(135deg,#C9A84C,#FDE68A)",
                color: "#1A1208",
              }}
            >
              {shareCopied ? "Copiado ✓" : "Compartir"}
            </button>
          </div>
        </div>
      </div>

      {refundState.status === "ok" && (
        <div
          className="px-4 py-3 rounded-lg mb-3 text-sm"
          style={{
            background: "linear-gradient(90deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))",
            border: "1px solid rgba(16,185,129,0.4)",
            color: "#6ee7b7",
          }}
        >
          {refundState.message}
        </div>
      )}
      {refundState.status === "error" && (
        <div
          className="px-4 py-3 rounded-lg mb-3 text-sm"
          style={{
            background: "linear-gradient(90deg, rgba(239,68,68,0.12), rgba(239,68,68,0.04))",
            border: "1px solid rgba(239,68,68,0.4)",
            color: "#fca5a5",
          }}
        >
          {refundState.message}
        </div>
      )}

      <button
        type="button"
        onClick={handleRefund}
        disabled={refundState.status === "loading" || refundState.status === "ok"}
        className="text-sm font-medium px-5 py-2.5 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: "transparent",
          border: "1px solid rgba(239, 68, 68, 0.35)",
          color: "#fca5a5",
        }}
      >
        {refundState.status === "loading" ? "Procesando…" : "Solicitar reembolso"}
      </button>
      <p className="text-[11px] text-gray-500 mt-3">
        Reembolso completo procesado por Stripe en 1-3 días hábiles. Perderás el acceso a las ventajas Founders al confirmarse.
      </p>
    </div>
  );
}
