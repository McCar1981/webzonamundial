import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Outfit } from "next/font/google";
import "./globals.css";
import RootLayoutClient from "./RootLayoutClient";
import { LanguageProvider } from "@/i18n/LanguageContext";
import CookieConsent from "@/components/CookieConsent";
import NativeAppGuard from "@/components/NativeAppGuard";

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
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/buscar?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      legalName: "ZonaMundial by SprintMarkt",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/img/zonamundial-images/imagenes/IMG-20260302-WA0016-removebg-preview.webp`,
      },
      foundingDate: "2025",
      founder: { "@type": "Organization", name: "SprintMarkt" },
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
  // Suprimir AdSense para Founders (cumple la promesa "navegación sin
  // publicidad"). Cualquier error en lookup → cargamos AdSense por defecto.
  let isFounderUser = false;
  try {
    const { getCurrentUser } = await import("@/lib/auth-helpers");
    const { isFounder } = await import("@/lib/founders/store");
    const u = await getCurrentUser();
    if (u?.email) {
      isFounderUser = await isFounder(u.email);
    }
  } catch {
    isFounderUser = false;
  }
  const showAds = !!ADSENSE_ID && !isFounderUser;

  return (
    <html lang="es" className={outfit.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "var(--zm-font-outfit), system-ui, sans-serif" }}>
        {showAds ? (
          <>
            {/* Google Consent Mode v2: por defecto todo denied. CookieConsent
                lo actualiza al elegir el usuario. */}
            <Script id="consent-mode-v2" strategy="beforeInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});`}
            </Script>
            <Script
              id="adsbygoogle-init"
              async
              strategy="afterInteractive"
              crossOrigin="anonymous"
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`}
            />
          </>
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
        <NativeAppGuard />
        <LanguageProvider>
          <RootLayoutClient>{children}</RootLayoutClient>
        </LanguageProvider>
        {showAds ? <CookieConsent /> : null}
      </body>
    </html>
  );
}
