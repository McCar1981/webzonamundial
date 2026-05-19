// src/app/creadores/[slug]/page.tsx
//
// Página individual de cada creador. SSG con generateStaticParams.
// Renderiza hero con avatar + bio + redes sociales + (si tiene Twitch)
// reproductor embebido del stream actual.
//
// El reproductor es client-side porque consulta /api/creators/live
// para saber si el creator está EN DIRECTO ahora mismo. Si no, muestra
// el último VOD (Twitch lo gestiona automáticamente con su iframe).

import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCreadorBySlug,
  getAllCreadorSlugs,
} from "@/data/creadores";
import CreadorDetailClient from "./CreadorDetailClient";

interface PageProps {
  params: { slug: string };
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  return getAllCreadorSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const c = getCreadorBySlug(params.slug);
  if (!c) return { title: "Creador no encontrado" };

  const title = `${c.nombre} — Creador de ZonaMundial`;
  const description = c.bio.slice(0, 160);

  return {
    title,
    description,
    keywords: [
      c.nombre,
      `${c.nombre} mundial 2026`,
      `${c.nombre} twitch`,
      `${c.nombre} streamer`,
      "creadores zonamundial",
    ],
    openGraph: {
      title,
      description,
      type: "profile",
      images: [{ url: c.imagen, width: 800, height: 800, alt: c.nombre }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [c.imagen],
    },
    alternates: {
      canonical: `/creadores/${c.slug}`,
    },
  };
}

export default function CreadorDetailPage({ params }: PageProps) {
  const creador = getCreadorBySlug(params.slug);
  if (!creador) {
    notFound();
  }

  return <CreadorDetailClient creador={creador} />;
}
