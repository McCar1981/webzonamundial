// src/app/ligas/equipo/[teamId]/page.tsx
//
// Pantalla de Equipo de Zona de Ligas: la forma reciente, los próximos partidos y
// los últimos resultados de un club, a través de TODAS sus competiciones (liga +
// copas). Ruta agnóstica de competición: /ligas/equipo/[teamId] (id de
// api-football). Consume getTeamFixtures. ISR (revalidate 300) para acotar coste.

import type { Metadata } from "next";
import { cache } from "react";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTeamFixtures, getTeamInfo, type TeamFixture } from "@/lib/competitions/api";
import { getCompetitionByApiId, getCompetition } from "@/data/competitions";
import { getCompetitionStandings } from "@/lib/competitions/api";
import { getPersonalNoticias } from "@/lib/ligas/noticias-personal";
import { getTeamSquad, type FantasyPlayer, type Position } from "@/lib/ligas/fantasy";
import PlayerAvatar from "@/components/ligas/PlayerAvatar";
import { getTeamSeasonStats, type PlayerSeasonStats } from "@/lib/ligas/plantilla";
import LocalTime from "../../[slug]/LocalTime";
import SeguirClub from "./SeguirClub";

export const revalidate = 300;

type Params = { teamId: string };

const GOLD = "#c9a84c";
const DIM = "#a69a82";
const FINISHED = new Set(["FT", "AET", "PEN"]);
const LIVE = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"]);

const load = cache((id: number) =>
  Promise.all([getTeamFixtures(id, { last: 6 }), getTeamFixtures(id, { next: 6 })]),
);

// Plantilla + estadísticas: BAJO DEMANDA (la visita dispara la sincronización;
// KV cachea la plantilla 7 días y las stats 24 h). Fail-soft: sin datos, la
// sección se oculta.
const loadPlantilla = cache((id: number) =>
  Promise.all([
    getTeamSquad(id).catch(() => [] as FantasyPlayer[]),
    getTeamSeasonStats(id).catch(() => null),
  ]),
);

const POS_LABEL: Record<Position, string> = {
  GK: "Porteros",
  DEF: "Defensas",
  MID: "Centrocampistas",
  FWD: "Delanteros",
};
const POS_ORDER: Position[] = ["GK", "DEF", "MID", "FWD"];

function teamOf(fixtures: TeamFixture[], teamId: number): { name: string; logo: string } | null {
  for (const f of fixtures) {
    if (f.home.id === teamId) return { name: f.home.name, logo: f.home.logo };
    if (f.away.id === teamId) return { name: f.away.name, logo: f.away.logo };
  }
  return null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const id = Number(params.teamId);
  if (!Number.isFinite(id)) return { title: "Equipo no encontrado — ZonaMundial" };
  const [last, next] = await load(id);
  const team = teamOf([...last, ...next], id);
  if (!team) return { title: "Equipo — ZonaMundial" };
  // El <title> lleva la marca por la plantilla del layout; OG no la hereda y la lleva explícita.
  const title = `${team.name}: calendario, resultados y forma`;
  const ogTitle = `${title} | ZonaMundial`;
  const description = `Sigue a ${team.name} en ZonaMundial: próximos partidos, últimos resultados y forma en todas sus competiciones. Predice cada partido y compite con tus amigos.`;
  return {
    title,
    description,
    alternates: { canonical: `https://zonamundial.app/ligas/equipo/${id}` },
    openGraph: { title: ogTitle, description, images: ["https://zonamundial.app/og-image.jpg"] },
  };
}

function Row({ f, teamId }: { f: TeamFixture; teamId: number }) {
  const isHome = f.home.id === teamId;
  const opp = isHome ? f.away : f.home;
  const finished = FINISHED.has(f.status);
  const live = LIVE.has(f.status);
  const ts = isHome ? f.score.home : f.score.away;
  const os = isHome ? f.score.away : f.score.home;
  let mid: ReactNode;
  if (finished || live) {
    const win = (ts ?? 0) > (os ?? 0);
    const draw = (ts ?? 0) === (os ?? 0);
    const col = live ? "#d85a30" : win ? "#3fbf6a" : draw ? DIM : "#cf5b5b";
    mid = <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500, color: col }}>{ts ?? 0}-{os ?? 0}</span>;
  } else {
    mid = <span style={{ fontSize: 13, color: DIM }}><LocalTime iso={f.kickoff} mode="time" fallback={f.kickoff.slice(11, 16)} /></span>;
  }
  // Si la competición del partido existe en ZM, la fila LLEVA al Match Center
  // (marcador en vivo, alineaciones, predicciones y IA Coach). Antes era un div
  // muerto: desde tu club no había forma de llegar al partido.
  const comp = getCompetitionByApiId(f.leagueId);
  const contenido = (
    <>
      <span style={{ width: 26, fontSize: 11, color: DIM, textAlign: "center", flexShrink: 0 }}>{isHome ? "L" : "V"}</span>
      {opp.logo ? <img src={opp.logo} alt="" width={20} height={20} loading="lazy" style={{ width: 20, height: 20, objectFit: "contain", flexShrink: 0 }} /> : null}
      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", color: "#fff" }}>{opp.name}</span>
      {live && <span style={{ fontSize: 10, fontWeight: 700, color: "#d85a30", flexShrink: 0 }}>EN VIVO</span>}
      <span style={{ fontSize: 10.5, color: DIM, maxWidth: 90, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", textAlign: "right" }}>{f.leagueName}</span>
      <span style={{ width: 46, textAlign: "right", flexShrink: 0 }}>{mid}</span>
    </>
  );
  const estilo = { display: "flex", alignItems: "center", gap: 10, padding: "10px 4px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 13.5 } as const;

  if (!comp) return <div style={estilo}>{contenido}</div>;
  return (
    <Link href={`/ligas/${comp.slug}/${f.fixtureId}`} style={{ ...estilo, textDecoration: "none", color: "inherit" }}>
      {contenido}
    </Link>
  );
}

/** El próximo partido, en grande y con acción. Antes el partido más importante
 *  del club —el que viene— era una fila más de una lista, sin nada que hacer
 *  con él. Ahora es lo primero que ves y lleva a su Match Center. */
function ProximoPartido({ f, oficial, teamId }: { f: TeamFixture; oficial: TeamFixture | null; teamId: number }) {
  const isHome = f.home.id === teamId;
  const rival = isHome ? f.away : f.home;
  const comp = getCompetitionByApiId(f.leagueId);
  const live = LIVE.has(f.status);
  // En pretemporada el próximo partido suele ser un amistoso, que no tiene
  // Match Center. En ese caso se ofrece además el primer partido OFICIAL, que
  // es el que se puede predecir y analizar.
  const compOficial = oficial ? getCompetitionByApiId(oficial.leagueId) : null;
  const rivalOficial = oficial ? (oficial.home.id === teamId ? oficial.away : oficial.home) : null;

  const cuerpo = (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: live ? "#ff6b3d" : GOLD }}>
          {live ? "Jugando ahora" : "Próximo partido"}
        </span>
        <span style={{ fontSize: 11, color: DIM, maxWidth: 130, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{f.leagueName}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {rival.logo ? <img src={rival.logo} alt="" width={44} height={44} loading="lazy" style={{ width: 44, height: 44, objectFit: "contain", flexShrink: 0 }} /> : null}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11.5, color: DIM }}>{isHome ? "En casa contra" : "Visita a"}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{rival.name}</div>
          <div style={{ fontSize: 12.5, color: GOLD, marginTop: 2 }}>
            <LocalTime iso={f.kickoff} mode="date" fallback={f.kickoff.slice(0, 10)} />
            {" · "}
            <LocalTime iso={f.kickoff} mode="time" fallback={f.kickoff.slice(11, 16)} />
          </div>
        </div>
      </div>
      {comp && (
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", borderRadius: 10, background: `linear-gradient(135deg, ${GOLD}, #e8d48b)`, color: "#0a0906", fontWeight: 700, fontSize: 13 }}>
          {live ? "Ver en directo" : "Predecir y ver análisis"} &rarr;
        </div>
      )}
    </>
  );

  const caja = { display: "block", marginTop: 20, padding: 16, borderRadius: 16, background: "linear-gradient(160deg, #16130a 0%, #0a0906 65%)", border: `1px solid ${GOLD}44`, textDecoration: "none" } as const;
  if (comp) return <Link href={`/ligas/${comp.slug}/${f.fixtureId}`} style={caja}>{cuerpo}</Link>;

  // Amistoso u otra competición fuera de ZM: la tarjeta informa, y debajo se
  // enlaza el primer partido oficial (el que sí se puede predecir).
  return (
    <div style={caja}>
      {cuerpo}
      {compOficial && rivalOficial && oficial && (
        <Link href={`/ligas/${compOficial.slug}/${oficial.fixtureId}`}
          style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)", textDecoration: "none" }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: "#fff" }}>
            <span style={{ color: DIM }}>Primer partido oficial: </span>{rivalOficial.name}
          </span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: GOLD, flexShrink: 0 }}>Predecir &rarr;</span>
        </Link>
      )}
    </div>
  );
}

/** Accesos a lo que se puede HACER con este club, no solo leer. */
function Acciones({ ligaSlug }: { ligaSlug: string | null }) {
  if (!ligaSlug) return null;
  // Solo rutas que EXISTEN: la liga (clasificación y partidos) y su fantasy.
  // Predecir se hace dentro del Match Center de cada partido, no en una ruta
  // propia, así que su puerta es el hero del próximo partido.
  const items = [
    { href: `/ligas/${ligaSlug}`, label: "Clasificación y partidos" },
    { href: `/ligas/${ligaSlug}/fantasy`, label: "Fantasy de la liga" },
  ];
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
      {items.map((i) => (
        <Link key={i.href} href={i.href}
          style={{ flex: "1 1 30%", textAlign: "center", padding: "9px 6px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.03)", color: "#fff", fontSize: 12.5, fontWeight: 600, textDecoration: "none" }}>
          {i.label}
        </Link>
      ))}
    </div>
  );
}

export default async function TeamPage({ params }: { params: Params }) {
  const id = Number(params.teamId);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const [[last, next], [squad, stats]] = await Promise.all([load(id), loadPlantilla(id)]);
  // Identidad del club: primero de los fixtures; si no hay (parón, club recién
  // ascendido o api-football caída), se resuelve con /teams?id=. Así un club que
  // SÍ existe nunca cae en 404 por una falta puntual de partidos/datos.
  let team = teamOf([...last, ...next], id);
  if (!team) {
    const info = await getTeamInfo(id);
    if (info) team = { name: info.name, logo: info.logo };
  }
  // Si ni siquiera podemos identificar el club (api-football sin responder),
  // degradamos con gracia a un estado "datos no disponibles" (HTTP 200) en vez
  // de un 404: es un fallo temporal de datos, no un club inexistente. La página
  // se autorepara en la siguiente revalidación (ISR) cuando la API vuelva.
  if (!team) {
    return (
      <main style={{ minHeight: "100vh", background: "#000", color: "#E2E8F0", padding: "24px 16px 64px" }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <Link href="/ligas" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: GOLD, textDecoration: "none" }}>
            <span aria-hidden>&larr;</span> Zona de Ligas
          </Link>
          <div style={{ marginTop: 48, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚽</div>
            <h1 className="zl-h2" style={{ marginBottom: 8 }}>Datos no disponibles ahora mismo</h1>
            <p style={{ fontSize: 14, color: DIM, lineHeight: 1.5, maxWidth: 380, margin: "0 auto" }}>
              No hemos podido cargar la información de este club en este momento. Es
              algo temporal — vuelve a intentarlo en unos minutos.
            </p>
          </div>
        </div>
      </main>
    );
  }
  const statById = new Map<number, PlayerSeasonStats>((stats?.players ?? []).map((p) => [p.playerId, p]));

  // Noticias del club por la MISMA vía que el feed personal del lobby: alias de
  // prensa curados (no el nombre literal) y, si no hay artículo publicado, los
  // breves de los drafts frescos — que es donde vive el 90% de lo que se publica
  // de clubes, porque el pipeline editorial va del Mundial.
  const personales = await getPersonalNoticias([team.name], [], 4).catch(
    () => ({ club: [], league: [], breves: [] })
  );
  const noticiasClub = personales.club.slice(0, 4);
  const brevesClub = personales.breves.slice(0, 5);

  // Liga "de casa" del club: la competición DOMÉSTICA de ZM que más aparece en
  // sus partidos (así un club que juega Libertadores no acaba clasificado por
  // la copa continental, donde no hay tabla propia comparable).
  const conteo = new Map<string, number>();
  for (const f of [...next, ...last]) {
    const c = getCompetitionByApiId(f.leagueId);
    if (c && c.scope === "domestic") conteo.set(c.slug, (conteo.get(c.slug) ?? 0) + 1);
  }
  const ligaSlug = [...conteo.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Su sitio en la tabla: contexto que la racha E-P-E-P-E no da.
  let posicion: { rank: number; points: number; played: number; total: number } | null = null;
  if (ligaSlug) {
    const comp = getCompetition(ligaSlug);
    if (comp) {
      const grupos = await getCompetitionStandings(comp.apiFootballId).catch(() => []);
      for (const g of grupos) {
        const fila = g.rows.find((r) => r.team.id === id);
        if (fila) { posicion = { rank: fila.rank, points: fila.points, played: fila.played, total: g.rows.length }; break; }
      }
    }
  }

  // Forma: últimos resultados terminados (más reciente primero).
  const form = last
    .filter((f) => FINISHED.has(f.status))
    .slice(-5)
    .reverse()
    .map((f) => {
      const isHome = f.home.id === id;
      const ts = isHome ? f.score.home : f.score.away;
      const os = isHome ? f.score.away : f.score.home;
      return (ts ?? 0) > (os ?? 0) ? "G" : (ts ?? 0) === (os ?? 0) ? "E" : "P";
    });
  const formColor: Record<string, string> = { G: "#3fbf6a", E: "#8a94a6", P: "#cf5b5b" };

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg, #000000, #000000)", color: "#E2E8F0", padding: "24px 16px 64px" }}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <Link href="/ligas" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: GOLD, textDecoration: "none" }}>
          <span aria-hidden>&larr;</span> Zona de Ligas
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16 }}>
          {team.logo ? <img src={team.logo} alt="" width={48} height={48} loading="lazy" style={{ width: 48, height: 48, objectFit: "contain" }} /> : null}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="zl-h1" style={{ margin: 0 }}>{team.name}</h1>
            {form.length > 0 && (
              <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
                {form.map((r, i) => (
                  <span key={i} title={r === "G" ? "Ganó" : r === "E" ? "Empató" : "Perdió"} style={{ width: 20, height: 20, borderRadius: 6, background: formColor[r], color: "#0a0906", fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{r}</span>
                ))}
              </div>
            )}
          </div>
          <SeguirClub teamId={id} teamName={team.name} teamLogo={team.logo ?? null} />
        </div>

        {/* Su sitio en la tabla: contexto real, no solo la racha. */}
        {posicion && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 12, padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: GOLD, fontVariantNumeric: "tabular-nums" }}>{posicion.rank}º</span>
            <span style={{ fontSize: 12.5, color: DIM, lineHeight: 1.4 }}>
              de {posicion.total} · <strong style={{ color: "#fff" }}>{posicion.points} pts</strong> en {posicion.played} partidos
            </span>
          </div>
        )}

        {/* Lo primero: el partido que viene, con acción. */}
        {next[0] && (
          <ProximoPartido
            f={next[0]}
            oficial={next.find((x) => x.fixtureId !== next[0].fixtureId && !!getCompetitionByApiId(x.leagueId)) ?? null}
            teamId={id}
          />
        )}

        <Acciones ligaSlug={ligaSlug} />

        {next.length > 0 && (
          <section style={{ marginTop: 28 }}>
            <h2 className="zl-h2">Próximos partidos</h2>
            {next.map((f) => <Row key={f.fixtureId} f={f} teamId={id} />)}
            <p style={{ fontSize: 11.5, color: DIM, marginTop: 8 }}>
              Toca un partido para abrir su Match Center: marcador en vivo, alineaciones, predicciones y análisis.
            </p>
          </section>
        )}

        {/* Noticias del club: lo que pasa alrededor del equipo, no solo sus
            partidos. Mismo emparejado por nombre que usa el lobby. */}
        {(noticiasClub.length > 0 || brevesClub.length > 0) && (
          <section style={{ marginTop: 30 }}>
            <h2 className="zl-h2">Noticias de {team.name}</h2>
            {noticiasClub.map((n) => (
              <Link key={n.slug} href={`/noticias/${n.slug}`}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 4px", borderTop: "1px solid rgba(255,255,255,0.06)", textDecoration: "none" }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: "#fff", lineHeight: 1.35 }}>{n.title}</span>
                <span style={{ fontSize: 11, color: DIM, flexShrink: 0 }}>{String(n.date ?? "").slice(0, 10)}</span>
              </Link>
            ))}
            {/* Breves: titulares frescos que aún no son artículo. Enlazan a la
                fuente original, igual que en el feed personal del lobby. */}
            {brevesClub.map((b, i) => (
              <a key={`b${i}`} href={b.url ?? "#"} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 4px", borderTop: "1px solid rgba(255,255,255,0.06)", textDecoration: "none" }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: GOLD, border: `1px solid ${GOLD}55`, borderRadius: 4, padding: "1px 5px", flexShrink: 0 }}>BREVE</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: "#fff", lineHeight: 1.35 }}>{b.title}</span>
                {b.source && <span style={{ fontSize: 11, color: DIM, flexShrink: 0, maxWidth: 90, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{b.source}</span>}
              </a>
            ))}
          </section>
        )}

        {last.length > 0 && (
          <section style={{ marginTop: 30 }}>
            <h2 className="zl-h2">Últimos resultados</h2>
            {last.slice().reverse().map((f) => <Row key={f.fixtureId} f={f} teamId={id} />)}
          </section>
        )}

        {/* Plantilla + rendimiento: sincronizada bajo demanda con api-football
            (la visita del primer usuario la trae; KV la sirve al resto). */}
        {squad.length > 0 && (
          <section style={{ marginTop: 30 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
              <h2 className="zl-h2" style={{ marginBottom: 0 }}>Plantilla</h2>
              {stats && <span style={{ fontSize: 11.5, color: DIM }}>Temporada {stats.season} · PJ / G / A / Nota</span>}
            </div>
            {POS_ORDER.map((pos) => {
              const players = squad.filter((p) => p.position === pos);
              if (!players.length) return null;
              return (
                <div key={pos} style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: GOLD, marginBottom: 2 }}>{POS_LABEL[pos]}</div>
                  {players.map((p) => {
                    const s = statById.get(p.id);
                    return (
                      <Link key={p.id} href={`/ligas/jugador/${p.id}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 4px", borderTop: "1px solid rgba(255,255,255,0.06)", textDecoration: "none" }}>
                        <span style={{ width: 24, fontSize: 12, color: DIM, fontVariantNumeric: "tabular-nums", flexShrink: 0, textAlign: "right" }}>{p.number ?? ""}</span>
                        <PlayerAvatar id={p.id} size={30} />
                        <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: "#fff", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{p.name}</span>
                        {s ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 10, flexShrink: 0, fontSize: 12.5, color: "#e6decb", fontVariantNumeric: "tabular-nums" }}>
                            <span title="Partidos jugados">{s.apps}</span>
                            <span title="Goles" style={{ color: s.goals > 0 ? "#fff" : DIM, fontWeight: s.goals > 0 ? 600 : 400 }}>{s.goals}</span>
                            <span title="Asistencias" style={{ color: s.assists > 0 ? "#fff" : DIM }}>{s.assists}</span>
                            {s.rating != null ? (
                              <span title="Nota media" style={{ minWidth: 34, textAlign: "center", fontWeight: 600, fontSize: 11.5, color: "#0a0906", background: s.rating >= 7 ? "linear-gradient(135deg, #c9a84c, #e8d48b)" : "rgba(255,255,255,0.55)", borderRadius: 6, padding: "2px 5px" }}>{s.rating.toFixed(2)}</span>
                            ) : (
                              <span style={{ minWidth: 34, textAlign: "center", color: DIM }}>-</span>
                            )}
                          </span>
                        ) : (
                          <span style={{ flexShrink: 0, fontSize: 12, color: DIM }}>sin minutos</span>
                        )}
                        <span aria-hidden style={{ color: DIM, fontSize: 16, flexShrink: 0, marginLeft: 2 }}>&rsaquo;</span>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </section>
        )}

        <p style={{ marginTop: 24, fontSize: 11.5, color: DIM, textAlign: "center" }}>L = local · V = visitante</p>
      </div>
    </main>
  );
}
