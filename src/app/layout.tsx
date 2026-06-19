import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import { Outfit } from "next/font/google";
import "./globals.css";
import RootLayoutClient from "./RootLayoutClient";
import { LanguageProvider } from "@/i18n/LanguageContext";
import GoogleAnalyticsRouteTracker from "@/components/analytics/GoogleAnalyticsRouteTracker";
import AuthEventTracker from "@/components/analytics/AuthEventTracker";
import NativeAppGuard from "@/components/NativeAppGuard";
import { EntitlementsProvider } from "@/components/pro/EntitlementsProvider";
import PaywallModal from "@/components/pro/PaywallModal";
import FreeWeekendCampaign from "@/components/pro/FreeWeekendCampaign";
import FreeWeekendConversion from "@/components/pro/FreeWeekendConversion";
import { isAdSenseEnabled } from "@/lib/adsense";

// Self-host Outfit via next/font for zero CLS + no render-blocking <link>.
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--zm-font-outfit",
});

// Google AdSense Publisher ID. El ID es público (aparece en /ads.txt), así que
// usamos un fallback hardcodeado para garantizar que el cargador se emita en
// producción aunque la env var no esté definida en Vercel. Si se define
// NEXT_PUBLIC_ADSENSE_ID, esta tiene prioridad.
const ADSENSE_ID =
  process.env.NEXT_PUBLIC_ADSENSE_ID ?? "ca-pub-1977548438117778";

const SITE_URL = "https://zonamundial.app";
const SITE_NAME = "ZonaMundial";
const DEFAULT_TITLE = "ZonaMundial: Predicciones y Fantasy Mundial 2026";
const DEFAULT_DESCRIPTION =
  "Juega gratis al Mundial 2026: predicciones, fantasy, IA Coach, trivia y streaming con 9 creators. 48 selecciones, 16 sedes, 104 partidos. ¡Regístrate ya!";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: "%s | ZonaMundial",
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  keywords: [
    "mundial 2026",
    "predicciones mundial 2026",
    "fantasy mundial 2026",
    "quiniela mundial",
    "copa del mundo 2026",
    "calendario mundial 2026",
    "grupos mundial 2026",
    "selecciones mundial 2026",
    "sedes mundial 2026",
    "app mundial 2026",
    "fantasy fútbol",
    "predicciones fútbol",
    "trivia mundial",
    "ia coach fútbol",
  ],
  authors: [{ name: "ZonaMundial by SprintMarkt", url: SITE_URL }],
  creator: "SprintMarkt",
  publisher: "SprintMarkt",
  category: "Sports",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: "2ME_QN8gmSs6B2ghby7r79ZKGs5uRKjZDltVKiQeQok",
  },
  alternates: {
    canonical: "/",
    languages: {
      "es-ES": "/",
      "es-MX": "/",
      "es-AR": "/",
      "es-CO": "/",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    alternateLocale: ["es_MX", "es_AR", "es_CO"],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    // images se inyecta autom\u00e1ticamente por src/app/opengraph-image.tsx
    // (Next.js File Convention). Esa imagen es generada din\u00e1micamente
    // con el logo + branding dorado de ZonaMundial. Si en el futuro
    // quieres volver a una imagen est\u00e1tica, borra el archivo
    // opengraph-image.tsx y descomenta el bloque images de abajo.
  },
  twitter: {
    card: "summary_large_image",
    site: "@zonamundial",
    creator: "@zonamundial",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    // images: idem \u2014 lo inyecta twitter-image.tsx si existe, o cae
    // al opengraph-image.tsx como fallback.
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/favicon-16.png", type: "image/png", sizes: "16x16" },
      { url: "/icons/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "ZonaMundial",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  other: {
    "msapplication-TileColor": "#0b0b0f",
    "theme-color": "#0b0b0f",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0b0b0f",
  colorScheme: "dark light",
};

// JSON-LD: WebSite + Organization + SportsEvent (Mundial 2026)
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      inLanguage: "es",
      publisher: { "@id": `${SITE_URL}/#organization` },
      // Sin potentialAction/SearchAction: el único buscador (/historia/buscar)
      // filtra en cliente y NO consume el parámetro ?q de la URL, así que una
      // sitelinks searchbox enviaría a Google a una URL que ignora el término.
      // Mejor no declarar la acción que declarar una rota.
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      legalName: "Carlos Manuel Zamudio Corral (SprintMarkt)",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/img/zonamundial-images/imagenes/IMG-20260302-WA0016-removebg-preview.webp`,
      },
      foundingDate: "2025",
      founder: { "@type": "Person", name: "Carlos Manuel Zamudio Corral" },
      sameAs: [
        "https://x.com/zonamundial",
        "https://instagram.com/zonamundial",
        "https://tiktok.com/@zonamundial",
        "https://youtube.com/@zonamundial",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "gol@zonamundial.app",
        availableLanguage: ["Spanish", "English"],
        url: `${SITE_URL}/contacto`,
      },
    },
    {
      "@type": "SportsEvent",
      "@id": `${SITE_URL}/#mundial2026`,
      name: "Copa Mundial de Fútbol 2026",
      alternateName: ["Mundial 2026", "Copa del Mundo 2026"],
      description:
        "Vigesimoprimera edición de la Copa Mundial de Fútbol. 48 selecciones, 16 sedes en Estados Unidos, México y Canadá, 104 partidos.",
      startDate: "2026-06-11",
      endDate: "2026-07-19",
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
      sport: "Fútbol",
      // Image — required by Google for Event rich result.
      // El opengraph-image.tsx en root se sirve en /opengraph-image (Next
      // resuelve el endpoint dinámico). Como fallback, el logo branded.
      image: [
        `${SITE_URL}/opengraph-image`,
        `${SITE_URL}/img/email/logo-zonamundial.png`,
      ],
      // Location with full address per host country (Google requires address inside location)
      location: [
        {
          "@type": "Place",
          name: "Estados Unidos",
          address: {
            "@type": "PostalAddress",
            addressCountry: "US",
            addressRegion: "Multiple host cities",
          },
        },
        {
          "@type": "Place",
          name: "México",
          address: {
            "@type": "PostalAddress",
            addressCountry: "MX",
            addressRegion: "Multiple host cities",
          },
        },
        {
          "@type": "Place",
          name: "Canadá",
          address: {
            "@type": "PostalAddress",
            addressCountry: "CA",
            addressRegion: "Multiple host cities",
          },
        },
      ],
      organizer: {
        "@type": "Organization",
        name: "FIFA",
        url: "https://www.fifa.com",
      },
      // Performer — Google requires at least one for SportsEvent rich result.
      // 48 teams play; we list the 3 host nations as referential performers.
      performer: [
        { "@type": "SportsTeam", name: "Selección de Estados Unidos" },
        { "@type": "SportsTeam", name: "Selección de México" },
        { "@type": "SportsTeam", name: "Selección de Canadá" },
      ],
      // Offers — required field. ZonaMundial doesn't sell tickets but documents
      // free access to the prediction platform.
      offers: {
        "@type": "Offer",
        url: `${SITE_URL}/registro`,
        price: "0",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        validFrom: "2025-10-01",
        category: "Free prediction platform access",
      },
    },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Suprimir AdSense para usuarios Pro — suscripción activa O Founders
  // (cumple la promesa "navegación sin publicidad" de ambos planes).
  // Cualquier error en lookup → cargamos AdSense por defecto.
  let isProUser = false;
  try {
    const { getCurrentUser } = await import("@/lib/auth-helpers");
    const { isPro } = await import("@/lib/pro/entitlement");
    const u = await getCurrentUser();
    if (u) {
      isProUser = await isPro(u.id, u.email);
    }
  } catch {
    isProUser = false;
  }
  // Ruta actual (la inyecta el middleware en la cabecera x-pathname). El layout
  // raíz no recibe el pathname por props en App Router, así que se lee aquí.
  const pathname = headers().get("x-pathname") ?? "";
  // En /app/** vive la zona de juego (módulos tras login) y el cargador de
  // AdSense NO debe emitirse ahí. /app está además bloqueado en robots.txt para
  // que ningún crawler de Google lo evalúe. GA4 sí sigue en todas las rutas.
  const isApp = pathname === "/app" || pathname.startsWith("/app/");

  // AdSense cuando está habilitado y el usuario no es Pro. OJO: durante la
  // revisión de aprobación el script SÍ debe estar presente (checklist oficial
  // de AdSense: "código de anuncios colocado"); antes de aprobar no se sirve
  // ningún anuncio, así que no afecta a la UX. Para apagarlo en emergencia:
  // NEXT_PUBLIC_ADSENSE_ENABLED=false en Vercel.
  const showAds = isAdSenseEnabled && !!ADSENSE_ID && !isProUser && !isApp;

  return (
    <html lang="es" className={outfit.variable}>
      <head>
        {/* Google AdSense verification — ayuda a Google a verificar la propiedad. */}
        <meta name="google-adsense-account" content={ADSENSE_ID} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      {/* Los estilos base del body viven en globals.css, NUNCA inline aquí:
          ScrollTrigger re-serializa el atributo style del body al registrarse
          (en module-eval, antes de hidratar) y React avisaría en dev de
          "Prop `style` did not match" en todas las rutas. */}
      <body>
        {/* Google Consent Mode v2 — default POR REGIÓN.
            - EU/EEA + Reino Unido + Suiza: todo denied por defecto (lo exige el
              RGPD); el CMP certificado de Google (inyectado en runtime por IP del
              EEE) es el único surface de consentimiento y lo concede si el usuario
              acepta. El banner casero CookieConsent se retiró para no duplicar CMP.
            - Resto del mundo (LATAM, EEUU, etc.): granted por defecto. La mayor
              parte de la audiencia es LATAM (ul=es-419) y NO está bajo RGPD, así
              que meterla en denied la hacía invisible en GA4 Tiempo real sin
              necesidad legal (un usuario "denegado" usa client_id temporal y GA4
              apenas lo cuenta como activo). Google aplica el bloque `region` según
              la IP, así que no hace falta geolocalizar en el server.
            SIEMPRE presente (no solo con ads): GA4 carga en todas las visitas.
            (Hallazgo: auditoría AdSense 11-06 dejó la gestión de consentimiento;
            el split por región se añadió el 11-06 al ver 8 usuarios reales en la
            app salir como 1 en Tiempo real por estar denied por defecto.) */}
        <Script id="consent-mode-v2" strategy="beforeInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',region:['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB','CH'],wait_for_update:500});gtag('consent','default',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted'});`}
        </Script>
        {showAds ? (
          <Script
            id="adsbygoogle-init"
            async
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`}
          />
        ) : null}
        {/* Google Analytics 4 */}
        <Script
          id="ga4-gtag"
          async
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-J9NWM9GNRK"
        />
        <Script id="ga4-config" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-J9NWM9GNRK');`}
        </Script>
        {/* Emite page_view en cada navegación SPA (App Router no recarga la
            página, así que sin esto solo se contaba la primera vista). */}
        <GoogleAnalyticsRouteTracker />
        {/* Emite sign_up (alta) / login (vuelta) a GA4 al establecerse la sesión
            — cubre email magic-link y OAuth, que convergen en /auth/callback. */}
        <AuthEventTracker />
        <NativeAppGuard />
        <LanguageProvider>
          <EntitlementsProvider>
            <RootLayoutClient>{children}</RootLayoutClient>
            {/* Paywall contextual global: lo abre cualquier juego al recibir
                un error pro_required de la API (handleProRequired). */}
            <PaywallModal />
            <FreeWeekendCampaign />
            <FreeWeekendConversion />
          </EntitlementsProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
