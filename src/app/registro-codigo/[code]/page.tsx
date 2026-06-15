// src/app/registro-codigo/[code]/page.tsx
// Landing de registro con CÓDIGO prerelleno, para compartir el enlace directo
// (ej. https://zonamundial.app/registro-codigo/RADIO5). Server component:
// valida el código en servidor para enseñar el bono y decidir el robots.
//
// noindex a propósito: son enlaces de campaña privados, no objetivos SEO.

import type { Metadata } from "next";
import { getPublicCodeInfo, normalizeSignupCode } from "@/lib/signup-codes/store";
import RegistroCodigoCodeClient from "./RegistroCodigoCodeClient";

interface Props {
  params: { code: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const code = normalizeSignupCode(decodeURIComponent(params.code || ""));
  return {
    title: `Regístrate con el código ${code} — ZonaMundial`,
    description:
      "Únete a ZonaMundial para el Mundial 2026: predicciones, Fantasy, Trivia y más. Regístrate con tu código y reclama tus Fútcoins de bienvenida.",
    alternates: { canonical: `/registro-codigo/${code}` },
    robots: { index: false, follow: false },
  };
}

export default async function RegistroCodigoCodePage({ params }: Props) {
  const code = normalizeSignupCode(decodeURIComponent(params.code || ""));
  const info = await getPublicCodeInfo(code);

  return (
    <RegistroCodigoCodeClient
      code={code}
      valid={info.valid}
      label={info.label}
      rewardNewUser={info.rewardNewUser}
    />
  );
}
