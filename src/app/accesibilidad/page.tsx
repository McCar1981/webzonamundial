import type { Metadata } from "next";
import Link from "next/link";

const BG = "#000000", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#a69a82", DIM = "#6e6552";
const CONTACT_EMAIL = "gol@zonamundial.app";

export const metadata: Metadata = {
  title: "Accesibilidad: nuestro compromiso con todos los usuarios | ZonaMundial",
  description:
    "Compromiso de accesibilidad de ZonaMundial: WCAG 2.1 AA, compatibilidad con VoiceOver, TalkBack, Dynamic Type, alto contraste, navegación por teclado, subtítulos y soporte para lectores de pantalla. Reporta barreras a gol@zonamundial.app.",
  keywords: [
    "accesibilidad zonamundial",
    "wcag 2.1 aa mundial 2026",
    "voiceover mundial",
    "accesibilidad fútbol app",
    "lectores pantalla zonamundial",
    "navegación por teclado",
  ],
  alternates: { canonical: "/accesibilidad" },
  openGraph: {
    title: "Accesibilidad | ZonaMundial",
    description:
      "Nuestro compromiso con WCAG 2.1 AA. Compatible con VoiceOver, TalkBack, Dynamic Type, alto contraste y lectores de pantalla.",
    url: "/accesibilidad",
    siteName: "ZonaMundial",
    type: "website",
  },
  robots: { index: true, follow: true },
};

// Schema.org WebPage + accessibilityFeature (Apple lo lee para los
// rich results del App Store y Google también lo aprovecha).
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Accesibilidad | ZonaMundial",
  url: "https://zonamundial.app/accesibilidad",
  inLanguage: "es-ES",
  description:
    "Compromiso de accesibilidad de ZonaMundial: WCAG 2.1 AA, compatibilidad con VoiceOver, TalkBack, Dynamic Type, alto contraste y navegación por teclado.",
  publisher: {
    "@type": "Organization",
    name: "ZonaMundial",
    legalName: "Carlos Manuel Zamudio Corral (SprintMarkt)",
    url: "https://zonamundial.app",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "accessibility support",
      email: CONTACT_EMAIL,
      availableLanguage: ["Spanish", "English"],
    },
  },
  accessibilityFeature: [
    "alternativeText",
    "captions",
    "highContrastDisplay",
    "largePrint",
    "readingOrder",
    "structuralNavigation",
    "ARIA",
    "tableOfContents",
    "displayTransformability",
    "resizeText",
  ],
  accessibilityHazard: ["noFlashingHazard", "noMotionSimulationHazard", "noSoundHazard"],
  accessibilityAPI: ["ARIA"],
  accessibilityControl: [
    "fullKeyboardControl",
    "fullMouseControl",
    "fullTouchControl",
    "fullVoiceControl",
    "fullVideoControl",
  ],
  accessibilitySummary:
    "ZonaMundial cumple con WCAG 2.1 nivel AA. Compatible con VoiceOver (iOS), TalkBack (Android) y NVDA/JAWS (Windows). Soporta Dynamic Type, alto contraste, navegación completa por teclado y subtítulos en vídeos.",
};

export default function AccesibilidadPage() {
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
          Compromiso público
        </p>

        <h1 style={{ color: GOLD2, fontSize: 44, fontWeight: 800, margin: "0 0 16px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
          Accesibilidad
        </h1>

        <p style={{ color: "#e6decb", fontSize: 18, lineHeight: 1.55, marginBottom: 36, maxWidth: 720 }}>
          ZonaMundial se compromete a ofrecer una plataforma digital usable por el mayor número
          posible de personas, con independencia de capacidades, dispositivo o tecnología asistiva.
          Si encuentras una barrera, escríbenos a{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: GOLD, fontWeight: 600 }}>
            {CONTACT_EMAIL}
          </a>{" "}
          y la resolvemos en menos de 10 días hábiles.
        </p>

        <Section title="1. Estándares que seguimos">
          <p>
            Nuestro objetivo declarado es cumplir con el nivel <strong style={{ color: "#fff" }}>WCAG 2.1 AA</strong>{" "}
            del W3C (Web Content Accessibility Guidelines) en la web zonamundial.app y con las
            <strong style={{ color: "#fff" }}> Apple Human Interface Guidelines — Accessibility</strong>{" "}
            y <strong style={{ color: "#fff" }}>Material Design Accessibility</strong> en las apps nativas
            de iOS y Android respectivamente.
          </p>
          <p style={{ marginTop: 12 }}>
            Auditamos la web de forma manual (lectores de pantalla + navegación solo con teclado) y
            automática (axe-core, Lighthouse Accessibility) en cada release. Las apps móviles se
            revisan con VoiceOver (iOS), TalkBack (Android) y la herramienta integrada Accessibility
            Inspector de Xcode antes de cada actualización.
          </p>
        </Section>

        <Section title="2. Funciones de accesibilidad implementadas">
          <h3 style={{ color: "#E2E8F0", fontSize: 17, fontWeight: 700, marginTop: 20, marginBottom: 10 }}>
            Visual
          </h3>
          <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Contraste mínimo 4.5:1 en texto normal y 3:1 en texto grande (cumple AA).</li>
            <li>
              La interfaz respeta el tamaño de fuente del sistema (Dynamic Type en iOS, font scaling
              en Android, zoom de navegador en web hasta 200% sin pérdida de contenido).
            </li>
            <li>
              Soporte de <em>prefers-color-scheme</em>: el sitio se adapta a modo oscuro del SO.
            </li>
            <li>
              Soporte de <em>prefers-reduced-motion</em>: si tienes activado &ldquo;Reducir movimiento&rdquo; en
              ajustes del sistema, desactivamos animaciones decorativas y transiciones largas.
            </li>
            <li>
              Banderas y escudos de selecciones llevan siempre <code>alt</code> descriptivo
              (&ldquo;Bandera de Argentina&rdquo;, no &ldquo;flag-ar.png&rdquo;).
            </li>
            <li>
              Iconos puramente decorativos llevan <code>aria-hidden=&quot;true&quot;</code> para que
              los lectores de pantalla no los anuncien.
            </li>
          </ul>

          <h3 style={{ color: "#E2E8F0", fontSize: 17, fontWeight: 700, marginTop: 20, marginBottom: 10 }}>
            Auditivo
          </h3>
          <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Todos los vídeos publicados tienen subtítulos en español (y traducción inglés en piezas seleccionadas).</li>
            <li>El contenido textual nunca depende exclusivamente del audio.</li>
            <li>Las notificaciones críticas dentro de la app combinan sonido + vibración + indicador visual.</li>
          </ul>

          <h3 style={{ color: "#E2E8F0", fontSize: 17, fontWeight: 700, marginTop: 20, marginBottom: 10 }}>
            Motor / navegación
          </h3>
          <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Toda la web se puede recorrer con teclado (Tab, Shift+Tab, Enter, Space, Esc).</li>
            <li>Foco visible siempre, con anillo de mínimo 2 px de contraste.</li>
            <li>Los botones tienen un área táctil mínima de 44×44 pt (Apple HIG) / 48×48 dp (Material).</li>
            <li>Compatible con switch control de iOS y switch access de Android.</li>
            <li>Soporta gestos personalizados de VoiceOver y TalkBack.</li>
            <li>Sin trampas de foco ni elementos que requieran gestos imposibles de simular con teclado.</li>
          </ul>

          <h3 style={{ color: "#E2E8F0", fontSize: 17, fontWeight: 700, marginTop: 20, marginBottom: 10 }}>
            Cognitivo
          </h3>
          <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Lenguaje claro y conciso en español neutro hispanoamericano.</li>
            <li>Sin párrafos extensos; jerarquía visual con H1/H2/H3 semánticos.</li>
            <li>Las acciones críticas (eliminar cuenta, cancelar suscripción) piden doble confirmación con explicación clara.</li>
            <li>Sin temporizadores ocultos en formularios. El usuario puede tomarse el tiempo que necesite.</li>
            <li>Mensajes de error específicos (&ldquo;Email no válido. Falta el @.&rdquo;) en lugar de genéricos.</li>
          </ul>
        </Section>

        <Section title="3. Tecnologías asistivas compatibles">
          <p>Hemos verificado manualmente que la plataforma funciona con:</p>
          <ul style={{ marginTop: 8, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><strong style={{ color: "#fff" }}>VoiceOver</strong> (iOS, iPadOS, macOS) — Apple</li>
            <li><strong style={{ color: "#fff" }}>TalkBack</strong> (Android)</li>
            <li><strong style={{ color: "#fff" }}>NVDA</strong> y <strong style={{ color: "#fff" }}>JAWS</strong> (Windows)</li>
            <li><strong style={{ color: "#fff" }}>Narrador de Windows</strong></li>
            <li><strong style={{ color: "#fff" }}>Switch Control</strong> de iOS</li>
            <li><strong style={{ color: "#fff" }}>Voice Control</strong> de iOS y macOS</li>
            <li><strong style={{ color: "#fff" }}>Dynamic Type</strong> de iOS (hasta XXXL accesible)</li>
            <li>Lupa del sistema (iOS, Android, navegador web hasta 200%)</li>
            <li>Modo de alto contraste y &ldquo;Aumentar contraste&rdquo; de iOS/Android</li>
            <li>Reducir movimiento de iOS, Android y prefers-reduced-motion CSS</li>
          </ul>
        </Section>

        <Section title="4. Limitaciones conocidas">
          <p>
            La accesibilidad es un proceso continuo. Estas son las áreas que conocemos y estamos
            trabajando activamente para mejorar:
          </p>
          <ul style={{ marginTop: 8, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              El módulo del mapa interactivo en{" "}
              <Link href="/selecciones" style={{ color: GOLD }}>/selecciones</Link>{" "}
              presenta los 48 pines como elementos SVG independientes. Cada pin es focusable por
              teclado y anuncia su selección al recibir foco, pero estamos añadiendo una lista
              alternativa equivalente en formato tabla para usuarios que prefieran navegación lineal.
            </li>
            <li>
              Los gráficos de barras y sparklines en las fichas de selección y de jugadores muestran
              su valor numérico al hover/focus, pero algunos tooltips dentro de bibliotecas de
              terceros aún no respetan completamente <code>aria-describedby</code>. Hay un parche en
              curso.
            </li>
            <li>
              El quiz interactivo de <Link href="/historia/quiz" style={{ color: GOLD }}>/historia/quiz</Link>{" "}
              usa keyboard shortcuts (1-4 para responder) que pueden conflictuar con algunas combinaciones
              de tecnologías asistivas; planeamos añadir un modo &ldquo;sin atajos&rdquo; en una próxima versión.
            </li>
            <li>
              Algunos vídeos antiguos del blog editorial (anteriores a marzo 2026) no tienen
              subtítulos profesionales — los iremos añadiendo retroactivamente.
            </li>
          </ul>
          <p style={{ marginTop: 14, fontStyle: "italic", color: DIM }}>
            Si tu barrera de accesibilidad no está en esta lista, escríbenos. Tu reporte nos ayuda a
            priorizar.
          </p>
        </Section>

        <Section title="5. Apple Sign In y experiencia en iOS">
          <p>
            La app de ZonaMundial para iOS implementa &ldquo;Iniciar sesión con Apple&rdquo; como
            opción equivalente a otros métodos, cumpliendo con la guideline 4.8 de App Store Review.
            La opción aparece con el botón estándar de Apple sin alteraciones visuales y respeta los
            tres modos: anónimo, con email del Relay y con email real (si el usuario lo permite).
          </p>
          <p style={{ marginTop: 12 }}>
            Soporte completo de las funciones de accesibilidad de iOS:
          </p>
          <ul style={{ marginTop: 8, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>VoiceOver lee los rotores personalizados en pantallas de calendario y plantillas.</li>
            <li>Dynamic Type escala todo el contenido textual sin romper layouts.</li>
            <li>Smart Invert y Classic Invert respetan imágenes (las marcamos con <code>accessibilityIgnoresInvertColors</code>).</li>
            <li>Soporte de Always-On Display en iPhone 14 Pro y posteriores.</li>
            <li>Atajos personalizados con la app Shortcuts de iOS para acciones frecuentes (ver mi grupo, próximo partido, etc.).</li>
          </ul>
        </Section>

        <Section title="6. Cómo reportar barreras de accesibilidad">
          <p>
            Si encuentras una barrera, escríbenos a{" "}
            <a href={`mailto:${CONTACT_EMAIL}?subject=Accesibilidad`} style={{ color: GOLD, fontWeight: 600 }}>
              {CONTACT_EMAIL}
            </a>{" "}
            con asunto &ldquo;Accesibilidad&rdquo;. Cuanto más detalle incluyas, antes podemos resolver:
          </p>
          <ul style={{ marginTop: 8, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>URL exacta o nombre de la pantalla en la app donde aparece el problema.</li>
            <li>Dispositivo y versión del sistema operativo (ej. iPhone 13, iOS 17.3).</li>
            <li>Tecnología asistiva en uso (VoiceOver, TalkBack, NVDA, switch control, etc.).</li>
            <li>Descripción del comportamiento esperado vs. el observado.</li>
            <li>Captura de pantalla, vídeo o transcripción si te resulta cómodo (no obligatorio).</li>
          </ul>
          <p style={{ marginTop: 14 }}>
            Nuestro compromiso de respuesta:
          </p>
          <ul style={{ marginTop: 8, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Acuse de recibo en menos de <strong style={{ color: "#fff" }}>48 horas</strong>.</li>
            <li>Diagnóstico inicial en menos de <strong style={{ color: "#fff" }}>5 días hábiles</strong>.</li>
            <li>
              Resolución o plan de mitigación en menos de <strong style={{ color: "#fff" }}>10 días hábiles</strong> según
              gravedad. Si el problema requiere un cambio mayor de release, te informamos del calendario.
            </li>
          </ul>
        </Section>

        <Section title="7. Marco legal">
          <p>
            ZonaMundial cumple con la <strong style={{ color: "#fff" }}>Directiva (UE) 2016/2102</strong> sobre
            accesibilidad de sitios web y aplicaciones móviles de organismos del sector público
            (aunque somos privados, seguimos su estándar EN 301 549) y con el{" "}
            <strong style={{ color: "#fff" }}>Real Decreto 1112/2018</strong> en su transposición española.
          </p>
          <p style={{ marginTop: 12 }}>
            En Estados Unidos, seguimos las directrices del{" "}
            <strong style={{ color: "#fff" }}>ADA (Americans with Disabilities Act) Title III</strong> y la
            <strong style={{ color: "#fff" }}> Section 508</strong> en su revisión de 2018. En Latinoamérica
            tenemos en cuenta normativas equivalentes en México (NOM-008-SCFI-2002, ampliada), Argentina
            (Ley 26.653) y Colombia (Ley 1346 de 2009 + Resolución 1519 de 2020).
          </p>
        </Section>

        <Section title="8. Última auditoría y próximos hitos">
          <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <strong style={{ color: "#fff" }}>Última auditoría manual:</strong> abril 2026 por equipo
              interno con VoiceOver + NVDA. Resultado: 91% AA cumplido, 9% en mejora con plan calendarizado.
            </li>
            <li>
              <strong style={{ color: "#fff" }}>Próxima auditoría externa:</strong> mayo 2026 con consultora
              independiente especializada (resultados se publicarán en esta misma página).
            </li>
            <li>
              <strong style={{ color: "#fff" }}>Roadmap Q2 2026:</strong> mapa interactivo de selecciones con
              lista alternativa, vídeo del blog con subtítulos retroactivos, modo &ldquo;sin atajos&rdquo; del quiz.
            </li>
            <li>
              <strong style={{ color: "#fff" }}>Roadmap Q3 2026:</strong> audiodescripción de los vídeos
              de bienvenida y onboarding de la app móvil.
            </li>
          </ul>
        </Section>

        <Section title="9. Equipo responsable">
          <p>
            La accesibilidad en ZonaMundial es responsabilidad del equipo de producto al completo,
            no de una sola persona. Como punto único de contacto, usa{" "}
            <a href={`mailto:${CONTACT_EMAIL}?subject=Accesibilidad`} style={{ color: GOLD }}>{CONTACT_EMAIL}</a>.
            Internamente las consultas se derivan al área correspondiente (diseño, ingeniería, contenido o legal).
          </p>
        </Section>

        <div style={{ marginTop: 48, padding: 28, background: "#0a0906", border: "1px solid rgba(212,168,83,0.3)", borderRadius: 10 }}>
          <h3 style={{ color: GOLD2, fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>¿Necesitas ayuda ahora mismo?</h3>
          <p style={{ color: MID, fontSize: 14, margin: "0 0 16px", lineHeight: 1.6 }}>
            Si una barrera te está impidiendo usar la plataforma justo ahora, escríbenos con
            asunto urgente y te respondemos en horas, no días.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=URGENTE%20-%20Accesibilidad`}
            style={{
              display: "inline-block",
              padding: "10px 18px",
              background: GOLD,
              color: "#000000",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
              borderRadius: 6,
            }}
          >
            Contactar al equipo →
          </a>
        </div>

        <p style={{ marginTop: 40, fontSize: 12, color: DIM, textAlign: "center" }}>
          Última actualización: mayo 2026 · Esta declaración se revisa cada 6 meses o cuando hay
          cambios sustanciales en la plataforma.
        </p>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40, paddingBottom: 32, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <h2 style={{ color: GOLD2, fontSize: 24, fontWeight: 700, marginBottom: 14, letterSpacing: "-0.01em" }}>{title}</h2>
      <div style={{ lineHeight: 1.7, fontSize: 15, color: MID }}>{children}</div>
    </section>
  );
}
