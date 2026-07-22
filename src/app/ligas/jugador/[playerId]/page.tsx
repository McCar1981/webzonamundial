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
import StatGlossary from "./StatGlossary";

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

// Grupo de estadísticas: solo se pinta si tiene al menos una fila con dato.
function Group({ title, lines }: { title: string; lines: { label: string; value: ReactNode; show: boolean }[] }) {
  const visible = lines.filter((l) => l.show);
  if (visible.length === 0) return null;
  return (
    <>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: DIM, margin: "12px 0 0" }}>{title}</div>
      {visible.map((l) => <Line key={l.label} label={l.label} value={l.value} />)}
    </>
  );
}

function CompCard({ c }: { c: PlayerCompetition }) {
  const pct = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 100)}%` : "—");
  const isGK = c.position === "Goalkeeper" || c.saves > 0 || c.conceded > 0;
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
        <Stat label={isGK ? "Paradas" : "Goles"} value={isGK ? c.saves : c.goals} gold={(isGK ? c.saves : c.goals) > 0} />
        <Stat label="Asist." value={c.assists} gold={c.assists > 0} />
        <Stat label="Nota" value={c.rating != null ? c.rating.toFixed(2) : "—"} gold={(c.rating ?? 0) >= 7} />
      </div>

      <Group title="Partido" lines={[
        { label: "Minutos", value: c.minutes.toLocaleString("es"), show: true },
        { label: "Titularidades", value: c.lineups, show: c.appearances > 0 },
        { label: "Entró / salió del campo", value: `${c.subIn} / ${c.subOut}`, show: c.subIn > 0 || c.subOut > 0 },
        { label: "En el banquillo", value: c.bench, show: c.bench > 0 },
      ]} />

      <Group title="Ataque" lines={[
        { label: "Goles", value: c.goals, show: c.goals > 0 },
        { label: "Asistencias", value: c.assists, show: c.assists > 0 },
        { label: "Tiros (a puerta)", value: `${c.shotsTotal} (${c.shotsOn})`, show: c.shotsTotal > 0 || c.shotsOn > 0 },
        { label: "Regates (éxito)", value: `${c.dribblesSuccess}/${c.dribblesAttempts} · ${pct(c.dribblesSuccess, c.dribblesAttempts)}`, show: c.dribblesAttempts > 0 },
        { label: "Penaltis (marcados / fallados)", value: `${c.penaltyScored} / ${c.penaltyMissed}`, show: c.penaltyScored > 0 || c.penaltyMissed > 0 },
        { label: "Penaltis provocados", value: c.penaltyWon, show: c.penaltyWon > 0 },
      ]} />

      <Group title="Creación" lines={[
        { label: "Pases (clave)", value: `${c.passesTotal.toLocaleString("es")} (${c.passesKey})`, show: c.passesTotal > 0 },
        { label: "Precisión de pase", value: c.passAccuracy != null ? `${c.passAccuracy}%` : "—", show: c.passAccuracy != null },
      ]} />

      <Group title="Defensa" lines={[
        { label: "Entradas", value: c.tacklesTotal, show: c.tacklesTotal > 0 },
        { label: "Bloqueos", value: c.tacklesBlocks, show: c.tacklesBlocks > 0 },
        { label: "Intercepciones", value: c.interceptions, show: c.interceptions > 0 },
        { label: "Duelos ganados", value: `${c.duelsWon}/${c.duelsTotal} · ${pct(c.duelsWon, c.duelsTotal)}`, show: c.duelsTotal > 0 },
        { label: "Regateado (superado)", value: c.dribblesPast, show: c.dribblesPast > 0 },
        { label: "Faltas (cometidas / recibidas)", value: `${c.foulsCommitted} / ${c.foulsDrawn}`, show: c.foulsCommitted > 0 || c.foulsDrawn > 0 },
        { label: "Penaltis cometidos", value: c.penaltyCommitted, show: c.penaltyCommitted > 0 },
      ]} />

      {isGK && (
        <Group title="Portería" lines={[
          { label: "Paradas", value: c.saves, show: true },
          { label: "Goles encajados", value: c.conceded, show: true },
          { label: "Penaltis parados", value: c.penaltySaved, show: c.penaltySaved > 0 },
        ]} />
      )}

      <Group title="Disciplina" lines={[
        { label: "Amarillas", value: c.yellow, show: c.yellow > 0 },
        { label: "Doble amarilla", value: c.yellowRed, show: c.yellowRed > 0 },
        { label: "Rojas", value: c.red, show: c.red > 0 },
      ]} />
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

        {/* Leyenda: qué significa cada estadística */}
        <StatGlossary />

        <p style={{ marginTop: 22, fontSize: 11, color: DIM, textAlign: "center" }}>Datos de api-football · temporada {p.season}</p>
      </div>
    </main>
  );
}
