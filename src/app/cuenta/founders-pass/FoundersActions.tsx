"use client";

import { useState } from "react";

interface Props {
  hasFounderPass: boolean;
}

export default function FoundersActions({ hasFounderPass }: Props) {
  const [refundState, setRefundState] = useState<{ status: "idle" | "loading" | "ok" | "error"; message?: string }>({ status: "idle" });

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
