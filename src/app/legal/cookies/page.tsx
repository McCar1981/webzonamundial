"use client";

import Link from "next/link";

const BG = "#060B14", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a";

export default function CookiesPage() {
  return (
    <main style={{ background: BG, minHeight: "100vh", color: MID, padding: "80px 20px 60px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Link href="/" style={{ color: GOLD, fontSize: 13, textDecoration: "none", opacity: 0.7 }}>
          ← Volver al inicio
        </Link>

        <h1 style={{ color: GOLD2, fontSize: 32, fontWeight: 800, margin: "24px 0 8px", letterSpacing: "-0.5px" }}>
          Política de Cookies
        </h1>
        <p style={{ color: DIM, fontSize: 13, marginBottom: 40 }}>
          Última actualización: Abril 2026 · Conforme a la Directiva ePrivacy y el RGPD
        </p>

        <Section title="1. ¿Qué son las cookies?">
          <p>Las cookies son pequeños archivos de texto que los sitios web y aplicaciones almacenan en el dispositivo del usuario al ser visitados. Sirven para recordar preferencias, mantener sesiones activas, analizar el uso del servicio y mostrar publicidad relevante.</p>
          <p>En la aplicación móvil de ZonaMundial se utilizan tecnologías equivalentes: identificadores de dispositivo (IDFA en iOS, GAID en Android), almacenamiento local y SDK de analytics. El régimen de consentimiento es equivalente al de las cookies en web.</p>
          <p>Salvo las cookies estrictamente necesarias, ZonaMundial solicita tu consentimiento antes de instalar o activar cualquier cookie o tecnología de seguimiento. Puedes retirar o modificar tu consentimiento en cualquier momento.</p>
        </Section>

        <Section title="2. Tipos de cookies que utilizamos">
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>Cookies técnicas / estrictamente necesarias</h4>
          <p>Imprescindibles para el funcionamiento de la Plataforma. Gestionan tu sesión de usuario, mantienen la autenticación, almacenan preferencias esenciales de idioma y región, y garantizan la seguridad del servicio. <strong>No requieren consentimiento.</strong></p>

          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>Cookies de preferencias / personalización</h4>
          <p>Recuerdan tus configuraciones personalizadas (creador favorito, tema visual, notificaciones activadas). Requieren consentimiento.</p>

          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>Cookies de análisis y rendimiento</h4>
          <p>Permiten entender cómo los usuarios interactúan con la Plataforma (páginas visitadas, módulos usados, errores técnicos). Los datos son agregados o pseudonimizados. Requieren consentimiento.</p>

          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>Cookies de publicidad / seguimiento</h4>
          <p>Utilizadas por Google AdMob para mostrar anuncios adaptados en el plan gratuito. Pueden implicar el uso de identificadores de dispositivo para el seguimiento entre aplicaciones. Requieren consentimiento. Solo activas para usuarios del plan gratuito.</p>
        </Section>

        <Section title="3. Detalle de cookies por proveedor">
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>3.1 Cookies propias</h4>
          <p>Cookies de sesión, idioma, preferencias de usuario y autenticación gestionadas directamente por ZonaMundial.</p>

          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>3.2 Firebase Analytics (Google)</h4>
          <p>Responsable: Google LLC. Más información en policies.google.com/privacy.</p>

          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>3.3 Google AdMob (solo plan gratuito)</h4>
          <p>App Tracking Transparency (iOS): en dispositivos iOS 14.5+, ZonaMundial solicita permiso explícito mediante el diálogo ATT antes de acceder al IDFA. Si denegas el permiso, se mostrará publicidad contextual no personalizada.</p>

          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>3.4 Stripe</h4>
          <p>Cookies necesarias para el procesamiento seguro de pagos de la suscripción Premium.</p>
        </Section>

        <Section title="4. Gestión y retirada del consentimiento">
          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>Desde la Plataforma</h4>
          <p>Accede al panel de preferencias de cookies desde el pie de página o desde Ajustes &gt; Privacidad. Puedes activar o desactivar cada categoría de forma individual.</p>

          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>Desde tu navegador web</h4>
          <ul>
            <li><strong>Chrome:</strong> Ajustes &gt; Privacidad y seguridad &gt; Cookies</li>
            <li><strong>Safari:</strong> Preferencias &gt; Privacidad &gt; Cookies</li>
            <li><strong>Firefox:</strong> Preferencias &gt; Privacidad y seguridad &gt; Cookies</li>
            <li><strong>Edge:</strong> Configuración &gt; Privacidad, búsqueda y servicios &gt; Cookies</li>
          </ul>

          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>Desde tu dispositivo móvil</h4>
          <ul>
            <li><strong>iOS:</strong> Ajustes &gt; Privacidad y seguridad &gt; Seguimiento &gt; desactivar permiso para ZonaMundial.</li>
            <li><strong>Android:</strong> Ajustes &gt; Aplicaciones &gt; ZonaMundial &gt; Permisos; y Ajustes de Google &gt; Anuncios &gt; Restablecer ID publicitario.</li>
          </ul>

          <h4 style={{ color: GOLD, marginTop: 16, marginBottom: 8 }}>Opt-out de publicidad de Google</h4>
          <p>Web: adssettings.google.com · Red de Publicidad de Intereses de la UE: youronlinechoices.eu</p>
        </Section>

        <Section title="5. Actualizaciones de esta política">
          <p>Se notificará al usuario y se solicitará nuevo consentimiento cuando sea necesario conforme a la normativa aplicable.</p>
        </Section>

        <Section title="6. Contacto">
          <p>Para cualquier consulta sobre el uso de cookies: <a href="mailto:privacidad@zonamundial.app" style={{ color: GOLD }}>privacidad@zonamundial.app</a></p>
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
