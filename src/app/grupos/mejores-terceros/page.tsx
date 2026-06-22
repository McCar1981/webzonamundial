// src/app/grupos/mejores-terceros/page.tsx
// Tabla EN VIVO de los mejores terceros del Mundial 2026 + explicación de la
// regla. Keyword nueva del formato 48 equipos (auditoría SEO 11-jun): 8 de los
// 12 terceros pasan a dieciseisavos y nadie tiene esta tabla integrada.
//
// Datos: misma fuente que la parrilla del calendario — snapshots durables
// mc:last: del Match Center vía getLastSnapshotsBulk(). Solo cuentan partidos
// TERMINADOS (FT). Sin KV o sin resultados, la tabla degrada a "por definir"
// y la página sigue siendo útil como explicador de la regla.

import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { WC_MATCHES } from "@/lib/calendario/time";
import { FINISHED_STATUSES } from "@/lib/calendario/live";
import { getLastSnapshotsBulk } from "@/lib/match-center/store";
import StickyCta from "./StickyCta";
import PremiosPopup from "./PremiosPopup";
import TercerosPicker from "./TercerosPicker";
import TercerosAccountSync from "./TercerosAccountSync";

const BG = "#060B14", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a";

export const revalidate = 60;

export const metadata: Metadata = {
  // absolute: bajo /grupos el template de marca del root no llega (lo corta el
  // title plano de grupos/layout.tsx), así que el sufijo va explícito.
  title: { absolute: "Mejores terceros del Mundial 2026 | ZonaMundial" },
  description:
    "Tabla de los mejores terceros del Mundial 2026 actualizada con cada resultado: los 8 mejores terceros de los 12 grupos pasan a dieciseisavos. Reglas y desempates.",
  keywords: [
    "mejores terceros mundial 2026",
    "tabla terceros mundial 2026",
    "terceros clasificados mundial 2026",
    "como clasifican los terceros mundial 2026",
    "dieciseisavos mundial 2026",
  ],
  alternates: { canonical: "/grupos/mejores-terceros" },
  openGraph: {
    title: "Mejores terceros del Mundial 2026: tabla en vivo",
    description:
      "Los 8 mejores terceros de los 12 grupos pasan a dieciseisavos. Tabla actualizada con cada resultado del Mundial 2026.",
    url: "/grupos/mejores-terceros",
    siteName: "ZonaMundial",
    type: "website",
    images: ["/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mejores terceros del Mundial 2026",
    description: "Tabla en vivo: 8 de los 12 terceros pasan a dieciseisavos.",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

interface Row {
  team: string;
  flag: string;
  pj: number;
  g: number;
  e: number;
  p: number;
  gf: number;
  gc: number;
}

const pts = (r: Row) => r.g * 3 + r.e;
const dg = (r: Row) => r.gf - r.gc;

/** Orden de tabla: puntos, diferencia, goles a favor, alfabético. El orden
 *  oficial FIFA añade fair play y sorteo como últimos criterios (se avisa en
 *  la página); con resultados reales casi nunca se llega ahí. */
function cmpRows(a: Row, b: Row): number {
  return pts(b) - pts(a) || dg(b) - dg(a) || b.gf - a.gf || a.team.localeCompare(b.team);
}

interface Tercero {
  letra: string;
  row: Row | null; // null = grupo sin partidos terminados aún
}

async function computeTerceros(): Promise<{ terceros: Tercero[]; jugados: number }> {
  const groupMatches = WC_MATCHES.filter((m) => m.p === "Fase de grupos");
  const snaps = await getLastSnapshotsBulk(groupMatches.map((m) => m.i));

  const groups = new Map<string, Map<string, Row>>();
  let jugados = 0;

  for (const m of groupMatches) {
    let g = groups.get(m.g);
    if (!g) {
      g = new Map();
      groups.set(m.g, g);
    }
    if (!g.has(m.h)) g.set(m.h, { team: m.h, flag: m.hf, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0 });
    if (!g.has(m.a)) g.set(m.a, { team: m.a, flag: m.af, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0 });

    const snap = snaps[m.i];
    if (!snap || !FINISHED_STATUSES.has(snap.status)) continue;

    const gh = snap.score?.[0] ?? 0;
    const ga = snap.score?.[1] ?? 0;
    const home = g.get(m.h)!;
    const away = g.get(m.a)!;
    jugados++;

    home.pj++; away.pj++;
    home.gf += gh; home.gc += ga;
    away.gf += ga; away.gc += gh;
    if (gh > ga) { home.g++; away.p++; }
    else if (gh < ga) { away.g++; home.p++; }
    else { home.e++; away.e++; }
  }

  const terceros: Tercero[] = [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letra, g]) => {
      const rows = [...g.values()].sort(cmpRows);
      const grupoJugado = rows.some((r) => r.pj > 0);
      return { letra, row: grupoJugado ? rows[2] : null };
    });

  return { terceros, jugados };
}

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "¿Cuántos terceros se clasifican en el Mundial 2026?",
    a: "Ocho. Por primera vez el Mundial tiene 12 grupos, y a los dieciseisavos de final pasan los dos primeros de cada grupo (24 equipos) más los 8 mejores terceros, hasta completar 32 clasificados.",
  },
  {
    q: "¿Cómo se ordenan los mejores terceros?",
    a: "Por puntos; si hay empate, por diferencia de goles; después por goles a favor; luego por puntos de fair play (menos tarjetas), y como último recurso, por sorteo de la FIFA.",
  },
  {
    q: "¿Cuándo se conocen los 8 mejores terceros?",
    a: "Al cerrarse la fase de grupos. La tercera jornada se juega en la última semana de junio de 2026, y la tabla definitiva queda fijada con el último partido de grupos, el 27 de junio.",
  },
  {
    q: "¿Contra quién juega cada tercero en dieciseisavos?",
    a: "Depende de qué grupos aporten terceros clasificados: la FIFA tiene una tabla de asignación que reparte a los 8 terceros contra ganadores de grupo según la combinación final. Por eso un tercero no conoce a su rival hasta que termina toda la fase de grupos.",
  },
];

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: "https://zonamundial.app" },
    { "@type": "ListItem", position: 2, name: "Grupos", item: "https://zonamundial.app/grupos" },
    {
      "@type": "ListItem",
      position: 3,
      name: "Mejores terceros",
      item: "https://zonamundial.app/grupos/mejores-terceros",
    },
  ],
};

const TH: CSSProperties = {
  textAlign: "center",
  padding: "10px 6px",
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: DIM,
  fontWeight: 600,
};
const TD: CSSProperties = { textAlign: "center", padding: "10px 6px", fontSize: 14, color: MID };

export default async function MejoresTercerosPage() {
  const { terceros, jugados } = await computeTerceros();

  // Ranking de terceros ya definibles (su grupo tiene al menos 1 resultado).
  const definidos = terceros.filter((t): t is { letra: string; row: Row } => t.row !== null);
  const pendientes = terceros.filter((t) => t.row === null);
  const ranked = [...definidos].sort((a, b) => cmpRows(a.row, b.row));

  // Datos serializables para el mini-juego (client island): los 12 grupos con
  // su tercero ACTUAL como contexto. El pick es por grupo, así que esto vale
  // aunque el tercero cambie con cada jornada.
  const pickerData = terceros.map((t) => ({
    letra: t.letra,
    team: t.row?.team ?? null,
    flag: t.row?.flag ?? null,
  }));

  return (
    <main style={{ background: BG, minHeight: "100vh", color: MID, padding: "24px 20px 60px" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <nav style={{ fontSize: 13, opacity: 0.8 }}>
          <Link href="/" style={{ color: GOLD, textDecoration: "none" }}>Inicio</Link>
          <span style={{ margin: "0 6px", color: DIM }}>/</span>
          <Link href="/grupos" style={{ color: GOLD, textDecoration: "none" }}>Grupos</Link>
          <span style={{ margin: "0 6px", color: DIM }}>/</span>
          <span style={{ color: MID }}>Mejores terceros</span>
        </nav>

        <p style={{ color: GOLD, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 24, marginBottom: 8, fontWeight: 600 }}>
          La regla nueva del Mundial de 48
        </p>

        <h1 style={{ color: GOLD2, fontSize: 42, fontWeight: 800, margin: "0 0 20px", letterSpacing: "-0.04em", lineHeight: 1.08 }}>
          Mejores terceros del Mundial 2026: la tabla, en vivo
        </h1>

        <p style={{ fontSize: 17, lineHeight: 1.7, margin: "0 0 14px" }}>
          En el Mundial 2026 quedar tercero no es quedar fuera. De los{" "}
          <Link href="/grupos" style={{ color: GOLD, textDecoration: "none" }}>12 grupos</Link>, pasan a{" "}
          <Link href="/dieciseisavos-mundial-2026" style={{ color: GOLD, textDecoration: "none" }}>dieciseisavos</Link> los dos primeros de cada uno <b style={{ color: "#fff" }}>y los 8 mejores
          terceros</b>. Esta tabla compara a los terceros de todos los grupos y se actualiza con cada
          resultado de la fase de grupos (del 11 al 27 de junio): los 8 primeros estarían dentro hoy;
          los 4 últimos, eliminados.
        </p>

        {/* Respuesta rápida (featured snippet): la consulta informacional de más
            volumen es "cuántos mejores terceros pasan". Google extrae mejor un
            bloque conciso y aislado que la frase dentro del párrafo. Visible
            (no en <details>) para ganar la posición 0 y subir el dwell time. */}
        <div style={{
          margin: "0 0 14px", padding: "14px 18px", borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)",
        }}>
          <p style={{ margin: "0 0 6px", color: "#fff", fontSize: 16, fontWeight: 700, lineHeight: 1.4 }}>
            Pasan <span style={{ color: GOLD2 }}>8 de los 12 terceros</span> a dieciseisavos.
          </p>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: MID }}>
            Se ordenan por <b style={{ color: "#fff" }}>puntos</b>, luego{" "}
            <b style={{ color: "#fff" }}>diferencia de goles</b>,{" "}
            <b style={{ color: "#fff" }}>goles a favor</b> y{" "}
            <b style={{ color: "#fff" }}>fair play</b>; los 8 mejores acompañan a los
            12 primeros y 12 segundos de grupo hasta completar los 32 de la{" "}
            <Link href="/dieciseisavos-mundial-2026" style={{ color: GOLD, textDecoration: "none" }}>ronda eliminatoria</Link>.
          </p>
        </div>

        {/* CTA arriba (sobre la tabla): conversión visible sin scroll. La tabla
            es alta en móvil; el mini-juego de abajo "quedaba muy abajo", así que
            ponemos aquí una llamada compacta que no entierra la tabla (SEO). */}
        <div style={{
          display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between",
          gap: "12px 16px", margin: "18px 0 4px", padding: "14px 18px", borderRadius: 14,
          border: "1px solid rgba(201,168,76,0.28)",
          background: "linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.03))",
        }}>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.45, color: MID, flex: "1 1 240px" }}>
            <b style={{ color: "#fff" }}>Juega gratis:</b> predice qué 8 terceros pasan y compite por{" "}
            <b style={{ color: GOLD2 }}>Gift Cards de 300/200/100 €</b>. Sin apuestas.
          </p>
          <Link href="/registro" style={{
            display: "inline-block", whiteSpace: "nowrap",
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`, color: "#0A1422",
            fontWeight: 800, fontSize: 15, padding: "11px 22px", borderRadius: 12, textDecoration: "none",
          }}>
            Crear mi cuenta gratis →
          </Link>
        </div>

        {/* Tabla en vivo */}
        <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, overflow: "auto", margin: "28px 0 10px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                <th style={{ ...TH, textAlign: "left", paddingLeft: 14 }}>#</th>
                <th style={{ ...TH, textAlign: "left" }}>Tercero</th>
                <th style={TH}>Grupo</th>
                <th style={TH}>PJ</th>
                <th style={TH}>G</th>
                <th style={TH}>E</th>
                <th style={TH}>P</th>
                <th style={TH}>GF</th>
                <th style={TH}>GC</th>
                <th style={TH}>DG</th>
                <th style={TH}>Pts</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((t, i) => (
                <tr
                  key={t.letra}
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    borderLeft: `3px solid ${i < 8 ? "#22c55e" : "#7f1d1d"}`,
                    background: i === 7 ? "rgba(34,197,94,0.04)" : "transparent",
                  }}
                >
                  <td style={{ ...TD, textAlign: "left", paddingLeft: 14, color: i < 8 ? "#22c55e" : DIM, fontWeight: 700 }}>{i + 1}</td>
                  <td style={{ ...TD, textAlign: "left" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://flagcdn.com/w20/${t.row.flag}.png`}
                      alt=""
                      width={20}
                      height={14}
                      style={{ verticalAlign: "-2px", marginRight: 8, borderRadius: 2 }}
                    />
                    <span style={{ color: "#fff", fontWeight: 600 }}>{t.row.team}</span>
                  </td>
                  <td style={TD}>
                    <Link href={`/grupos/grupo-${t.letra.toLowerCase()}`} style={{ color: GOLD, textDecoration: "none" }}>
                      {t.letra}
                    </Link>
                  </td>
                  <td style={TD}>{t.row.pj}</td>
                  <td style={TD}>{t.row.g}</td>
                  <td style={TD}>{t.row.e}</td>
                  <td style={TD}>{t.row.p}</td>
                  <td style={TD}>{t.row.gf}</td>
                  <td style={TD}>{t.row.gc}</td>
                  <td style={TD}>{dg(t.row) > 0 ? `+${dg(t.row)}` : dg(t.row)}</td>
                  <td style={{ ...TD, color: "#fff", fontWeight: 700 }}>{pts(t.row)}</td>
                </tr>
              ))}
              {pendientes.map((t) => (
                <tr key={t.letra} style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderLeft: "3px solid rgba(255,255,255,0.1)" }}>
                  <td style={{ ...TD, textAlign: "left", paddingLeft: 14 }}>—</td>
                  <td style={{ ...TD, textAlign: "left", fontStyle: "italic" }}>Por definir (sin partidos terminados)</td>
                  <td style={TD}>
                    <Link href={`/grupos/grupo-${t.letra.toLowerCase()}`} style={{ color: GOLD, textDecoration: "none" }}>
                      {t.letra}
                    </Link>
                  </td>
                  <td style={TD} colSpan={8} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: DIM, margin: "0 0 6px" }}>
          {jugados === 0
            ? "La fase de grupos arranca el 11 de junio: la tabla cobra vida con los primeros resultados."
            : `Con ${jugados} ${jugados === 1 ? "partido terminado" : "partidos terminados"} de la fase de grupos. Se actualiza con cada final de partido.`}{" "}
          Verde: hoy estarían clasificados (top 8). Desempates mostrados: puntos, diferencia de goles y
          goles a favor — el orden oficial añade fair play y, en último extremo, sorteo.
        </p>

        {/* Conversión + interacción: mini-juego insertado en el pico de intención
            — el lector acaba de ver la carrera en vivo. Sustituye al CTA estático
            anterior: engancha (sube el tiempo de interacción) Y convierte (al
            completar los 8, desbloquea el registro). 100% client-side. */}
        <TercerosPicker terceros={pickerData} />

        {/* Cierra el bucle de conversión: si el visitante YA tiene cuenta, su
            pronóstico de localStorage se sube solo a su cuenta. Cero coste para
            los anónimos (solo llama al endpoint si hay pronóstico que guardar). */}
        <TercerosAccountSync />

        {/* Explicación */}
        <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: "44px 0 12px" }}>
          Cómo funciona la regla de los mejores terceros
        </h2>
        <p style={{ fontSize: 16, lineHeight: 1.7, margin: "0 0 12px" }}>
          El salto a 48 selecciones cambió la aritmética del torneo: 12 grupos de 4 dan 24 plazas
          directas (primeros y segundos), pero los dieciseisavos necesitan 32 equipos. Las 8 plazas
          restantes son para los mejores terceros de toda la fase de grupos, comparados entre sí con
          estos criterios oficiales, en orden:
        </p>
        <ol style={{ fontSize: 16, lineHeight: 1.9, margin: "0 0 12px", paddingLeft: 22 }}>
          <li><b style={{ color: "#fff" }}>Puntos</b> obtenidos en el grupo.</li>
          <li><b style={{ color: "#fff" }}>Diferencia de goles.</b></li>
          <li><b style={{ color: "#fff" }}>Goles a favor.</b></li>
          <li><b style={{ color: "#fff" }}>Fair play</b> (menos puntos de sanción por tarjetas).</li>
          <li><b style={{ color: "#fff" }}>Sorteo</b> de la FIFA, si todo lo anterior empata.</li>
        </ol>
        <p style={{ fontSize: 16, lineHeight: 1.7, margin: "0 0 12px" }}>
          La consecuencia práctica: <b style={{ color: "#fff" }}>casi nadie está eliminado tras dos
          jornadas</b>. Un equipo con 3 o 4 puntos llega vivo a la última fecha, y los goles de un
          7-0 ajeno pueden decidir tu clasificación. Por eso la tercera jornada se juega con la
          calculadora en la mano — y por eso esta tabla existe.
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.7, margin: "0 0 12px" }}>
          ¿Contra quién juega cada tercero? No hay cruce fijo: la FIFA aplica una tabla de asignación
          que depende de qué grupos aporten terceros clasificados. Hasta el último partido de grupos no
          se conocen los emparejamientos definitivos de dieciseisavos. Puedes ensayar todas las
          combinaciones en nuestro{" "}
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

        {/* CTA */}
        <div style={{ textAlign: "center", padding: "28px 16px 8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: "0 0 16px" }}>
            ¿Crees que sabes qué terceros pasarán? Demuéstralo.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <Link
              href="/registro"
              style={{ display: "inline-block", background: GOLD, color: "#0B0F1A", fontWeight: 700, fontSize: 15, padding: "12px 24px", borderRadius: 12, textDecoration: "none" }}
            >
              Crear mi cuenta gratis
            </Link>
            <Link
              href="/quiniela-mundial-2026"
              style={{ display: "inline-block", border: `1px solid ${GOLD}`, color: GOLD, fontWeight: 600, fontSize: 15, padding: "12px 24px", borderRadius: 12, textDecoration: "none" }}
            >
              Cómo funciona la quiniela
            </Link>
          </div>
        </div>

        {/* Espaciador para que la barra fija inferior no tape el CTA del pie */}
        <div style={{ height: 64 }} aria-hidden />
      </div>

      <StickyCta />
      <PremiosPopup />
    </main>
  );
}
