// src/app/app/tu-mundial/page.tsx
//
// Página PRIVADA "Tu Mundial 2026": calcula las cifras REALES del usuario logueado
// (server-authoritative) y muestra su tarjeta-recuerdo + botón de compartir. La
// tarjeta compartida es gratis (viralidad con marca ZonaMundial); debajo, un
// empujón honesto a Pro / a la próxima temporada (retención + monetización).
// Sin emojis.

import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUserWithName } from "@/lib/auth-helpers";
import { isPro } from "@/lib/pro/entitlement";
import { getTuMundialStats } from "@/lib/tu-mundial/stats";
import { statsToQuery } from "@/lib/tu-mundial/share";
import RecapCard from "@/app/tu-mundial/RecapCard";
import ShareButton from "@/app/tu-mundial/ShareButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tu Mundial 2026 — ZonaMundial",
  description: "Tu recuerdo personalizado del Mundial 2026: puntos, aciertos, ranking y más. Compártelo.",
  robots: { index: false, follow: false },
};

export default async function TuMundialPage() {
  const user = await getCurrentUserWithName();
  if (!user) redirect("/registro?next=/app/tu-mundial");

  const [stats, pro] = await Promise.all([
    getTuMundialStats(user.id, user.name ?? "Aficionado"),
    isPro(user.id, user.email),
  ]);
  const query = statsToQuery(stats);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #000000, #000000)",
        color: "#E2E8F0",
        padding: "40px 16px 64px",
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto 22px", textAlign: "center" }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#fff", margin: "0 0 6px" }}>Tu Mundial 2026</h1>
        <p style={{ fontSize: 14.5, color: "#a69a82", margin: 0 }}>
          Así ha sido tu torneo. Compártelo con tu marca y reta a tus amigos.
        </p>
      </div>

      <RecapCard s={stats} />

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <ShareButton query={query} />
      </div>

      {/* Empujón honesto: Pro + puente a la próxima temporada. No bloquea el
          compartir (la viralidad es gratis); es un punto de conversión/retención. */}
      <div
        style={{
          maxWidth: 560,
          margin: "32px auto 0",
          padding: 20,
          borderRadius: 18,
          background: "rgba(201,168,76,0.08)",
          border: "1px solid rgba(201,168,76,0.28)",
          textAlign: "center",
        }}
      >
        {pro ? (
          <p style={{ margin: 0, fontSize: 14.5, color: "#e6decb" }}>
            Gracias por ser Pro. Tu progreso —puntos, nivel, Fútcoins y cromos— te acompaña a la próxima temporada.
          </p>
        ) : (
          <>
            <p style={{ margin: "0 0 14px", fontSize: 15, color: "#e6decb" }}>
              El Mundial se acaba, pero el fútbol no. Con <b style={{ color: "#fff" }}>Pro</b> te llevas tu progreso a la
              próxima temporada de ligas de clubes.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href="/pro"
                style={{ background: "linear-gradient(135deg, #c9a84c, #e8d48b)", color: "#0a0906", fontWeight: 800, fontSize: 15, padding: "12px 24px", borderRadius: 12, textDecoration: "none" }}
              >
                Ver Pro
              </Link>
              <Link
                href="/zona-futbol-preview"
                style={{ background: "rgba(255,255,255,0.05)", color: "#fff", fontWeight: 700, fontSize: 15, padding: "12px 24px", borderRadius: 12, textDecoration: "none", border: "1px solid rgba(201,168,76,0.3)" }}
              >
                Reserva tu sitio
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
