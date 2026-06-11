// src/app/quiniela-mundial-2026/page.tsx
// Landing editorial SEO: "quiniela / porra / prode / polla / penca Mundial 2026".
// Auditoría SEO 11-jun: hueco transaccional con SERPs débiles y producto propio
// superior (Predicciones + Piques 1v1 + ligas privadas). Server component
// estático, sin datos en vivo: el juego real vive en /app/predicciones.

import type { Metadata } from "next";
import Link from "next/link";

const BG = "#060B14", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a";

export const metadata: Metadata = {
  title: "Quiniela Mundial 2026: crea tu porra gratis",
  description:
    "Crea tu quiniela del Mundial 2026 gratis y compite con tus amigos: porra, prode, polla o penca con marcador en vivo, ranking automático y sin apuestas.",
  keywords: [
    "quiniela mundial 2026",
    "quiniela mundial 2026 con amigos",
    "porra mundial 2026",
    "prode mundial 2026",
    "polla mundial 2026",
    "penca mundial 2026",
    "quiniela mundial gratis",
  ],
  alternates: { canonical: "/quiniela-mundial-2026" },
  openGraph: {
    title: "Quiniela Mundial 2026: crea tu porra gratis",
    description:
      "Tu quiniela del Mundial 2026 con amigos: predicciones partido a partido, marcador en vivo y ranking automático. Gratis y sin apuestas.",
    url: "/quiniela-mundial-2026",
    siteName: "ZonaMundial",
    type: "website",
    images: ["/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quiniela Mundial 2026 gratis",
    description: "Crea tu porra del Mundial con amigos: en vivo, automática y sin apuestas.",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "¿La quiniela del Mundial 2026 de ZonaMundial es gratis?",
    a: "Sí, totalmente gratis. Creas tu cuenta, haces tus predicciones y compites con tus amigos sin pagar nada. No hay apuestas ni dinero en juego: se compite por puntos, ranking y orgullo.",
  },
  {
    q: "¿Cómo invito a mis amigos a la quiniela?",
    a: "Creas tu liga privada y compartes el enlace o el código de invitación por WhatsApp o por donde quieras. Cada amigo entra con su cuenta gratuita y aparece en el ranking de la liga automáticamente.",
  },
  {
    q: "¿Hace falta descargar una app?",
    a: "No. ZonaMundial funciona desde el navegador del móvil o del ordenador, y si quieres puedes instalarla como webapp en tu pantalla de inicio. No ocupa espacio ni requiere tienda de aplicaciones.",
  },
  {
    q: "¿Cómo se puntúa en la quiniela?",
    a: "Predices cada partido del Mundial 2026 y sumas puntos al acertar. El sistema resuelve los partidos automáticamente con el resultado real y actualiza el ranking en vivo: durante el partido ya ves si tu predicción va ganando o perdiendo.",
  },
  {
    q: "¿Puedo crear varias quinielas a la vez?",
    a: "Sí. Puedes jugar la quiniela general y a la vez crear ligas privadas distintas: una con la familia, otra con el trabajo y otra con tu grupo de amigos, cada una con su propio ranking.",
  },
  {
    q: "¿Qué pasa con las eliminatorias y la prórroga?",
    a: "Las eliminatorias también se predicen. En cada partido la web te indica claramente qué cuenta para puntuar, así no hay discusiones de grupo de WhatsApp a las once de la noche.",
  },
  {
    q: "¿Se juega con dinero real?",
    a: "No. ZonaMundial es un juego gratuito de predicciones, sin apuestas y sin premios en metálico. La gracia es la competición con tus amigos: el ranking, los piques y la gloria de ganar tu liga.",
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
    {
      "@type": "ListItem",
      position: 2,
      name: "Quiniela Mundial 2026",
      item: "https://zonamundial.app/quiniela-mundial-2026",
    },
  ],
};

/* Nombres regionales del mismo juego: cada fila es también una keyword. */
const NOMBRES: Array<{ nombre: string; donde: string; nota: string }> = [
  { nombre: "Quiniela", donde: "México, España, Centroamérica", nota: "El término más extendido en el mundo hispano." },
  { nombre: "Porra", donde: "España", nota: "La de la oficina y el grupo de amigos de toda la vida." },
  { nombre: "Prode", donde: "Argentina, Uruguay", nota: "De «pronósticos deportivos», un clásico rioplatense." },
  { nombre: "Polla", donde: "Chile, Perú, Colombia", nota: "La polla mundialera entre colegas, famosa en cada Mundial." },
  { nombre: "Penca", donde: "Uruguay, Paraguay", nota: "Mismo juego, nombre charrúa." },
];

const PASOS: Array<{ n: string; titulo: string; texto: string }> = [
  {
    n: "1",
    titulo: "Crea tu cuenta gratis",
    texto: "Un minuto, sin tarjeta. Con tu cuenta entras a predicciones, fantasy, trivia y el resto de juegos del Mundial.",
  },
  {
    n: "2",
    titulo: "Haz tus predicciones",
    texto: "Pronostica los partidos del Mundial 2026, desde el México–Sudáfrica inaugural hasta la final del 19 de julio.",
  },
  {
    n: "3",
    titulo: "Invita a tus amigos y compite",
    texto: "Monta tu liga privada, comparte el código y que hable el ranking. Resolución automática: cero hojas de cálculo.",
  },
];

const VENTAJAS: Array<{ titulo: string; texto: string }> = [
  {
    titulo: "Marcador y ranking en vivo",
    texto: "Cada predicción se resuelve sola con el resultado real. Durante el partido ves si la vas ganando o la estás perdiendo, minuto a minuto.",
  },
  {
    titulo: "Piques 1 contra 1",
    texto: "Reta a un amigo a un duelo directo por un partido concreto. El cara a cara de toda porra, elevado a deporte.",
  },
  {
    titulo: "Ligas privadas ilimitadas",
    texto: "Familia, oficina, peña, grupo del colegio. Cada liga con su ranking, su código de invitación y su pique propio.",
  },
  {
    titulo: "Sin apuestas, sin dinero",
    texto: "Es un juego gratuito: nada de casas de apuestas ni premios en metálico. Compites por puntos y por la gloria.",
  },
  {
    titulo: "IA Coach para tus pronósticos",
    texto: "Un asistente con datos de las 48 selecciones te ayuda a pensar cada pick. Decidir sigue siendo cosa tuya.",
  },
  {
    titulo: "Todo el Mundial alrededor",
    texto: "Calendario con tu hora local, grupos al día, noticias diarias y la historia completa de los Mundiales en la misma web.",
  },
];

export default function QuinielaMundial2026Page() {
  return (
    <main style={{ background: BG, minHeight: "100vh", color: MID, padding: "80px 20px 60px" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <Link href="/" style={{ color: GOLD, fontSize: 13, textDecoration: "none", opacity: 0.7 }}>
          ← Volver al inicio
        </Link>

        <p style={{ color: GOLD, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 24, marginBottom: 8, fontWeight: 600 }}>
          Quiniela · Porra · Prode · Polla · Penca
        </p>

        <h1 style={{ color: GOLD2, fontSize: 42, fontWeight: 800, margin: "0 0 20px", letterSpacing: "-0.04em", lineHeight: 1.08 }}>
          Quiniela del Mundial 2026: crea tu porra gratis y compite con tus amigos
        </h1>

        <p style={{ fontSize: 17, lineHeight: 1.7, margin: "0 0 16px" }}>
          El Mundial 2026 ya está aquí: 48 selecciones, 12 grupos y 104 partidos entre el 11 de junio
          y el 19 de julio. Y con él vuelve el ritual que une oficinas, familias y grupos de WhatsApp:
          la quiniela. En ZonaMundial puedes crear la tuya <b style={{ color: "#fff" }}>gratis</b>, con
          resolución automática de resultados, ranking en vivo y piques 1 contra 1 — sin hojas de
          cálculo, sin discusiones y sin apuestas.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "24px 0 8px" }}>
          <Link
            href="/registro"
            style={{ background: GOLD, color: "#0B0F1A", fontWeight: 700, fontSize: 15, padding: "12px 22px", borderRadius: 12, textDecoration: "none" }}
          >
            Crear mi quiniela gratis
          </Link>
          <Link
            href="/app/predicciones"
            style={{ border: `1px solid ${GOLD}`, color: GOLD, fontWeight: 600, fontSize: 15, padding: "12px 22px", borderRadius: 12, textDecoration: "none" }}
          >
            Ver el juego de predicciones
          </Link>
        </div>

        {/* ¿Por qué este Mundial es distinto? */}
        <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: "48px 0 12px" }}>
          La quiniela de siempre, en el Mundial más difícil de acertar
        </h2>
        <p style={{ fontSize: 16, lineHeight: 1.7, margin: "0 0 14px" }}>
          Una quiniela del Mundial es sencilla: cada participante pronostica los partidos y gana quien
          más acierta. Lo complicado, esta vez, es acertar. El de 2026 es el primer Mundial con{" "}
          <Link href="/selecciones" style={{ color: GOLD, textDecoration: "none" }}>48 selecciones</Link>{" "}
          repartidas en{" "}
          <Link href="/grupos" style={{ color: GOLD, textDecoration: "none" }}>12 grupos</Link>, con una
          fase nueva en la que también se clasifican los{" "}
          <Link href="/grupos/mejores-terceros" style={{ color: GOLD, textDecoration: "none" }}>
            8 mejores terceros
          </Link>{" "}
          y unos dieciseisavos de final inéditos. Más partidos, más sorpresas y más oportunidades de
          remontar en tu liga: el{" "}
          <Link href="/calendario" style={{ color: GOLD, textDecoration: "none" }}>calendario completo</Link>{" "}
          tiene 104 citas para puntuar.
        </p>

        {/* Nombres regionales */}
        <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: "44px 0 12px" }}>
          Un mismo juego, muchos nombres
        </h2>
        <p style={{ fontSize: 16, lineHeight: 1.7, margin: "0 0 18px" }}>
          ¿Quiniela, porra, prode, polla o penca? Depende de dónde seas, pero el juego es el mismo — y
          en ZonaMundial caben todos.
        </p>
        <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, overflow: "hidden", marginBottom: 8 }}>
          {NOMBRES.map((n, i) => (
            <div
              key={n.nombre}
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                padding: "12px 16px",
                background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span style={{ color: GOLD2, fontWeight: 700, minWidth: 90 }}>{n.nombre}</span>
              <span style={{ color: "#fff", minWidth: 220, fontSize: 14 }}>{n.donde}</span>
              <span style={{ fontSize: 14 }}>{n.nota}</span>
            </div>
          ))}
        </div>

        {/* Cómo crearla */}
        <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: "44px 0 12px" }}>
          Cómo crear tu quiniela del Mundial 2026 en 3 pasos
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, margin: "0 0 18px" }}>
          {PASOS.map((p) => (
            <div key={p.n} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "18px 16px", background: "rgba(255,255,255,0.02)" }}>
              <div style={{ color: GOLD, fontSize: 28, fontWeight: 800, marginBottom: 6 }}>{p.n}</div>
              <div style={{ color: "#fff", fontWeight: 700, marginBottom: 6 }}>{p.titulo}</div>
              <div style={{ fontSize: 14, lineHeight: 1.6 }}>{p.texto}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.7, margin: "0 0 8px" }}>
          Eso es todo. Nada de plantillas de Excel que alguien tiene que corregir a mano después de
          cada jornada: aquí los resultados entran solos y el ranking se mueve en cuanto se mueve el
          marcador.
        </p>

        {/* Ventajas */}
        <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: "44px 0 12px" }}>
          Qué hace distinta la quiniela de ZonaMundial
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 14, margin: "0 0 8px" }}>
          {VENTAJAS.map((v) => (
            <div key={v.titulo} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "18px 16px" }}>
              <div style={{ color: GOLD2, fontWeight: 700, marginBottom: 6 }}>{v.titulo}</div>
              <div style={{ fontSize: 14, lineHeight: 1.6 }}>{v.texto}</div>
            </div>
          ))}
        </div>

        {/* Consejos */}
        <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: "44px 0 12px" }}>
          Tres consejos para ganar tu porra
        </h2>
        <p style={{ fontSize: 16, lineHeight: 1.7, margin: "0 0 12px" }}>
          <b style={{ color: "#fff" }}>1. Estudia los grupos, no solo a los favoritos.</b> Las ligas se
          ganan en los partidos que nadie mira: un empate bien visto en el{" "}
          <Link href="/grupos/grupo-f" style={{ color: GOLD, textDecoration: "none" }}>Grupo F</Link> vale
          lo mismo que acertar a Brasil. Repasa los{" "}
          <Link href="/grupos" style={{ color: GOLD, textDecoration: "none" }}>12 grupos</Link> antes de
          rellenar nada.
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.7, margin: "0 0 12px" }}>
          <b style={{ color: "#fff" }}>2. Entiende la regla de los terceros.</b> Ocho de los doce
          terceros pasan de ronda: equipos que parecen eliminados siguen vivos hasta el final. Nuestra{" "}
          <Link href="/grupos/mejores-terceros" style={{ color: GOLD, textDecoration: "none" }}>
            tabla de mejores terceros
          </Link>{" "}
          se actualiza en vivo para que no se te escape ninguno.
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.7, margin: "0 0 12px" }}>
          <b style={{ color: "#fff" }}>3. La historia pesa.</b> Los Mundiales castigan a los soberbios:
          campeones eliminados en grupos, debutantes en cuartos. Un paseo por la{" "}
          <Link href="/historia" style={{ color: GOLD, textDecoration: "none" }}>historia de los Mundiales</Link>{" "}
          antes de predecir es la mejor inversión. Y si quieres jugar con las llaves completas, arma tu
          pronóstico en el{" "}
          <Link href="/bracket" style={{ color: GOLD, textDecoration: "none" }}>simulador del Mundial 2026</Link>.
        </p>

        {/* Bares y empresas */}
        <div style={{ border: `1px solid rgba(201,168,76,0.35)`, background: "rgba(201,168,76,0.06)", borderRadius: 14, padding: "20px 18px", margin: "40px 0 0" }}>
          <div style={{ color: GOLD2, fontWeight: 700, marginBottom: 6 }}>
            ¿La quiniela es para tu bar o tu empresa?
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.7 }}>
            Tenemos versiones pensadas para locales y equipos:{" "}
            <Link href="/bares" style={{ color: GOLD, textDecoration: "none" }}>porra digital para bares</Link>{" "}
            con ranking de clientes, y{" "}
            <Link href="/empresas" style={{ color: GOLD, textDecoration: "none" }}>porra para empresas</Link>{" "}
            para el equipo entero, sin que nadie tenga que perseguir resultados.
          </div>
        </div>

        {/* FAQ */}
        <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: "48px 0 14px" }}>
          Preguntas frecuentes sobre la quiniela del Mundial 2026
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
            El Mundial se juega una vez cada cuatro años. Tu quiniela, también.
          </p>
          <Link
            href="/registro"
            style={{ display: "inline-block", background: GOLD, color: "#0B0F1A", fontWeight: 700, fontSize: 16, padding: "14px 28px", borderRadius: 12, textDecoration: "none" }}
          >
            Crear mi quiniela gratis
          </Link>
          <p style={{ color: DIM, fontSize: 13, marginTop: 12 }}>
            Sin apuestas, sin dinero y sin descargas. Solo fútbol y tus amigos.
          </p>
        </div>
      </div>
    </main>
  );
}
