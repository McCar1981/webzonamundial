"use client";

// Barra de acciones del cartel (no se imprime). Botón para lanzar el diálogo de
// impresión / guardar como PDF del navegador.

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <div className="cartel-toolbar" style={{ position: "fixed", top: 16, right: 16, zIndex: 50 }}>
      <button
        type="button"
        onClick={() => window.print()}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer",
          background: "#14110a", color: "#fff", border: "none", borderRadius: 10,
          fontWeight: 800, fontSize: 14, padding: "10px 16px", boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        }}
      >
        <Printer size={16} /> Imprimir o guardar PDF
      </button>
    </div>
  );
}
