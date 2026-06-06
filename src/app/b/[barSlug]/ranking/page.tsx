// src/app/b/[barSlug]/ranking/page.tsx
//
// Clasificación completa de la porra del bar. Reusa el ranking de la liga de
// predicciones. Tras la tabla, CTAs inteligentes hacia el ecosistema ZM.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy, ArrowLeft, ArrowRight, Star, Crown } from "lucide-react";
import { getBarBySlug, barLeaderboard, barIsLive } from "@/lib/bars/store";
import { getTheme } from "@/lib/bars/themes";
import BarInactiveScreen from "@/components/bars/BarInactiveScreen";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { barSlug: string } }): Promise<Metadata> {
  const bar = await getBarBySlug(params.barSlug);
  return {
    title: bar ? `Ranking · ${bar.name}` : "Ranking · ZonaMundial",
    robots: { index: false, follow: true },
  };
}

export default async function BarRankingPage({ params }: { params: { barSlug: string } }) {
  const bar = await getBarBySlug(params.barSlug);
  if (!bar) notFound();
  if (!(await barIsLive(bar))) return <BarInactiveScreen bar={bar} />;

  const t = getTheme(bar.theme_id);
  const standings = await barLeaderboard(bar);
  const medal = (pos: number) => (pos === 1 ? "#FFD54A" : pos === 2 ? "#C7CDD6" : pos === 3 ? "#D89B6A" : t.textMuted);

  return (
    <main style={{ minHeight: "100vh", background: t.bg, color: t.text }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 16px 48px" }}>
        <Link href={`/b/${bar.slug}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, color: t.textMuted, fontSize: 13, textDecoration: "none", marginBottom: 16 }}>
          <ArrowLeft size={14} /> {bar.name}
        </Link>

        <h1 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 22, fontWeight: 900, margin: "0 0 4px" }}>
          <Trophy size={20} color={t.primary} /> Clasificación
        </h1>
        <p style={{ color: t.textMuted, fontSize: 14, margin: "0 0 20px" }}>Porra del Mundial · {bar.name}</p>

        {standings.length === 0 ? (
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: t.cardRadius, padding: 20, color: t.textMuted, fontSize: 14, textAlign: "center" }}>
            Aún no hay participantes. Comparte el QR del bar para empezar.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {standings.map((s) => (
              <div key={s.user_id} style={{
                display: "flex", alignItems: "center", gap: 12,
                background: t.surface, border: `1px solid ${s.position <= 3 ? medal(s.position) : t.border}`,
                borderRadius: t.cardRadius, padding: "11px 14px",
              }}>
                <span style={{ fontWeight: 900, fontSize: 16, color: medal(s.position), width: 26, display: "inline-flex", alignItems: "center", gap: 2 }}>
                  {s.position <= 3 && <Crown size={13} />}{s.position}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.display_name}</div>
                  {s.bracket_points > 0 && (
                    <div style={{ color: t.textMuted, fontSize: 11 }}>{s.match_points} partidos · {s.bracket_points} bracket</div>
                  )}
                </div>
                <span style={{ fontWeight: 800, fontSize: 15, color: t.secondary }}>{s.points} pts</span>
              </div>
            ))}
          </div>
        )}

        {/* CTA predecir */}
        <Link href="/app/predicciones/jugar" style={{
          display: "inline-flex", width: "100%", boxSizing: "border-box", justifyContent: "center", alignItems: "center", gap: 8,
          marginTop: 18, background: t.primary, color: t.primaryInk, textDecoration: "none",
          borderRadius: t.buttonRadius, fontWeight: 800, fontSize: 15, padding: "13px 18px",
        }}>
          Predecir más partidos <ArrowRight size={17} />
        </Link>

        {/* Bloque ZM */}
        <section style={{ background: `linear-gradient(135deg, ${t.surface}, ${t.surface2})`, border: `1px solid ${t.border}`, borderRadius: t.cardRadius, padding: 16, marginTop: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 14 }}>
            <Star size={15} color={t.secondary} /> Sigue compitiendo en ZonaMundial
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <Link href="/app/rankings" style={{ flex: "1 1 auto", textAlign: "center", textDecoration: "none", background: t.surface2, color: t.text, border: `1px solid ${t.border}`, borderRadius: t.buttonRadius, fontWeight: 700, fontSize: 13, padding: "9px 12px" }}>
              Ranking global
            </Link>
            <Link href="/trivia" style={{ flex: "1 1 auto", textAlign: "center", textDecoration: "none", background: t.surface2, color: t.text, border: `1px solid ${t.border}`, borderRadius: t.buttonRadius, fontWeight: 700, fontSize: 13, padding: "9px 12px" }}>
              Trivia diaria
            </Link>
          </div>
        </section>

        <footer style={{ textAlign: "center", marginTop: 24 }}>
          <Link href="/" style={{ color: t.textMuted, fontSize: 12, textDecoration: "none", fontWeight: 600 }}>
            Powered by <span style={{ color: t.secondary, fontWeight: 800 }}>ZonaMundial</span>
          </Link>
        </footer>
      </div>
    </main>
  );
}
