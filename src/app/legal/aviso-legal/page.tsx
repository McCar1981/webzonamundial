"use client";

import Link from "next/link";

const BG = "#060B14", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a";

export default function AvisoLegalPage() {
  return (
    <main style={{ background: BG, minHeight: "100vh", color: MID, padding: "80px 20px 60px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Link href="/" style={{ color: GOLD, fontSize: 13, textDecoration: "none", opacity: 0.7 }}>
          ← Volver al inicio
        </Link>

        <h1 style={{ color: GOLD2, fontSize: 32, fontWeight: 800, margin: "24px 0 8px", letterSpacing: "-0.5px" }}>
          Aviso Legal
        </h1>
        <p style={{ color: DIM, fontSize: 13, marginBottom: 40 }}>
          Última actualización: Abril 2026 · En cumplimiento de la Ley 34/2002 (LSSI-CE)
        </p>

        <Section title="1. Datos del titular">
          <p>En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de los siguientes datos identificativos del titular de la plataforma.</p>
        </Section>

        <Section title="2. Objeto y actividad">
          <p>ZonaMundial es un servicio digital de entretenimiento deportivo que permite a los usuarios realizar predicciones sobre resultados de competiciones futbolísticas, participar en ligas fantasy, acceder a contenidos informativos sobre el torneo de selecciones nacionales 2026 y competir en clasificaciones de puntos con otros usuarios.</p>
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>Naturaleza del servicio</h4>
          <ul>
            <li>La Plataforma es un servicio de entretenimiento y predicción deportiva sin apuesta monetaria entre usuarios.</li>
            <li>Los puntos y clasificaciones del sistema son virtuales y no tienen valor económico directo.</li>
            <li>La Plataforma no constituye un servicio de juego de azar o apuestas en el sentido de la Ley 13/2011, al no mediar contraprestación económica entre participantes en los juegos de predicción gratuita.</li>
            <li>Los premios eventualmente otorgados son financiados exclusivamente por patrocinadores y no provienen de las aportaciones de otros usuarios.</li>
            <li>Sin licencia DGOJ: al ser una plataforma de predicción gratuita sin transferencia de dinero entre participantes, no está sujeta a autorización de la Dirección General de Ordenación del Juego (DGOJ).</li>
          </ul>
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>Servicios disponibles</h4>
          <ul>
            <li>Predicciones de partidos (resultado, goleadores, estadísticas)</li>
            <li>Fantasy — gestión de equipos virtuales basada en estadísticas reales</li>
            <li>Modo Carrera DT — simulación de seleccionador</li>
            <li>Ligas privadas con amigos y chat social</li>
            <li>Trivia y micro-predicciones en tiempo real</li>
            <li>Contenidos informativos editoriales sobre la competición</li>
            <li>Funciones premium opcionales (suscripción de pago)</li>
          </ul>
        </Section>

        <Section title="3. Condiciones de acceso y uso">
          <p>El acceso y la navegación por la Plataforma implica la aceptación plena y sin reservas del presente Aviso Legal, así como de los <Link href="/legal/terminos" style={{ color: GOLD }}>Términos y Condiciones de Uso</Link> y la <Link href="/legal/privacidad" style={{ color: GOLD }}>Política de Privacidad</Link>.</p>
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>Edad mínima</h4>
          <p>El acceso y registro está restringido a mayores de 14 años. Se recomienda que los usuarios menores de 18 años cuenten con el consentimiento de sus progenitores o tutores legales. El titular se reserva el derecho a solicitar documentación acreditativa de la edad en cualquier momento y a cancelar las cuentas de usuarios que no cumplan el requisito mínimo.</p>
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>Uso permitido</h4>
          <ul>
            <li>Uso personal, no comercial y conforme a la ley.</li>
            <li>No está permitida la reproducción, distribución o comunicación pública de los contenidos de la Plataforma sin autorización expresa.</li>
            <li>Queda prohibido el uso de bots, scrapers, sistemas automatizados o cualquier herramienta que altere el funcionamiento normal del servicio.</li>
          </ul>
        </Section>

        <Section title="4. Propiedad intelectual e industrial">
          <p>Todos los elementos de la Plataforma —código fuente, diseño gráfico, logotipos, textos, imágenes, iconografía, estructura, selección y presentación de contenidos— son propiedad de Carlos Manuel Zamudio Corral (SprintMarkt) o de sus licenciantes, y están protegidos por la legislación española e internacional sobre propiedad intelectual e industrial.</p>
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>Marcas</h4>
          <p>La denominación ZonaMundial y su logotipo son propiedad de Carlos Manuel Zamudio Corral bajo la marca comercial SprintMarkt. Queda prohibida su reproducción, modificación, distribución o uso comercial sin autorización previa y por escrito.</p>
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>Contenido de terceros y marcas deportivas</h4>
          <ul>
            <li>Los nombres y escudos de selecciones nacionales son marcas de sus respectivas federaciones. ZonaMundial los utiliza en contexto editorial informativo conforme a los usos admitidos por la doctrina del fair use informativo.</li>
            <li>Las banderas nacionales son patrimonio de dominio público y su representación gráfica es de libre uso.</li>
            <li>ZonaMundial no está afiliada, patrocinada ni avalada por la FIFA, la CONCACAF, la UEFA ni ninguna federación deportiva nacional o internacional.</li>
            <li>Cualquier marca registrada de terceros mencionada en la Plataforma pertenece a sus respectivos titulares.</li>
          </ul>
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>Contenido generado por usuarios</h4>
          <p>El contenido publicado por los usuarios en las funciones sociales de la Plataforma es responsabilidad exclusiva de quien lo genera. El titular no se hace responsable de dicho contenido, sin perjuicio de su derecho a moderarlo o eliminarlo cuando vulnere los Términos y Condiciones o la legislación vigente.</p>
        </Section>

        <Section title="5. Limitación de responsabilidad">
          <ul>
            <li>El titular no garantiza la disponibilidad continua e ininterrumpida del sitio web y la aplicación, si bien se compromete a adoptar las medidas técnicas razonables para asegurar la continuidad del servicio.</li>
            <li>Datos deportivos: se proporcionan con carácter informativo. No se garantiza la exactitud ni la actualización en tiempo real de los mismos.</li>
            <li>Daños técnicos: el titular no será responsable de los daños causados en los equipos o sistemas informáticos de los usuarios derivados del acceso o uso de la Plataforma.</li>
            <li>La Plataforma puede contener enlaces a sitios web de terceros sobre los que el titular no ejerce control. No se asume responsabilidad por sus contenidos.</li>
            <li>El titular quedará exonerado de responsabilidad por incumplimientos debidos a causas de fuerza mayor o caso fortuito.</li>
          </ul>
        </Section>

        <Section title="6. Política de enlaces">
          <p>Cualquier persona o entidad que desee establecer un enlace desde su sitio web a ZonaMundial deberá obtener autorización previa y por escrito. El enlace únicamente podrá dirigirse a la página principal (zonamundial.app). No se autorizan enlaces en sitios que contengan contenido ilícito, ofensivo, discriminatorio, o que pueda dañar la imagen de ZonaMundial o SprintMarkt.</p>
        </Section>

        <Section title="7. Legislación aplicable y jurisdicción">
          <p>El presente Aviso Legal se rige por la legislación española. Para la resolución de cualquier controversia, las partes se someten a los Juzgados y Tribunales de Valencia (España). En el caso de usuarios con la condición de consumidores, será de aplicación la normativa de protección de consumidores vigente en su lugar de residencia habitual.</p>
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>Marco normativo de referencia</h4>
          <ul>
            <li>Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE)</li>
            <li>Reglamento (UE) 2016/679 (RGPD) y Ley Orgánica 3/2018 (LOPDGDD)</li>
            <li>Real Decreto Legislativo 1/2007 (TRLGDCU)</li>
            <li>Ley 17/2001, de Marcas</li>
            <li>Real Decreto Legislativo 1/1996, de Propiedad Intelectual</li>
            <li>Ley 13/2011, de regulación del juego</li>
          </ul>
        </Section>

        <Section title="8. Contacto">
          <ul>
            <li>Email legal: <a href="mailto:legal@zonamundial.app" style={{ color: GOLD }}>legal@zonamundial.app</a></li>
            <li>Email comercial: <a href="mailto:business.dev@sprintmarkt.com" style={{ color: GOLD }}>business.dev@sprintmarkt.com</a></li>
            <li>Formulario web: <Link href="/contacto" style={{ color: GOLD }}>zonamundial.app/contacto</Link></li>
          </ul>
          <p>El titular se compromete a responder en un plazo máximo de 10 días hábiles.</p>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <h2 style={{ color: "#e8d48b", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{title}</h2>
      <div style={{ lineHeight: 1.7, fontSize: 14 }}>{children}</div>
    </section>
  );
}
