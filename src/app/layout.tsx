import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import RootLayoutClient from "./RootLayoutClient";
import { LanguageProvider } from "@/i18n/LanguageContext";

// Google AdSense Publisher ID (NEXT_PUBLIC_* expuesto al cliente).
const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID;

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
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ZonaMundial — Predicciones y Fantasy del Mundial 2026",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@zonamundial",
    creator: "@zonamundial",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/og-image.jpg"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/img/zonamundial-images/imagenes/IMG-20260302-WA0016-removebg-preview.webp", type: "image/webp" },
    ],
    shortcut: "/favicon.ico",
    apple: "/img/zonamundial-images/imagenes/IMG-20260302-WA0016-removebg-preview.webp",
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
        contactType: "business",
        email: "business.dev@sprintmarkt.com",
        availableLanguage: ["Spanish", "English"],
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
      location: [
        { "@type": "Country", name: "Estados Unidos" },
        { "@type": "Country", name: "México" },
        { "@type": "Country", name: "Canadá" },
      ],
      organizer: {
        "@type": "Organization",
        name: "FIFA",
        url: "https://www.fifa.com",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        {ADSENSE_ID ? (
          <Script
            id="adsbygoogle-init"
            async
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}`}
          />
        ) : null}
        <LanguageProvider>
          <RootLayoutClient>{children}</RootLayoutClient>
        </LanguageProvider>
      </body>
    </html>
  );
}
