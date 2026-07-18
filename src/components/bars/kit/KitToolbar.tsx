"use client";

// Barra de acciones del material del kit (no se imprime/exporta). Permite volver
// al kit de activación y lanzar el diálogo de impresión / guardar como PDF del
// navegador. Se oculta con @media print desde la propia ruta del material.

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

export default function KitToolbar({ label }: { label: string }) {
  return (
    <div
      className="kit-toolbar"
      style={{
        position: "fixed", top: 16, left: 16, right: 16, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        pointerEvents: "none",
      }}
    >
      <Link
        href="/bar-dashboard/kit"
        style={{
          pointerEvents: "auto", display: "inline-flex", alignItems: "center", gap: 8,
          background: "#14110a", color: "#E2E8F0", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 10, fontWeight: 800, fontSize: 14, padding: "10px 16px", textDecoration: "none",
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        }}
      >
        <ArrowLeft size={16} /> Volver al kit
      </Link>
      <button
        type="button"
        onClick={() => window.print()}
        style={{
          pointerEvents: "auto", display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer",
          background: "linear-gradient(135deg, #C9A84C, #E8C76B 50%, #FDE68A)", color: "#1A1208",
          border: "none", borderRadius: 10, fontWeight: 800, fontSize: 14, padding: "10px 16px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        }}
      >
        <Printer size={16} /> Imprimir / Guardar PDF · {label}
      </button>
    </div>
  );
}
