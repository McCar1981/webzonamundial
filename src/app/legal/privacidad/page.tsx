"use client";

import Link from "next/link";

const BG = "#060B14", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a";

export default function PrivacidadPage() {
  return (
    <main style={{ background: BG, minHeight: "100vh", color: MID, padding: "80px 20px 60px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Link href="/" style={{ color: GOLD, fontSize: 13, textDecoration: "none", opacity: 0.7 }}>
          ← Volver al inicio
        </Link>

        <h1 style={{ color: GOLD2, fontSize: 32, fontWeight: 800, margin: "24px 0 8px", letterSpacing: "-0.5px" }}>
          Política de Privacidad
        </h1>
        <p style={{ color: DIM, fontSize: 13, marginBottom: 24 }}>
          Última actualización: Abril 2026 · Conforme al RGPD (UE) 2016/679 y LOPDGDD 3/2018
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 32, padding: "16px", background: "rgba(201,168,76,0.08)", borderLeft: "3px solid " + GOLD, borderRadius: 4 }}>
          <strong>Resumen:</strong> Recogemos tu email, nombre de usuario y actividad en la app para ofrecerte el servicio. No vendemos tus datos. Usamos proveedores de confianza (AWS, Stripe, Firebase). Tienes derecho a acceder, rectificar y eliminar tus datos escribiendo a <a href="mailto:privacidad@zonamundial.app" style={{ color: GOLD }}>privacidad@zonamundial.app</a>.
        </p>

        <Section title="1. Responsable del tratamiento">
          <p>Carlos Manuel Zamudio Corral (SprintMarkt), con domicilio en Valencia, España. Contacto de privacidad: <a href="mailto:privacidad@zonamundial.app" style={{ color: GOLD }}>privacidad@zonamundial.app</a>.</p>
        </Section>

        <Section title="2. Qué datos recogemos y cómo">
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>2.1 Datos que tú nos proporcionas directamente</h4>
          <ul>
            <li><strong>Registro de cuenta:</strong> nombre de usuario, email, contraseña (almacenada en formato hash bcrypt, nunca en texto plano), fecha de nacimiento (para verificación de edad).</li>
            <li><strong>Perfil opcional:</strong> foto de perfil (si la cargas), nombre de pila o alias público.</li>
            <li><strong>Pago premium:</strong> los datos de tarjeta son procesados íntegramente por Stripe. ZonaMundial únicamente recibe el identificador del cliente y el estado de la suscripción. Nunca se almacenan datos de tarjeta.</li>
            <li><strong>Comunicaciones:</strong> mensajes enviados al soporte técnico o a través del formulario de contacto.</li>
            <li><strong>Contenido de usuario:</strong> predicciones, selecciones de fantasy, mensajes en el chat de ligas privadas, votos en trivia.</li>
          </ul>
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>2.2 Datos recogidos automáticamente</h4>
          <ul>
            <li><strong>Datos de uso:</strong> módulos visitados, partidos consultados, tiempo de sesión, acciones realizadas en la app.</li>
            <li><strong>Datos técnicos:</strong> dirección IP (para geolocalización aproximada y publicidad adaptada), tipo de dispositivo, sistema operativo, versión de la app, idioma del dispositivo.</li>
            <li><strong>Identificadores de dispositivo:</strong> IDFA (iOS) o GAID (Android) para AdMob, únicamente si el usuario consiente el seguimiento publicitario.</li>
            <li><strong>Token de notificación:</strong> identificador de Firebase Cloud Messaging para el envío de notificaciones push.</li>
            <li><strong>Cookies y almacenamiento local:</strong> ver <Link href="/legal/cookies" style={{ color: GOLD }}>Política de Cookies</Link>.</li>
          </ul>
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>2.3 Datos de terceros</h4>
          <p>Si te registras mediante Google o Apple, recibiremos únicamente los datos que hayas autorizado (normalmente: email y nombre). No se solicita acceso a contactos, calendario ni otros datos de la cuenta de terceros.</p>
        </Section>

        <Section title="3. Para qué usamos tus datos">
          <p>Utilizamos tus datos para prestar el servicio (gestión de cuenta, predicciones, rankings), comunicarnos contigo (notificaciones, soporte), mejorar la plataforma (analítica agregada), mostrar publicidad (plan gratuito) y cumplir obligaciones legales.</p>
          <p>No usamos tus datos para: venderlos a terceros, crear perfiles de comportamiento fuera de la Plataforma, ni tomar decisiones automatizadas con efectos jurídicos significativos.</p>
        </Section>

        <Section title="4. Base jurídica del tratamiento (Art. 6 RGPD)">
          <p>Cuando el tratamiento se base en el consentimiento, tienes derecho a retirarlo en cualquier momento sin que ello afecte al funcionamiento del servicio gratuito de predicciones.</p>
        </Section>

        <Section title="5. Destinatarios y proveedores">
          <p>Los creadores de contenido asociados (Sportfield Agency) pueden ver métricas agregadas de su comunidad. En ningún caso tienen acceso a datos identificativos de usuarios individuales.</p>
          <p>El titular no vende, cede ni comparte datos personales con terceros para sus propios fines comerciales.</p>
        </Section>

        <Section title="6. Transferencias internacionales de datos">
          <p>Algunos proveedores procesan datos fuera del Espacio Económico Europeo. Las garantías adoptadas son: Cláusulas Contractuales Tipo (SCCs) adoptadas por la Comisión Europea, Marco UE-EE.UU. de Privacidad de Datos (DPF) cuando el proveedor está certificado, y Evaluaciones de impacto de transferencia (TIA) para los proveedores principales.</p>
          <p>Puedes solicitar información sobre las garantías específicas escribiendo a <a href="mailto:privacidad@zonamundial.app" style={{ color: GOLD }}>privacidad@zonamundial.app</a>.</p>
        </Section>

        <Section title="7. Conservación de los datos">
          <p>Los datos se conservan mientras la cuenta esté activa y durante los plazos legales aplicables tras su eliminación.</p>
        </Section>

        <Section title="8. Tus derechos">
          <p>Conforme al RGPD y la LOPDGDD, puedes ejercer los siguientes derechos:</p>
          <ul>
            <li><strong>Acceso:</strong> saber qué datos tenemos sobre ti.</li>
            <li><strong>Rectificación:</strong> corregir datos incorrectos o incompletos.</li>
            <li><strong>Supresión:</strong> eliminar tus datos (&quot;derecho al olvido&quot;).</li>
            <li><strong>Limitación:</strong> restringir el tratamiento en ciertos casos.</li>
            <li><strong>Portabilidad:</strong> obtener tus datos en formato legible por máquina.</li>
            <li><strong>Oposición:</strong> oponerte al tratamiento por interés legítimo o marketing.</li>
            <li><strong>Decisiones automatizadas:</strong> no ser objeto de decisiones totalmente automatizadas.</li>
            <li><strong>Retirar consentimiento:</strong> en cualquier momento, sin efecto retroactivo.</li>
          </ul>
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>Cómo ejercerlos</h4>
          <ul>
            <li>Desde la app: Ajustes &gt; Cuenta &gt; Privacidad y datos.</li>
            <li>Por email: <a href="mailto:privacidad@zonamundial.app" style={{ color: GOLD }}>privacidad@zonamundial.app</a> — indicando nombre de usuario, email de registro y el derecho que deseas ejercer.</li>
            <li>Plazo de respuesta: máximo 30 días naturales (prorrogables a 60 en casos complejos).</li>
          </ul>
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>Reclamación ante la AEPD</h4>
          <p>Si consideras que el tratamiento infringe la normativa, puedes reclamar ante la Agencia Española de Protección de Datos (AEPD): www.aepd.es, C/ Jorge Juan, 6, 28001 Madrid. Los usuarios de América Latina pueden dirigirse a la autoridad de protección de datos de su país de residencia.</p>
        </Section>

        <Section title="9. Menores de edad">
          <p>ZonaMundial está dirigida a usuarios mayores de 14 años, que es la edad mínima de consentimiento digital en España conforme al artículo 8 del RGPD y el artículo 7 de la LOPDGDD. Para usuarios residentes en otros países, se aplica la edad mínima de su legislación nacional si es superior.</p>
          <p>Si se detecta o recibe notificación de que un usuario es menor de 14 años, se procederá a la eliminación inmediata de su cuenta y todos los datos asociados. Los progenitores o tutores que tengan conocimiento de un registro indebido pueden solicitar la eliminación en <a href="mailto:privacidad@zonamundial.app" style={{ color: GOLD }}>privacidad@zonamundial.app</a>.</p>
          <p>Publicidad: para usuarios identificados como menores de edad (entre 14 y 18 años), se mostrará exclusivamente publicidad contextual no dirigida, desactivando el uso de IDFA/GAID para AdMob.</p>
        </Section>

        <Section title="10. Seguridad">
          <ul>
            <li><strong>Cifrado en tránsito:</strong> todas las comunicaciones mediante TLS 1.3 (HTTPS).</li>
            <li><strong>Cifrado en reposo:</strong> bases de datos y almacenamientos cifrados (AES-256).</li>
            <li><strong>Contraseñas:</strong> almacenadas en hash bcrypt con salt. El titular no puede recuperar tu contraseña.</li>
            <li><strong>Acceso restringido:</strong> solo los empleados y proveedores con necesidad operativa acceden a datos personales.</li>
            <li><strong>Infraestructura:</strong> alojada en AWS con controles de seguridad estándar (VPC, IAM, WAF).</li>
            <li><strong>Notificación de brechas:</strong> en caso de brecha con riesgo para los usuarios, se notificará a la AEPD en 72 horas y a los afectados en cuanto sea razonablemente posible.</li>
          </ul>
        </Section>

        <Section title="11. Cookies y tecnologías similares">
          <p>Para información detallada consulta la <Link href="/legal/cookies" style={{ color: GOLD }}>Política de Cookies</Link>.</p>
        </Section>

        <Section title="12. Cambios en esta política">
          <p>Cuando los cambios sean significativos, se notificará mediante aviso dentro de la app, correo electrónico a la dirección de registro y actualización de la fecha de este documento. El uso continuado de la Plataforma tras la publicación de cambios implica la aceptación de la política actualizada.</p>
        </Section>

        <Section title="13. Contacto">
          <ul>
            <li>Email de privacidad: <a href="mailto:privacidad@zonamundial.app" style={{ color: GOLD }}>privacidad@zonamundial.app</a></li>
            <li>Email general: <a href="mailto:legal@zonamundial.app" style={{ color: GOLD }}>legal@zonamundial.app</a></li>
          </ul>
          <p style={{ fontSize: 13, color: DIM }}>Carlos Manuel Zamudio Corral, como empresario individual en etapa de inicio, no está obligado a designar un Delegado de Protección de Datos (DPO) formal según el Art. 37 RGPD. El punto de contacto para privacidad es privacidad@zonamundial.app.</p>
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
