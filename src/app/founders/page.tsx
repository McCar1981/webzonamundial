// /founders — landing pública (no requiere login) con contador en vivo,
// ingresos transparentes y CTA hacia /cuenta/comprar.

import type { Metadata } from "next";
import Link from "next/link";
import { getFoundersCount, getRevenueCents, listEvents } from "@/lib/founders/store";
import { getCurrentUser } from "@/lib/auth-helpers";
import { isFounder } from "@/lib/founders/store";

export const metadata: Metadata = {
  title: "Founders Pass · ZonaMundial 2026",
  description:
    "Apoya el proyecto y desbloquea ventajas durante todo el Mundial 2026: navegación sin publicidad, estadísticas avanzadas, beta access, sticker pack e insignia Founders.",
  alternates: { canonical: "/founders" },
  openGraph: {
    title: "Founders Pass · ZonaMundial 2026",
    description:
      "El equipo fundador de ZonaMundial. 8 € (Europa) · 6 USD (LATAM/USA). Pago único, válido para todo el Mundial.",
    url: "/founders",
    type: "website",
    siteName: "ZonaMundial",
    images: [{ url: "/img/blog/portada-zona-mundial.png", width: 1200, height: 630 }],
  },
};

export const revalidate = 60; // contador casi-real-time

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "ahora mismo";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

export default async function FoundersLandingPage() {
  // Tolerantes a fallos de KV/Supabase (en local sin env vars la página
  // sigue siendo navegable; en prod las llamadas funcionan normalmente).
  const [count, revenueCents, events, user] = await Promise.all([
    getFoundersCount().catch(() => 0),
    getRevenueCents().catch(() => 0),
    listEvents(8).catch(() => []),
    getCurrentUser().catch(() => null),
  ]);
  const userIsFounder = user?.email ? await isFounder(user.email).catch(() => false) : false;
  const purchaseEvents = events.filter((e) => e.type === "purchase").slice(0, 6);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(201,168,76,0.15), transparent 60%), linear-gradient(180deg, #060B14, #0B1825)",
        color: "#fff",
        fontFamily: "Outfit, system-ui, sans-serif",
      }}
    >
      {/* HERO */}
      <section style={{ padding: "clamp(48px, 8vw, 96px) 20px 64px", textAlign: "center" }}>
        <div className="max-w-3xl mx-auto">
          <div
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 11,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "#C9A84C",
              fontWeight: 700,
              marginBottom: 18,
            }}
          >
            {/* FOUNDERS PASS · MUNDIAL 2026 */}
          </div>
          <h1
            style={{
              fontWeight: 900,
              fontSize: "clamp(36px, 6vw, 64px)",
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
              marginBottom: 18,
              textWrap: "balance" as React.CSSProperties["textWrap"],
            }}
          >
            Sé parte del{" "}
            <span
              style={{
                backgroundImage: "linear-gradient(135deg,#C9A84C,#E8C76B 50%,#FDE68A)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              equipo fundador
            </span>{" "}
            de ZonaMundial
          </h1>
          <p
            style={{
              fontSize: "clamp(16px, 1.6vw, 19px)",
              lineHeight: 1.55,
              color: "#94a3b8",
              maxWidth: 640,
              margin: "0 auto 32px",
              fontStyle: "italic",
              fontFamily: "Source Serif 4, Crimson Pro, Georgia, serif",
            }}
          >
            Pago único válido para todo el Mundial 2026. Sin suscripciones, sin
            renovaciones automáticas. Reembolso total disponible si cambias de opinión.
          </p>

          {userIsFounder ? (
            <Link
              href="/cuenta/founders-pass"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-bold text-[#1A1208] no-underline"
              style={{
                background: "linear-gradient(135deg,#C9A84C,#E8C76B 50%,#FDE68A)",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.15) inset, 0 0 30px -8px rgba(201,168,76,0.55)",
              }}
            >
              🏆 Eres Founder · Ver mi panel
            </Link>
          ) : (
            <Link
              href="/cuenta/comprar"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-bold text-[#1A1208] no-underline transition-transform hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg,#C9A84C,#E8C76B 50%,#FDE68A)",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.15) inset, 0 0 30px -8px rgba(201,168,76,0.55)",
                fontSize: 15,
              }}
            >
              Conseguir mi Founders Pass
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </Link>
          )}
        </div>
      </section>

      {/* CONTADOR EN VIVO */}
      <section style={{ padding: "0 20px 64px", maxWidth: 1100, margin: "0 auto" }}>
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          style={{
            border: "1px solid rgba(201,168,76,0.25)",
            borderRadius: 18,
            padding: 24,
            background: "linear-gradient(180deg, rgba(15,31,48,0.6), rgba(11,24,37,0.3))",
          }}
        >
          <Stat label="Founders activos" value={count.toString()} sub={count === 0 ? "Sé el primero" : count === 1 ? "El primero ya está" : "Y subiendo"} />
          <Stat label="Precio Europa" value="8 €" sub="Pago único" />
          <Stat label="Precio LATAM/USA" value="6 USD" sub="Pago único" />
        </div>

        {purchaseEvents.length > 0 && (
          <div style={{ marginTop: 20, fontSize: 13, color: "#94a3b8", textAlign: "center" }}>
            {purchaseEvents.length === 1 ? (
              <span>1 persona ya se ha unido al equipo Founders.</span>
            ) : (
              <span>
                Últimas <b style={{ color: "#FDE68A" }}>{purchaseEvents.length}</b> incorporaciones al
                equipo Founders.
              </span>
            )}
            <ul style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginTop: 12, listStyle: "none", padding: 0 }}>
              {purchaseEvents.map((e, i) => (
                <li
                  key={i}
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 11,
                    padding: "4px 10px",
                    borderRadius: 99,
                    background: "rgba(201,168,76,0.08)",
                    border: "1px solid rgba(201,168,76,0.20)",
                    color: "#C9A84C",
                  }}
                >
                  ● {timeAgo(e.ts)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* QUÉ INCLUYE */}
      <section style={{ padding: "0 20px 80px", maxWidth: 980, margin: "0 auto" }}>
        <h2
          style={{
            fontWeight: 900,
            fontSize: "clamp(26px, 3.5vw, 34px)",
            letterSpacing: "-0.02em",
            marginBottom: 28,
            textAlign: "center",
          }}
        >
          ¿Qué incluye el Founders Pass?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PerkCard
            icon="🚫"
            title="Cero publicidad"
            text="Navegación 100% limpia en toda la plataforma. Sin AdSense, sin trackers de anuncios, sin interrupciones."
          />
          <PerkCard
            icon="📊"
            title="Estadísticas avanzadas"
            text="xG, mapas de calor, comparativas entre jugadores, expected assists y métricas Opta no disponibles en el plan gratuito."
          />
          <PerkCard
            icon="🚀"
            title="Beta access"
            text="Acceso anticipado a nuevas funcionalidades antes que el resto. Tu feedback alimenta el roadmap."
          />
          <PerkCard
            icon="💎"
            title="Sticker pack exclusivo"
            text="Pack de stickers oficial del Mundial 2026 para WhatsApp e Instagram, solo para Founders."
          />
          <PerkCard
            icon="🏅"
            title="Insignia permanente"
            text="Insignia 'Founders' visible en tu perfil para siempre. Cuando ZonaMundial crezca, tú estuviste primero."
          />
          <PerkCard
            icon="❤️"
            title="Apoyas el proyecto"
            text="Tu pago va directo a sostener servidores, datos en vivo y la redacción editorial. Sin tu apoyo, esto no existe."
          />
        </div>
      </section>

      {/* TRANSPARENCIA */}
      <section style={{ padding: "0 20px 96px", maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
        <div
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#C9A84C",
            marginBottom: 14,
          }}
        >
          {/* TRANSPARENCIA */}
        </div>
        <h2 style={{ fontWeight: 800, fontSize: 24, letterSpacing: "-0.02em", marginBottom: 14 }}>
          ¿A dónde va tu dinero?
        </h2>
        <p style={{ color: "#94a3b8", lineHeight: 1.7, fontSize: 15 }}>
          El 100% de los ingresos del Founders Pass se destinan a <b style={{ color: "#fff" }}>sostener
          la plataforma</b>: servidores, base de datos, datos en vivo de partidos, derechos de imágenes,
          email transaccional y redacción editorial. Sin tu apoyo, ZonaMundial no podría ofrecer un plan
          gratuito completo. <b style={{ color: "#fff" }}>Cada Founder hace posible que el resto juegue gratis.</b>
        </p>

        <div
          style={{
            marginTop: 32,
            padding: 24,
            borderRadius: 16,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            fontSize: 14,
            color: "#cbd5e1",
            lineHeight: 1.6,
          }}
        >
          <b style={{ color: "#FDE68A" }}>💸 Reembolso garantizado.</b> Si por cualquier motivo cambias
          de opinión, solicita el reembolso desde tu panel{" "}
          <Link href="/cuenta/founders-pass" style={{ color: "#C9A84C" }}>
            /cuenta/founders-pass
          </Link>{" "}
          y Stripe procesa la devolución íntegra en 1-3 días hábiles. Sin preguntas.
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: "0 20px 100px", textAlign: "center" }}>
        {userIsFounder ? null : (
          <Link
            href="/cuenta/comprar"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-[#1A1208] no-underline transition-transform hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg,#C9A84C,#E8C76B 50%,#FDE68A)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.15) inset, 0 0 40px -8px rgba(201,168,76,0.55)",
              fontSize: 16,
            }}
          >
            Conseguir mi Founders Pass
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </Link>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={{ textAlign: "center", padding: "16px 8px" }}>
      <div
        style={{
          fontWeight: 900,
          fontSize: "clamp(36px, 5vw, 52px)",
          letterSpacing: "-0.02em",
          lineHeight: 1,
          backgroundImage: "linear-gradient(135deg,#C9A84C,#FDE68A)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 10,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.55)",
          marginTop: 8,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>{sub}</div>
    </div>
  );
}

function PerkCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div
      style={{
        padding: 22,
        borderRadius: 14,
        border: "1px solid rgba(201,168,76,0.18)",
        background: "linear-gradient(180deg, rgba(15,31,48,0.5), rgba(11,24,37,0.3))",
      }}
    >
      <div style={{ fontSize: 26, marginBottom: 10 }}>{icon}</div>
      <h3 style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.01em", marginBottom: 6 }}>{title}</h3>
      <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.55, margin: 0 }}>{text}</p>
    </div>
  );
}
