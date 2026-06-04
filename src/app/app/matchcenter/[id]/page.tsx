// src/app/app/matchcenter/[id]/page.tsx
//
// Página de la experiencia en vivo de un partido. Resuelve los metadatos en el
// servidor y delega la reproducción al cliente. ?sim=1 fuerza la simulación
// (útil antes del Mundial / para la demo); por defecto el API decide live o sim.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMeta, resolveMatchId, matchSlug } from "@/lib/match-center/store";
import MatchCenterLive from "../MatchCenterLive";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
  searchParams: { sim?: string };
}

export function generateMetadata({ params }: PageProps): Metadata {
  const matchId = resolveMatchId(params.id);
  const meta = matchId != null ? buildMeta(matchId) : null;
  if (!meta) return { title: "Match Center | ZonaMundial" };
  const title = `${meta.home.name} vs ${meta.away.name} EN VIVO — Match Center | ZonaMundial`;
  const slug = matchSlug(meta.id);
  return {
    title,
    description: `Sigue ${meta.home.name} contra ${meta.away.name} en vivo: marcador, cancha animada, estadísticas y locución del partido. ${meta.phase}, ${meta.venue}.`,
    robots: { index: false, follow: true },
    ...(slug ? { alternates: { canonical: `/app/matchcenter/${slug}` } } : {}),
  };
}

export default function MatchPage({ params, searchParams }: PageProps) {
  const matchId = resolveMatchId(params.id);
  const meta = matchId != null ? buildMeta(matchId) : null;
  if (matchId == null || !meta) notFound();
  const sim = searchParams?.sim === "1";
  return <MatchCenterLive matchId={matchId} meta={meta} sim={sim} />;
}
