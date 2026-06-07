// src/app/b/[barSlug]/page.tsx
//
// Página pública del bar (mobile-first). Es la puerta de entrada: el cliente
// llega por QR, entra en la porra y desde aquí se le lleva al ecosistema ZM
// (ranking global, trivia). Personalizada con el tema del bar, pero siempre
// con "Powered by ZonaMundial" y CTAs inteligentes hacia ZM.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Trophy, AtSign, Gift, Users, ArrowRight, Star } from "lucide-react";
import { getBarBySlug, listPrizes, barLeaderboard, participantCount, barIsLive } from "@/lib/bars/store";
import { getTheme } from "@/lib/bars/themes";
import BarInactiveScreen from "@/components/bars/BarInactiveScreen";
import JoinButton from "./JoinButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { barSlug: string } }): Promise<Metadata> {
  const bar = await getBarBySlug(params.barSlug);
  if (!bar) return { title: "Peña no encontrada · ZonaMundial" };
  return {
    title: `Peña Mundialista · ${bar.name}`,
    description: bar.description || `Únete a la peña mundialista de ${bar.name}. Predice, compite y gana premios.`,
    robots: { index: false, follow: true },
  };
}

export default async function BarPublicPage({
  params, searchParams,
}: { params: { barSlug: string }; searchParams: { qr?: string; join?: string } }) {
  const bar = await getBarBySlug(params.barSlug);
  if (!bar) notFound();

  // Porra no pública (sin publicar o sin plan activo): pantalla de "no activa".
  if (!(await barIsLive(bar))) return <BarInactiveScreen bar={bar} />;

  const t = getTheme(bar.theme_id);
  const [prizes, standings, count] = await Promise.all([
    listPrizes(bar.id), barLeaderboard(bar), participantCount(bar.id),
  ]);
  const mainPrize = prizes.find((p) => p.prize_type === "principal") ?? prizes[0] ?? null;
  const top3 = standings.slice(0, 3);

  return (
    <main style={{ minHeight: "100vh", background: t.bg, color: t.text }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px 48px" }}>
        {/* Portada + logo */}
        <header style={{ position: "relative", marginBottom: 18 }}>
          <div style={{
            height: 150, borderRadius: `0 0 ${t.cardRadius}px ${t.cardRadius}px`, overflow: "hidden",
            background: bar.cover_url ? `center/cover url(${bar.cover_url})` : `linear-gradient(135deg, ${t.surface}, ${t.surface2})`,
            borderBottom: `1px solid ${t.border}`,
          }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: -34, padding: "0 6px" }}>
            <div style={{
              width: 68, height: 68, borderRadius: 16, flexShrink: 0, border: `2px solid ${t.primary}`,
              background: bar.logo_url ? `center/cover url(${bar.logo_url})` : t.surface,
              display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 26, color: t.primary,
            }}>
              {!bar.logo_url && bar.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ paddingTop: 30 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, lineHeight: 1.1 }}>{bar.name}</h1>
              {bar.city && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, color: t.textMuted, fontSize: 13, marginTop: 3 }}>
                  <MapPin size={13} /> {bar.city}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Nombre de la porra + bienvenida */}
        <section style={{ marginBottom: 16 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: t.primary, fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>
            <Trophy size={14} /> Peña Mundialista 2026
          </div>
          <p style={{ color: t.textMuted, fontSize: 15, lineHeight: 1.5, margin: "8px 0 0" }}>
            {bar.welcome_message || `Predice los partidos del Mundial, compite con la peña de ${bar.name} y gana premios.`}
          </p>
        </section>

        {/* Premio destacado */}
        {mainPrize && (
          <section style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: t.cardRadius, padding: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, color: t.secondary, fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
              <Gift size={15} /> Premio principal
            </div>
            <div style={{ fontWeight: 900, fontSize: 19, marginTop: 6 }}>{mainPrize.title}</div>
            {mainPrize.description && <div style={{ color: t.textMuted, fontSize: 14, marginTop: 4 }}>{mainPrize.description}</div>}
          </section>
        )}

        {/* CTA principal */}
        <section style={{ marginBottom: 10 }}>
          <JoinButton slug={bar.slug} qr={searchParams.qr} autoJoin={searchParams.join === "1"} label={bar.cta_label || "Unirme a la peña"} primary={t.primary} primaryInk={t.primaryInk} radius={t.buttonRadius} />
        </section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: t.textMuted, fontSize: 13, marginBottom: 20 }}>
          <Users size={14} /> {count} {count === 1 ? "participante" : "participantes"}
        </div>

        {/* Ranking mini top 3 */}
        <section style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Clasificación</h2>
            <Link href={`/b/${bar.slug}/ranking`} style={{ color: t.primary, fontSize: 13, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}>
              Ver ranking <ArrowRight size={13} />
            </Link>
          </div>
          {top3.length === 0 ? (
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: t.cardRadius, padding: 16, color: t.textMuted, fontSize: 14, textAlign: "center" }}>
              Aún no hay participantes. ¡Sé el primero en unirte a la peña!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {top3.map((s) => (
                <div key={s.user_id} style={{ display: "flex", alignItems: "center", gap: 12, background: t.surface, border: `1px solid ${t.border}`, borderRadius: t.cardRadius, padding: "10px 14px" }}>
                  <span style={{ fontWeight: 900, fontSize: 16, color: t.primary, width: 22 }}>{s.position}</span>
                  <span style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{s.display_name}</span>
                  <span style={{ fontWeight: 800, fontSize: 14, color: t.secondary }}>{s.points} pts</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Cómo funciona */}
        <section style={{ marginBottom: 22 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 10px" }}>Cómo funciona</h2>
          <ol style={{ margin: 0, paddingLeft: 18, color: t.textMuted, fontSize: 14, lineHeight: 1.7 }}>
            <li>Únete a la peña con tu cuenta de ZonaMundial.</li>
            <li>Predice los partidos del Mundial desde tu móvil.</li>
            <li>Suma puntos y sube en la clasificación del bar.</li>
            <li>El premio lo entrega {bar.name} según sus reglas.</li>
          </ol>
        </section>

        {/* Bloque ZM — puerta hacia el ecosistema */}
        <section style={{ background: `linear-gradient(135deg, ${t.surface}, ${t.surface2})`, border: `1px solid ${t.border}`, borderRadius: t.cardRadius, padding: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 14 }}>
            <Star size={15} color={t.secondary} /> También compites en ZonaMundial
          </div>
          <p style={{ color: t.textMuted, fontSize: 13.5, lineHeight: 1.5, margin: "6px 0 12px" }}>
            Tus puntos te ayudan a subir en el ranking global y a desbloquear insignias durante el Mundial.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/app/rankings" style={{ flex: "1 1 auto", textAlign: "center", textDecoration: "none", background: t.surface2, color: t.text, border: `1px solid ${t.border}`, borderRadius: t.buttonRadius, fontWeight: 700, fontSize: 13, padding: "9px 12px" }}>
              Ranking global
            </Link>
            <Link href="/trivia" style={{ flex: "1 1 auto", textAlign: "center", textDecoration: "none", background: t.surface2, color: t.text, border: `1px solid ${t.border}`, borderRadius: t.buttonRadius, fontWeight: 700, fontSize: 13, padding: "9px 12px" }}>
              Trivia diaria
            </Link>
          </div>
        </section>

        {/* Contacto del bar */}
        {(bar.instagram || bar.website || bar.address) && (
          <section style={{ color: t.textMuted, fontSize: 13, marginBottom: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            {bar.address && <div style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={13} /> {bar.address}</div>}
            {bar.instagram && (
              <a href={`https://instagram.com/${bar.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, color: t.textMuted, textDecoration: "none" }}>
                <AtSign size={13} /> @{bar.instagram.replace(/^@/, "")}
              </a>
            )}
          </section>
        )}

        {/* Footer Powered by ZonaMundial */}
        <footer style={{ textAlign: "center", borderTop: `1px solid ${t.border}`, paddingTop: 16 }}>
          <Link href="/" style={{ color: t.textMuted, fontSize: 12, textDecoration: "none", fontWeight: 600 }}>
            Powered by <span style={{ color: t.secondary, fontWeight: 800 }}>ZonaMundial</span>
          </Link>
          <div style={{ marginTop: 8, display: "flex", gap: 12, justifyContent: "center", fontSize: 11, color: t.textMuted }}>
            <Link href="/legal/terminos" style={{ color: t.textMuted, textDecoration: "none" }}>Términos</Link>
            <Link href="/legal/privacidad" style={{ color: t.textMuted, textDecoration: "none" }}>Privacidad</Link>
          </div>
          <p style={{ color: t.textMuted, fontSize: 10.5, lineHeight: 1.5, marginTop: 12, opacity: 0.8 }}>
            Esta peña es una dinámica gratuita de predicciones y puntos. No implica apuestas ni pago por participar.
            Los premios son ofrecidos y gestionados por el establecimiento.
          </p>
        </footer>
      </div>
    </main>
  );
}
