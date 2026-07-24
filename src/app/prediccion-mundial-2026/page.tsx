// src/app/prediccion-mundial-2026/page.tsx
//
// Landing SEO PÚBLICA de Predicciones del Mundial 2026. Tercera fuga de la
// auditoría GSC (22-jun): el clúster "predicción/pronóstico/predecir mundial
// 2026" suma ~24k impr/sem y hoy cae al HOME (pos ~8), no a una página propia.
// "prediccion mundial 2026" solo = 5.842 impr. El juego real (Predicciones)
// vive en /app/predicciones (noindex), así que esta página, en ruta RAÍZ e
// indexable, explica el modo con los 8 TIPOS y la PUNTUACIÓN REALES del código
// (src/lib/predictions/scoring.ts + types.ts + pro/limits.ts) y lleva a /registro.
//
// VERACIDAD: a diferencia del fantasy, Predicciones SÍ es la vía del Gran Premio
// (Gift Cards 300/200/100€ al top 3 por TASA DE ACIERTO, mín. 20 predicciones —
// bases en /legal/bases-gran-premio). Por eso AQUÍ sí usamos la barra fija y el
// popup de Gift Cards: es exacto. Concurso de habilidad, gratis, sin apuestas.
//
// Estática (explicador evergreen; el juego vive en /app/predicciones/jugar).
// Título plano → el layout raíz añade "| ZonaMundial". Complementa, no canibaliza,
// a /quiniela-mundial-2026 (keywords porra/prode/polla) — se enlazan entre sí.

import type { Metadata } from "next";
import Link from "next/link";
import StickyCta from "@/app/grupos/mejores-terceros/StickyCta";

const BG = "#000000", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#a69a82", DIM = "#6e6552";

export const metadata: Metadata = {
  title: "Predicción Mundial 2026: predice gratis y gana premios",
  description:
    "Predice los 104 partidos del Mundial 2026 de 8 formas distintas, gratis: resultado exacto, ganador, goleador y más. Ranking en vivo, ligas con amigos y Gift Cards de 300/200/100 € a los más certeros.",
  keywords: [
    "prediccion mundial 2026",
    "predicciones mundial 2026",
    "predecir mundial 2026",
    "pronostico mundial 2026",
    "app para predecir el mundial",
    "juego de prediccion del mundial 2026",
  ],
  alternates: { canonical: "/prediccion-mundial-2026" },
  openGraph: {
    title: "Predicción Mundial 2026: predice gratis y gana premios",
    description:
      "8 formas de predecir el Mundial 2026, gratis. Ranking en vivo, ligas con amigos y Gift Cards de 300/200/100 € a los más certeros.",
    url: "/prediccion-mundial-2026",
    siteName: "ZonaMundial",
    type: "website",
    images: ["/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Predicción Mundial 2026",
    description: "Predice los 104 partidos de 8 formas, gratis. Ranking en vivo y premios a los más certeros.",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

// Los 8 tipos REALES (src/lib/predictions/types.ts) con puntos de scoring.ts.
const TIPOS: Array<{ nombre: string; desc: string; pts: string }> = [
  { nombre: "Resultado exacto", desc: "Acierta el marcador final del partido. El más difícil de clavar.", pts: "hasta 25 pts" },
  { nombre: "Ganador con confianza", desc: "Local, empate o visitante — y cuánta confianza le pones (×1, ×2 o ×3).", pts: "10–30 pts" },
  { nombre: "Primer goleador", desc: "Quién marca el primer gol del partido.", pts: "hasta 30 pts" },
  { nombre: "Predicción encadenada", desc: "Combina varias predicciones en una sola jugada: más eslabones, más puntos.", pts: "hasta 100 pts" },
  { nombre: "Duelo de jugadores", desc: "Cuál de dos cracks rinde mejor: goles, asistencias, tarjetas…", pts: "15 pts" },
  { nombre: "Over / Under", desc: "Si el total de goles (o córners, o tarjetas) supera un número.", pts: "8–20 pts" },
  { nombre: "Minuto del drama", desc: "En qué franja del partido caerá un gol clave.", pts: "hasta 25 pts" },
  { nombre: "Modo manada", desc: "Ve con la mayoría para puntos seguros, o a contracorriente para llevarte más.", pts: "10–30 pts" },
];

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "¿Cómo funcionan las predicciones del Mundial 2026?",
    a: "Eliges un partido (hay 104, desde la fase de grupos hasta la final) y haces tu predicción de una de 8 formas distintas: desde el resultado exacto o el ganador hasta el primer goleador, duelos de jugadores o el minuto del gol. El sistema resuelve cada partido solo con el resultado real y suma tus puntos; durante el encuentro ya ves en vivo si vas ganando.",
  },
  {
    q: "¿Es gratis?",
    a: "Sí. Crear tu cuenta, predecir, competir en el ranking global y jugar en ligas privadas con tus amigos es gratis. El plan Pro quita los límites del plan gratuito (más partidos por jornada, todos los tipos y los multiplicadores), pero no hace falta para competir ni para optar al premio.",
  },
  {
    q: "¿Cómo se gana el Gran Premio?",
    a: "Es un concurso de habilidad: ganan los tres primeros del ranking por tasa de acierto, con un mínimo de 20 predicciones válidas durante el torneo. El reparto son Gift Cards de 300, 200 y 100 € para el 1.º, 2.º y 3.º. Participar es gratis, no hay azar ni apuestas, y se decide solo por lo que aciertes.",
  },
  {
    q: "¿Qué formas de predecir hay?",
    a: "Ocho: resultado exacto, ganador con confianza, primer goleador, predicción encadenada, duelo de jugadores, over/under, minuto del gol y modo manada (con la mayoría o a contracorriente). Cada tipo tiene su recompensa, y los aciertos pueden multiplicarse por rachas, por predecir con antelación y por el Modo Underdog en partidos desigualados.",
  },
  {
    q: "¿Puedo jugar con mis amigos?",
    a: "Sí. Puedes retar a un amigo a un duelo 1 contra 1 por un partido concreto y crear o unirte a ligas privadas con un código, cada una con su propio ranking. Unirse a una liga es gratis.",
  },
  {
    q: "¿Se juega con dinero o apuestas?",
    a: "No. Es un juego de predicciones gratuito, sin apuestas ni dinero en juego: se compite por puntos, por el ranking y por la gloria. El Gran Premio es un concurso de habilidad patrocinado, gratis y fuera de la regulación de juego.",
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
    { "@type": "ListItem", position: 2, name: "Predicciones", item: "https://zonamundial.app/prediccion-mundial-2026" },
  ],
};

export default function PrediccionMundialPage() {
  return (
    <main style={{ background: BG, minHeight: "100vh", color: MID, padding: "24px 20px 60px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <nav style={{ fontSize: 13, opacity: 0.8 }}>
          <Link href="/" style={{ color: GOLD, textDecoration: "none" }}>Inicio</Link>
          <span style={{ margin: "0 6px", color: DIM }}>/</span>
          <span style={{ color: MID }}>Predicciones</span>
        </nav>

        <p style={{ color: GOLD, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 24, marginBottom: 8, fontWeight: 600 }}>
          8 formas de predecir · gratis · sin apuestas
        </p>

        <h1 style={{ color: GOLD2, fontSize: 42, fontWeight: 800, margin: "0 0 20px", letterSpacing: "-0.04em", lineHeight: 1.08 }}>
          Predicción del Mundial 2026: predice cada partido y compite
        </h1>

        <p style={{ fontSize: 17, lineHeight: 1.7, margin: "0 0 14px" }}>
          Predecir no es adivinar. En ZonaMundial pronosticas los <b style={{ color: "#fff" }}>104 partidos</b> del
          Mundial 2026 de <b style={{ color: "#fff" }}>8 formas distintas</b> —desde el resultado exacto hasta el primer
          goleador o el minuto del gol—, el sistema los resuelve solo con el resultado real y sumas puntos en vivo. Es{" "}
          <b style={{ color: "#fff" }}>gratis</b>, sin apuestas, y los más certeros del torneo se llevan{" "}
          <b style={{ color: GOLD2 }}>Gift Cards de 300/200/100 €</b>.
        </p>

        {/* CTA arriba (intención transaccional: quieren predecir) */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", margin: "20px 0 8px" }}>
          <Link href="/registro" style={{ display: "inline-block", background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`, color: "#0a0906", fontWeight: 800, fontSize: 15, padding: "12px 26px", borderRadius: 12, textDecoration: "none", whiteSpace: "nowrap" }}>
            Crear mi cuenta gratis y predecir →
          </Link>
          <Link href="/app/predicciones" style={{ display: "inline-block", border: `1px solid ${GOLD}`, color: GOLD, fontWeight: 600, fontSize: 15, padding: "12px 24px", borderRadius: 12, textDecoration: "none" }}>
            Ver el juego de predicciones
          </Link>
        </div>

        {/* Las 8 formas */}
        <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: "44px 0 6px" }}>
          Las 8 formas de predecir
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 16px" }}>
          Cada partido es una oportunidad. Elige el tipo que mejor se te dé —o combínalos— y suma puntos al acertar.
        </p>
        <div style={{ display: "grid", gap: 10 }}>
          {TIPOS.map((t) => (
            <div key={t.nombre} style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: "4px 12px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 16px" }}>
              <div style={{ flex: "1 1 280px" }}>
                <span style={{ color: GOLD2, fontWeight: 800, fontSize: 15 }}>{t.nombre}</span>
                <span style={{ fontSize: 14, lineHeight: 1.5, color: MID }}> — {t.desc}</span>
              </div>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}>{t.pts}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 13, color: DIM, margin: "10px 2px 0" }}>
          Tus aciertos se multiplican por <b style={{ color: MID }}>rachas</b>, por predecir con{" "}
          <b style={{ color: MID }}>antelación</b> y por el <b style={{ color: MID }}>Modo Underdog</b> (hasta el doble en
          partidos desigualados). Y si <b style={{ color: MID }}>clavas los 8 tipos en un mismo partido</b>, te llevas un{" "}
          <b style={{ color: MID }}>bonus de 500 Fútcoins</b>.
        </p>

        {/* El premio / cómo se gana */}
        <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: "44px 0 12px" }}>
          Predice mejor que nadie y gana
        </h2>
        <p style={{ fontSize: 16, lineHeight: 1.7, margin: "0 0 12px" }}>
          Hay un <b style={{ color: "#fff" }}>ranking global por tasa de acierto</b> que se actualiza en vivo. Al final del
          torneo, los <b style={{ color: "#fff" }}>tres más certeros</b> se llevan <b style={{ color: GOLD2 }}>Gift Cards
          de 300, 200 y 100 €</b>. Es un concurso de <b style={{ color: "#fff" }}>habilidad</b> (lo decide tu acierto, no el
          azar), <b style={{ color: "#fff" }}>gratis</b> y sin apuestas; solo necesitas un mínimo de 20 predicciones para
          optar.{" "}
          <Link href="/legal/bases-gran-premio" style={{ color: GOLD, textDecoration: "none" }}>Consulta las bases</Link>.
        </p>

        {/* Modalidades */}
        <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: "44px 0 12px" }}>
          Y no se predice en solitario
        </h2>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
          {[
            ["Piques 1 contra 1", "Reta a un amigo a un duelo directo por un partido concreto. El cara a cara de toda la vida, elevado a deporte."],
            ["Ligas privadas", "Familia, oficina o grupo del cole: crea o únete a una liga con un código y que hable el ranking. Unirse es gratis."],
            ["Ranking en vivo", "Tu tasa de acierto y tu posición, actualizadas en cuanto se mueve el marcador. Sin hojas de cálculo."],
          ].map(([t, d]) => (
            <div key={t} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ color: GOLD2, fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{t}</div>
              <div style={{ fontSize: 14, lineHeight: 1.55 }}>{d}</div>
            </div>
          ))}
        </div>

        {/* Gratis vs Pro (honesto) */}
        <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: "44px 0 12px" }}>
          Gratis para jugar y para ganar
        </h2>
        <p style={{ fontSize: 16, lineHeight: 1.7, margin: "0 0 12px" }}>
          Predecir, competir en el ranking, jugar en ligas y optar al premio es <b style={{ color: "#fff" }}>gratis</b>. El
          plan <Link href="/pro" style={{ color: GOLD, textDecoration: "none" }}>Pro</Link> es para quien quiere exprimirlo al
          máximo: predice todos los partidos que quieras, desbloquea los 8 tipos en todos los encuentros y activa los
          multiplicadores. Pero el premio se decide por acierto, así que jugar gratis también compite por las Gift Cards.
        </p>

        {/* CTA medio */}
        <div style={{ margin: "24px 0 8px", padding: "18px 20px", borderRadius: 16, border: "1px solid rgba(201,168,76,0.22)", background: "rgba(255,255,255,0.02)" }}>
          <p style={{ color: "#fff", fontSize: 18, fontWeight: 800, margin: "0 0 6px" }}>
            ¿Sabes de fútbol? Demuéstralo y gana.
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.6, margin: "0 0 14px" }}>
            Crea tu cuenta gratis, empieza a predecir y entra en el ranking que reparte las Gift Cards.
          </p>
          <Link href="/registro" style={{ display: "inline-block", background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`, color: "#0a0906", fontWeight: 800, fontSize: 15, padding: "12px 26px", borderRadius: 12, textDecoration: "none" }}>
            Crear mi cuenta gratis →
          </Link>
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

        {/* CTA final + enlaces internos */}
        <div style={{ textAlign: "center", padding: "28px 16px 8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: "0 0 16px" }}>
            104 partidos. 8 formas de acertar. Un campeón del pronóstico.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/registro" style={{ display: "inline-block", background: GOLD, color: "#0a0906", fontWeight: 800, fontSize: 15, padding: "12px 24px", borderRadius: 12, textDecoration: "none" }}>
              Crear mi cuenta gratis
            </Link>
            <Link href="/quiniela-mundial-2026" style={{ display: "inline-block", border: `1px solid ${GOLD}`, color: GOLD, fontWeight: 600, fontSize: 15, padding: "12px 24px", borderRadius: 12, textDecoration: "none" }}>
              ¿Prefieres una porra con amigos?
            </Link>
          </div>
        </div>

        <div style={{ height: 64 }} aria-hidden />
      </div>

      <StickyCta />
    </main>
  );
}
