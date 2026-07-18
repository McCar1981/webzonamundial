import Link from "next/link";
import type { Metadata } from "next";

const BG = "#000000", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#a69a82", DIM = "#6e6552";

export const metadata: Metadata = {
  title: "Información legal · ZonaMundial",
  description:
    "Centro de documentación legal de ZonaMundial: aviso legal, términos y condiciones, política de privacidad, política de cookies y licencia de uso (EULA).",
};

const DOCS = [
  {
    href: "/legal/aviso-legal",
    title: "Aviso Legal",
    desc: "Datos del titular y condiciones de uso del sitio (LSSI-CE).",
  },
  {
    href: "/legal/terminos",
    title: "Términos y Condiciones",
    desc: "Reglas de uso de la Plataforma, cuentas, premios y suscripciones.",
  },
  {
    href: "/legal/privacidad",
    title: "Política de Privacidad",
    desc: "Cómo tratamos tus datos personales conforme al RGPD y la LOPDGDD.",
  },
  {
    href: "/legal/cookies",
    title: "Política de Cookies",
    desc: "Cookies y tecnologías similares, publicidad y gestión del consentimiento.",
  },
  {
    href: "/legal/eula",
    title: "Licencia de uso (EULA)",
    desc: "Términos de la licencia de la aplicación móvil para el usuario final.",
  },
];

export default function LegalIndexPage() {
  return (
    <main style={{ background: BG, minHeight: "100vh", color: MID, padding: "80px 20px 60px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Link href="/" style={{ color: GOLD, fontSize: 13, textDecoration: "none", opacity: 0.7 }}>
          ← Volver al inicio
        </Link>

        <h1 style={{ color: GOLD2, fontSize: 32, fontWeight: 800, margin: "24px 0 8px", letterSpacing: "-0.5px" }}>
          Información legal
        </h1>
        <p style={{ color: DIM, fontSize: 13, marginBottom: 40 }}>
          Toda la documentación legal de ZonaMundial en un solo lugar.
        </p>

        <div style={{ display: "grid", gap: 16 }}>
          {DOCS.map((doc) => (
            <Link
              key={doc.href}
              href={doc.href}
              style={{
                display: "block",
                padding: "18px 20px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderLeft: "3px solid " + GOLD,
                borderRadius: 6,
                textDecoration: "none",
              }}
            >
              <span style={{ display: "block", color: GOLD2, fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                {doc.title}
              </span>
              <span style={{ display: "block", color: MID, fontSize: 14, lineHeight: 1.6 }}>
                {doc.desc}
              </span>
            </Link>
          ))}
        </div>

        <p style={{ color: DIM, fontSize: 13, marginTop: 40 }}>
          ¿Dudas sobre estos documentos? Escríbenos a{" "}
          <a href="mailto:gol@zonamundial.app" style={{ color: GOLD }}>gol@zonamundial.app</a>.
        </p>
      </div>
    </main>
  );
}
