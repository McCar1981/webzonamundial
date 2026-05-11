import type { Metadata } from "next";
import Link from "next/link";

const BG = "#060B14", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a";

export const metadata: Metadata = {
  title: "Sobre ZonaMundial: quiénes somos y qué hacemos",
  description:
    "ZonaMundial es la plataforma hispana de predicciones, fantasy, trivia y streaming para el Mundial 2026. Construida en Valencia por Sprintmarkt. Conoce el equipo, la misión y la historia detrás del proyecto.",
  keywords: [
    "sobre zonamundial",
    "quiénes somos zonamundial",
    "equipo zonamundial",
    "sprintmarkt valencia",
    "plataforma mundial 2026",
    "fantasy mundial 2026 español",
  ],
  alternates: { canonical: "/sobre" },
  openGraph: {
    title: "Sobre ZonaMundial",
    description: "Quiénes somos, qué hacemos y por qué construimos la plataforma definitiva del Mundial 2026.",
    url: "/sobre",
    siteName: "ZonaMundial",
    type: "website",
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ZonaMundial",
  legalName: "Sprintmarkt S.L.",
  url: "https://zonamundial.app",
  logo: "https://zonamundial.app/og-image.jpg",
  foundingDate: "2025",
  founders: [{ "@type": "Person", name: "Carlos Acosta" }],
  address: {
    "@type": "PostalAddress",
    addressLocality: "Valencia",
    addressCountry: "ES",
  },
  contactPoint: [
    { "@type": "ContactPoint", contactType: "customer support", email: "gol@zonamundial.app", availableLanguage: ["Spanish", "English"] },
    { "@type": "ContactPoint", contactType: "press", email: "gol@zonamundial.app" },
    { "@type": "ContactPoint", contactType: "legal", email: "gol@zonamundial.app" },
  ],
  sameAs: [
    "https://www.instagram.com/zona.mundial",
    "https://www.tiktok.com/@zonamundialfutbol",
    "https://www.facebook.com/share/1Ay733gLRU/",
  ],
};

export default function SobrePage() {
  return (
    <main style={{ background: BG, minHeight: "100vh", color: MID, padding: "80px 20px 60px" }}>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <Link href="/" style={{ color: GOLD, fontSize: 13, textDecoration: "none", opacity: 0.7 }}>
          ← Volver al inicio
        </Link>

        <p style={{ color: GOLD, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 24, marginBottom: 8, fontWeight: 600 }}>
          Sobre el proyecto
        </p>

        <h1 style={{ color: GOLD2, fontSize: 48, fontWeight: 800, margin: "0 0 20px", letterSpacing: "-0.04em", lineHeight: 1.05 }}>
          La plataforma del Mundial 2026, hecha por fans, para fans.
        </h1>

        <p style={{ fontSize: 19, lineHeight: 1.55, color: "#94A3B8", maxWidth: 720, marginBottom: 48 }}>
          ZonaMundial nace en Valencia con una idea simple: que el Mundial 2026 no se viva solo en la televisión, sino
          también en el teléfono. Predicciones gratis, fantasy de selecciones, trivia diaria, streaming con creadores
          hispanos y un IA Coach que te ayuda a tomar decisiones cuando la cabeza ya no da más. Todo en español,
          en una sola app.
        </p>

        <Section title="Qué es ZonaMundial">
          <p>
            ZonaMundial es una plataforma digital de entretenimiento deportivo enfocada exclusivamente en la Copa del
            Mundo 2026 que organizan Estados Unidos, Canadá y México. Combinamos siete módulos en una experiencia única:
            predicciones partido a partido, fantasy de selecciones nacionales, trivia con preguntas verificadas,
            streaming con creadores hispanos, ligas privadas para grupos de amigos, un IA Coach que sugiere alineaciones
            y un álbum digital coleccionable de los 48 equipos clasificados.
          </p>
          <p style={{ marginTop: 16 }}>
            El acceso a la plataforma es <strong style={{ color: "#E2E8F0" }}>gratuito</strong>. Los jugadores compiten
            por puntos y posiciones en rankings públicos y privados, no por dinero. ZonaMundial no es un sitio de
            apuestas. Es entretenimiento futbolístico y gamificación social para los 39 días que dura el torneo más
            grande en la historia del fútbol.
          </p>
        </Section>

        <Section title="Por qué lo hacemos">
          <p>
            Vimos que cada Mundial los hispanohablantes terminamos repartidos entre apps en inglés, sitios de apuestas
            de baja calidad, grupos de WhatsApp para anotar predicciones en libretas, y porras informales en oficinas.
            Hay 480 millones de hispanos en el mundo y ninguna plataforma seria que centralice toda la experiencia con
            cuidado editorial, datos verificados y tono propio.
          </p>
          <p style={{ marginTop: 16 }}>
            En vez de hacer otra app de quinielas, decidimos construir un producto editorial-first: cada selección,
            cada sede, cada partido tiene su ficha redactada por personas con conocimiento real del fútbol, con
            fuentes citadas, fotos con licencia libre, y datos cruzados con FIFA, federaciones nacionales y
            cobertura especializada (L'Équipe, A Bola, Olé, Marca, The Athletic, Globo, Goal, etc.).
          </p>
          <p style={{ marginTop: 16 }}>
            Queremos que el sitio sea útil incluso si nunca usas la app: la ficha de Argentina te sirva para entender
            su Power Index, su trayectoria FIFA de los últimos 12 meses, su historia mundialista año por año, su
            plantilla con clubes actualizados y su análisis táctico. Sin clickbait, sin generadores automáticos, sin
            reescrituras de Wikipedia.
          </p>
        </Section>

        <Section title="Cómo funcionamos">
          <p>
            <strong style={{ color: "#E2E8F0" }}>Contenido editorial.</strong> Las 48 fichas de selecciones, las 16 sedes,
            los 12 grupos, el calendario completo, la historia de los 22 Mundiales previos y el blog editorial los
            mantiene un equipo interno de redacción más una red de colaboradores hispanohablantes con experiencia en
            medios deportivos (Marca, Olé, Globo, ESPN Latinoamérica, Goal). Cada artículo lleva firma, fecha y, cuando
            corresponde, bio del autor. Las correcciones se aceptan en <a href="mailto:gol@zonamundial.app" style={{ color: GOLD }}>gol@zonamundial.app</a> y se publican con marca de tiempo.
          </p>
          <p style={{ marginTop: 16 }}>
            <strong style={{ color: "#E2E8F0" }}>Plataforma de juego.</strong> Las predicciones, fantasy, trivia y
            módulos asociados se desarrollan en Next.js sobre infraestructura Vercel + Supabase. El IA Coach utiliza
            modelos de lenguaje de Anthropic (Claude) para sugerir alineaciones y analizar partidos en tiempo real,
            con prompts ajustados por nuestro equipo. Todos los datos de jugadores, clubes, partidos y resultados
            se cruzan con APIs oficiales de FIFA y federaciones nacionales.
          </p>
          <p style={{ marginTop: 16 }}>
            <strong style={{ color: "#E2E8F0" }}>Modelo de negocio.</strong> ZonaMundial es gratuito para todos los
            usuarios. Nos financiamos con publicidad display (incluida Google AdSense), patrocinios directos de marcas
            (cerveceras, deportivas, casas de apuestas legales en mercados donde aplique), suscripción Premium opcional
            (sin anuncios, con módulos avanzados), y acuerdos comerciales con creadores de contenido que reciben un
            porcentaje del tráfico que generan. Nunca vendemos datos personales de usuarios.
          </p>
        </Section>

        <Section title="El equipo">
          <p>
            ZonaMundial es un proyecto de <strong style={{ color: "#E2E8F0" }}>Sprintmarkt S.L.</strong>, agencia digital
            con sede en Valencia (España) especializada en producto digital, marketing performance y SEO. Sprintmarkt
            opera desde 2015 con clientes en e-commerce, banca, retail y deporte.
          </p>
          <p style={{ marginTop: 16 }}>
            El equipo de ZonaMundial combina perfiles editoriales (periodistas deportivos), técnicos (ingenieros
            frontend y backend), producto (diseñadores UX y product managers) y comerciales (partnerships y patrocinios).
            La sede es Valencia, pero el equipo trabaja distribuido entre España, México, Argentina y Colombia.
          </p>
          <p style={{ marginTop: 16 }}>
            Si quieres unirte como creador, colaborador editorial, partner comercial o socio inversor, escríbenos a{" "}
            <a href="mailto:gol@zonamundial.app" style={{ color: GOLD }}>gol@zonamundial.app</a>{" "}
            con un breve resumen de propuesta y enlaces a tu trabajo previo.
          </p>
        </Section>

        <Section title="Compromiso con la verdad y los datos">
          <p>
            En un Mundial donde van a circular millones de stats, predicciones y rumores, nos comprometemos a tres
            principios editoriales innegociables:
          </p>
          <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <strong style={{ color: "#E2E8F0" }}>Datos verificados.</strong> Todo dato numérico (rankings FIFA,
              títulos, fechas, valor de mercado, edades) se cruza con al menos dos fuentes oficiales antes de publicarse.
              Las fuentes se citan al pie de cada artículo cuando son relevantes.
            </li>
            <li>
              <strong style={{ color: "#E2E8F0" }}>Imágenes con licencia.</strong> Todas las fotos de jugadores en las
              fichas de selecciones provienen de Wikimedia Commons con licencias Creative Commons. Las banderas son
              servidas por flagcdn.com (dominio público). Las imágenes de sedes son originales o tienen permiso de uso.
            </li>
            <li>
              <strong style={{ color: "#E2E8F0" }}>Correcciones transparentes.</strong> Si publicamos un error, lo
              corregimos visible y públicamente con sello "Actualizado el [fecha]". No reescribimos historia sin avisar.
            </li>
          </ul>
        </Section>

        <Section title="Privacidad y datos personales">
          <p>
            ZonaMundial cumple con el Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica 3/2018 española.
            No recopilamos más datos de los necesarios para que la plataforma funcione (email + nombre de usuario para
            el ranking) y nunca vendemos esa información a terceros. El detalle completo está en la{" "}
            <Link href="/legal/privacidad" style={{ color: GOLD }}>Política de Privacidad</Link>, las{" "}
            <Link href="/legal/cookies" style={{ color: GOLD }}>Cookies</Link> y los{" "}
            <Link href="/legal/terminos" style={{ color: GOLD }}>Términos de uso</Link>.
          </p>
          <p style={{ marginTop: 12 }}>
            Para ejercer cualquier derecho RGPD (acceso, rectificación, supresión, oposición, portabilidad) escribe a{" "}
            <a href="mailto:gol@zonamundial.app" style={{ color: GOLD }}>gol@zonamundial.app</a>{" "}
            indicando el derecho que ejerces y una copia de tu documento de identidad. Respondemos en menos de 30 días.
          </p>
        </Section>

        <Section title="Datos rápidos">
          <ul style={{ listStyle: "none", padding: 0, lineHeight: 2 }}>
            <li><strong style={{ color: "#E2E8F0" }}>Lanzamiento beta:</strong> primer trimestre 2026</li>
            <li><strong style={{ color: "#E2E8F0" }}>Mundial cubierto:</strong> Copa del Mundo 2026 (11 jun – 19 jul)</li>
            <li><strong style={{ color: "#E2E8F0" }}>Países anfitriones:</strong> Estados Unidos, Canadá, México</li>
            <li><strong style={{ color: "#E2E8F0" }}>Selecciones cubiertas:</strong> 48 (formato ampliado)</li>
            <li><strong style={{ color: "#E2E8F0" }}>Partidos cubiertos:</strong> 104</li>
            <li><strong style={{ color: "#E2E8F0" }}>Sedes:</strong> 16 ciudades</li>
            <li><strong style={{ color: "#E2E8F0" }}>Idiomas:</strong> Español y English</li>
            <li><strong style={{ color: "#E2E8F0" }}>Precio:</strong> 100% gratis. Premium opcional</li>
            <li><strong style={{ color: "#E2E8F0" }}>Sede operativa:</strong> Valencia, España</li>
            <li><strong style={{ color: "#E2E8F0" }}>Empresa responsable:</strong> Sprintmarkt S.L.</li>
          </ul>
        </Section>

        <div style={{ marginTop: 48, padding: 28, background: "#0B1825", border: "1px solid rgba(212,168,83,0.3)", borderRadius: 10 }}>
          <h3 style={{ color: GOLD2, fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>¿Quieres saber más?</h3>
          <p style={{ color: MID, fontSize: 14, margin: "0 0 16px", lineHeight: 1.6 }}>
            Para colaboraciones editoriales, partnerships comerciales, prensa o cualquier consulta corporativa,
            consulta la página de <Link href="/contacto" style={{ color: GOLD }}>contacto</Link> con todos los canales.
          </p>
          <Link
            href="/contacto"
            style={{
              display: "inline-block",
              padding: "10px 18px",
              background: GOLD,
              color: "#060B14",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
              borderRadius: 6,
            }}
          >
            Ir a contacto →
          </Link>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40, paddingBottom: 32, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <h2 style={{ color: GOLD2, fontSize: 26, fontWeight: 700, marginBottom: 16, letterSpacing: "-0.01em" }}>{title}</h2>
      <div style={{ lineHeight: 1.7, fontSize: 15, color: MID }}>{children}</div>
    </section>
  );
}
