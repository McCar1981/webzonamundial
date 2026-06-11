// src/components/bars/BarInactiveScreen.tsx
//
// Pantalla pública que se muestra cuando una porra de bar NO está activa
// (sin publicar o sin plan de pago vigente). Sustituye a la página/ranking/TV
// del bar para que nunca se vea contenido de una porra inactiva. Usa el tema
// del bar para mantener la identidad y deriva al ecosistema ZonaMundial.

import Link from "next/link";
import { Trophy, Clock } from "lucide-react";
import type { BarRow } from "@/lib/bars/store";
import { getTheme } from "@/lib/bars/themes";

export default function BarInactiveScreen({ bar }: { bar: BarRow }) {
  const t = getTheme(bar.theme_id);
  return (
    <main style={{ minHeight: "100vh", background: t.bg, color: t.text, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 440, textAlign: "center" }}>
        <div style={{
          width: 76, height: 76, borderRadius: 20, margin: "0 auto 18px", border: `2px solid ${t.primary}`,
          background: bar.logo_url ? `center/cover url(${bar.logo_url})` : t.surface,
          display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 30, color: t.primary,
        }}>
          {!bar.logo_url && bar.name.charAt(0).toUpperCase()}
        </div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: t.primary, fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>
          <Trophy size={14} /> {bar.name}
        </div>

        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: t.cardRadius, padding: "26px 22px", marginTop: 16 }}>
          <Clock size={28} color={t.secondary} style={{ margin: "0 auto" }} />
          <h1 style={{ fontSize: 21, fontWeight: 900, margin: "12px 0 6px" }}>Esta peña todavía no está activa</h1>
          <p style={{ color: t.textMuted, fontSize: 14.5, lineHeight: 1.55, margin: 0 }}>
            {bar.name} aún está preparando su peña del Mundial. Vuelve a escanear el QR en un rato:
            cuando esté lista, podrás predecir los partidos y competir por los incentivos del local.
          </p>
        </div>

        <p style={{ color: t.textMuted, fontSize: 13, lineHeight: 1.5, marginTop: 18 }}>
          Mientras tanto, sigue jugando en{" "}
          <Link href="/" style={{ color: t.secondary, fontWeight: 800, textDecoration: "none" }}>ZonaMundial</Link>.
        </p>

        <div style={{ marginTop: 24 }}>
          <Link href="/" style={{ color: t.textMuted, fontSize: 12, textDecoration: "none", fontWeight: 600 }}>
            Powered by <span style={{ color: t.secondary, fontWeight: 800 }}>ZonaMundial</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
