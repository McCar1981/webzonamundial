// src/app/partido/[slug]/page.tsx
//
// Página PÚBLICA e indexable de un partido del Mundial 2026: "Local vs Visitante"
// con previa/horario, resultado, goles, estadísticas y alineaciones. Capta las
// búsquedas de partido ("alemania vs paraguay mundial 2026", "resultado…"), que
// son el mayor volumen del torneo y que el Match Center (en /app, noindex) no
// captura. Server-rendered, JSON-LD SportsEvent, revalidate 60 (se actualiza con
// el marcador en vivo).
//
// Solo se indexan los partidos con equipos REALES (los de slot "W##"/"tbd" del
// cuadro aún sin asignar dan 404 hasta que se resuelven).

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MATCHES } from "@/data/matches";
import { buildMeta, getLastSnapshot } from "@/lib/match-center/store";
import { matchSlug, resolveMatchId } from "@/lib/match-center/slug";
import { matchInstant } from "@/lib/calendario/time";
import { FINISHED_STATUSES, IN_PLAY_STATUSES } from "@/lib/calendario/live";
import { heroImageForSlug } from "@/data/hero-match-images";
import type { LiveSnapshot, LiveStats } from "@/lib/match-center/types";
import StickyCta from "@/app/grupos/mejores-terceros/StickyCta";

const BG = "#000000", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#a69a82", DIM = "#6e6552", GREEN = "#22c55e", RED = "#ef6a6a";

export const revalidate = 60;
export const dynamicParams = true;

function realMatches() {
  return MATCHES.filter((m) => m.i < 9000 && m.hf !== "tbd" && m.af !== "tbd");
}

export function generateStaticParams() {
  return realMatches()
    .map((m) => ({ slug: matchSlug(m.i) }))
    .filter((p): p is { slug: string } => !!p.slug);
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
function fmtFecha(d: string): string {
  const [y, m, day] = d.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, day));
  return `${DIAS[date.getUTCDay()]} ${day} de ${MESES[m - 1]} de ${y}`;
}
function horaCDMX(d: string, t: string): string | null {
  const inst = matchInstant({ d, t });
  if (!inst) return null;
  return new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Mexico_City" }).format(inst);
}

function resolveOr404(slug: string) {
  const id = resolveMatchId(slug);
  if (id == null) return null;
  const m = MATCHES.find((x) => x.i === id);
  // Excluir partidos de prueba/amistosos (i>=9000) y slots de cuadro sin asignar:
  // NO deben ser páginas públicas indexables del Mundial (mismo criterio que el sitemap).
  if (!m || m.i >= 9000 || m.hf === "tbd" || m.af === "tbd") return null;
  return m;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const m = resolveOr404(slug);
  if (!m) return { title: "Partido no encontrado", robots: { index: false, follow: true } };

  const snap = await getLastSnapshot(m.i);
  const status = snap?.status ?? "NS";
  const finished = FINISHED_STATUSES.has(status);
  const inPlay = IN_PLAY_STATUSES.has(status);
  const sc = snap?.score;

  const base = `${m.h} vs ${m.a}`;
  const title = finished && sc
    ? `${m.h} ${sc[0]}-${sc[1]} ${m.a} — Mundial 2026: resultado y estadísticas`
    : inPlay
      ? `${base} EN VIVO — Mundial 2026`
      : `${base} — Mundial 2026: previa, horario y dónde ver`;
  const description = finished && sc
    ? `Resultado de ${m.h} ${sc[0]}-${sc[1]} ${m.a} en el Mundial 2026 (${m.p}): goles, estadísticas y alineaciones. ${m.vn}, ${m.vc}.`
    : `${m.h} vs ${m.a} en el Mundial 2026 (${m.p}): fecha, horario, sede y previa. ${fmtFecha(m.d)} en ${m.vn}, ${m.vc}.`;

  const hero = heroImageForSlug(slug);
  return {
    title,
    description,
    keywords: [`${m.h} vs ${m.a}`, `${m.h} ${m.a} mundial 2026`, `resultado ${m.h} ${m.a}`, `${m.h} ${m.a} en vivo`, "mundial 2026"],
    alternates: { canonical: `/partido/${slug}` },
    openGraph: { title, description, url: `/partido/${slug}`, siteName: "ZonaMundial", locale: "es_MX", type: "website", images: [hero?.wide ?? "/og-image.jpg"] },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true, "max-image-preview": "large" },
  };
}

function roundLink(phase: string, group: string): { href: string; label: string } {
  if (phase === "Fase de grupos") return group ? { href: `/grupos/grupo-${group.toLowerCase()}`, label: `Grupo ${group}` } : { href: "/grupos", label: "Grupos" };
  if (phase === "Dieciseisavos") return { href: "/dieciseisavos-mundial-2026", label: "Dieciseisavos" };
  if (phase === "Octavos de final") return { href: "/octavos-de-final-mundial-2026", label: "Octavos de final" };
  return { href: "/bracket", label: "Cuadro de eliminatorias" };
}

function Flag({ code, size = 28 }: { code: string; size?: number }) {
  const w = Math.round(size);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`} alt="" width={w} height={Math.round(w * 0.7)} style={{ borderRadius: 3, flexShrink: 0 }} />;
}

const STAT_ROWS: Array<{ key: keyof LiveStats; label: string; pct?: boolean }> = [
  { key: "possession", label: "Posesión", pct: true },
  { key: "shots", label: "Tiros" },
  { key: "shotsOn", label: "Tiros a puerta" },
  { key: "corners", label: "Córners" },
  { key: "fouls", label: "Faltas" },
  { key: "yellow", label: "Tarjetas amarillas" },
  { key: "xg", label: "Goles esperados (xG)" },
];

export default async function PartidoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = resolveOr404(slug);
  if (!m) notFound();

  const meta = buildMeta(m.i)!;
  const snap: LiveSnapshot | null = await getLastSnapshot(m.i);
  const status = snap?.status ?? "NS";
  const finished = FINISHED_STATUSES.has(status);
  const inPlay = IN_PLAY_STATUSES.has(status);
  const sc = (finished || inPlay) && snap?.score ? snap.score : null;
  const pen = status === "PEN" ? snap?.penalty : undefined;
  const hora = horaCDMX(m.d, m.t);
  const round = roundLink(meta.phase, meta.group);
  const hero = heroImageForSlug(slug);

  // Goles y rojas para la cronología (sin lanzamientos de la tanda).
  const keyEvents = (snap?.events ?? []).filter(
    (e) => !e.shootout && (e.type === "goal" || e.type === "own_goal" || e.type === "penalty_goal" || e.type === "red" || e.type === "second_yellow"),
  );
  const hasStats = !!snap && (finished || inPlay) && snap.stats && (snap.stats.shots[0] + snap.stats.shots[1] > 0 || snap.stats.possession[0] !== 50);

  const kickoffIso = snap?.kickoff ?? matchInstant({ d: m.d, t: m.t })?.toISOString();
  // endDate ≈ saque + 2h (partido + descanso). new Date(iso) es válido en runtime de app.
  const endIso = kickoffIso ? new Date(new Date(kickoffIso).getTime() + 2 * 60 * 60 * 1000).toISOString() : undefined;
  // NO usamos superEvent anidado: un SportsEvent exige startDate+location, y un
  // "torneo padre" sin esos campos lo marca Google como inválido (2 errores
  // críticos). El partido se describe entero por sí mismo.
  const sportsEventLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${m.h} vs ${m.a}`,
    description: `${m.h} vs ${m.a} en el Mundial 2026 (${m.p})${finished && sc ? `: resultado ${sc[0]}-${sc[1]}` : ""}. ${m.vn}, ${m.vc}.`,
    sport: "Soccer",
    ...(kickoffIso ? { startDate: kickoffIso } : {}),
    ...(endIso ? { endDate: endIso } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    location: { "@type": "Place", name: m.vn, address: { "@type": "PostalAddress", addressLocality: m.vc } },
    image: [`https://zonamundial.app${hero?.wide ?? "/og-image.jpg"}`],
    organizer: { "@type": "Organization", name: "FIFA", url: "https://www.fifa.com" },
    competitor: [
      { "@type": "SportsTeam", name: m.h },
      { "@type": "SportsTeam", name: m.a },
    ],
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://zonamundial.app" },
      { "@type": "ListItem", position: 2, name: "Calendario", item: "https://zonamundial.app/calendario" },
      { "@type": "ListItem", position: 3, name: `${m.h} vs ${m.a}`, item: `https://zonamundial.app/partido/${slug}` },
    ],
  };

  const statusBadge = finished ? { txt: "Final", color: MID } : inPlay ? { txt: "En vivo", color: GREEN } : { txt: "Próximo", color: GOLD };

  return (
    <main style={{ background: BG, minHeight: "100vh", color: MID, padding: "24px 20px 60px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(sportsEventLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <nav style={{ fontSize: 13, opacity: 0.8 }}>
          <Link href="/" style={{ color: GOLD, textDecoration: "none" }}>Inicio</Link>
          <span style={{ margin: "0 6px", color: DIM }}>/</span>
          <Link href={round.href} style={{ color: GOLD, textDecoration: "none" }}>{round.label}</Link>
          <span style={{ margin: "0 6px", color: DIM }}>/</span>
          <span style={{ color: MID }}>{m.h} vs {m.a}</span>
        </nav>

        {hero && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero.wide} alt={`${m.h} vs ${m.a}`} style={{ width: "100%", height: "auto", borderRadius: 16, margin: "16px 0 4px", display: "block" }} loading="eager" />
        )}

        <p style={{ color: GOLD, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: hero ? 12 : 24, marginBottom: 10, fontWeight: 600 }}>
          Mundial 2026 · {meta.phase}{meta.group ? ` · Grupo ${meta.group}` : ""}
        </p>

        {/* Marcador / hero */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "18px 16px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
            <Flag code={m.hf} size={40} />
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 17, textAlign: "center" }}>{m.h}</span>
          </div>
          <div style={{ flexShrink: 0, textAlign: "center", minWidth: 80 }}>
            {sc ? (
              <span style={{ color: inPlay ? GREEN : "#fff", fontWeight: 800, fontSize: 34, letterSpacing: "-0.02em" }}>{sc[0]}<span style={{ color: DIM }}> - </span>{sc[1]}</span>
            ) : (
              <span style={{ color: DIM, fontWeight: 800, fontSize: 22 }}>VS</span>
            )}
            <div style={{ marginTop: 4, fontSize: 11, fontWeight: 700, color: statusBadge.color, textTransform: "uppercase", letterSpacing: "0.08em" }}>{statusBadge.txt}</div>
            {pen && <div style={{ fontSize: 11, color: MID, marginTop: 2 }}>({pen[0]}-{pen[1]} pen.)</div>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
            <Flag code={m.af} size={40} />
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 17, textAlign: "center" }}>{m.a}</span>
          </div>
        </div>

        <h1 style={{ color: GOLD2, fontSize: 30, fontWeight: 800, margin: "22px 0 10px", letterSpacing: "-0.03em", lineHeight: 1.15 }}>
          {m.h} vs {m.a}: {finished && sc ? "resultado del partido" : inPlay ? "marcador en vivo" : "previa y horario"} — Mundial 2026
        </h1>

        {/* Datos del partido */}
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", display: "grid", gap: 6, fontSize: 15 }}>
          <li><b style={{ color: "#fff" }}>Fase:</b> {meta.phase}{meta.group ? ` · Grupo ${meta.group}` : ""}</li>
          <li><b style={{ color: "#fff" }}>Fecha:</b> {fmtFecha(m.d)}{hora ? ` · ${hora}h (hora de México / CDMX)` : ""}</li>
          <li><b style={{ color: "#fff" }}>Sede:</b> {m.vn}, {m.vc}</li>
          {snap?.referee && <li><b style={{ color: "#fff" }}>Árbitro:</b> {snap.referee}</li>}
        </ul>

        {/* CTA */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px 16px", margin: "4px 0 8px", padding: "14px 18px", borderRadius: 14, border: "1px solid rgba(201,168,76,0.28)", background: "linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.03))" }}>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.45, color: MID, flex: "1 1 240px" }}>
            <b style={{ color: "#fff" }}>Juega gratis:</b> predice este partido y compite por <b style={{ color: GOLD2 }}>Fútcoins y la cima del ranking</b>. Sin apuestas.
          </p>
          <Link href="/registro" style={{ display: "inline-block", whiteSpace: "nowrap", background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`, color: "#0a0906", fontWeight: 800, fontSize: 15, padding: "11px 22px", borderRadius: 12, textDecoration: "none" }}>
            Crear cuenta y predecir →
          </Link>
        </div>

        {/* Goles y tarjetas */}
        {keyEvents.length > 0 && (
          <section style={{ marginTop: 22 }}>
            <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: "0 0 10px" }}>Goles y momentos clave</h2>
            <div style={{ display: "grid", gap: 6 }}>
              {keyEvents.map((e) => {
                const isCard = e.type === "red" || e.type === "second_yellow";
                const label = e.type === "own_goal" ? "Gol en propia" : e.type === "penalty_goal" ? "Gol de penalti" : isCard ? "Tarjeta roja" : "Gol";
                return (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, padding: "8px 12px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, justifyContent: e.side === "away" ? "flex-end" : "flex-start" }}>
                    <span style={{ color: GOLD2, fontWeight: 800, minWidth: 34 }}>{e.minute}{e.extra ? `+${e.extra}` : ""}&apos;</span>
                    <span style={{ width: 9, height: 9, borderRadius: isCard ? 2 : "50%", background: isCard ? RED : GOLD, flexShrink: 0, display: "inline-block" }} aria-hidden />
                    <span style={{ color: "#fff", fontWeight: 600 }}>{e.player ?? label}</span>
                    <span style={{ color: DIM, fontSize: 12 }}>{label}{e.assist ? ` · asist. ${e.assist}` : ""}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Estadísticas */}
        {hasStats && snap && (
          <section style={{ marginTop: 24 }}>
            <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: "0 0 10px" }}>Estadísticas del partido</h2>
            <div style={{ display: "grid", gap: 8 }}>
              {STAT_ROWS.filter((r) => snap.stats[r.key] !== undefined).map((r) => {
                const v = snap.stats[r.key] as [number, number];
                const sfx = r.pct ? "%" : "";
                return (
                  <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                    <span style={{ color: "#fff", fontWeight: 700, minWidth: 36, textAlign: "right" }}>{v[0]}{sfx}</span>
                    <span style={{ flex: 1, textAlign: "center", color: MID, fontSize: 12.5 }}>{r.label}</span>
                    <span style={{ color: "#fff", fontWeight: 700, minWidth: 36 }}>{v[1]}{sfx}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Alineaciones */}
        {(snap?.homeLineup || snap?.awayLineup) && (
          <section style={{ marginTop: 24 }}>
            <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: "0 0 10px" }}>Alineaciones</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
              {([{ t: m.h, l: snap?.homeLineup }, { t: m.a, l: snap?.awayLineup }] as const).map(({ t, l }) =>
                l ? (
                  <div key={t} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 14px" }}>
                    <p style={{ margin: "0 0 8px", color: GOLD2, fontWeight: 800, fontSize: 14 }}>{t} <span style={{ color: DIM, fontWeight: 600 }}>· {l.formation}</span></p>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 3 }}>
                      {l.starters.map((p, i) => (
                        <li key={i} style={{ fontSize: 13, color: MID }}>
                          <span style={{ color: DIM, display: "inline-block", minWidth: 22 }}>{p.num}</span> <span style={{ color: "#fff" }}>{p.name ?? p.pos}</span>
                        </li>
                      ))}
                    </ul>
                    {l.coach && <p style={{ margin: "8px 0 0", fontSize: 12, color: DIM }}>DT: {l.coach}</p>}
                  </div>
                ) : null,
              )}
            </div>
          </section>
        )}

        {/* Contexto */}
        <section style={{ marginTop: 26 }}>
          <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: "0 0 10px" }}>El partido</h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, margin: "0 0 12px" }}>
            {m.h} y {m.a} se {finished ? "vieron las caras" : "ven las caras"} en {meta.phase.toLowerCase()} del Mundial 2026
            {meta.group ? ` (Grupo ${meta.group})` : ""}, en {m.vn} ({m.vc}), el {fmtFecha(m.d)}.{" "}
            {finished && sc
              ? `El partido terminó ${sc[0]}-${sc[1]}${pen ? ` (${pen[0]}-${pen[1]} en la tanda de penaltis)` : ""}.`
              : meta.phase === "Fase de grupos"
                ? "Un duelo clave por la clasificación a la fase eliminatoria."
                : "Una eliminatoria directa: quien gana avanza, quien pierde queda fuera."}{" "}
            Sigue el <Link href={round.href} style={{ color: GOLD, textDecoration: "none" }}>{round.label.toLowerCase()}</Link> y el{" "}
            <Link href="/calendario" style={{ color: GOLD, textDecoration: "none" }}>calendario completo</Link> del Mundial.
          </p>
        </section>

        {/* CTA final */}
        <div style={{ textAlign: "center", padding: "26px 16px 8px", borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 18 }}>
          <p style={{ color: "#fff", fontSize: 19, fontWeight: 700, margin: "0 0 14px" }}>
            Vive el Mundial 2026 jugando, no solo mirando.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/registro" style={{ display: "inline-block", background: GOLD, color: "#0a0906", fontWeight: 700, fontSize: 15, padding: "12px 24px", borderRadius: 12, textDecoration: "none" }}>
              Crear mi cuenta gratis
            </Link>
            <Link href={round.href} style={{ display: "inline-block", border: `1px solid ${GOLD}`, color: GOLD, fontWeight: 600, fontSize: 15, padding: "12px 24px", borderRadius: 12, textDecoration: "none" }}>
              Ver el {round.label.toLowerCase()}
            </Link>
          </div>
        </div>

        <div style={{ height: 56 }} aria-hidden />
      </div>

      <StickyCta />
    </main>
  );
}
