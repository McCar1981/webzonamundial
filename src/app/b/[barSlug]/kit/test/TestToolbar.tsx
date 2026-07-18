"use client";

// Barra de acciones de la PRUEBA de cartel sobre imagen base (no se imprime).
// Imprimir, abrir en nueva pestaña, copiar enlace, alternar modo debug y probar
// distintos formatos de logo. Todo se controla por query params (?debug, ?logoTest).

import { useState } from "react";
import { Printer, ExternalLink, Copy, Check, Bug, Image as ImageIcon } from "lucide-react";

const LOGO_TESTS = [
  { value: "", label: "Logo real" },
  { value: "horizontal", label: "Horizontal" },
  { value: "square", label: "Cuadrado" },
  { value: "none", label: "Sin logo" },
] as const;

export default function TestToolbar({ publicUrl, debug, logoTest }: { publicUrl: string; debug: boolean; logoTest: string | null }) {
  const [copied, setCopied] = useState(false);

  function buildUrl(next: { debug?: boolean; logoTest?: string }) {
    const params = new URLSearchParams();
    const d = next.debug ?? debug;
    const l = next.logoTest ?? logoTest ?? "";
    if (d) params.set("debug", "1");
    if (l) params.set("logoTest", l);
    const qs = params.toString();
    return qs ? `?${qs}` : window.location.pathname;
  }

  function go(next: { debug?: boolean; logoTest?: string }) {
    window.location.href = buildUrl(next);
  }

  return (
    <div
      className="kit-toolbar"
      style={{ position: "fixed", top: 16, left: 16, right: 16, zIndex: 50, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}
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

      <button type="button" onClick={() => go({ debug: !debug })} style={debug ? primary() : btn()}>
        <Bug size={16} /> {debug ? "Debug ON" : "Debug OFF"}
      </button>

      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#14110a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "6px 10px", boxShadow: "0 4px 16px rgba(0,0,0,0.25)" }}>
        <ImageIcon size={15} color="#E2E8F0" />
        {LOGO_TESTS.map((t) => {
          const active = (logoTest ?? "") === t.value;
          return (
            <button
              key={t.value || "real"}
              type="button"
              onClick={() => go({ logoTest: t.value })}
              style={{
                cursor: "pointer", border: "none", borderRadius: 7, fontWeight: 800, fontSize: 12.5, padding: "5px 9px",
                background: active ? "linear-gradient(135deg, #C9A84C, #E8C76B)" : "transparent",
                color: active ? "#1A1208" : "#a69a82",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
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
    background: "#14110a", color: "#E2E8F0", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10, fontWeight: 800, fontSize: 14, padding: "10px 16px", textDecoration: "none",
    boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
  };
}
