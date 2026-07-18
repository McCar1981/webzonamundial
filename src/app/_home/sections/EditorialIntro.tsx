"use client";

// EditorialIntro — bloque editorial denso para SEO + AdSense.
// Aporta ~600 palabras de texto sustantivo SIN parecer un muro de texto:
// stats cards intercaladas, sub-secciones con H3, pull quote destacada
// y CTAs visuales. Mobile-first: font-size cómodo y respiración entre bloques.

import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";

const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const MID = "rgba(255,255,255,0.72)";
const DIM = "rgba(255,255,255,0.55)";

export function EditorialIntro() {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  return (
    <section
      style={{
        background:
          "linear-gradient(180deg, transparent 0%, rgba(20,17,10,0.35) 40%, rgba(20,17,10,0.45) 60%, transparent 100%)",
        padding: "72px 18px",
        position: "relative",
      }}
      aria-labelledby="editorial-intro-h2"
    >
      <div style={{ maxWidth: 880, margin: "0 auto", color: MID }}>
        {/* Eyebrow */}
        <p
          style={{
            color: GOLD,
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: 14,
            margin: 0,
          }}
        >
          {isEn ? "About the project" : "Sobre el proyecto"}
        </p>

        {/* H2 más compacto */}
        <h2
          id="editorial-intro-h2"
          style={{
            color: GOLD2,
            fontSize: "clamp(24px, 4.5vw, 38px)",
            fontWeight: 800,
            margin: "8px 0 22px",
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}
        >
          {isEn
            ? "The first World Cup that fits in your pocket."
            : "El primer Mundial que cabe en tu bolsillo."}
        </h2>

        {/* Lead — 1 párrafo corto y potente */}
        <p
          style={{
            fontSize: "clamp(15px, 2.2vw, 18px)",
            lineHeight: 1.65,
            color: "rgba(255,255,255,0.85)",
            marginBottom: 28,
            fontWeight: 400,
          }}
        >
          {isEn
            ? "Built in Spanish, by football fans, for football fans. ZonaMundial is the home for the 480 million Spanish-speaking fans who will live the 2026 World Cup — the biggest tournament FIFA has ever organized."
            : "Hecho en español, por fans del fútbol, para fans del fútbol. ZonaMundial es la casa de los 480 millones de hispanohablantes que van a vivir el Mundial 2026 — el torneo más grande que jamás ha organizado la FIFA."}
        </p>

        {/* Stats cards — rompen el muro de texto */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8,
            marginBottom: 32,
          }}
          className="zm-edit-stats"
        >
          <Stat n="48" l={isEn ? "Teams" : "Selecciones"} />
          <Stat n="16" l={isEn ? "Venues" : "Sedes"} />
          <Stat n="104" l={isEn ? "Matches" : "Partidos"} />
          <Stat n="39" l={isEn ? "Days" : "Días"} />
        </div>

        {/*
          Cuerpo editorial largo plegado en <details>: el visitante ve una home
          limpia, pero el texto sigue en el HTML servido (el crawler de AdSense
          lo lee igual). No es cloaking: es contenido expandible por el usuario.
        */}
        <details className="zm-edit-more">
          <summary className="zm-edit-summary">
            {isEn ? "Read more about the project" : "Seguir leyendo sobre el proyecto"}
          </summary>
          <div style={{ marginTop: 18 }}>{isEn ? <EnCopy /> : <EsCopy />}</div>
        </details>

        {/* CTAs */}
        <div
          style={{
            marginTop: 32,
            paddingTop: 24,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/sobre"
            style={{
              padding: "10px 16px",
              background: GOLD,
              color: "#000000",
              fontWeight: 600,
              fontSize: 13,
              textDecoration: "none",
              borderRadius: 6,
              whiteSpace: "nowrap",
            }}
          >
            {isEn ? "About ZonaMundial →" : "Sobre ZonaMundial →"}
          </Link>
          <Link
            href="/selecciones"
            style={{
              padding: "10px 16px",
              background: "transparent",
              color: GOLD,
              fontWeight: 600,
              fontSize: 13,
              textDecoration: "none",
              borderRadius: 6,
              border: `1px solid ${GOLD}`,
              whiteSpace: "nowrap",
            }}
          >
            {isEn ? "48 teams →" : "48 selecciones →"}
          </Link>
          <Link
            href="/blog"
            style={{
              padding: "10px 16px",
              background: "transparent",
              color: MID,
              fontWeight: 600,
              fontSize: 13,
              textDecoration: "none",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.15)",
              whiteSpace: "nowrap",
            }}
          >
            {isEn ? "Blog →" : "Blog →"}
          </Link>
        </div>
      </div>

      {/* Mobile: stats grid 2x2 (más cómodo) */}
      <style>{`
        @media (max-width: 540px) {
          .zm-edit-stats {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        .zm-edit-more > summary {
          list-style: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: ${GOLD};
          font-size: 14px;
          font-weight: 600;
          padding: 10px 0;
          user-select: none;
        }
        .zm-edit-more > summary::-webkit-details-marker { display: none; }
        .zm-edit-more > summary::after {
          content: "+";
          font-size: 18px;
          line-height: 1;
          opacity: 0.8;
        }
        .zm-edit-more[open] > summary::after { content: "−"; }
        .zm-edit-more[open] > summary { margin-bottom: 4px; }
      `}</style>
    </section>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div
      style={{
        background: "rgba(10,9,6,0.6)",
        border: "1px solid rgba(212,168,83,0.18)",
        borderRadius: 8,
        padding: "12px 8px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          color: GOLD2,
          fontSize: "clamp(22px, 4vw, 30px)",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1,
          marginBottom: 4,
        }}
      >
        {n}
      </div>
      <div
        style={{
          color: DIM,
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        {l}
      </div>
    </div>
  );
}

/* ───────────── Sub-headers que rompen el texto ───────────── */
function SubH({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        color: "#E2E8F0",
        fontSize: "clamp(16px, 2.4vw, 19px)",
        fontWeight: 700,
        margin: "26px 0 10px",
        letterSpacing: "-0.01em",
        lineHeight: 1.3,
      }}
    >
      {children}
    </h3>
  );
}

const P_STYLE: React.CSSProperties = {
  fontSize: "clamp(14px, 2vw, 15px)",
  lineHeight: 1.72,
  color: MID,
  margin: "0 0 14px",
};

/* ───────────── Pull quote ───────────── */
function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote
      style={{
        margin: "22px 0",
        padding: "16px 18px",
        borderLeft: `3px solid ${GOLD}`,
        background: "rgba(212,168,83,0.06)",
        borderRadius: "0 8px 8px 0",
        fontFamily: "var(--zm-font-outfit, sans-serif)",
        fontSize: "clamp(15px, 2.2vw, 18px)",
        lineHeight: 1.45,
        color: "#E2E8F0",
        fontWeight: 500,
        letterSpacing: "-0.005em",
      }}
    >
      {children}
    </blockquote>
  );
}

/* ───────────── ES copy ───────────── */
function EsCopy() {
  return (
    <>
      <SubH>Una enciclopedia hispana del Mundial 2026</SubH>
      <p style={P_STYLE}>
        ZonaMundial nace para ser <strong style={{ color: "#fff" }}>la enciclopedia oficiosa del Mundial 2026 en español</strong>:
        48 fichas de selecciones redactadas a mano con historia mundialista año por año, plantillas verificadas, análisis táctico,
        palmarés, partidos icónicos y curiosidades. 16 fichas de sedes con datos, ubicación, capacidad e historia. 12 fichas de grupos
        con calendarios, predicciones y favoritos. Calendario completo de los 104 partidos sincronizado con tu zona horaria.
      </p>

      <SubH>Producto editorial-first, no app de quinielas</SubH>
      <p style={P_STYLE}>
        No somos una casa de apuestas ni un blog automatizado. Somos un proyecto construido en Valencia por{" "}
        <Link href="https://sprintmarkt.com/es/" target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>
          Sprintmarkt
        </Link>{" "}
        con un equipo distribuido entre España, México, Argentina y Colombia: periodistas deportivos, ingenieros, diseñadores UX y
        product managers. Cada artículo del blog lleva firma, fecha y bio. Las correcciones se aceptan públicamente.
      </p>

      <PullQuote>
        &ldquo;Queremos que la ficha de Argentina sirva aunque nunca uses la app: Power Index, trayectoria FIFA, plantilla actual,
        análisis táctico. Sin clickbait.&rdquo;
      </PullQuote>

      <SubH>Plataforma gratuita, no apuestas</SubH>
      <p style={P_STYLE}>
        Por encima del contenido editorial hay <strong style={{ color: "#fff" }}>una plataforma de gamificación gratuita</strong>:
        predicciones partido a partido con puntos transparentes, fantasy de selecciones, trivia verificada, ligas privadas para grupos
        de amigos, álbum digital coleccionable y un IA Coach con modelos de Anthropic que sugiere alineaciones. Los jugadores compiten
        por posiciones en rankings, no por dinero. ZonaMundial no es un sitio de apuestas: es entretenimiento y comunidad.
      </p>

      <SubH>Compromiso con la calidad</SubH>
      <p style={P_STYLE}>
        Cada dato numérico se cruza con dos fuentes oficiales antes de publicarse. Cada foto de jugador viene de Wikimedia Commons con
        licencia Creative Commons verificada. Si publicamos un error, lo corregimos visiblemente con sello{" "}
        <em>&ldquo;Actualizado el [fecha]&rdquo;</em>. Si quieres saber más, lee{" "}
        <Link href="/sobre" style={{ color: GOLD, fontWeight: 600 }}>
          Sobre ZonaMundial
        </Link>{" "}
        o escríbenos a través del{" "}
        <Link href="/contacto" style={{ color: GOLD, fontWeight: 600 }}>
          formulario de contacto
        </Link>
        .
      </p>

      <p style={{ ...P_STYLE, fontStyle: "italic", color: DIM, marginTop: 18 }}>
        El Mundial empieza el <strong style={{ color: "#fff", fontStyle: "normal" }}>11 de junio de 2026</strong> en el Estadio Azteca
        con México vs Sudáfrica. Tenemos hasta entonces para terminar de construir la mejor experiencia digital posible.
      </p>
    </>
  );
}

/* ───────────── EN copy ───────────── */
function EnCopy() {
  return (
    <>
      <SubH>A Spanish-first 2026 World Cup encyclopedia</SubH>
      <p style={P_STYLE}>
        ZonaMundial exists to be <strong style={{ color: "#fff" }}>the unofficial 2026 World Cup encyclopedia in Spanish</strong>: 48
        national team pages written by hand with edition-by-edition history, verified squads, tactical analysis, palmares, iconic
        matches and curiosities. 16 venue pages with data, location, capacity and stadium history. 12 group pages with fixtures,
        predictions and favorites. A full 104-match calendar synced to your time zone.
      </p>

      <SubH>Editorial-first, not just a prediction app</SubH>
      <p style={P_STYLE}>
        We are not a sportsbook or an automated blog. We are a project built in Valencia by{" "}
        <Link href="https://sprintmarkt.com/es/" target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>
          Sprintmarkt
        </Link>{" "}
        with a team distributed across Spain, Mexico, Argentina and Colombia: sports journalists, engineers, UX designers and product
        managers. Every blog article carries byline, date and author bio. Corrections are accepted publicly.
      </p>

      <PullQuote>
        &ldquo;We want Argentina&apos;s team page to be useful even if you never use the app: Power Index, FIFA trajectory, current squad,
        tactical analysis. No clickbait.&rdquo;
      </PullQuote>

      <SubH>Free platform, not betting</SubH>
      <p style={P_STYLE}>
        On top of the editorial content sits <strong style={{ color: "#fff" }}>a free gamification platform</strong>: match-by-match
        predictions with a transparent points system, national-team fantasy, verified trivia, private leagues for groups of friends, a
        digital collectible album and an AI Coach built with Anthropic models that suggests lineups. Players compete for positions in
        rankings, not for money. ZonaMundial is not a betting site: it&apos;s football entertainment and community.
      </p>

      <SubH>Quality commitment</SubH>
      <p style={P_STYLE}>
        Every numerical fact is cross-checked against two official sources before publication. Every player photo comes from Wikimedia
        Commons with a verified Creative Commons license. If we publish a mistake, we correct it visibly with an{" "}
        <em>&ldquo;Updated on [date]&rdquo;</em> stamp. To learn more, read the{" "}
        <Link href="/sobre" style={{ color: GOLD, fontWeight: 600 }}>
          About
        </Link>{" "}
        page or write us via the{" "}
        <Link href="/contacto" style={{ color: GOLD, fontWeight: 600 }}>
          contact form
        </Link>
        .
      </p>

      <p style={{ ...P_STYLE, fontStyle: "italic", color: DIM, marginTop: 18 }}>
        The World Cup kicks off on <strong style={{ color: "#fff", fontStyle: "normal" }}>June 11, 2026</strong> at Estadio Azteca with
        Mexico vs South Africa. We have until then to finish building the best possible digital experience.
      </p>
    </>
  );
}
