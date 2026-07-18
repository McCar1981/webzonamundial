import Link from "next/link";
import type { Metadata } from "next";

const BG = "#000000", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#a69a82", DIM = "#6e6552", CARD = "rgba(255,255,255,0.03)", BORDER = "1px solid rgba(255,255,255,0.06)";

export const metadata: Metadata = {
  title: "Anúnciate en ZonaMundial · Patrocinio y publicidad",
  description:
    "Llega a la afición latinoamericana al fútbol durante el Mundial 2026: slot patrocinado del Gran Premio, integración nativa en el juego, push segmentado y campañas con creadores. Escríbenos a gol@zonamundial.app.",
};

export default function PublicidadPage() {
  return (
    <main style={{ background: BG, minHeight: "100vh", color: MID, padding: "80px 20px 60px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <Link href="/" style={{ color: GOLD, fontSize: 13, textDecoration: "none", opacity: 0.7 }}>
          ← Volver al inicio
        </Link>

        <p style={{ color: GOLD, fontSize: 13, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", margin: "24px 0 8px" }}>
          Patrocinio y publicidad
        </p>
        <h1 style={{ color: GOLD2, fontSize: 38, fontWeight: 800, margin: "0 0 16px", letterSpacing: "-0.5px", lineHeight: 1.15 }}>
          Tu marca, en el centro del Mundial
        </h1>
        <p style={{ color: MID, fontSize: 17, lineHeight: 1.7, maxWidth: 680, marginBottom: 40 }}>
          ZonaMundial es la plataforma de predicciones, fantasy y juego social del Mundial 2026.
          Conectamos a tu marca con una afición que entra cada día a competir, predecir y comentar
          el torneo. Patrocinio real, integrado en la experiencia, sin banners intrusivos.
        </p>

        {/* A quién llega */}
        <Section title="A quién llega">
          <p>
            Nuestra comunidad es la afición <strong style={{ color: GOLD }}>latinoamericana</strong> y de habla hispana
            al fútbol: usuarios apasionados que durante el Mundial mantienen un <strong style={{ color: GOLD }}>engagement diario</strong>,
            volviendo cada jornada para hacer sus predicciones, gestionar su equipo fantasy, jugar al
            Modo Carrera DT y seguir el minuto a minuto de los partidos.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginTop: 20 }}>
            <Stat value="LATAM + ES" label="Mercado principal de la afición" />
            <Stat value="Diario" label="Frecuencia de uso durante el Mundial" />
            <Stat value="Orgánico" label="Origen principal del tráfico (búsqueda Google)" />
            <Stat value="Móvil" label="Dispositivo mayoritario de la audiencia" />
          </div>
          <p style={{ color: DIM, fontSize: 13, marginTop: 14 }}>
            Las cifras exactas de audiencia (usuarios activos, impresiones y clics de Search Console) se facilitan bajo demanda con datos actualizados al momento de la propuesta.
          </p>
        </Section>

        {/* Alcance de creadores */}
        <Section title="El alcance de nuestros creadores">
          <p>
            ZonaMundial trabaja con una red de creadores de contenido de fútbol en España y Latinoamérica.
            En conjunto, esta red suma un alcance de aproximadamente{" "}
            <strong style={{ color: GOLD }}>8,3 millones de seguidores</strong> en TikTok, Instagram y YouTube,
            que canalizan a su comunidad hacia la plataforma y amplifican cualquier campaña de patrocinio.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginTop: 20 }}>
            <Stat value="~8,3M" label="Alcance combinado de creadores" />
            <Stat value="ES + LATAM" label="Cobertura geográfica" />
            <Stat value="Multiplataforma" label="TikTok · Instagram · YouTube" />
          </div>
        </Section>

        {/* Qué se vende */}
        <Section title="Qué ofrecemos">
          <div style={{ display: "grid", gap: 16, marginTop: 8 }}>
            <Offer
              title="Slot Gran Premio patrocinado"
              desc="Tu marca financia el premio del concurso de habilidad por tasa de acierto y aparece como patrocinador oficial junto al ranking global, visible para toda la comunidad durante el Mundial."
            />
            <Offer
              title="Integración nativa en el juego"
              desc="Presencia de marca integrada en la experiencia (predicciones, fantasy, Modo Carrera, trivia) de forma orgánica, sin banners intrusivos que rompan la navegación."
            />
            <Offer
              title="Push segmentado"
              desc="Notificaciones push asociadas a hitos del torneo (previa, alineaciones, final) con tu marca, dirigidas a la audiencia activa y suscrita."
            />
            <Offer
              title="Campaña con creadores"
              desc="Activación coordinada con nuestra red de creadores de fútbol para amplificar el patrocinio y dirigir tráfico cualificado a la plataforma."
            />
          </div>
        </Section>

        {/* Formatos / entregables */}
        <Section title="Formatos y entregables">
          <ul>
            <li>Logotipo y enlace del patrocinador en el módulo del Gran Premio (ranking global).</li>
            <li>Mención de marca como financiador del premio en las bases del concurso.</li>
            <li>Integraciones de marca a medida dentro de los módulos de juego.</li>
            <li>Notificaciones push patrocinadas, segmentadas por audiencia y momento del torneo.</li>
            <li>Piezas de contenido con creadores (vídeo corto, stories, menciones) según el paquete acordado.</li>
            <li>Reporte de resultados de campaña al cierre del Mundial.</li>
          </ul>
          <p style={{ color: DIM, fontSize: 13, marginTop: 12 }}>
            Los paquetes son flexibles y se adaptan al objetivo y al presupuesto de cada anunciante.
          </p>
        </Section>

        {/* CTA */}
        <div
          style={{
            marginTop: 8,
            padding: "28px 24px",
            background: "rgba(201,168,76,0.06)",
            border: "1px solid rgba(201,168,76,0.25)",
            borderRadius: 10,
            textAlign: "center",
          }}
        >
          <h2 style={{ color: GOLD2, fontSize: 24, fontWeight: 800, margin: "0 0 10px" }}>
            Hablemos de tu campaña
          </h2>
          <p style={{ color: MID, fontSize: 15, lineHeight: 1.7, maxWidth: 540, margin: "0 auto 20px" }}>
            Cuéntanos tu objetivo y te preparamos una propuesta a medida con cifras actualizadas
            de audiencia y alcance. El Mundial es ahora.
          </p>
          <a
            href="mailto:gol@zonamundial.app?subject=Propuesta%20de%20patrocinio%20en%20ZonaMundial"
            style={{
              display: "inline-block",
              padding: "13px 28px",
              background: GOLD,
              color: BG,
              fontSize: 15,
              fontWeight: 800,
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            gol@zonamundial.app
          </a>
        </div>

        <p style={{ color: DIM, fontSize: 13, marginTop: 32, textAlign: "center" }}>
          Consulta las <Link href="/legal/bases-gran-premio" style={{ color: GOLD }}>bases del Gran Premio</Link>{" "}
          y la <Link href="/legal" style={{ color: GOLD }}>información legal</Link> de la plataforma.
        </p>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36, paddingBottom: 28, borderBottom: BORDER }}>
      <h2 style={{ color: GOLD2, fontSize: 22, fontWeight: 700, marginBottom: 14 }}>{title}</h2>
      <div style={{ lineHeight: 1.7, fontSize: 15 }}>{children}</div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ padding: "16px 18px", background: CARD, border: BORDER, borderLeft: "3px solid " + GOLD, borderRadius: 6 }}>
      <span style={{ display: "block", color: GOLD2, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{value}</span>
      <span style={{ display: "block", color: MID, fontSize: 13, lineHeight: 1.5 }}>{label}</span>
    </div>
  );
}

function Offer({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{ padding: "18px 20px", background: CARD, border: BORDER, borderRadius: 8 }}>
      <span style={{ display: "block", color: GOLD2, fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{title}</span>
      <span style={{ display: "block", color: MID, fontSize: 14, lineHeight: 1.65 }}>{desc}</span>
    </div>
  );
}
