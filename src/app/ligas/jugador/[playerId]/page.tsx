// src/app/ligas/jugador/[playerId]/page.tsx
//
// Ficha COMPLETA de un jugador de Zona de Ligas: datos personales + estadísticas
// por competición de la temporada (api-football, bajo demanda con caché KV 24 h).
// Se llega tocando un jugador en la Plantilla de la ficha de club. Ruta agnóstica
// de equipo: /ligas/jugador/[playerId] (id de api-football). ISR revalidate 3600.

import type { Metadata } from "next";
import { cache } from "react";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlayerProfile, type PlayerCompetition } from "@/lib/ligas/player";
import PlayerCareer from "./PlayerCareer";

export const revalidate = 3600;

type Params = { playerId: string };

const GOLD = "#c9a84c";
const DIM = "#a69a82";
const LINE = "1px solid rgba(255,255,255,0.06)";

const load = cache((id: number) => getPlayerProfile(id));

const POS_ES: Record<string, string> = { Goalkeeper: "Portero", Defender: "Defensa", Midfielder: "Centrocampista", Attacker: "Delantero" };

function fmtBirth(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const id = Number(params.playerId);
  if (!Number.isFinite(id)) return { title: "Jugador no encontrado — ZonaMundial" };
  const p = await load(id);
  if (!p) return { title: "Jugador — ZonaMundial" };
  const primary = p.competitions[0];
  const title = `${p.name}: ficha, datos y estadísticas`;
  const desc = `Ficha de ${p.name}${primary ? ` (${primary.team})` : ""} en ZonaMundial: datos personales, goles, asistencias y estadísticas de la temporada.`;
  return {
    title,
    description: desc,
    alternates: { canonical: `https://zonamundial.app/ligas/jugador/${id}` },
    openGraph: { title: `${title} | ZonaMundial`, description: desc, images: p.photo ? [{ url: p.photo }] : ["https://zonamundial.app/og-image.jpg"] },
  };
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ padding: "9px 0", borderTop: LINE }}>
      <div style={{ fontSize: 11, color: DIM, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13.5, color: "#fff", fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function Stat({ label, value, gold = false }: { label: string; value: ReactNode; gold?: boolean }) {
  return (
    <div style={{ textAlign: "center", padding: "6px 4px" }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: gold ? GOLD : "#fff", fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 10.5, color: DIM, marginTop: 3, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
    </div>
  );
}

// Fila etiqueta/valor para el desglose por competición.
function Line({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, padding: "7px 0", borderTop: LINE, fontSize: 13 }}>
      <span style={{ color: DIM }}>{label}</span>
      <span style={{ color: "#fff", fontWeight: 500, fontVariantNumeric: "tabular-nums", textAlign: "right" }}>{value}</span>
    </div>
  );
}

function CompCard({ c }: { c: PlayerCompetition }) {
  const pct = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 100)}%` : "—");
  return (
    <section style={{ marginTop: 14, padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(201,168,76,0.16)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        {c.teamLogo ? <img src={c.teamLogo} alt="" width={22} height={22} loading="lazy" style={{ width: 22, height: 22, objectFit: "contain", flexShrink: 0 }} /> : null}
        <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: "#fff", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{c.team}</span>
        <span style={{ fontSize: 11.5, color: GOLD, flexShrink: 0, textAlign: "right", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: 150 }}>{c.league}</span>
      </div>

      {/* Números principales */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, margin: "8px 0 4px", padding: "8px 0", borderTop: LINE, borderBottom: LINE }}>
        <Stat label="Partidos" value={c.appearances} />
        <Stat label="Goles" value={c.goals} gold={c.goals > 0} />
        <Stat label="Asist." value={c.assists} gold={c.assists > 0} />
        <Stat label="Nota" value={c.rating != null ? c.rating.toFixed(2) : "—"} gold={(c.rating ?? 0) >= 7} />
      </div>

      <Line label="Minutos" value={c.minutes.toLocaleString("es")} />
      <Line label="Titular / suplente" value={`${c.lineups} / ${Math.max(0, c.appearances - c.lineups)}`} />
      {(c.shotsTotal > 0 || c.shotsOn > 0) && <Line label="Tiros (a puerta)" value={`${c.shotsTotal} (${c.shotsOn})`} />}
      {c.passesTotal > 0 && <Line label="Pases (clave)" value={`${c.passesTotal.toLocaleString("es")} (${c.passesKey})${c.passAccuracy != null ? ` · ${c.passAccuracy}%` : ""}`} />}
      {c.dribblesAttempts > 0 && <Line label="Regates (éxito)" value={`${c.dribblesSuccess}/${c.dribblesAttempts} · ${pct(c.dribblesSuccess, c.dribblesAttempts)}`} />}
      {(c.tacklesTotal > 0 || c.interceptions > 0) && <Line label="Entradas · intercep." value={`${c.tacklesTotal} · ${c.interceptions}`} />}
      {c.duelsTotal > 0 && <Line label="Duelos ganados" value={`${c.duelsWon}/${c.duelsTotal} · ${pct(c.duelsWon, c.duelsTotal)}`} />}
      {(c.penaltyScored > 0 || c.penaltyMissed > 0) && <Line label="Penaltis (marcados/fallados)" value={`${c.penaltyScored} / ${c.penaltyMissed}`} />}
      {(c.yellow > 0 || c.red > 0) && <Line label="Tarjetas (A/R)" value={`${c.yellow} / ${c.red}`} />}
    </section>
  );
}

export default async function JugadorPage({ params }: { params: Params }) {
  const id = Number(params.playerId);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const p = await load(id);
  if (!p) notFound();

  const primary = p.competitions[0] ?? null;
  const posEs = p.position ? (POS_ES[p.position] ?? p.position) : null;
  const backHref = primary ? `/ligas/equipo/${primary.teamId}` : "/ligas";
  const birth = fmtBirth(p.birthDate);
  const clubComps = p.competitions.filter((c) => c.kind === "club");
  const natComps = p.competitions.filter((c) => c.kind === "national");

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg, #000000, #000000)", color: "#E2E8F0", padding: "24px 16px 64px" }}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <Link href={backHref} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: GOLD, textDecoration: "none" }}>
          <span aria-hidden>&larr;</span> {primary ? primary.team : "Zona de Ligas"}
        </Link>

        {/* Cabecera */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16 }}>
          {p.photo ? (
            <img src={p.photo} alt="" width={84} height={84} style={{ width: 84, height: 84, borderRadius: "50%", objectFit: "cover", background: "#241e12", flexShrink: 0, border: `2px solid ${GOLD}55` }} />
          ) : (
            <span style={{ width: 84, height: 84, borderRadius: "50%", background: "#241e12", flexShrink: 0 }} aria-hidden />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="zl-h1" style={{ margin: 0, fontSize: 24 }}>{p.name}</h1>
            <div style={{ fontSize: 13, color: DIM, marginTop: 4, display: "flex", flexWrap: "wrap", gap: "2px 10px" }}>
              {posEs && <span>{posEs}</span>}
              {p.number != null && <span>Dorsal {p.number}</span>}
              {p.nationality && <span style={{ color: "#e6decb" }}>{p.nationality}</span>}
            </div>
            {p.injured && <span style={{ display: "inline-block", marginTop: 8, fontSize: 11, fontWeight: 700, color: "#0a0906", background: "#cf5b5b", borderRadius: 6, padding: "2px 8px" }}>Lesionado</span>}
          </div>
        </div>

        {/* Totales de la temporada */}
        <section style={{ marginTop: 22 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <h2 className="zl-h2" style={{ marginBottom: 0 }}>Temporada {p.season}</h2>
            {p.rating != null && <span style={{ fontSize: 12, color: DIM }}>Nota media {p.rating.toFixed(2)}</span>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, marginTop: 10, padding: "10px 0", borderRadius: 14, background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)" }}>
            <Stat label="Partidos" value={p.totals.appearances} />
            <Stat label="Goles" value={p.totals.goals} gold={p.totals.goals > 0} />
            <Stat label="Asist." value={p.totals.assists} gold={p.totals.assists > 0} />
            <Stat label="Min." value={p.totals.minutes.toLocaleString("es")} />
          </div>
        </section>

        {/* Datos personales */}
        <section style={{ marginTop: 24 }}>
          <h2 className="zl-h2">Datos</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
            {p.age != null && <Field label="Edad" value={`${p.age} años`} />}
            {birth && <Field label="Nacimiento" value={birth} />}
            {(p.birthPlace || p.birthCountry) && <Field label="Lugar" value={[p.birthPlace, p.birthCountry].filter(Boolean).join(", ")} />}
            {p.nationality && <Field label="Nacionalidad" value={p.nationality} />}
            {p.height && <Field label="Altura" value={p.height} />}
            {p.weight && <Field label="Peso" value={p.weight} />}
          </div>
        </section>

        {/* Temporada actual, SEPARADA en Club y Selección (si fue convocado) */}
        {clubComps.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <h2 className="zl-h2">Club · {p.season}</h2>
            {clubComps.map((c) => <CompCard key={`${c.leagueId}-${c.teamId}`} c={c} />)}
          </section>
        )}
        {natComps.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <h2 className="zl-h2">Selección · {p.season}</h2>
            {natComps.map((c) => <CompCard key={`${c.leagueId}-${c.teamId}`} c={c} />)}
          </section>
        )}
        {clubComps.length === 0 && natComps.length === 0 && (
          <p style={{ marginTop: 20, fontSize: 13.5, color: DIM }}>Sin estadísticas de las últimas temporadas.</p>
        )}

        {/* Carrera completa (histórico) — colapsada, se carga bajo demanda */}
        <PlayerCareer playerId={p.id} />

        <p style={{ marginTop: 22, fontSize: 11, color: DIM, textAlign: "center" }}>Datos de api-football · temporada {p.season}</p>
      </div>
    </main>
  );
}
