// src/app/que-necesita-cada-seleccion-mundial-2026/page.tsx
//
// Landing SEO de la ÚLTIMA JORNADA de grupos: qué necesita cada selección para
// clasificar a dieciseisavos y para quedar 1ª, con un SIMULADOR interactivo que
// reordena la tabla con el motor de desempates FIFA real (mismo de /grupos).
//
// Misma fórmula que /grupos/mejores-terceros y /dieciseisavos-mundial-2026:
// server component con datos reales (clasificación viva + fixtures j3 + cruces),
// JSON-LD (FAQPage/BreadcrumbList) y el stack de conversión. Se autodegrada:
// antes de jugarse la jornada todo es "se decide"; al cerrarse cada grupo las
// insignias pasan a posición real. La ola muere el 27-jun; antes de eso esta
// página hereda el intent "qué necesita X para clasificar".

import type { Metadata } from "next";
import Link from "next/link";
import { computeEscenarios, type Certeza, type GroupScenario } from "@/lib/grupos/escenarios";
import EscenariosSimulador from "./EscenariosSimulador";
import { matchInstant } from "@/lib/calendario/time";

const BG = "#060B14", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a", GREEN = "#22c55e", AMBER = "#e8a33d", RED = "#ef6a6a";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Qué necesita cada selección para pasar a dieciseisavos — Mundial 2026",
  description:
    "Última jornada de grupos del Mundial 2026: la clasificación de cada grupo en vivo, qué necesita cada selección para pasar a dieciseisavos y quedar primera, y los posibles cruces. Con simulador interactivo.",
  keywords: [
    "qué necesita para clasificar mundial 2026",
    "clasificación grupos mundial 2026",
    "última jornada mundial 2026",
    "combinaciones grupos mundial 2026",
    "escenarios clasificación mundial 2026",
    "cómo clasifica mi selección mundial 2026",
    "posibles cruces dieciseisavos mundial 2026",
  ],
  alternates: { canonical: "/que-necesita-cada-seleccion-mundial-2026" },
  openGraph: {
    title: "Qué necesita cada selección para pasar a dieciseisavos — Mundial 2026",
    description:
      "La situación de cada grupo en la última jornada: qué necesita cada equipo para pasar y los posibles cruces. Con simulador.",
    url: "/que-necesita-cada-seleccion-mundial-2026",
    siteName: "ZonaMundial",
    locale: "es_MX",
    type: "website",
    images: ["/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Qué necesita cada selección para pasar a dieciseisavos — Mundial 2026",
    description: "Situación de cada grupo, qué necesita cada equipo y posibles cruces. Con simulador interactivo.",
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
// Hora de saque en CDMX (80% del tráfico es MX-LATAM). El dato base es ET.
function fmtHoraCDMX(d: string, t: string): string | null {
  const inst = matchInstant({ d, t });
  if (!inst) return null;
  return new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Mexico_City" }).format(inst);
}

const BADGE: Record<Certeza, { txt: string; color: string }> = {
  primero: { txt: "1º asegurado", color: GOLD2 },
  clasificado: { txt: "Clasificado", color: GREEN },
  decide: { txt: "Se decide", color: AMBER },
  fuera: { txt: "Top-2 imposible", color: RED },
};

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "¿Qué necesita una selección para clasificar a dieciseisavos en el Mundial 2026?",
    a: "Pasan los dos primeros de cada uno de los 12 grupos (24 equipos) más los 8 mejores terceros (8 equipos): 32 en total. Para asegurar el pase directo, una selección necesita terminar 1ª o 2ª de su grupo; si queda 3ª, depende de compararse con los terceros de los otros grupos. El orden dentro del grupo se decide por puntos, y si hay empate por diferencia de goles, goles a favor, el resultado entre los implicados (mini-liga) y, por último, el fair play.",
  },
  {
    q: "¿Cuándo se juega la última jornada de la fase de grupos?",
    a: "Entre el 24 y el 27 de junio de 2026. Los dos partidos de cada grupo se juegan a la misma hora para que ninguna selección tenga ventaja de saber el otro resultado.",
  },
  {
    q: "¿Por qué dos selecciones con los mismos puntos quedan en distinto puesto?",
    a: "Porque el desempate oficial mira, en orden: diferencia de goles general, goles a favor, y si siguen iguales, los puntos y goles solo en los partidos entre las selecciones empatadas (mini-liga directa). El simulador de esta página aplica exactamente esos criterios al recalcular la tabla.",
  },
  {
    q: "¿Contra quién jugaría mi selección en dieciseisavos?",
    a: "El cuadro está fijado por la FIFA: el 1º y el 2º de cada grupo tienen ya asignados su rival (una posición concreta de otro grupo o un mejor tercero), su sede y su fecha. En cada grupo te mostramos a dónde va el 1º y a dónde el 2º.",
  },
];

// FAQ schema = preguntas estáticas + 1 pregunta por grupo (coincide con el
// acordeón visible de cada ficha → válido y apto para featured snippet long-tail).
function buildFaqLd(groups: GroupScenario[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      ...FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      ...groups.map((g) => ({
        "@type": "Question",
        name: `¿Qué necesita cada selección del Grupo ${g.letra} para pasar a dieciseisavos?`,
        acceptedAnswer: { "@type": "Answer", text: g.current.map((r) => `${r.nombre}: ${g.escenarios[r.flagCode] ?? ""}`).join(" ") },
      })),
    ],
  };
}
const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: "https://zonamundial.app" },
    { "@type": "ListItem", position: 2, name: "Grupos", item: "https://zonamundial.app/grupos" },
    { "@type": "ListItem", position: 3, name: "Qué necesita cada selección", item: "https://zonamundial.app/que-necesita-cada-seleccion-mundial-2026" },
  ],
};

function Flag({ code }: { code: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`https://flagcdn.com/w20/${code.toLowerCase()}.png`} alt="" width={20} height={14} loading="lazy" decoding="async" style={{ borderRadius: 2, flexShrink: 0, verticalAlign: "-2px" }} />;
}

function GrupoCard({ g }: { g: GroupScenario }) {
  const algo = g.current.some((r) => r.pj > 0);
  return (
    <section style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px 16px 18px", background: "rgba(255,255,255,0.02)" }}>
      <h3 style={{ color: GOLD2, fontSize: 16, fontWeight: 800, margin: "0 0 10px", letterSpacing: "0.02em" }}>
        Grupo {g.letra}
      </h3>

      {/* Clasificación actual + insignia de certeza */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", fontSize: 10, color: DIM, textTransform: "uppercase", letterSpacing: "0.05em", padding: "0 4px 6px 0", fontWeight: 700 }}>Selección</th>
            <th style={{ textAlign: "center", fontSize: 10, color: DIM, padding: "0 4px 6px", fontWeight: 700 }}>PJ</th>
            <th style={{ textAlign: "center", fontSize: 10, color: DIM, padding: "0 4px 6px", fontWeight: 700 }}>DG</th>
            <th style={{ textAlign: "center", fontSize: 10, color: DIM, padding: "0 4px 6px", fontWeight: 700 }}>Pts</th>
            <th style={{ textAlign: "right", fontSize: 10, color: DIM, padding: "0 0 6px 4px", fontWeight: 700 }}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {g.current.map((r, i) => {
            const b = BADGE[g.badges[r.flagCode] ?? "decide"];
            return (
              <tr key={r.flagCode} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <td style={{ padding: "7px 4px 7px 0" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: i <= 1 ? GREEN : i === 2 ? AMBER : DIM, fontWeight: 800, fontSize: 12, width: 12, display: "inline-block" }}>{i + 1}</span>
                    <Flag code={r.flagCode} />
                    <span style={{ color: "#fff", fontSize: 13.5, fontWeight: 600 }}>{r.nombre}</span>
                  </span>
                </td>
                <td style={{ textAlign: "center", color: MID, fontSize: 13, padding: "7px 4px" }}>{r.pj}</td>
                <td style={{ textAlign: "center", color: MID, fontSize: 13, padding: "7px 4px" }}>{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                <td style={{ textAlign: "center", color: "#fff", fontSize: 13, fontWeight: 800, padding: "7px 4px" }}>{r.pts}</td>
                <td style={{ textAlign: "right", color: b.color, fontSize: 11.5, fontWeight: 700, padding: "7px 0 7px 4px" }}>{b.txt}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Partidos de la última jornada (ambos a la misma hora → fecha+hora una vez) */}
      {g.finals.length > 0 && (() => {
        const hora = !g.decided ? fmtHoraCDMX(g.finals[0].fecha, g.finals[0].hora) : null;
        return (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 10.5, color: DIM, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, margin: "0 0 6px" }}>
              Última jornada · {fmtFecha(g.finals[0].fecha)}{hora ? `, ${hora}h CDMX` : g.decided ? " (jugada)" : ""}
            </p>
            <div style={{ display: "grid", gap: 5 }}>
              {g.finals.map((f) => {
                const sc = g.live[f.i]?.sc;
                return (
                  <div key={f.i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 13 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#fff", minWidth: 0 }}>
                      <Flag code={f.hf} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.hn}</span>
                    </span>
                    <span style={{ color: f.jugado ? "#fff" : DIM, fontWeight: 700, flexShrink: 0, fontSize: 12 }}>
                      {f.jugado && sc ? `${sc[0]}–${sc[1]}` : "vs"}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#fff", minWidth: 0, justifyContent: "flex-end" }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.an}</span> <Flag code={f.af} />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Cruces */}
      {(g.cruces.primero || g.cruces.segundo) && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: 12.5, lineHeight: 1.5, color: MID }}>
          {g.cruces.primero && <div><b style={{ color: GOLD2 }}>1º</b> → {g.cruces.primero.rival}</div>}
          {g.cruces.segundo && <div><b style={{ color: GOLD2 }}>2º</b> → {g.cruces.segundo.rival}</div>}
        </div>
      )}

      {/* Escenarios por selección: PLEGADO por defecto (UI limpia) pero en el HTML
          → indexable por Google y apto para snippet "¿qué necesita {país}?". */}
      <details style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <summary style={{ cursor: "pointer", color: GOLD, fontSize: 13, fontWeight: 700, listStyle: "none" }}>
          ¿Qué necesita cada selección del Grupo {g.letra}? ▾
        </summary>
        <div style={{ display: "grid", gap: 7, marginTop: 8 }}>
          {g.current.map((r) => (
            <p key={r.flagCode} style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: MID }}>
              <b style={{ color: "#fff" }}>{r.nombre}:</b> {g.escenarios[r.flagCode]}
            </p>
          ))}
        </div>
      </details>

      {!algo && (
        <p style={{ fontSize: 11.5, color: DIM, margin: "10px 0 0", fontStyle: "italic" }}>
          Aún sin partidos jugados; orden inicial por ranking FIFA.
        </p>
      )}
    </section>
  );
}

export default async function EscenariosPage() {
  const groups = await computeEscenarios();
  const algunoJugado = groups.some((g) => g.current.some((r) => r.pj > 0));
  // Sello de frescura (señal de CTR en queries 100% sensibles a la actualidad).
  // Con revalidate=60 refleja la última regeneración (≤1 min). Hora CDMX (80% MX-LATAM).
  const actualizado = new Intl.DateTimeFormat("es-MX", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City",
  }).format(new Date());
  const faqLd = buildFaqLd(groups);

  return (
    <main style={{ background: BG, minHeight: "100vh", color: MID, padding: "24px 20px 60px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <nav style={{ fontSize: 13, opacity: 0.8 }}>
          <Link href="/" style={{ color: GOLD, textDecoration: "none" }}>Inicio</Link>
          <span style={{ margin: "0 6px", color: DIM }}>/</span>
          <Link href="/grupos" style={{ color: GOLD, textDecoration: "none" }}>Grupos</Link>
          <span style={{ margin: "0 6px", color: DIM }}>/</span>
          <span style={{ color: MID }}>Qué necesita cada selección</span>
        </nav>

        <p style={{ color: GOLD, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 24, marginBottom: 8, fontWeight: 600 }}>
          Última jornada · fase de grupos
        </p>
        <h1 style={{ color: GOLD2, fontSize: 40, fontWeight: 800, margin: "0 0 10px", letterSpacing: "-0.04em", lineHeight: 1.1 }}>
          Qué necesita cada selección para pasar a dieciseisavos del Mundial 2026
        </h1>
        <p style={{ fontSize: 13, color: DIM, margin: "0 0 18px" }}>
          <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: GREEN, marginRight: 6, verticalAlign: "middle" }} aria-hidden />
          Datos en vivo · actualizado el {actualizado} (hora CDMX)
        </p>

        <p style={{ fontSize: 17, lineHeight: 1.7, margin: "0 0 14px" }}>
          Llega la <b style={{ color: "#fff" }}>última jornada de grupos</b> (24–27 de junio) y todo se decide. Aquí tienes la{" "}
          <Link href="/grupos" style={{ color: GOLD, textDecoration: "none" }}>clasificación de cada grupo</Link> en vivo, qué necesita
          cada equipo para meterse en{" "}
          <Link href="/dieciseisavos-mundial-2026" style={{ color: GOLD, textDecoration: "none" }}>dieciseisavos</Link>, quién pelea por
          ser <b style={{ color: "#fff" }}>primero</b> y los posibles cruces. Y un{" "}
          <b style={{ color: GOLD2 }}>simulador</b>: mueve los marcadores y mira cómo cambia todo.
        </p>

        {/* Bloque-respuesta (featured snippet) */}
        <div style={{ margin: "14px 0 4px", padding: "14px 18px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(201,168,76,0.06)" }}>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: MID }}>
            <b style={{ color: "#fff" }}>En corto:</b> a dieciseisavos pasan <b style={{ color: GOLD2 }}>32 selecciones</b> — los{" "}
            <b style={{ color: "#fff" }}>dos primeros</b> de cada uno de los 12 grupos (24) más los{" "}
            <Link href="/grupos/mejores-terceros" style={{ color: GOLD, textDecoration: "none" }}>8 mejores terceros</Link>. Para asegurar el
            pase, una selección necesita acabar <b style={{ color: "#fff" }}>1ª o 2ª</b>; si queda 3ª, depende de los demás grupos. El orden
            se decide por <b style={{ color: "#fff" }}>puntos → diferencia de goles → goles a favor → mini-liga entre empatados → fair play</b>.
          </p>
        </div>

        {/* Simulador interactivo (isla cliente) */}
        <div style={{ margin: "22px 0 10px" }}>
          <EscenariosSimulador groups={groups} />
        </div>

        {/* CTA conversión */}
        <div style={{
          display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between",
          gap: "12px 16px", margin: "8px 0 6px", padding: "14px 18px", borderRadius: 14,
          border: "1px solid rgba(201,168,76,0.28)",
          background: "linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.03))",
        }}>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.45, color: MID, flex: "1 1 240px" }}>
            <b style={{ color: "#fff" }}>Juega gratis:</b> predice qué selecciones pasan y compite por{" "}
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

        {/* Situación grupo por grupo (render servidor = SEO) */}
        <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: "40px 0 6px" }}>
          La situación de cada grupo
        </h2>
        <p style={{ fontSize: 14, color: DIM, margin: "0 0 18px" }}>
          <span style={{ color: GREEN }}>■</span> 1º y 2º clasifican directo · <span style={{ color: AMBER }}>■</span> 3º se la juega en los{" "}
          <Link href="/grupos/mejores-terceros" style={{ color: GOLD, textDecoration: "none" }}>mejores terceros</Link>.{" "}
          {algunoJugado ? "Las insignias solo afirman lo matemáticamente seguro; lo demás, pruébalo en el simulador." : "Sin partidos aún: todo por decidirse."}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14, marginBottom: 8 }}>
          {groups.map((g) => <GrupoCard key={g.letra} g={g} />)}
        </div>

        {/* Explicación */}
        <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: "44px 0 12px" }}>
          Cómo se decide quién pasa
        </h2>
        <p style={{ fontSize: 16, lineHeight: 1.7, margin: "0 0 12px" }}>
          En el Mundial de 48 equipos, cada grupo de 4 reparte dos plazas directas (1º y 2º). Las 8 plazas restantes de la ronda de 32
          son para los mejores terceros de toda la fase. Por eso un tercero puede clasificar o quedar fuera según cómo terminen los
          demás grupos: lo sigues en la{" "}
          <Link href="/grupos/mejores-terceros" style={{ color: GOLD, textDecoration: "none" }}>tabla de mejores terceros</Link>.
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.7, margin: "0 0 12px" }}>
          Cuando dos selecciones empatan a puntos, el desempate oficial mira la diferencia de goles, luego los goles a favor y, si
          siguen iguales, lo que pasó en el partido entre ellas (mini-liga). El simulador de arriba aplica esos mismos criterios, así que
          puedes comprobar al detalle qué resultado deja a tu selección dentro. Cuando se cierre la fase, los cruces se dibujan en el{" "}
          <Link href="/dieciseisavos-mundial-2026" style={{ color: GOLD, textDecoration: "none" }}>cuadro de dieciseisavos</Link> y puedes
          completarlo entero en el <Link href="/bracket" style={{ color: GOLD, textDecoration: "none" }}>simulador del cuadro</Link>.
        </p>

        {/* FAQ */}
        <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: "44px 0 14px" }}>Preguntas frecuentes</h2>
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
            No solo mires la última jornada: juégala.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/registro" style={{ display: "inline-block", background: GOLD, color: "#0A1422", fontWeight: 700, fontSize: 15, padding: "12px 24px", borderRadius: 12, textDecoration: "none" }}>
              Crear mi cuenta gratis
            </Link>
            <Link href="/grupos/mejores-terceros" style={{ display: "inline-block", border: `1px solid ${GOLD}`, color: GOLD, fontWeight: 600, fontSize: 15, padding: "12px 24px", borderRadius: 12, textDecoration: "none" }}>
              Ver los mejores terceros
            </Link>
          </div>
        </div>

        <div style={{ height: 48 }} aria-hidden />
      </div>
    </main>
  );
}
