// src/app/ligas/[slug]/fantasy/page.tsx
//
// "Monta tu once de la jornada" del Fantasy de Zona de Ligas. Server: resuelve la
// próxima jornada de la competición, arma el pool de jugadores (plantillas de los
// equipos que juegan esa jornada, en paralelo y cacheadas) y renderiza el selector.
// Autenticada (redirige a registro si no hay sesión).

import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getCompetition } from "@/data/competitions";
import { getCompetitionFixtures } from "@/lib/competitions/api";
import { getTeamSquad, type FantasyPlayer } from "@/lib/ligas/fantasy";
import { getUserFantasyPick } from "@/lib/ligas/fantasy-store";
import FantasyPicker from "./FantasyPicker";

export const dynamic = "force-dynamic";

const GOLD = "#c9a84c";
const DIM = "#a69a82";

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const comp = getCompetition(params.slug);
  return {
    title: comp ? `Fantasy ${comp.name} — monta tu once` : "Fantasy — ZonaMundial",
    robots: { index: false, follow: true },
  };
}

export default async function FantasyPage({ params }: { params: { slug: string } }) {
  const comp = getCompetition(params.slug);
  if (!comp) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/registro?next=/ligas/${comp.slug}/fantasy`);

  const upcoming = await getCompetitionFixtures(comp.apiFootballId, { next: 20 });
  const round = upcoming[0]?.round ?? null;
  const roundFixtures = round ? upcoming.filter((f) => f.round === round) : [];

  const shell = (children: React.ReactNode) => (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg, #000000, #000000)", color: "#E2E8F0", padding: "24px 16px 64px" }}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <Link href={`/ligas/${comp.slug}`} style={{ display: "inline-flex", gap: 6, fontSize: 12.5, color: GOLD, textDecoration: "none" }}>
          <span aria-hidden>&larr;</span> {comp.name}
        </Link>
        <p style={{ margin: "16px 0 2px", fontSize: 12, fontWeight: 500, letterSpacing: 2, color: GOLD }}>FANTASY · ZONA DE LIGAS</p>
        <h1 style={{ margin: "0 0 2px", fontSize: 26, fontWeight: 500, color: "#fff" }}>Monta tu once de la jornada</h1>
        {children}
      </div>
    </main>
  );

  if (!round || !roundFixtures.length) {
    return shell(
      <div style={{ marginTop: 24, padding: 24, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.24)", textAlign: "center", color: DIM, fontSize: 14 }}>
        No hay una jornada activa para {comp.name} ahora mismo. Vuelve cuando se anuncie la siguiente.
      </div>,
    );
  }

  // Pool: plantillas de los equipos que juegan la jornada (en paralelo, cacheadas).
  const teamIds = [...new Set(roundFixtures.flatMap((f) => [f.home.id, f.away.id]))].slice(0, 24);
  const squads = await Promise.all(teamIds.map((id) => getTeamSquad(id)));
  const pool: FantasyPlayer[] = squads.flat();

  const existing = await getUserFantasyPick(user.id, comp.slug, round);

  if (!pool.length) {
    return shell(
      <div style={{ marginTop: 24, padding: 24, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.24)", textAlign: "center", color: DIM, fontSize: 14 }}>
        Las plantillas de esta jornada aún no están disponibles. Inténtalo en un rato.
      </div>,
    );
  }

  // Resultado de la jornada. La página promete "se puntúa al terminar la jornada
  // y ganas Fútcoins", pero el usuario volvía y NO veía nada: los puntos se
  // calculaban, se pagaban y nunca se mostraban. Solo se pinta cuando ya hay
  // veredicto (puntuada o anulada); mientras está pendiente no se dice nada.
  const marcador =
    existing && existing.status === "scored" ? (
      <div style={{ margin: "0 0 14px", padding: "14px 16px", borderRadius: 14, background: "linear-gradient(135deg, rgba(201,168,76,0.16), rgba(201,168,76,0.05))", border: "1px solid rgba(201,168,76,0.42)" }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD }}>Tu jornada</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 30, fontWeight: 800, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{existing.points ?? 0}</span>
          <span style={{ fontSize: 14, color: DIM }}>{(existing.points ?? 0) === 1 ? "punto" : "puntos"}</span>
        </div>
      </div>
    ) : existing && existing.status === "void" ? (
      <div style={{ margin: "0 0 14px", padding: "12px 16px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)", fontSize: 13, color: DIM }}>
        Esta jornada se anuló (partidos aplazados o cancelados). No se descontó nada.
      </div>
    ) : null;

  return shell(
    <>
      <p style={{ margin: "0 0 4px", fontSize: 13.5, color: DIM }}>{comp.name} · {round}</p>
      {marcador}
      <FantasyPicker slug={comp.slug} round={round} pool={pool} existing={existing} />
    </>,
  );
}
