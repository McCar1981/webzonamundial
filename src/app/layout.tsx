import type { Metadata } from "next";
import "./globals.css";
import RootLayoutClient from "./RootLayoutClient";
import { LanguageProvider } from "@/i18n/LanguageContext";

export const metadata: Metadata = {
  title: "ZonaMundial — Predicciones, Fantasy y Engagement para el Mundial 2026",
  description: "Plataforma de predicciones, fantasy y engagement en español para la Copa del Mundo 2026. 48 selecciones, 104 partidos, 39 días.",
  icons: {
    icon: "/img/zonamundial-images/imagenes/IMG-20260302-WA0016-removebg-preview.png",
    shortcut: "/img/zonamundial-images/imagenes/IMG-20260302-WA0016-removebg-preview.png",
    apple: "/img/zonamundial-images/imagenes/IMG-20260302-WA0016-removebg-preview.png",
  },
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
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <LanguageProvider>
          <RootLayoutClient>{children}</RootLayoutClient>
        </LanguageProvider>
      </body>
    </html>
  );
}
