"use client";

// Botón de compartir el recuerdo "Tu Mundial 2026". navigator.share en móvil
// (87% de la audiencia), copiar enlace en escritorio. Emite evento GA4 para medir
// la viralidad (la auditoría marcó que ningún CTA emitía eventos). Sin emojis.

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { trackEvent } from "@/lib/analytics/track-event";

const GOLD = "#c9a84c", GOLD2 = "#e8d48b";

export default function ShareButton({ query }: { query: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}/tu-mundial?${query}`;
    const text = "Este ha sido mi Mundial 2026 en ZonaMundial";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "Tu Mundial 2026", text, url });
        trackEvent("share", { method: "web_share", content_type: "tu_mundial" });
        return;
      }
    } catch {
      // el usuario canceló el diálogo nativo: no es un error
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      trackEvent("share", { method: "copy", content_type: "tu_mundial" });
    } catch {
      // último recurso: abrir en pestaña para copiar a mano
      window.prompt("Copia tu enlace para compartir:", url);
    }
  };

  return (
    <button
      onClick={share}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        border: "none",
        cursor: "pointer",
        background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
        color: "#0a0906",
        fontWeight: 800,
        fontSize: 16,
        padding: "14px 28px",
        borderRadius: 14,
      }}
    >
      {copied ? (
        <>
          <Check size={18} strokeWidth={3} aria-hidden /> Enlace copiado
        </>
      ) : (
        <>
          <Share2 size={18} aria-hidden /> Comparte tu Mundial
        </>
      )}
    </button>
  );
}
