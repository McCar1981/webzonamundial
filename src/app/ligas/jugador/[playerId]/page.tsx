// src/app/ligas/jugador/[playerId]/page.tsx
//
// Ficha COMPLETA de un jugador de Zona de Ligas: datos personales + estadísticas
// por competición de la temporada (api-football, bajo demanda con caché KV 24 h).
// Se llega tocando un jugador en la Plantilla de la ficha de club. Ruta agnóstica
// de equipo: /ligas/jugador/[playerId] (id de api-football). ISR revalidate 3600.

import type { Metadata } from "next";
import { cache } from "react";
import type { ReactNode, CSSProperties } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlayerProfile, getPlayerClubs, type PlayerCompetition } from "@/lib/ligas/player";
import { clubColor, flagUrl } from "@/lib/ligas/player-visuals";
import FichaTabs from "./FichaTabs";
import StatGlossary from "./StatGlossary";
import styles from "./ficha.module.css";

export const revalidate = 3600;

type Params = { playerId: string };

const GOLD = "#c9a84c";
const DIM = "#a69a82";
const LINE = "1px solid rgba(255,255,255,0.06)";

const load = cache((id: number) => getPlayerProfile(id));
const loadClubs = cache((id: number) => getPlayerClubs(id));

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
    <section style={{ marginTop: 14, padding: "14px 16px", borderRadius: 14, background: "#1c1710", border: "1px solid rgba(201,168,76,0.22)", boxShadow: "0 8px 26px rgba(0,0,0,0.45)" }}>
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

  const [p, clubs] = await Promise.all([load(id), loadClubs(id)]);
  if (!p) notFound();

  const clubComps = p.competitions.filter((c) => c.kind === "club");
  const natComps = p.competitions.filter((c) => c.kind === "national");
  // Identidad de CLUB del héroe: el club con más minutos, NO la selección (en
  // pretemporada la temporada puede quedar solo con datos de selección).
  const primaryClub = clubComps[0] ?? p.competitions[0] ?? null;
  const posEs = p.position ? (POS_ES[p.position] ?? p.position) : null;
  const backHref = primaryClub ? `/ligas/equipo/${primaryClub.teamId}` : "/ligas";
  const birth = fmtBirth(p.birthDate);

  // Piezas cinematográficas
  const nm = p.name.trim();
  const sp = nm.lastIndexOf(" ");
  const firstName = sp > 0 ? nm.slice(0, sp) : "";
  const lastName = sp > 0 ? nm.slice(sp + 1) : nm;
  const ghostNum = p.number ?? primaryClub?.number ?? null;
  const cc = clubColor(primaryClub?.teamId);
  const natFlag = flagUrl(p.nationality, 40);
  const natTeam = natComps[0]?.team ?? null;
  // "Ha vestido": SOLO clubes (de /transfers, viejo→nuevo); si no hay, el principal.
  const badgeClubs = clubs.length > 0
    ? [...clubs].reverse()
    : (primaryClub && primaryClub.kind === "club" ? [{ id: primaryClub.teamId, name: primaryClub.team, logo: primaryClub.teamLogo }] : []);

  return (
    <div className={styles.screen} style={cc ? ({ "--club": cc.club, "--club-deep": cc.deep } as CSSProperties) : undefined}>
      <div className={styles.amb} aria-hidden />
      <div className={styles.amb2} aria-hidden />

      <div className={styles.inner}>
        <div className={styles.bar}>
          <Link className={styles.back} href={backHref}><span aria-hidden>&larr;</span> {primaryClub ? primaryClub.team : "Zona de Ligas"}</Link>
        </div>

        {/* HÉROE */}
        <header className={`${styles.hero} ${styles.rise} ${styles.d1}`}>
          {ghostNum != null && <div className={styles.ghost} aria-hidden>{ghostNum}</div>}
          <div className={styles.avatarWrap}>
            <div className={styles.glow} aria-hidden />
            <div className={styles.ring} aria-hidden />
            <div className={styles.avatar}>
              {p.photo ? (
                <img src={p.photo} alt={p.name} />
              ) : (
                <svg className={styles.avatarPh} viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 12.8a4.4 4.4 0 1 0 0-8.8 4.4 4.4 0 0 0 0 8.8ZM4 20.4c0-3.6 3.6-5.8 8-5.8s8 2.2 8 5.8" stroke="#e8d48b" strokeWidth="1.3" strokeLinecap="round" /></svg>
              )}
            </div>
            {primaryClub?.teamLogo ? <img className={styles.crestBadge} src={primaryClub.teamLogo} alt="" /> : null}
          </div>

          {(posEs || p.number != null) && (
            <div className={styles.eyebrow}>{[posEs, p.number != null ? `Dorsal ${p.number}` : null].filter(Boolean).join(" · ")}</div>
          )}
          <h1 className={styles.name}>{firstName ? <>{firstName} </> : null}<span className={styles.gold}>{lastName}</span></h1>
          <div className={styles.subline}>
            {p.nationality && (
              <span className={styles.natpill}>
                {natFlag && <img className={styles.flag} src={natFlag} alt="" />}
                {p.nationality}
              </span>
            )}
            {primaryClub && (<><span className={styles.dot}>•</span><span>{primaryClub.team}</span></>)}
            {(p.age != null || p.height) && (<><span className={styles.dot}>•</span><span>{[p.age != null ? `${p.age} años` : null, p.height].filter(Boolean).join(" · ")}</span></>)}
            {p.injured && (<><span className={styles.dot}>•</span><span style={{ color: "#ef8a8a", fontWeight: 700 }}>Lesionado</span></>)}
          </div>
        </header>

        {/* HA VESTIDO — escudos de sus clubes + bandera de su selección */}
        {(badgeClubs.length > 0 || natTeam) && (
          <div className={`${styles.badges} ${styles.rise} ${styles.d2}`}>
            <div className={styles.badgesLab}>Ha vestido</div>
            <div className={styles.badgesRow}>
              {badgeClubs.map((cl) => (
                <Link key={cl.id} className={styles.club} href={`/ligas/equipo/${cl.id}`}>
                  {cl.logo ? <img src={cl.logo} alt="" /> : <span style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} aria-hidden />}
                  <span className={`${styles.clubName}${cl.id === primaryClub?.teamId ? " " + styles.clubCurrent : ""}`}>{cl.name}</span>
                </Link>
              ))}
              {natTeam && (
                <>
                  <span className={styles.sep} aria-hidden />
                  <div className={styles.club}>
                    {natFlag ? <img className={styles.selFlag} src={natFlag} alt="" /> : <span style={{ width: 34, height: 24, borderRadius: 4, background: "rgba(255,255,255,.08)" }} aria-hidden />}
                    <span className={styles.clubName}>{natTeam}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* TIRA DESTACADA */}
        <div className={`${styles.strip} ${styles.rise} ${styles.d2}`}>
          <div className={styles.stripS}><div className={styles.stripV}>{p.totals.appearances}</div><div className={styles.stripK}>Partidos</div></div>
          <div className={styles.stripS}><div className={`${styles.stripV} ${styles.stripVg}`}>{p.totals.goals}</div><div className={styles.stripK}>Goles</div></div>
          <div className={styles.stripS}><div className={`${styles.stripV} ${styles.stripVg}`}>{p.totals.assists}</div><div className={styles.stripK}>Asist.</div></div>
          <div className={styles.stripS}><div className={styles.stripV}>{p.rating != null ? p.rating.toFixed(2) : "—"}</div><div className={styles.stripK}>Nota</div></div>
        </div>

        <div style={{ padding: "0 16px 52px" }}>
          {/* Datos personales (chips, estilo maqueta) */}
          <section style={{ marginTop: 22 }}>
            <h2 className="zl-h2">Datos</h2>
            <div className={styles.bio}>
              {p.age != null && <span className={styles.chip}><span className={styles.chipLabel}>Edad</span> {p.age} años</span>}
              {birth && <span className={styles.chip}><span className={styles.chipLabel}>Nacimiento</span> {birth}</span>}
              {(p.birthPlace || p.birthCountry) && <span className={styles.chip}><span className={styles.chipLabel}>Lugar</span> {[p.birthPlace, p.birthCountry].filter(Boolean).join(", ")}</span>}
              {p.nationality && <span className={styles.chip}><span className={styles.chipLabel}>Nacionalidad</span> {p.nationality}</span>}
              {p.height && <span className={styles.chip}><span className={styles.chipLabel}>Altura</span> {p.height}</span>}
              {p.weight && <span className={styles.chip}><span className={styles.chipLabel}>Peso</span> {p.weight}</span>}
            </div>
          </section>

          {/* Tabs: Temporada (Club/Selección) vs Carrera (histórico) */}
          <FichaTabs playerId={p.id} season={p.season}>
            {clubComps.length > 0 && (
              <section style={{ marginTop: 20 }}>
                <h2 className="zl-h2">Club · {p.season}</h2>
                {clubComps.map((c) => <CompCard key={`${c.leagueId}-${c.teamId}`} c={c} />)}
              </section>
            )}
            {natComps.length > 0 && (
              <section style={{ marginTop: 20 }}>
                <h2 className="zl-h2">Selección · {natComps[0]?.season ?? p.season}</h2>
                {natComps.map((c) => <CompCard key={`${c.leagueId}-${c.teamId}`} c={c} />)}
              </section>
            )}
            {clubComps.length === 0 && natComps.length === 0 && (
              <p style={{ marginTop: 20, fontSize: 13.5, color: DIM }}>Sin estadísticas de las últimas temporadas.</p>
            )}
          </FichaTabs>

          {/* Leyenda de siglas */}
          <StatGlossary />

          <p style={{ marginTop: 22, fontSize: 11, color: DIM, textAlign: "center" }}>Datos de api-football · temporada {p.season}</p>
        </div>
      </div>

      <div className={styles.grain} aria-hidden />
      <div className={styles.vig} aria-hidden />
    </div>
  );
}
