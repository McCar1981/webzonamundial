import type { Metadata } from "next";
import Link from "next/link";

const BG = "#060B14", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a";

const CONTACT_EMAIL = "gol@zonamundial.app";

export const metadata: Metadata = {
  title: "Contacto: cómo escribirnos | ZonaMundial",
  description:
    "Datos de contacto de ZonaMundial: email único gol@zonamundial.app. Carlos Manuel Zamudio Corral (SprintMarkt), Valencia, España. Tiempo de respuesta: 5 días hábiles.",
  keywords: [
    "contacto zonamundial",
    "contactar zonamundial",
    "email zonamundial",
    "sprintmarkt valencia",
    "prensa mundial 2026",
  ],
  alternates: { canonical: "/contacto" },
  openGraph: {
    title: "Contacto | ZonaMundial",
    description: "Cómo escribirnos para soporte, prensa, colaboraciones o asuntos legales.",
    url: "/contacto",
    siteName: "ZonaMundial",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function ContactoPage() {
  return (
    <main style={{ background: BG, minHeight: "100vh", color: MID, padding: "80px 20px 60px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <Link href="/" style={{ color: GOLD, fontSize: 13, textDecoration: "none", opacity: 0.7 }}>
          ← Volver al inicio
        </Link>

        <h1 style={{ color: GOLD2, fontSize: 40, fontWeight: 800, margin: "24px 0 12px", letterSpacing: "-0.5px" }}>
          Contacto
        </h1>
        <p style={{ color: DIM, fontSize: 15, marginBottom: 40, maxWidth: 640, lineHeight: 1.6 }}>
          ZonaMundial es un proyecto de Carlos Manuel Zamudio Corral, empresario individual (autónomo) que opera
          bajo el nombre comercial SprintMarkt, con sede en Valencia, España.
          Para cualquier consulta — soporte, prensa, comercial, legal o creadores — usa el email único{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: GOLD, fontWeight: 600 }}>{CONTACT_EMAIL}</a>{" "}
          y te respondemos en menos de 5 días hábiles.
        </p>

        {/* Email destacado */}
        <div
          style={{
            background: "#0B1825",
            border: "1px solid rgba(212,168,83,0.35)",
            borderRadius: 12,
            padding: 28,
            marginBottom: 40,
            textAlign: "center",
          }}
        >
          <p style={{ color: DIM, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 12px", fontWeight: 600 }}>
            Email oficial
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            style={{ color: GOLD2, fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", textDecoration: "none", display: "inline-block", margin: "0 0 16px" }}
          >
            {CONTACT_EMAIL}
          </a>
          <p style={{ color: MID, fontSize: 14, margin: 0, lineHeight: 1.6, maxWidth: 540, marginInline: "auto" }}>
            Indica el motivo en el asunto (soporte, prensa, comercial, legal, creadores) y te derivamos
            internamente al equipo correspondiente.
          </p>
        </div>

        {/* Datos de la empresa */}
        <Section title="Datos del responsable">
          <ul style={{ listStyle: "none", padding: 0, lineHeight: 2 }}>
            <li><strong style={{ color: "#E2E8F0" }}>Titular:</strong> Carlos Manuel Zamudio Corral (empresario individual)</li>
            <li><strong style={{ color: "#E2E8F0" }}>Nombre comercial:</strong> SprintMarkt</li>
            <li><strong style={{ color: "#E2E8F0" }}>Marca:</strong> ZonaMundial</li>
            <li><strong style={{ color: "#E2E8F0" }}>Domicilio:</strong> Valencia, España</li>
            <li><strong style={{ color: "#E2E8F0" }}>Sitio web:</strong> <a href="https://zonamundial.app" style={{ color: GOLD }}>zonamundial.app</a></li>
            <li><strong style={{ color: "#E2E8F0" }}>Web corporativa:</strong> <a href="https://sprintmarkt.com/es/" target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>sprintmarkt.com</a></li>
            <li><strong style={{ color: "#E2E8F0" }}>Email único:</strong> <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: GOLD }}>{CONTACT_EMAIL}</a></li>
          </ul>
        </Section>

        {/* Motivos de contacto */}
        <Section title="¿Para qué puedes escribirnos?">
          <p style={{ marginBottom: 18 }}>
            Atendemos cualquier consulta relacionada con la plataforma. Estos son los motivos más habituales:
          </p>
          <div style={{ display: "grid", gap: 14 }}>
            <ContactBlock
              label="Soporte y consultas generales"
              description="Dudas sobre la plataforma, problemas con tu cuenta, ayuda para empezar, sugerencias de funcionalidades."
            />
            <ContactBlock
              label="Prensa y colaboraciones editoriales"
              description="Notas de prensa, declaraciones, entrevistas, partners de contenido, intercambio de enlaces."
            />
            <ContactBlock
              label="Comercial y patrocinios"
              description="Acuerdos publicitarios, integraciones de marca, sponsored content, oportunidades de inversión."
            />
            <ContactBlock
              label="Asuntos legales y privacidad"
              description="Solicitudes RGPD, propiedad intelectual, derecho al olvido, retiradas de contenido, DMCA."
            />
            <ContactBlock
              label="Creadores y comunidad"
              description="Si eres creador de contenido futbolístico hispano y quieres unirte al programa de embajadores."
            />
            <ContactBlock
              label="Anunciantes y agencias publicitarias"
              description="Display, sponsored content, video pre-roll. Audiencia hispana 18-45 años, alto interés en fútbol."
            />
            <ContactBlock
              label="Correcciones editoriales"
              description="Errores factuales en artículos, datos desactualizados, atribuciones incorrectas. Indica URL y fuente alternativa."
            />
          </div>
        </Section>

        {/* Política editorial */}
        <Section title="Política editorial y correcciones">
          <p>
            ZonaMundial publica contenido informativo sobre el Mundial 2026: selecciones, sedes, calendarios, jugadores,
            historia del torneo, predicciones y análisis. Todo el contenido editorial se redacta internamente o por
            colaboradores identificados con su nombre y biografía pública al pie de cada artículo.
          </p>
          <p style={{ marginTop: 12 }}>
            Si detectas un error factual — un dato histórico erróneo, una atribución incorrecta, una estadística
            desactualizada — escríbenos a <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: GOLD }}>{CONTACT_EMAIL}</a>{" "}
            con asunto <em>&ldquo;Corrección: [URL del artículo]&rdquo;</em>, indicando la corrección sugerida con su
            fuente. Revisamos cada solicitud y publicamos erratas con marca de tiempo cuando corresponde.
          </p>
        </Section>

        {/* Tiempos */}
        <Section title="Tiempos de respuesta">
          <p>
            Nos comprometemos a contestar todos los correos en un plazo máximo de{" "}
            <strong style={{ color: "#E2E8F0" }}>5 días hábiles</strong> (lunes a viernes, festivos nacionales en
            España excluidos). Las solicitudes legales (RGPD: acceso, rectificación, supresión, oposición) tienen un
            plazo máximo de respuesta de <strong style={{ color: "#E2E8F0" }}>30 días</strong> conforme al artículo
            12.3 del RGPD.
          </p>
          <p style={{ marginTop: 12 }}>
            Durante el periodo del Mundial (junio-julio 2026) ampliamos el equipo de soporte y los tiempos pueden bajar
            a 24-48 horas para consultas sobre la plataforma.
          </p>
        </Section>

        {/* Sociales */}
        <Section title="Redes sociales oficiales">
          <ul style={{ listStyle: "none", padding: 0, lineHeight: 2 }}>
            <li>
              Instagram:{" "}
              <a href="https://www.instagram.com/zona.mundial" target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>
                @zona.mundial
              </a>
            </li>
            <li>
              TikTok:{" "}
              <a href="https://www.tiktok.com/@zonamundialfutbol" target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>
                @zonamundialfutbol
              </a>
            </li>
            <li>
              Facebook:{" "}
              <a href="https://www.facebook.com/share/1Ay733gLRU/" target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>
                ZonaMundial
              </a>
            </li>
          </ul>
          <p style={{ marginTop: 12, fontSize: 13, color: DIM }}>
            Los mensajes privados en redes sociales pueden tardar más. Para consultas que requieran respuesta rápida o
            trazabilidad, usa el email.
          </p>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36, paddingBottom: 28, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <h2 style={{ color: GOLD2, fontSize: 22, fontWeight: 700, marginBottom: 14 }}>{title}</h2>
      <div style={{ lineHeight: 1.7, fontSize: 14, color: MID }}>{children}</div>
    </section>
  );
}

function ContactBlock({ label, description }: { label: string; description: string }) {
  return (
    <div
      style={{
        padding: 14,
        background: "#0B1825",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
      }}
    >
      <div style={{ color: "#E2E8F0", fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{label}</div>
      <p style={{ fontSize: 13, color: DIM, margin: 0 }}>{description}</p>
    </div>
  );
}
