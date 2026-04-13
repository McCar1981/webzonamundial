"use client";

import Link from "next/link";

const BG = "#060B14", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a";

export default function TerminosPage() {
  return (
    <main style={{ background: BG, minHeight: "100vh", color: MID, padding: "80px 20px 60px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Link href="/" style={{ color: GOLD, fontSize: 13, textDecoration: "none", opacity: 0.7 }}>
          ← Volver al inicio
        </Link>

        <h1 style={{ color: GOLD2, fontSize: 32, fontWeight: 800, margin: "24px 0 8px", letterSpacing: "-0.5px" }}>
          Términos y Condiciones de Uso
        </h1>
        <p style={{ color: DIM, fontSize: 13, marginBottom: 40 }}>
          Última actualización: Abril 2026 · Versión 1.0
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 32, padding: "16px", background: "rgba(201,168,76,0.08)", borderLeft: "3px solid " + GOLD, borderRadius: 4 }}>
          Al registrarte en ZonaMundial o al acceder a la Plataforma aceptas íntegramente estos Términos y Condiciones. Léelos detenidamente antes de continuar.
        </p>

        <Section title="1. Objeto y aceptación">
          <p>Los presentes Términos y Condiciones de Uso regulan el acceso y uso de la plataforma digital ZonaMundial, disponible en zonamundial.app y en las aplicaciones móviles para iOS y Android, titularidad de Carlos Manuel Zamudio Corral (NIF: 26581062P), actuando bajo la marca comercial SprintMarkt.</p>
          <p>El acceso, registro o uso de cualquier funcionalidad de la Plataforma implica la aceptación plena, sin reservas y vinculante de estos Términos, así como de la <Link href="/legal/privacidad" style={{ color: GOLD }}>Política de Privacidad</Link> y la <Link href="/legal/cookies" style={{ color: GOLD }}>Política de Cookies</Link>. Si no estás de acuerdo con estos Términos, debes abstenerte de acceder o usar la Plataforma.</p>
        </Section>

        <Section title="2. Registro y cuenta de usuario">
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>2.1 Requisitos de edad</h4>
          <p>Para registrarse en ZonaMundial es necesario tener al menos 14 años. Al completar el registro, el usuario declara bajo su responsabilidad cumplir este requisito.</p>
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>2.2 Proceso de registro</h4>
          <p>El registro puede realizarse mediante correo electrónico y contraseña propia, inicio de sesión con Google, o inicio de sesión con Apple ID. El usuario se compromete a proporcionar información veraz, completa y actualizada.</p>
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>2.3 Responsabilidad de la cuenta</h4>
          <ul>
            <li>Cada usuario puede tener una única cuenta. La creación de cuentas múltiples para obtener ventajas constituye una infracción grave.</li>
            <li>El usuario es responsable de mantener la confidencialidad de sus credenciales y de todas las actividades realizadas desde su cuenta.</li>
            <li>Ante cualquier uso no autorizado, el usuario debe notificarlo inmediatamente a <a href="mailto:soporte@zonamundial.app" style={{ color: GOLD }}>soporte@zonamundial.app</a>.</li>
          </ul>
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>2.4 Canal de acceso</h4>
          <p>ZonaMundial distribuye el servicio a través de creadores de contenido asociados. El usuario accede a través del enlace o código de su creador de referencia, lo que personaliza su experiencia. Esta asociación es voluntaria y no limita el acceso a ninguna funcionalidad del plan gratuito.</p>
        </Section>

        <Section title="3. Descripción del servicio">
          <p>ZonaMundial es una plataforma de entretenimiento deportivo que incluye módulos de predicciones, fantasy, modo carrera, trivia, ligas privadas, chat social, contenidos editoriales y funciones premium opcionales.</p>
        </Section>

        <Section title="4. Plan gratuito y naturaleza del servicio de predicciones">
          <p style={{ fontWeight: 600, color: GOLD2 }}>ZonaMundial NO es una plataforma de apuestas. Las predicciones son completamente gratuitas. Los puntos son virtuales y no tienen valor monetario.</p>
          <ul>
            <li>Los usuarios no arriesgan dinero real al realizar predicciones.</li>
            <li>No hay transferencia de valor económico de unos usuarios a otros.</li>
            <li>El sistema de puntuación es virtual sin equivalencia económica directa.</li>
            <li>Los premios son financiados por los patrocinadores de la Plataforma, no por las aportaciones de otros usuarios.</li>
            <li>La puntuación depende del conocimiento futbolístico del usuario, con un componente aleatorio inherente a los resultados deportivos.</li>
            <li>En el plan gratuito, los usuarios aceptan la visualización de publicidad contextual y/o personalizada (según consentimiento) como modelo de negocio.</li>
          </ul>
        </Section>

        <Section title="5. Suscripción Premium y compras in-app">
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>5.1 Características del plan Premium</h4>
          <p>La suscripción Premium ofrece entre otras funcionalidades: ausencia de publicidad, módulos exclusivos (IA Coach avanzado, estadísticas ampliadas), acceso prioritario a nuevas funciones y emblemas de perfil premium.</p>
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>5.2 Precios y facturación</h4>
          <p>El procesamiento de pagos se realiza a través de Stripe (web) y las tiendas de aplicaciones. No se almacenan datos de tarjetas bancarias.</p>
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>5.3 Política de reembolsos</h4>
          <ul>
            <li>Usuarios de la UE: derecho de desistimiento de 14 días naturales desde la compra, salvo que se haya solicitado el inicio de la prestación antes del vencimiento del plazo.</li>
            <li>Disfunción técnica grave: si el servicio no está disponible durante más del 30% del período contratado por causas imputables al titular, el usuario puede solicitar un reembolso proporcional.</li>
            <li>Compras en App Store o Google Play: se rigen por la política de reembolsos de Apple o Google respectivamente.</li>
            <li>Solicitudes de reembolso: <a href="mailto:soporte@zonamundial.app" style={{ color: GOLD }}>soporte@zonamundial.app</a></li>
          </ul>
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>5.4 Compras in-app</h4>
          <p>La Plataforma puede ofrecer compras in-app adicionales (contenido cosmético, badges, funciones puntuales). Las compras in-app no son reembolsables salvo error técnico demostrable o requisito legal aplicable.</p>
        </Section>

        <Section title="6. Sistema de puntos y rankings">
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>6.1 Naturaleza de los puntos</h4>
          <p>Los puntos acumulados en ZonaMundial son virtuales, intransferibles y sin valor económico directo. No pueden ser canjeados por dinero ni transferidos entre usuarios.</p>
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>6.2 Criterios de puntuación</h4>
          <p>El titular establece y puede modificar en cualquier momento los criterios de puntuación de cada módulo. Los criterios vigentes se muestran en la sección &quot;Cómo jugar&quot;. Las modificaciones no tendrán efecto retroactivo sobre predicciones ya realizadas.</p>
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>6.3 Integridad del ranking</h4>
          <p>Cualquier intento de manipular el sistema —bots, múltiples cuentas, explotación de bugs o coordinación con terceros— resultará en la inhabilitación permanente de la cuenta y la exclusión del ranking.</p>
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>6.4 Empates</h4>
          <p>Criterios de desempate por orden: (1) mayor número de predicciones exactas, (2) mayor antigüedad como usuario registrado, (3) sorteo aleatorio entre los empatados.</p>
        </Section>

        <Section title="7. Premios y concursos patrocinados">
          <ul>
            <li>ZonaMundial puede organizar concursos con premios aportados por patrocinadores, que se regirán por sus propias Bases Legales publicadas en la Plataforma.</li>
            <li>La participación es gratuita.</li>
            <li>Los premios son aportados por los patrocinadores, no por las cuotas de los usuarios.</li>
            <li>Los ganadores son notificados por email y/o dentro de la Plataforma.</li>
            <li>Los premios no son canjeables por su valor en metálico salvo indicación expresa.</li>
            <li>Los impuestos aplicables a los premios son responsabilidad del ganador conforme a la legislación de su país de residencia.</li>
          </ul>
        </Section>

        <Section title="8. Código de conducta y contenido prohibido">
          <p>Queda expresamente prohibido:</p>
          <ul>
            <li>Publicar contenido ilegal, difamatorio, obsceno, discriminatorio, amenazante o que incite al odio.</li>
            <li>Acosar, intimidar o amenazar a otros usuarios a través del chat u otras funciones sociales.</li>
            <li>Hacerse pasar por otra persona, creador o por el titular.</li>
            <li>Registrar múltiples cuentas bajo identidades falsas.</li>
            <li>Utilizar bots, scripts o automatismos para interactuar con la Plataforma.</li>
            <li>Intentar acceder a partes restringidas del sistema o a cuentas ajenas.</li>
            <li>Reproducir, distribuir o comercializar el contenido de la Plataforma sin autorización.</li>
          </ul>
          <p>Los usuarios pueden reportar infracciones a través de la función &quot;Reportar&quot; de la app o escribiendo a <a href="mailto:soporte@zonamundial.app" style={{ color: GOLD }}>soporte@zonamundial.app</a>.</p>
        </Section>

        <Section title="9. Propiedad intelectual">
          <p>Todos los elementos de ZonaMundial —código fuente, diseño, logotipos, textos, gráficos, estructura, funcionalidades— son propiedad de Carlos Manuel Zamudio Corral (SprintMarkt) o de sus licenciantes y están protegidos por la legislación de propiedad intelectual.</p>
          <p>El usuario conserva la propiedad de todo el contenido que publique en la Plataforma. Al publicarlo, otorga al titular una licencia mundial, no exclusiva, gratuita, sublicenciable y transferible para usar, reproducir, modificar, adaptar, publicar, traducir y distribuir dicho contenido en el marco de la operación y promoción del servicio. Esta licencia finaliza cuando el usuario elimina el contenido o cierra su cuenta.</p>
          <p>ZonaMundial no está afiliada ni respaldada por la FIFA, ninguna federación nacional ni organismo deportivo oficial.</p>
        </Section>

        <Section title="10. Suspensión y cancelación de cuentas">
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>10.1 Cancelación voluntaria</h4>
          <p>El usuario puede cancelar su cuenta en cualquier momento desde Ajustes &gt; Cuenta &gt; Eliminar cuenta. La eliminación es inmediata y conlleva la pérdida de puntos, rankings y contenido asociado.</p>
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>10.2 Cancelación por el titular</h4>
          <p>El titular puede suspender o cancelar cuentas por: incumplimiento de estos Términos, uso fraudulento del sistema, publicación de contenido ilegal o gravemente ofensivo, impago de la suscripción Premium, o requerimiento de autoridad competente.</p>
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>10.3 Fin del servicio</h4>
          <p>Al finalizar la cobertura del torneo (19 de julio de 2026), la Plataforma puede pasar a modo mantenimiento o cierre. El titular informará a los usuarios con al menos 30 días de antelación.</p>
        </Section>

        <Section title="11. Limitación de responsabilidad">
          <p>El titular no garantiza la disponibilidad ininterrumpida de la Plataforma ni la exactitud de los datos deportivos de terceros. No se responsabiliza de daños indirectos, lucro cesante o pérdida de datos derivados del uso de la Plataforma, ni del contenido publicado por los usuarios en funciones sociales.</p>
          <p>La responsabilidad máxima del titular frente a un usuario, por cualquier concepto, no podrá exceder el importe abonado por dicho usuario en los 12 meses anteriores al evento dañoso o, si no hubo pago, la cantidad de 50 euros.</p>
        </Section>

        <Section title="12. Modificaciones del servicio y los términos">
          <p>El titular puede modificar estos Términos en cualquier momento. Los cambios relevantes se comunicarán mediante notificación en la app, correo electrónico y actualización de la fecha de este documento. El uso continuado tras los cambios implica su aceptación.</p>
        </Section>

        <Section title="13. Privacidad y cookies">
          <p>El tratamiento de los datos personales se rige por la <Link href="/legal/privacidad" style={{ color: GOLD }}>Política de Privacidad</Link>, que forma parte integrante de estos Términos. El uso de cookies y tecnologías similares se regula en la <Link href="/legal/cookies" style={{ color: GOLD }}>Política de Cookies</Link>.</p>
        </Section>

        <Section title="14. Legislación aplicable y resolución de disputas">
          <p>Estos Términos se rigen por la legislación española. Las partes se someten a los Juzgados y Tribunales de Valencia (España). Los usuarios de la UE pueden acudir a la plataforma de resolución de litigios en línea de la Comisión Europea. Con carácter previo, el titular atiende reclamaciones en <a href="mailto:soporte@zonamundial.app" style={{ color: GOLD }}>soporte@zonamundial.app</a> con compromiso de respuesta en 10 días hábiles.</p>
        </Section>

        <Section title="15. Contacto">
          <ul>
            <li>Soporte técnico y cuenta: <a href="mailto:soporte@zonamundial.app" style={{ color: GOLD }}>soporte@zonamundial.app</a></li>
            <li>Legal y privacidad: <a href="mailto:legal@zonamundial.app" style={{ color: GOLD }}>legal@zonamundial.app</a></li>
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
