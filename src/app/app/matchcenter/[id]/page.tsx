// src/app/app/matchcenter/[id]/page.tsx
//
// Página de la experiencia en vivo de un partido. Resuelve los metadatos en el
// servidor y delega la reproducción al cliente. ?sim=1 fuerza la simulación
// (útil antes del Mundial / para la demo); por defecto el API decide live o sim.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMeta, resolveMatchId, matchSlug } from "@/lib/match-center/store";
import { matchHeroImage } from "@/lib/match-center/heroImage";
import MatchCenterLive from "../MatchCenterLive";
import FollowMatchButton from "../FollowMatchButton";
import MicroLive from "../MicroLive";
import MicroHistory from "../MicroHistory";
import MicroDuels from "../MicroDuels";
import AffiliateBettingCTA from "@/components/affiliate/AffiliateBettingCTA";
import MerchAmazonStrip from "@/components/affiliate/MerchAmazonStrip";

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

export default async function MatchPage({ params, searchParams }: PageProps) {
  const matchId = resolveMatchId(params.id);
  const meta = matchId != null ? buildMeta(matchId) : null;
  if (matchId == null || !meta) notFound();
  const sim = searchParams?.sim === "1";
  // Foto que acompaña al partido (jugador estrella local; respaldo: estadio).
  const heroImage = await matchHeroImage(meta);
  return (
    <>
      <div style={{ display: "flex", justifyContent: "center", padding: "12px 16px 0" }}>
        <FollowMatchButton
          matchId={matchId}
          homeName={meta.home.name}
          awayName={meta.away.name}
        />
      </div>
      <MatchCenterLive matchId={matchId} meta={meta} sim={sim} heroImage={heroImage} />
      <MicroDuels matchId={matchId} />
      <MicroHistory matchId={matchId} />
      <MicroLive matchId={matchId} />
      {/* Camisetas de las dos selecciones de ESTE partido (afiliado Amazon).
          Va FUERA de cualquier <Link>, así que no hay <a> anidados. */}
      <div style={{ display: "flex", justifyContent: "center", padding: "8px 16px 0" }}>
        <div style={{ width: "100%", maxWidth: 560 }}>
          <MerchAmazonStrip
            variant="match"
            home={{ name: meta.home.name, flag: meta.home.flag }}
            away={{ name: meta.away.name, flag: meta.away.flag }}
          />
        </div>
      </div>
      {/* CTA de apuestas (afiliado Betcris/1xBet). Server component con candado
          geo: SOLO visitantes de países LATAM permitidos lo ven; España y país
          desconocido → null (no se renderiza nada). */}
      <AffiliateBettingCTA />
      {/* Colchón final de página: la bottom-nav fija (~64px) más los botones
          flotantes (comentarios/Coach, hasta ~130px) tapaban la última
          micro-predicción al llegar al fondo del scroll. Vive AQUÍ y no en el
          root de MatchCenterLive porque las micros se montan después de él. */}
      <div aria-hidden style={{ height: "calc(140px + env(safe-area-inset-bottom))" }} />
    </>
  );
}
