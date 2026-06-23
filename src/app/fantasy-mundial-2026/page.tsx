// src/app/fantasy-mundial-2026/page.tsx
//
// Landing SEO PÚBLICA del Fantasy del Mundial 2026. El juego (y su explicación
// con animaciones) ya existe en /app/fantasy, pero /app es noindex (Disallow):
// Google no lo ve, así que perdemos ~7.500 impresiones/semana de "fantasy
// mundial 2026" y variantes (auditoría GSC 22-jun). Esta página, en ruta RAÍZ
// e indexable, explica el fantasy con las REGLAS Y PUNTUACIÓN REALES del código
// (src/lib/fantasy/scoring.ts y rules.ts) y lleva a /registro.
//
// Estática (sin datos en vivo): es un explicador evergreen, el juego vive en
// /app/fantasy/jugar. Título plano → el layout raíz añade "| ZonaMundial".
//
// OJO veracidad: las Gift Cards del Gran Premio se ganan por ACIERTO DE
// PREDICCIONES (mín. 20), no por el fantasy. Por eso aquí NO usamos el popup ni
// la barra de Gift Cards (sería engañoso): el gancho es el fantasy en sí
// (gratis, ligas privadas, puntos reales por jornada).

import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";

const BG = "#060B14", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a", GREEN = "#22c55e", RED = "#ef6a6a";

export const metadata: Metadata = {
  title: "Fantasy Mundial 2026: arma tu equipo gratis",
  description:
    "Juega gratis al Fantasy del Mundial 2026: elige 15 jugadores (máx. 3 por selección), 100M€, capitán y comodines, y suma puntos reales cada jornada. Crea tu equipo y compite en ligas privadas.",
  keywords: [
    "fantasy mundial 2026",
    "fantasy mundial",
    "liga fantasy mundial 2026",
    "fantasy futbol mundial 2026",
    "juego fantasy mundial 2026",
  ],
  alternates: { canonical: "/fantasy-mundial-2026" },
  openGraph: {
    title: "Fantasy Mundial 2026: arma tu equipo gratis",
    description:
      "Elige 15 jugadores, máximo 3 por selección, 100M€, capitán y comodines. Puntos reales cada jornada y ligas privadas. Gratis.",
    url: "/fantasy-mundial-2026",
    siteName: "ZonaMundial",
    type: "website",
    images: ["/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fantasy Mundial 2026",
    description: "Arma tu equipo gratis: 15 jugadores, comodines y puntos reales por jornada.",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

// Valores REALES de src/lib/fantasy/scoring.ts (no inventar).
const SCORING_POS: Array<{ accion: string; pts: string; good: boolean }> = [
  { accion: "Jugar 60 minutos o más", pts: "+2", good: true },
  { accion: "Jugar menos de 60 minutos", pts: "+1", good: true },
  { accion: "Gol de un delantero", pts: "+5", good: true },
  { accion: "Gol de un centrocampista", pts: "+6", good: true },
  { accion: "Gol de un defensa", pts: "+8", good: true },
  { accion: "Gol de un portero", pts: "+10", good: true },
  { accion: "Asistencia", pts: "+3", good: true },
  { accion: "Portería a cero (portero)", pts: "+5", good: true },
  { accion: "Portería a cero (defensa)", pts: "+4", good: true },
  { accion: "Hat-trick (bonus)", pts: "+5", good: true },
  { accion: "Penalti parado (portero)", pts: "+8", good: true },
  { accion: "Bonus a los 3 mejores del partido", pts: "+3 / +2 / +1", good: true },
];
const SCORING_NEG: Array<{ accion: string; pts: string; good: boolean }> = [
  { accion: "Tarjeta amarilla", pts: "−1", good: false },
  { accion: "Tarjeta roja", pts: "−3", good: false },
  { accion: "Gol en propia puerta", pts: "−3", good: false },
  { accion: "Penalti fallado", pts: "−3", good: false },
];

const POWERUPS: Array<{ nombre: string; desc: string }> = [
  { nombre: "Tridente", desc: "Tus 3 mejores jugadores de la jornada puntúan ×1,5." },
  { nombre: "Muro", desc: "Todos tus defensas puntúan doble esa jornada." },
  { nombre: "Francotirador", desc: "Si tu capitán marca, puntúa ×3 (en vez de ×2)." },
  { nombre: "Comodín", desc: "Fichajes ilimitados sin penalización durante una jornada." },
  { nombre: "Joker", desc: "Copia los puntos del mejor jugador de la jornada y súmalos." },
];

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "¿El Fantasy del Mundial 2026 es gratis?",
    a: "Sí, es totalmente gratis. Armas tu equipo, juegas todas las jornadas, compites en la clasificación global y te unes a ligas privadas sin pagar nada. El plan Pro añade extras (editar hasta el último minuto, sustituciones y puntos en vivo, y algo más de presupuesto), pero el juego completo es gratuito.",
  },
  {
    q: "¿Cómo se arma el equipo?",
    a: "Eliges 15 jugadores (11 titulares y 4 suplentes) de las 48 selecciones del Mundial, con un máximo de 3 jugadores por selección y un presupuesto de 100 millones. Escoges formación, capitán (puntúa doble) y vicecapitán, y puedes activar comodines en los momentos clave.",
  },
  {
    q: "¿Cómo se puntúa?",
    a: "Con datos reales de los partidos: tus jugadores suman por minutos, goles (más cuanto más atrás juega quien marca), asistencias y porterías a cero, y restan por tarjetas o errores. El capitán dobla sus puntos y el Modo Underdog multiplica los puntos de las selecciones menos favoritas.",
  },
  {
    q: "¿Puedo empezar ahora si el Mundial ya está en marcha?",
    a: "Sí. El fantasy se juega por jornadas: hay 8 en total (3 de la fase de grupos y 5 de la fase eliminatoria, hasta la final). Puedes incorporarte y competir en las jornadas que quedan; cada jornada es una nueva oportunidad de puntuar.",
  },
  {
    q: "¿Hay ligas privadas para jugar con amigos?",
    a: "Sí. Puedes unirte a ligas privadas con un código gratis y competir contra tus amigos, ya sea por la puntuación total del torneo o jornada a jornada. Crear tu propia liga está disponible con el plan Pro.",
  },
  {
    q: "¿Qué es el Modo Underdog?",
    a: "Un multiplicador que premia arriesgar con las selecciones menos favoritas: cuanto mayor es la diferencia de ranking FIFA en un partido, más se multiplican los puntos del equipo más débil (hasta el doble). Acertar con una sorpresa puede disparar tu jornada.",
  },
];

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: "https://zonamundial.app" },
    { "@type": "ListItem", position: 2, name: "Fantasy", item: "https://zonamundial.app/fantasy-mundial-2026" },
  ],
};

function ScoreTable({ rows, title }: { rows: typeof SCORING_POS; title: string }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.03)", color: DIM, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>
        {title}
      </div>
      {rows.map((r) => (
        <div key={r.accion} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "9px 14px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <span style={{ fontSize: 14, color: MID }}>{r.accion}</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: r.good ? GREEN : RED, whiteSpace: "nowrap" }}>{r.pts}</span>
        </div>
      ))}
    </div>
  );
}

const primaryCta: CSSProperties = {
  display: "inline-block", background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`, color: "#0A1422",
  fontWeight: 800, fontSize: 15, padding: "12px 26px", borderRadius: 12, textDecoration: "none", whiteSpace: "nowrap",
};
const secondaryCta: CSSProperties = {
  display: "inline-block", border: `1px solid ${GOLD}`, color: GOLD,
  fontWeight: 600, fontSize: 15, padding: "12px 24px", borderRadius: 12, textDecoration: "none",
};

export default function FantasyMundialPage() {
  return (
    <main style={{ background: BG, minHeight: "100vh", color: MID, padding: "24px 20px 60px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <nav style={{ fontSize: 13, opacity: 0.8 }}>
          <Link href="/" style={{ color: GOLD, textDecoration: "none" }}>Inicio</Link>
          <span style={{ margin: "0 6px", color: DIM }}>/</span>
          <span style={{ color: MID }}>Fantasy</span>
        </nav>

        <p style={{ color: GOLD, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 24, marginBottom: 8, fontWeight: 600 }}>
          Gratis · sin dinero · solo estrategia
        </p>

        <h1 style={{ color: GOLD2, fontSize: 42, fontWeight: 800, margin: "0 0 20px", letterSpacing: "-0.04em", lineHeight: 1.08 }}>
          Fantasy del Mundial 2026: arma tu equipo y compite
        </h1>

        <p style={{ fontSize: 17, lineHeight: 1.7, margin: "0 0 14px" }}>
          Elige <b style={{ color: "#fff" }}>15 jugadores</b> de las 48 selecciones del Mundial (máximo 3 por país),
          con <b style={{ color: "#fff" }}>100 millones</b> de presupuesto, capitán y comodines. Cada jornada sumas
          <b style={{ color: "#fff" }}> puntos reales</b> según lo que hagan tus jugadores en el campo. Sin dinero, sin
          draft: pura estrategia y conocimiento futbolístico. Y es <b style={{ color: "#fff" }}>gratis</b>.
        </p>

        {/* CTA arriba (transaccional: quien busca "fantasy mundial 2026" quiere jugar) */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", margin: "20px 0 8px" }}>
          <Link href="/registro" style={primaryCta}>Crear mi cuenta gratis y jugar →</Link>
          <Link href="/app/fantasy/jugar" style={secondaryCta}>Ya tengo cuenta — jugar</Link>
        </div>

        {/* Cómo funciona */}
        <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: "44px 0 14px" }}>
          Cómo funciona el Fantasy del Mundial 2026
        </h2>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", marginBottom: 8 }}>
          {[
            ["Tu plantilla", "15 jugadores: 11 titulares y 4 en el banquillo. Máximo 3 de una misma selección."],
            ["Presupuesto", "100 millones para repartir. Cada jugador tiene un precio según su valor real."],
            ["Formación y capitán", "7 formaciones (4-3-3, 4-4-2, 3-5-2…). Tu capitán puntúa el doble; el vice, ×1,5 si el capitán no juega."],
            ["8 jornadas", "3 de la fase de grupos y 5 de la eliminatoria, hasta la final. Un fichaje gratis por jornada."],
            ["Ligas privadas", "Únete con un código y compite con tus amigos por el total del torneo o jornada a jornada. Unirse es gratis."],
            ["Modo Underdog", "Los puntos de las selecciones menos favoritas se multiplican (hasta el doble). Arriesgar con la cenicienta paga."],
          ].map(([t, d]) => (
            <div key={t} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ color: GOLD2, fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{t}</div>
              <div style={{ fontSize: 14, lineHeight: 1.55 }}>{d}</div>
            </div>
          ))}
        </div>

        {/* Sistema de puntos */}
        <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: "44px 0 6px" }}>
          Sistema de puntos
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 16px" }}>
          Tus jugadores puntúan con lo que pasa de verdad en el campo. Cuanto más atrás juega quien marca, más vale el gol.
        </p>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          <ScoreTable rows={SCORING_POS} title="Suman" />
          <ScoreTable rows={SCORING_NEG} title="Restan" />
        </div>

        {/* Comodines */}
        <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: "44px 0 6px" }}>
          Los 5 comodines
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 16px" }}>
          Un solo uso de cada uno en todo el torneo. Guárdalos para el momento clave.
        </p>
        <div style={{ display: "grid", gap: 10 }}>
          {POWERUPS.map((p) => (
            <div key={p.nombre} style={{ display: "flex", gap: 12, alignItems: "baseline", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 16px" }}>
              <span style={{ color: GOLD2, fontWeight: 800, fontSize: 15, minWidth: 110 }}>{p.nombre}</span>
              <span style={{ fontSize: 14, lineHeight: 1.55 }}>{p.desc}</span>
            </div>
          ))}
        </div>

        {/* Gratis vs Pro (honesto) */}
        <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: "44px 0 12px" }}>
          Gratis para todos
        </h2>
        <p style={{ fontSize: 16, lineHeight: 1.7, margin: "0 0 12px" }}>
          El fantasy completo es gratuito: armas tu equipo, juegas las 8 jornadas, apareces en la clasificación global y
          te unes a ligas privadas sin pagar. El plan <Link href="/pro" style={{ color: GOLD, textDecoration: "none" }}>Pro</Link> añade
          extras para quienes quieren afinar al máximo —editar la plantilla hasta el último minuto, sustituciones y
          puntos <b style={{ color: "#fff" }}>en vivo</b> durante los partidos, y algo más de presupuesto— pero no hace
          falta para competir.
        </p>

        {/* CTA medio */}
        <div style={{ margin: "24px 0 8px", padding: "18px 20px", borderRadius: 16, border: "1px solid rgba(201,168,76,0.22)", background: "rgba(255,255,255,0.02)" }}>
          <p style={{ color: "#fff", fontSize: 18, fontWeight: 800, margin: "0 0 6px" }}>
            Tu XI ideal te está esperando.
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.6, margin: "0 0 14px" }}>
            Crea tu cuenta gratis, arma tu equipo y compite con tus amigos en una liga privada.
          </p>
          <Link href="/registro" style={primaryCta}>Crear mi cuenta gratis →</Link>
        </div>

        {/* FAQ */}
        <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: "44px 0 14px" }}>
          Preguntas frecuentes
        </h2>
        <div style={{ display: "grid", gap: 12, marginBottom: 32 }}>
          {FAQ.map((f) => (
            <details key={f.q} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px" }}>
              <summary style={{ color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 15 }}>{f.q}</summary>
              <p style={{ fontSize: 14, lineHeight: 1.7, margin: "10px 0 0" }}>{f.a}</p>
            </details>
          ))}
        </div>

        {/* CTA final */}
        <div style={{ textAlign: "center", padding: "28px 16px 8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: "0 0 16px" }}>
            15 jugadores. 1 campeón. Tu estrategia.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/registro" style={primaryCta}>Crear mi cuenta gratis</Link>
            <Link href="/dieciseisavos-mundial-2026" style={secondaryCta}>Ver el cuadro de eliminatorias</Link>
          </div>
        </div>

        <div style={{ height: 24 }} aria-hidden />
      </div>
    </main>
  );
}
