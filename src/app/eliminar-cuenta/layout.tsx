// src/app/eliminar-cuenta/layout.tsx
//
// Metadatos SEO para la página de eliminación de cuenta. Es accesible para
// los buscadores (index: true) porque Google y los stores de apps suelen
// pedir un enlace público y crawleable a esta funcionalidad como parte de
// los requisitos de privacidad.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Eliminar tu cuenta — ZonaMundial",
  description:
    "Solicita la eliminación de tu cuenta y datos personales en ZonaMundial. Procesamos cada solicitud en un máximo de 30 días conforme al RGPD (art. 17).",
  alternates: { canonical: "/eliminar-cuenta" },
  openGraph: {
    title: "Eliminar tu cuenta — ZonaMundial",
    description:
      "Formulario para solicitar la eliminación de tu cuenta y datos personales en ZonaMundial. Procesado en 30 días según RGPD.",
    url: "/eliminar-cuenta",
    siteName: "ZonaMundial",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function EliminarCuentaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
