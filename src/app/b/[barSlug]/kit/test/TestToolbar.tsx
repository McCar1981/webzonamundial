"use client";

// Barra de acciones de la PRUEBA de cartel sobre imagen base (no se imprime).
// Imprimir/Guardar PDF, abrir en nueva pestaña y copiar el enlace del bar.

import { useState } from "react";
import { Printer, ExternalLink, Copy, Check } from "lucide-react";

export default function TestToolbar({ publicUrl }: { publicUrl: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      className="kit-toolbar"
      style={{ position: "fixed", top: 16, left: 16, right: 16, zIndex: 50, display: "flex", gap: 10, flexWrap: "wrap" }}
    >
      <button type="button" onClick={() => window.print()} style={primary()}>
        <Printer size={16} /> Imprimir cartel
      </button>
      <a href={publicUrl} target="_blank" rel="noopener noreferrer" style={btn()}>
        <ExternalLink size={16} /> Abrir en nueva pestaña
      </a>
      <button
        type="button"
        onClick={() => { void navigator.clipboard.writeText(publicUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        style={btn()}
      >
        {copied ? <><Check size={16} /> Copiado</> : <><Copy size={16} /> Copiar enlace</>}
      </button>
    </div>
  );
}

function primary(): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", border: "none",
    background: "linear-gradient(135deg, #C9A84C, #E8C76B 50%, #FDE68A)", color: "#1A1208",
    borderRadius: 10, fontWeight: 800, fontSize: 14, padding: "10px 16px", boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
  };
}
function btn(): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer",
    background: "#0F1D32", color: "#E2E8F0", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10, fontWeight: 800, fontSize: 14, padding: "10px 16px", textDecoration: "none",
    boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
  };
}
