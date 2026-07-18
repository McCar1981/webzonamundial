// src/app/octavos-de-final-mundial-2026/page.tsx
//
// Landing SEO de los OCTAVOS de final del Mundial 2026 (ronda de 16). Cada
// octavo lo juega el GANADOR de un cruce de dieciseisavos, así que la página se
// VUELCA sola: en cuanto se juega un 16avo, su ganador aparece en su octavo.
//
// Reutiliza el resolver oficial del cuadro (resolveKnockoutSlots): traduce los
// slots "W74" (ganador del partido 74) a la selección real encadenando rondas,
// con penaltis incluidos. Los 1º/2º de grupo y los mejores terceros (estos
// últimos provisionales) ya quedan resueltos de la fase de grupos. revalidate
// 60 → se actualiza cada minuto con los resultados.

import type { Metadata } from "next";
import Link from "next/link";
import { MATCHES } from "@/data/matches";
import { FINISHED_STATUSES, IN_PLAY_STATUSES, type LiveMap } from "@/lib/calendario/live";
import { getLastSnapshotsBulk } from "@/lib/match-center/store";
import { resolveKnockoutSlots, applyResolution, type KoResult, type ResolvedTeam } from "@/lib/match-center/knockout-resolve";
import { matchInstant } from "@/lib/calendario/time";
import StickyCta from "@/app/grupos/mejores-terceros/StickyCta";
import PremiosPopup from "@/app/grupos/mejores-terceros/PremiosPopup";

const BG = "#000000", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#a69a82", DIM = "#6e6552", GREEN = "#22c55e";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Octavos de final del Mundial 2026: cuadro y cruces",
  description:
    "Cuadro de los octavos de final del Mundial 2026: los 8 cruces de la ronda de 16, con sus fechas y sedes. Se actualiza solo con los ganadores de los dieciseisavos.",
  keywords: [
    "octavos de final mundial 2026",
    "octavos mundial 2026",
    "cuadro octavos de final mundial 2026",
    "cruces octavos mundial 2026",
    "cuándo son los octavos del mundial 2026",
    "fechas octavos de final mundial 2026",
    "ronda de 16 mundial 2026",
  ],
  alternates: { canonical: "/octavos-de-final-mundial-2026" },
  openGraph: {
    title: "Octavos de final del Mundial 2026: cuadro y cruces",
    description: "Los 8 cruces de la ronda de 16 del Mundial 2026, con fechas y sedes. Se actualiza con cada resultado.",
    url: "/octavos-de-final-mundial-2026",
    siteName: "ZonaMundial",
    locale: "es_MX",
    type: "website",
    images: ["/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Octavos de final del Mundial 2026",
    description: "Los 8 cruces de la ronda de 16, con fechas y sedes. Se actualiza con cada resultado.",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
function fmtFecha(d: string): string {
  const [y, m, day] = d.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, day));
  return `${DIAS[date.getUTCDay()]} ${day} ${MESES[m - 1]}`;
}
function fmtHoraCDMX(d: string, t: string): string | null {
  const inst = matchInstant({ d, t });
  if (!inst) return null;
  return new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Mexico_City" }).format(inst);
}

// Etiqueta legible de un slot sin resolver.
function humanSlot(label: string): string {
  if (/^1[A-L]$/.test(label)) return `1º Grupo ${label[1]}`;
  if (/^2[A-L]$/.test(label)) return `2º Grupo ${label[1]}`;
  if (/^3[A-L]+$/.test(label)) return `Mejor 3º (${label.slice(1).split("").join("/")})`;
  if (/^W\d+$/.test(label)) return "Ganador 16avos";
  return label;
}

interface SideView {
  team: ResolvedTeam | null;   // selección resuelta (con bandera)
  feed: string | null;         // si es ganador de un 16avo aún sin jugar: "A – B"
  raw: string | null;          // último recurso
}

function buildSide(slot: string, flag: string, resolved: Map<string, ResolvedTeam>): SideView {
  const r = applyResolution(slot, flag, resolved);
  if (r.flag) return { team: { flagCode: r.flag, nombre: r.name, provisional: r.provisional }, feed: null, raw: null };
  // Slot "W##": describe el dieciseisavo que lo alimenta (sus dos equipos).
  const w = /^W(\d+)$/.exec(slot);
  if (w) {
    const fm = MATCHES.find((x) => x.i === Number(w[1]));
    if (fm) {
      const a = applyResolution(fm.h, fm.hf, resolved);
      const b = applyResolution(fm.a, fm.af, resolved);
      // Solo mostramos nombre real si es CIERTO (1º/2º); el tercero provisional
      // se queda como "Mejor 3º (…)" para no dar por hecho una asignación no oficial.
      const an = a.flag && !a.provisional ? a.name : humanSlot(fm.h);
      const bn = b.flag && !b.provisional ? b.name : humanSlot(fm.a);
      return { team: null, feed: `${an} — ${bn}`, raw: null };
    }
  }
  return { team: null, feed: null, raw: humanSlot(slot) };
}

function Flag({ code }: { code: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`https://flagcdn.com/w20/${code.toLowerCase()}.png`} alt="" width={20} height={14} loading="lazy" decoding="async" style={{ borderRadius: 2, flexShrink: 0, verticalAlign: "-2px" }} />;
}

function Lado({ s, align }: { s: SideView; align: "left" | "right" }) {
  const justify = align === "right" ? "flex-end" : "flex-start";
  if (s.team) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: justify, flex: 1, minWidth: 0 }}>
        {align === "left" && <Flag code={s.team.flagCode} />}
        <span style={{ color: "#fff", fontSize: 15, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {s.team.nombre}{s.team.provisional ? <span style={{ color: DIM, fontWeight: 600 }}> *</span> : null}
        </span>
        {align === "right" && <Flag code={s.team.flagCode} />}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1, alignItems: align === "right" ? "flex-end" : "flex-start", flex: 1, minWidth: 0 }}>
      <span style={{ color: MID, fontSize: 12, fontWeight: 700 }}>Ganador</span>
      <span style={{ color: DIM, fontSize: 12, fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%", textAlign: align === "right" ? "right" : "left" }}>
        {s.feed ?? s.raw}
      </span>
    </div>
  );
}

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "¿Qué son los octavos de final del Mundial 2026?",
    a: "Son la segunda ronda eliminatoria: la ronda de 16. A ellos llegan los 16 ganadores de los dieciseisavos de final (la ronda de 32 que estrena el Mundial de 48 selecciones). De esos 16 equipos, 8 pasan a cuartos.",
  },
  {
    q: "¿Cuándo se juegan los octavos del Mundial 2026?",
    a: "Del 4 al 7 de julio de 2026, justo después de los dieciseisavos (28 de junio al 3 de julio).",
  },
  {
    q: "¿Cómo se deciden los cruces de octavos?",
    a: "El cuadro está fijado de antemano por la FIFA: cada octavo lo juega el ganador de un dieciseisavo concreto contra el ganador de otro. Por eso, en cuanto se juega un dieciseisavo, su vencedor aparece automáticamente en su octavo.",
  },
  {
    q: "¿Qué pasa si un partido de octavos termina empatado?",
    a: "Al ser eliminatoria directa, si hay empate tras los 90 minutos se juega prórroga y, si persiste, se decide en la tanda de penaltis.",
  },
];

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};
const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: "https://zonamundial.app" },
    { "@type": "ListItem", position: 2, name: "Octavos de final", item: "https://zonamundial.app/octavos-de-final-mundial-2026" },
  ],
};

export default async function OctavosPage() {
  const all = MATCHES.filter((m) => m.i < 9000);
  const snaps = await getLastSnapshotsBulk(all.map((m) => m.i));

  const live: LiveMap = {};
  for (const m of all) {
    const snap = snaps[m.i];
    if (snap && snap.status) live[m.i] = { s: snap.status, sc: [snap.score?.[0] ?? 0, snap.score?.[1] ?? 0], el: snap.elapsed ?? 0 };
  }
  const koResults: Record<number, KoResult> = {};
  for (const m of all.filter((x) => x.p !== "Fase de grupos")) {
    const snap = snaps[m.i];
    if (!snap) continue;
    koResults[m.i] = {
      status: snap.status,
      score: [snap.score?.[0] ?? 0, snap.score?.[1] ?? 0],
      penalty: snap.penalty ? [snap.penalty[0] ?? 0, snap.penalty[1] ?? 0] : undefined,
    };
  }
  const resolved = resolveKnockoutSlots(live, koResults);

  const octavos = MATCHES.filter((m) => m.p === "Octavos de final").sort((a, b) => a.i - b.i);
  const dias = [...new Set(octavos.map((m) => m.d))].sort();
  const algunoResuelto = octavos.some((m) => applyResolution(m.h, m.hf, resolved).flag || applyResolution(m.a, m.af, resolved).flag);
  const algunaProvisional = octavos.some((m) => {
    const h = applyResolution(m.h, m.hf, resolved), a = applyResolution(m.a, m.af, resolved);
    return h.provisional || a.provisional;
  });

  return (
    <main style={{ background: BG, minHeight: "100vh", color: MID, padding: "24px 20px 60px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <nav style={{ fontSize: 13, opacity: 0.8 }}>
          <Link href="/" style={{ color: GOLD, textDecoration: "none" }}>Inicio</Link>
          <span style={{ margin: "0 6px", color: DIM }}>/</span>
          <span style={{ color: MID }}>Octavos de final</span>
        </nav>

        <p style={{ color: GOLD, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 24, marginBottom: 8, fontWeight: 600 }}>
          La ronda de 16 del Mundial 2026
        </p>
        <h1 style={{ color: GOLD2, fontSize: 42, fontWeight: 800, margin: "0 0 20px", letterSpacing: "-0.04em", lineHeight: 1.08 }}>
          Octavos de final del Mundial 2026: el cuadro y los cruces
        </h1>

        <p style={{ fontSize: 17, lineHeight: 1.7, margin: "0 0 14px" }}>
          A los octavos llegan los <b style={{ color: "#fff" }}>16 ganadores</b> de los{" "}
          <Link href="/dieciseisavos-mundial-2026" style={{ color: GOLD, textDecoration: "none" }}>dieciseisavos</Link>. Estos son los{" "}
          <b style={{ color: "#fff" }}>8 cruces</b> con su sede y fecha, del 4 al 7 de julio. La página se{" "}
          <b style={{ color: GOLD2 }}>actualiza sola</b>: en cuanto se juega un dieciseisavo, su ganador aparece aquí.
        </p>

        {/* CTA arriba */}
        <div style={{
          display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between",
          gap: "12px 16px", margin: "18px 0 4px", padding: "14px 18px", borderRadius: 14,
          border: "1px solid rgba(201,168,76,0.28)",
          background: "linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.03))",
        }}>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.45, color: MID, flex: "1 1 240px" }}>
            <b style={{ color: "#fff" }}>Juega gratis:</b> predice los cruces y compite por{" "}
            <b style={{ color: GOLD2 }}>Gift Cards de 300/200/100 €</b>. Sin apuestas.
          </p>
          <Link href="/registro" style={{
            display: "inline-block", whiteSpace: "nowrap",
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`, color: "#0a0906",
            fontWeight: 800, fontSize: 15, padding: "11px 22px", borderRadius: 12, textDecoration: "none",
          }}>
            Crear mi cuenta gratis →
          </Link>
        </div>

        {/* Cuadro: 8 cruces por día */}
        <div style={{ margin: "24px 0 10px" }}>
          {dias.map((dia) => (
            <section key={dia} style={{ marginBottom: 18 }}>
              <h2 style={{ color: GOLD2, fontSize: 14, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", margin: "0 0 10px" }}>
                {fmtFecha(dia)}
              </h2>
              <div style={{ display: "grid", gap: 8 }}>
                {octavos.filter((m) => m.d === dia).map((m) => {
                  const snap = snaps[m.i];
                  const showScore = !!snap && (FINISHED_STATUSES.has(snap.status) || IN_PLAY_STATUSES.has(snap.status)) && Array.isArray(snap.score);
                  const enJuego = !!snap && IN_PLAY_STATUSES.has(snap.status);
                  const home = buildSide(m.h, m.hf, resolved);
                  const away = buildSide(m.a, m.af, resolved);
                  const hora = fmtHoraCDMX(m.d, m.t);
                  return (
                    <div key={m.i} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 14px", background: "rgba(255,255,255,0.02)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Lado s={home} align="left" />
                        <div style={{ flexShrink: 0, textAlign: "center", minWidth: 44 }}>
                          {showScore ? (
                            <span style={{ color: enJuego ? GREEN : "#fff", fontWeight: 800, fontSize: 16 }}>
                              {snap!.score![0]}<span style={{ color: DIM }}> - </span>{snap!.score![1]}
                            </span>
                          ) : (
                            <span style={{ color: DIM, fontSize: 12, fontWeight: 700 }}>VS</span>
                          )}
                        </div>
                        <Lado s={away} align="right" />
                      </div>
                      <div style={{ marginTop: 8, fontSize: 12, color: DIM, textAlign: "center" }}>
                        {m.vn} · {m.vc}{hora ? ` · ${hora}h CDMX` : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <p style={{ fontSize: 13, color: DIM, margin: "0 0 6px" }}>
          {algunoResuelto
            ? "Los cruces se rellenan con los ganadores de los dieciseisavos; la página se actualiza sola con cada resultado."
            : "Hasta que se jueguen los dieciseisavos verás qué cruce alimenta cada octavo; los ganadores aparecen solos al terminar cada partido."}{" "}
          {algunaProvisional ? "El asterisco (*) marca un puesto aún provisional (mejor tercero pendiente de la asignación oficial). " : ""}
          Horarios en tu zona horaria en el{" "}
          <Link href="/calendario" style={{ color: GOLD, textDecoration: "none" }}>calendario completo</Link>.
        </p>

        {/* CTA al simulador */}
        <div style={{ margin: "24px 0 8px", padding: "18px 20px", borderRadius: 16, border: "1px solid rgba(201,168,76,0.22)", background: "rgba(255,255,255,0.02)" }}>
          <p style={{ color: "#fff", fontSize: 18, fontWeight: 800, margin: "0 0 6px" }}>
            ¿Sabes quién llegará a cuartos?
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.6, margin: "0 0 14px" }}>
            Rellena tú el cuadro hasta la final en nuestro simulador, guárdalo y compite con tu pronóstico. Gratis.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/bracket" style={{ display: "inline-block", background: GOLD, color: "#0a0906", fontWeight: 800, fontSize: 15, padding: "11px 22px", borderRadius: 12, textDecoration: "none" }}>
              Simular el cuadro →
            </Link>
            <Link href="/registro" style={{ display: "inline-block", border: `1px solid ${GOLD}`, color: GOLD, fontWeight: 600, fontSize: 15, padding: "11px 22px", borderRadius: 12, textDecoration: "none" }}>
              Crear mi cuenta gratis
            </Link>
          </div>
        </div>

        {/* Explicación */}
        <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: "44px 0 12px" }}>
          Cómo se llega a los octavos
        </h2>
        <p style={{ fontSize: 16, lineHeight: 1.7, margin: "0 0 12px" }}>
          Con el formato de 48 selecciones, la fase final empieza en{" "}
          <Link href="/dieciseisavos-mundial-2026" style={{ color: GOLD, textDecoration: "none" }}>dieciseisavos</Link> (ronda de 32):
          los dos primeros de cada uno de los{" "}
          <Link href="/grupos" style={{ color: GOLD, textDecoration: "none" }}>12 grupos</Link> más los{" "}
          <Link href="/grupos/mejores-terceros" style={{ color: GOLD, textDecoration: "none" }}>8 mejores terceros</Link>. Los 16 que
          ganan su dieciseisavo llegan a octavos; de ahí, 8 pasan a cuartos.
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.7, margin: "0 0 12px" }}>
          El emparejamiento de octavos lo fija la FIFA de antemano —cada hueco lo ocupa el ganador de un dieciseisavo concreto—,
          así que el cuadro se dibuja solo según avanzan los resultados. Puedes adelantarte y completar todas las rondas en el{" "}
          <Link href="/bracket" style={{ color: GOLD, textDecoration: "none" }}>simulador del Mundial 2026</Link>.
        </p>

        {/* FAQ */}
        <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: "44px 0 14px" }}>
          Preguntas frecuentes
        </h2>
        <div style={{ display: "grid", gap: 12, marginBottom: 32 }}>
          {FAQ.map((f) => (
            <details key={f.q} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px" }}>
              <summary style={{ color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 15 }}>{f.q}</summary>
              <p style={{ fontSize: 14, lineHeight: 1.7, margin: "10px 0 0" }}>{f.a}</p>
            </details>
          ))}
        </div>

        {/* CTA final */}
        <div style={{ textAlign: "center", padding: "28px 16px 8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: "0 0 16px" }}>
            Vive los octavos jugando, no solo mirando.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/registro" style={{ display: "inline-block", background: GOLD, color: "#0a0906", fontWeight: 700, fontSize: 15, padding: "12px 24px", borderRadius: 12, textDecoration: "none" }}>
              Crear mi cuenta gratis
            </Link>
            <Link href="/dieciseisavos-mundial-2026" style={{ display: "inline-block", border: `1px solid ${GOLD}`, color: GOLD, fontWeight: 600, fontSize: 15, padding: "12px 24px", borderRadius: 12, textDecoration: "none" }}>
              Ver los dieciseisavos
            </Link>
          </div>
        </div>

        <div style={{ height: 64 }} aria-hidden />
      </div>

      <StickyCta />
      <PremiosPopup />
    </main>
  );
}
