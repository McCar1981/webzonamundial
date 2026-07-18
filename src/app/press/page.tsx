// /press — kit de prensa para periodistas, creadores y partners.
// Boilerplate listo para copiar/pegar, contacto, hechos clave, logo
// descargable y screenshots.

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kit de prensa | ZonaMundial",
  description:
    "Recursos oficiales para periodistas y creadores: boilerplate, hechos clave, logos descargables, screenshots y contacto del equipo de comunicación.",
  alternates: { canonical: "/press" },
  openGraph: {
    title: "Kit de prensa · ZonaMundial",
    description:
      "Boilerplate, logos, screenshots y contacto de prensa de ZonaMundial — la plataforma del Mundial 2026.",
    url: "/press",
    type: "website",
    siteName: "ZonaMundial",
  },
};

const FACTS = [
  { k: "Lanzamiento", v: "2026" },
  { k: "Equipo", v: "Editorial Zona Mundial + producto" },
  { k: "Sede", v: "España" },
  { k: "Mercados", v: "España, LATAM y USA" },
  { k: "Idiomas", v: "ES + EN" },
  { k: "Modelo", v: "Free + Founders Pass (8 € / 6 USD)" },
];

const BOILERPLATE = `ZonaMundial es la plataforma del Mundial FIFA 2026 que combina predicciones, fantasy, IA Coach, ligas privadas, trivia, streaming con creadores y comunidad en una sola app. Nacida para los 39 días más intensos del fútbol mundial — del 11 de junio al 19 de julio de 2026 — ofrece un plan base gratuito y un plan opcional Founders Pass (pago único, 8 € / 6 USD) para quien quiera apoyar el proyecto y desbloquear ventajas. Operada con sede en España y enfocada al público hispanohablante (España + Latinoamérica) y al mercado de EE.UU. Web: zonamundial.app`;

export default function PressPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(201,168,76,0.10), transparent 60%), linear-gradient(180deg, #000000, #0a0906)",
        color: "#fff",
        fontFamily: "Outfit, system-ui, sans-serif",
        padding: "clamp(40px, 6vw, 72px) 20px 80px",
      }}
    >
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "#a69a82",
            textDecoration: "none",
            marginBottom: 24,
          }}
        >
          ← Volver al inicio
        </Link>

        {/* HEADER */}
        <div
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 11,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "#C9A84C",
            fontWeight: 700,
            marginBottom: 14,
          }}
        >
          {/* KIT DE PRENSA */}
        </div>
        <h1
          style={{
            fontWeight: 900,
            fontSize: "clamp(34px, 5vw, 52px)",
            letterSpacing: "-0.025em",
            lineHeight: 1.05,
            marginBottom: 14,
          }}
        >
          ZonaMundial para{" "}
          <span
            style={{
              backgroundImage: "linear-gradient(135deg,#C9A84C,#FDE68A)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            prensa y creadores
          </span>
        </h1>
        <p
          style={{
            fontSize: 17,
            lineHeight: 1.6,
            color: "#e6decb",
            margin: "0 0 36px",
            maxWidth: 720,
          }}
        >
          Recursos oficiales para hablar de ZonaMundial: boilerplate listo para
          copiar, hechos clave, logos descargables, screenshots y contacto directo
          con el equipo de comunicación.
        </p>

        {/* HECHOS CLAVE */}
        <Section title="Hechos clave">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {FACTS.map((f) => (
              <div
                key={f.k}
                style={{
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <div
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "#a69a82",
                    marginBottom: 4,
                  }}
                >
                  {f.k}
                </div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{f.v}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* BOILERPLATE */}
        <Section title="Boilerplate (descripción oficial)">
          <p style={{ fontSize: 14, color: "#a69a82", margin: "0 0 12px" }}>
            Texto autorizado para copiar y pegar en notas de prensa, artículos o
            entrevistas. Cabe sin problema en una sola tarjeta de Twitter.
          </p>
          <div
            style={{
              padding: 18,
              borderRadius: 12,
              border: "1px solid rgba(201,168,76,0.25)",
              background: "linear-gradient(180deg, rgba(20,17,10,0.7), rgba(10,9,6,0.4))",
              fontFamily: "Source Serif 4, Georgia, serif",
              fontSize: 15,
              lineHeight: 1.65,
              color: "#e5e7eb",
              fontStyle: "italic",
            }}
          >
            {BOILERPLATE}
          </div>
          <p style={{ fontSize: 12, color: "#6b7280", margin: "10px 0 0" }}>
            ✏️ Si necesitas una versión más corta o más larga, escríbenos.
          </p>
        </Section>

        {/* RECURSOS DESCARGABLES */}
        <Section title="Logos y recursos visuales">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            <Resource label="Logo principal (PNG)" href="/img/logo.png" sub="Fondo oscuro · 512×512" />
            <Resource label="Logo blanco (PNG)" href="/img/logo-512.png" sub="Para fondos claros" />
            <Resource label="OG image genérica" href="/og-image.jpg" sub="1200×630 · social cards" />
            <Resource label="Manifest del proyecto" href="/manifest.json" sub="PWA + iconos" />
          </div>
          <p style={{ fontSize: 12, color: "#6b7280", margin: "14px 0 0" }}>
            ⚠️ Pedimos que no se modifiquen colores ni proporciones del logo. Marca
            registrada en proceso (España).
          </p>
        </Section>

        {/* SCREENSHOTS */}
        <Section title="Screenshots de la plataforma">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 12,
            }}
          >
            <ImagePreview src="/img/blog/portada-zona-mundial.png" alt="Portada de ZonaMundial con módulo Fantasy" />
            <ImagePreview src="/img/blog/zonamundial-app-fantasy.png" alt="Vista del módulo Fantasy en directo" />
            <ImagePreview src="/img/blog/zonamundial-app-modulos.png" alt="Menú de módulos de la app" />
          </div>
        </Section>

        {/* CONTACTO */}
        <Section title="Contacto de prensa">
          <div
            style={{
              padding: 22,
              borderRadius: 14,
              border: "1px solid rgba(201,168,76,0.30)",
              background:
                "radial-gradient(ellipse 70% 100% at 0% 0%, rgba(201,168,76,0.10), transparent 70%), linear-gradient(180deg, rgba(20,17,10,0.7), rgba(10,9,6,0.4))",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 12, color: "#a69a82", marginBottom: 4 }}>Redacción / entrevistas</div>
                <a
                  href="mailto:editorial@zonamundial.app"
                  style={{ color: "#FDE68A", textDecoration: "none", fontWeight: 700 }}
                >
                  editorial@zonamundial.app
                </a>
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 12, color: "#a69a82", marginBottom: 4 }}>Partners / colaboraciones</div>
                <a
                  href="mailto:partners@zonamundial.app"
                  style={{ color: "#FDE68A", textDecoration: "none", fontWeight: 700 }}
                >
                  partners@zonamundial.app
                </a>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#e6decb", marginTop: 16, marginBottom: 0 }}>
              Respondemos en menos de 24 horas hábiles. Si tienes una fecha límite,
              escríbela en el asunto y la priorizamos.
            </p>
          </div>
        </Section>

        {/* EMBED WIDGET */}
        <Section title="Embed del calendario en tu sitio">
          <p style={{ fontSize: 14, color: "#a69a82", margin: "0 0 12px" }}>
            Si publicas en un blog o medio digital, puedes embeber el calendario
            del Mundial 2026 en tu sitio con un iframe. Filtra por equipo, fase o
            sede usando query params.
          </p>
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              border: "1px solid rgba(201,168,76,0.20)",
              background: "rgba(0,0,0,0.30)",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 12.5,
              lineHeight: 1.55,
              color: "#e6decb",
              overflowX: "auto",
            }}
          >
            <pre style={{ margin: 0 }}>{`<iframe
  src="https://zonamundial.app/embed/calendario?team=es"
  width="100%"
  height="600"
  frameborder="0"
  style="border:0;border-radius:14px;background:#000000"
  loading="lazy"
></iframe>`}</pre>
          </div>
          <p style={{ fontSize: 12, color: "#6b7280", margin: "10px 0 0" }}>
            Parámetros opcionales: <code>?team=es</code> (ISO),{" "}
            <code>?phase=grupos</code> (grupos | octavos | cuartos | semis | final),{" "}
            <code>?venue=us</code> (us | mx | ca), <code>?compact=1</code>.
          </p>
        </Section>

        {/* REDES SOCIALES */}
        <Section title="Redes sociales">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <SocialLink href="https://instagram.com/zonamundialapp" label="Instagram @zonamundialapp" />
            <SocialLink href="https://x.com/zonamundialapp" label="X @zonamundialapp" />
            <SocialLink href="https://tiktok.com/@zonamundialapp" label="TikTok @zonamundialapp" />
            <SocialLink href="https://www.facebook.com/zonamundialapp" label="Facebook" />
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2
        style={{
          fontWeight: 800,
          fontSize: 22,
          letterSpacing: "-0.02em",
          marginBottom: 14,
          paddingBottom: 8,
          borderBottom: "1px solid rgba(201,168,76,0.20)",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Resource({ label, href, sub }: { label: string; href: string; sub: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        padding: 14,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
        textDecoration: "none",
        color: "#fff",
        transition: "all 200ms",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color: "#a69a82", letterSpacing: "0.04em" }}>{sub}</div>
      <div
        style={{
          fontSize: 11,
          color: "#C9A84C",
          marginTop: 8,
          fontFamily: "JetBrains Mono, monospace",
          letterSpacing: "0.1em",
        }}
      >
        DESCARGAR ↓
      </div>
    </a>
  );
}

function ImagePreview({ src, alt }: { src: string; alt: string }) {
  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "#14110a",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        style={{ width: "100%", height: "auto", display: "block" }}
        loading="lazy"
      />
    </a>
  );
}

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        padding: "8px 14px",
        borderRadius: 99,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.03)",
        color: "#e6decb",
        textDecoration: "none",
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      {label}
    </a>
  );
}
