"use client";

// EditorialIntro — bloque editorial denso para SEO + AdSense.
// Aporta ~600 palabras de texto sustantivo sobre qué es ZonaMundial,
// por qué existe y cómo se diferencia. Crucial para que Google
// detecte el sitio como "publisher de contenido" y no como app landing.
//
// Visible para todos los usuarios. Renderizado en SSR. No depende de JS.

import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";

const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const MID = "#8a94b0";

export function EditorialIntro() {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  return (
    <section
      style={{
        background: "linear-gradient(180deg, transparent 0%, rgba(15,29,50,0.4) 50%, transparent 100%)",
        padding: "80px 20px",
        position: "relative",
      }}
      aria-labelledby="editorial-intro-h2"
    >
      <div style={{ maxWidth: 900, margin: "0 auto", color: MID, lineHeight: 1.7 }}>
        <p
          style={{
            color: GOLD,
            fontSize: 12,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          {isEn ? "About the project" : "Sobre el proyecto"}
        </p>

        <h2
          id="editorial-intro-h2"
          style={{
            color: GOLD2,
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 800,
            margin: "0 0 28px",
            letterSpacing: "-0.025em",
            lineHeight: 1.1,
          }}
        >
          {isEn
            ? "The first World Cup that fits in your pocket — built in Spanish, by football fans, for football fans."
            : "El primer Mundial que cabe en tu bolsillo — hecho en español, por fans del fútbol, para fans del fútbol."}
        </h2>

        {isEn ? <EnglishCopy /> : <SpanishCopy />}

        <div
          style={{
            marginTop: 40,
            paddingTop: 28,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/sobre"
            style={{
              padding: "10px 18px",
              background: GOLD,
              color: "#060B14",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
              borderRadius: 6,
            }}
          >
            {isEn ? "About ZonaMundial →" : "Sobre ZonaMundial →"}
          </Link>
          <Link
            href="/selecciones"
            style={{
              padding: "10px 18px",
              background: "transparent",
              color: GOLD,
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
              borderRadius: 6,
              border: `1px solid ${GOLD}`,
            }}
          >
            {isEn ? "Browse 48 teams →" : "Ver las 48 selecciones →"}
          </Link>
          <Link
            href="/blog"
            style={{
              padding: "10px 18px",
              background: "transparent",
              color: MID,
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            {isEn ? "Read the blog →" : "Leer el blog →"}
          </Link>
        </div>
      </div>
    </section>
  );
}

function SpanishCopy() {
  return (
    <>
      <p style={{ fontSize: 18, color: "#cbd5e1", marginBottom: 22 }}>
        El Mundial 2026 va a ser distinto a todos los anteriores. Por primera vez en la historia jugarán <strong style={{ color: "#fff" }}>48 selecciones</strong>{" "}
        repartidas en <strong style={{ color: "#fff" }}>12 grupos</strong>, en <strong style={{ color: "#fff" }}>16 sedes</strong> de tres países anfitriones —{" "}
        Estados Unidos, Canadá y México — durante <strong style={{ color: "#fff" }}>39 días</strong> y <strong style={{ color: "#fff" }}>104 partidos</strong>.
        Es el torneo más grande, más complejo y más comercial que ha organizado la FIFA. Y también el que más fans hispanohablantes va a movilizar de toda la historia.
      </p>

      <p style={{ marginBottom: 18 }}>
        ZonaMundial nace para acompañar ese Mundial desde un sitio único en español. No somos una casa de apuestas, ni una app de quinielas
        improvisada, ni un blog automatizado. Somos un proyecto editorial-first construido en Valencia por{" "}
        <Link href="https://sprintmarkt.com/es/" target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>
          Sprintmarkt
        </Link>
        , agencia digital con una década de experiencia en producto, marketing y SEO. Nuestro equipo combina periodistas deportivos, ingenieros de
        software, diseñadores UX y product managers distribuidos entre España, México, Argentina y Colombia.
      </p>

      <p style={{ marginBottom: 18 }}>
        El sitio existe para ser <strong style={{ color: "#fff" }}>la enciclopedia oficiosa del Mundial 2026 en español</strong>: 48 fichas de selecciones
        redactadas a mano con historia mundialista año por año, plantillas verificadas, análisis táctico, palmarés, partidos icónicos y curiosidades. 16 fichas
        de sedes con datos, ubicación, capacidad e historia de los estadios. 12 fichas de grupos con calendarios, predicciones y favoritos. Calendario completo
        de los 104 partidos sincronizado con tu zona horaria. Y un blog editorial donde periodistas hispanohablantes con experiencia en medios deportivos
        (Marca, Olé, Globo, ESPN Latinoamérica) publican análisis profundos, previas, crónicas y opinión.
      </p>

      <p style={{ marginBottom: 18 }}>
        Por encima de eso hay una <strong style={{ color: "#fff" }}>plataforma de gamificación gratuita</strong>: predicciones partido a partido con sistema de
        puntos transparente, fantasy de selecciones nacionales, trivia con preguntas verificadas, ligas privadas para grupos de amigos, álbum digital
        coleccionable de los 48 equipos y un IA Coach desarrollado con modelos de lenguaje de Anthropic que te sugiere alineaciones y análisis cuando la
        cabeza ya no da más. Todo el acceso es gratuito; los jugadores compiten por posiciones en rankings públicos y privados, no por dinero. ZonaMundial
        no es un sitio de apuestas: es entretenimiento futbolístico y comunidad.
      </p>

      <p style={{ marginBottom: 18 }}>
        Nos importa la calidad. Cada dato numérico se cruza con al menos dos fuentes oficiales antes de publicarse. Cada foto de jugador en las fichas
        proviene de Wikimedia Commons con licencia Creative Commons verificada. Cada artículo del blog lleva firma, fecha de publicación y bio del autor.
        Si publicamos un error, lo corregimos visiblemente con sello "Actualizado el [fecha]" — sin reescribir historia. Si quieres saber más sobre cómo
        trabajamos, lee la página{" "}
        <Link href="/sobre" style={{ color: GOLD, fontWeight: 600 }}>
          Sobre ZonaMundial
        </Link>
        , consulta nuestras{" "}
        <Link href="/legal/privacidad" style={{ color: GOLD, fontWeight: 600 }}>
          políticas de privacidad
        </Link>{" "}
        o escríbenos por{" "}
        <Link href="/contacto" style={{ color: GOLD, fontWeight: 600 }}>
          el formulario de contacto
        </Link>
        .
      </p>

      <p>
        El Mundial empieza el <strong style={{ color: "#fff" }}>11 de junio de 2026</strong> en el Estadio Azteca con México vs Sudáfrica.
        Tenemos hasta entonces para terminar de construir la mejor experiencia digital posible para 480 millones de hispanohablantes que vivirán el torneo.
        Si quieres acompañarnos, regístrate gratis, sigue el blog, comparte una ficha que te haya gustado o únete a la comunidad de creadores. Cualquier
        ayuda suma.
      </p>
    </>
  );
}

function EnglishCopy() {
  return (
    <>
      <p style={{ fontSize: 18, color: "#cbd5e1", marginBottom: 22 }}>
        The 2026 World Cup is going to be different. For the first time in history, <strong style={{ color: "#fff" }}>48 national teams</strong> will play
        across <strong style={{ color: "#fff" }}>12 groups</strong> in <strong style={{ color: "#fff" }}>16 venues</strong> spread over three host countries —
        the United States, Canada and Mexico — for <strong style={{ color: "#fff" }}>39 days</strong> and <strong style={{ color: "#fff" }}>104 matches</strong>.
        It is the largest, most complex and most commercial tournament FIFA has ever organized. It is also the one that will mobilize the most
        Spanish-speaking fans in history.
      </p>

      <p style={{ marginBottom: 18 }}>
        ZonaMundial exists to cover that World Cup from a single Spanish-first home on the internet. We are not a sportsbook, not a hastily-built prediction
        app, not an automated blog. We are an editorial-first project built in Valencia (Spain) by{" "}
        <Link href="https://sprintmarkt.com/es/" target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>
          Sprintmarkt
        </Link>
        , a digital agency with a decade of experience in product, marketing and SEO. Our team combines sports journalists, software engineers,
        UX designers and product managers distributed across Spain, Mexico, Argentina and Colombia.
      </p>

      <p style={{ marginBottom: 18 }}>
        The site exists to be <strong style={{ color: "#fff" }}>the unofficial 2026 World Cup encyclopedia in Spanish</strong>: 48 national team pages written
        by hand with edition-by-edition World Cup history, verified squads, tactical analysis, palmares, iconic matches and curiosities. 16 venue pages with
        data, location, capacity and stadium history. 12 group pages with fixtures, predictions and favorites. A full 104-match calendar synced to your time
        zone. And an editorial blog where Spanish-speaking journalists with experience at Marca, Olé, Globo and ESPN Latinoamérica publish deep analysis,
        previews, match reports and opinion.
      </p>

      <p style={{ marginBottom: 18 }}>
        On top of that, a <strong style={{ color: "#fff" }}>free gamification platform</strong>: match-by-match predictions with a transparent points system,
        national-team fantasy, verified trivia, private leagues for groups of friends, a digital collectible album of all 48 teams and an AI Coach built with
        Anthropic language models that suggests lineups and analysis when your head is fried. All access is free; players compete for positions in public and
        private rankings, not for money. ZonaMundial is not a betting site: it is football entertainment and community.
      </p>

      <p style={{ marginBottom: 18 }}>
        We care about quality. Every numerical fact is cross-checked against at least two official sources before publication. Every player photo on the team
        pages comes from Wikimedia Commons with a verified Creative Commons license. Every blog article carries author byline, publication date and an author
        bio. If we publish a mistake, we correct it visibly with an "Updated on [date]" stamp — without rewriting history. To learn more about how we work,
        read the{" "}
        <Link href="/sobre" style={{ color: GOLD, fontWeight: 600 }}>
          About ZonaMundial
        </Link>{" "}
        page, check our{" "}
        <Link href="/legal/privacidad" style={{ color: GOLD, fontWeight: 600 }}>
          privacy policies
        </Link>{" "}
        or write us via the{" "}
        <Link href="/contacto" style={{ color: GOLD, fontWeight: 600 }}>
          contact form
        </Link>
        .
      </p>

      <p>
        The World Cup kicks off on <strong style={{ color: "#fff" }}>June 11, 2026</strong> at Estadio Azteca with Mexico vs South Africa. We have until then
        to finish building the best possible digital experience for 480 million Spanish-speaking fans who will live the tournament. If you want to join us,
        sign up for free, follow the blog, share a team page you liked, or join the creator community. Any help counts.
      </p>
    </>
  );
}
