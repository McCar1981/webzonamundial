"use client";

import Link from "next/link";

const BG = "#060B14", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a";

export default function EulaPage() {
  return (
    <main style={{ background: BG, minHeight: "100vh", color: MID, padding: "80px 20px 60px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Link href="/" style={{ color: GOLD, fontSize: 13, textDecoration: "none", opacity: 0.7 }}>
          ← Volver al inicio
        </Link>

        <h1 style={{ color: GOLD2, fontSize: 32, fontWeight: 800, margin: "24px 0 8px", letterSpacing: "-0.5px" }}>
          Licencia de Usuario Final (EULA)
        </h1>
        <p style={{ color: DIM, fontSize: 13, marginBottom: 24 }}>
          Última actualización: Abril 2026 · Apple App Store y Google Play Store
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 32, padding: "16px", background: "rgba(201,168,76,0.08)", borderLeft: "3px solid " + GOLD, borderRadius: 4 }}>
          Este EULA regula el uso de la aplicación móvil ZonaMundial. Aplica de forma complementaria a los <Link href="/legal/terminos" style={{ color: GOLD }}>Términos y Condiciones</Link> generales del servicio. En caso de conflicto, prevalece el EULA en lo que respecta al uso de la aplicación móvil.
        </p>

        <Section title="1. Partes del acuerdo">
          <p>Este Acuerdo de Licencia de Usuario Final (&quot;EULA&quot;) es un contrato legal entre:</p>
          <ul>
            <li><strong>Licenciante:</strong> Carlos Manuel Zamudio Corral (NIF: 26581062P), con domicilio en Avenida General Avilés, 20 Duplo, 46015 Valencia, España, actuando bajo la marca comercial SprintMarkt / ZonaMundial.</li>
            <li><strong>Licenciatario:</strong> tú, la persona física que descarga, instala o utiliza la aplicación.</li>
          </ul>
          <p>Al descargar, instalar o utilizar ZonaMundial, aceptas quedar vinculado por este EULA. Si no aceptas sus términos, no debes instalar ni utilizar la aplicación.</p>
        </Section>

        <Section title="2. Concesión de licencia">
          <p>Carlos Manuel Zamudio Corral (SprintMarkt) te concede una licencia personal, no exclusiva, no transferible, revocable y limitada para descargar e instalar una copia de la aplicación ZonaMundial en dispositivos móviles que sean de tu propiedad o estén bajo tu control, y para acceder y utilizarla conforme a este EULA, los Términos y Condiciones y la legislación aplicable.</p>
          <p>Esta licencia no incluye ningún derecho de sublicencia, reventa, distribución, modificación, descompilación o ingeniería inversa. La aplicación se licencia, no se vende. El titular conserva la plena titularidad de la aplicación y todos los derechos de propiedad intelectual asociados.</p>
        </Section>

        <Section title="3. Restricciones de uso">
          <p>Queda expresamente prohibido:</p>
          <ul>
            <li>Copiar, modificar, adaptar, traducir o crear trabajos derivados de la aplicación.</li>
            <li>Realizar ingeniería inversa, descompilar, desensamblar o intentar obtener el código fuente.</li>
            <li>Eliminar o alterar avisos de derechos de propiedad, marcas o leyendas de la aplicación.</li>
            <li>Alquilar, arrendar, prestar, revender, sublicenciar o transferir la aplicación a terceros.</li>
            <li>Utilizar la aplicación con fines ilegales, fraudulentos o contrarios a los Términos y Condiciones.</li>
            <li>Utilizar herramientas automatizadas (bots, scrapers, macros) para interactuar con la aplicación.</li>
            <li>Interferir con los servidores o la red del titular.</li>
            <li>Utilizar la aplicación para transmitir código malicioso.</li>
          </ul>
        </Section>

        <Section title="4. Actualizaciones de la aplicación">
          <p>El titular puede publicar actualizaciones, parches o nuevas versiones en cualquier momento. Algunas actualizaciones pueden ser obligatorias para continuar utilizando el servicio. El titular no es responsable de las interrupciones del servicio causadas por no actualizar la aplicación a la versión más reciente disponible.</p>
        </Section>

        <Section title="5. Compras in-app y suscripciones">
          <p>Las compras a través de App Store se gestionan conforme a los Términos de Apple. Las compras a través de Google Play se gestionan conforme a las Condiciones de Google Play. Los usuarios de la UE conservan el derecho de desistimiento de 14 días conforme al TRLGDCU cuando aplique.</p>
        </Section>

        <Section title="6. Recopilación de datos y privacidad">
          <p>El titular recopila y trata datos personales en la medida necesaria para prestar el servicio. Para información completa consulta la <Link href="/legal/privacidad" style={{ color: GOLD }}>Política de Privacidad</Link>.</p>
        </Section>

        <Section title="7. Contenido de terceros y datos deportivos">
          <p>La aplicación muestra datos deportivos proporcionados por Total Football API. El titular no es responsable de la exactitud o actualización en tiempo real de dichos datos. ZonaMundial no está afiliada, patrocinada, aprobada ni asociada a la FIFA, la UEFA, la CONCACAF ni a ninguna federación deportiva nacional o internacional.</p>
        </Section>

        <Section title="8. Ausencia de garantía">
          <p style={{ textTransform: "uppercase", fontSize: 13, fontWeight: 600 }}>La aplicación se proporciona &quot;tal cual&quot; y &quot;según disponibilidad&quot;, sin garantías de ningún tipo, expresas o implícitas. El titular no garantiza que la aplicación funcionará de forma ininterrumpida o libre de errores, que los resultados obtenidos serán exactos o fiables, ni que cualquier error será corregido.</p>
        </Section>

        <Section title="9. Limitación de responsabilidad">
          <p style={{ textTransform: "uppercase", fontSize: 13, fontWeight: 600 }}>En la máxima medida permitida por la legislación aplicable, el titular no será responsable por daños indirectos, incidentales, especiales, consecuentes o punitivos, incluyendo pérdida de beneficios, datos o interrupción del servicio.</p>
          <p>La responsabilidad total del titular no superará, en ningún caso, el importe abonado por el usuario en los 12 meses anteriores al evento, o 50 euros si no ha habido pago.</p>
        </Section>

        <Section title="10. Terminación de la licencia">
          <p>La licencia termina automáticamente si incumples cualquier término de este EULA o de los Términos y Condiciones, si eliminas tu cuenta, si el titular cancela tu cuenta por incumplimiento, o si el titular cierra el servicio definitivamente. Al terminar la licencia, debes dejar de usar la aplicación y eliminarla de tus dispositivos.</p>
        </Section>

        <Section title="11. Cláusulas específicas — Apple App Store">
          <p style={{ fontSize: 13, color: DIM, marginBottom: 12 }}>Las siguientes cláusulas son obligatorias conforme a los requisitos de revisión de la App Store de Apple (sección 3.2).</p>
          <ul>
            <li><strong>Reconocimiento:</strong> Este EULA se celebra entre Carlos Manuel Zamudio Corral (SprintMarkt) y el usuario, y NO con Apple Inc. Apple no es parte de este EULA y no es responsable de la aplicación ni de su contenido.</li>
            <li><strong>Alcance de la licencia:</strong> La licencia concedida es para el uso de la aplicación en dispositivos iOS propiedad del usuario o bajo su control.</li>
            <li><strong>Mantenimiento y soporte:</strong> SprintMarkt es el único responsable de proporcionar servicios de mantenimiento y soporte. Apple no tiene ninguna obligación al respecto.</li>
            <li><strong>Garantía:</strong> SprintMarkt es el único responsable de cualquier garantía relacionada con la aplicación.</li>
            <li><strong>Reclamaciones de producto:</strong> SprintMarkt es el único responsable de atender cualquier reclamación relacionada con la aplicación.</li>
            <li><strong>Derechos de propiedad intelectual:</strong> En caso de reclamación de terceros por infracción, SprintMarkt, no Apple, será el único responsable.</li>
            <li><strong>Cumplimiento legal:</strong> El usuario declara que no se encuentra en un país sujeto a embargo del Gobierno de EE.UU.</li>
            <li><strong>Terceros beneficiarios:</strong> Apple y sus filiales son terceros beneficiarios de este EULA.</li>
          </ul>
        </Section>

        <Section title="12. Cláusulas específicas — Google Play Store">
          <p>Las aplicaciones distribuidas en Google Play están sujetas a las Políticas del Programa para Desarrolladores de Google Play. SprintMarkt declara el cumplimiento de dichas políticas. La sección Data Safety de Google Play refleja los datos recopilados y compartidos por la aplicación, conforme a lo declarado en la Política de Privacidad.</p>
        </Section>

        <Section title="13. Ley aplicable">
          <p>Este EULA se rige por la legislación española. Para cualquier controversia, las partes se someten a los Juzgados y Tribunales de Valencia (España), sin perjuicio de los derechos del usuario como consumidor en su país de residencia.</p>
        </Section>

        <Section title="14. Contacto">
          <ul>
            <li>Soporte: <a href="mailto:soporte@zonamundial.app" style={{ color: GOLD }}>soporte@zonamundial.app</a></li>
            <li>Legal: <a href="mailto:legal@zonamundial.app" style={{ color: GOLD }}>legal@zonamundial.app</a></li>
            <li>Comercial: <a href="mailto:business.dev@sprintmarkt.com" style={{ color: GOLD }}>business.dev@sprintmarkt.com</a></li>
          </ul>
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
