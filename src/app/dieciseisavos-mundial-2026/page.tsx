// src/app/dieciseisavos-mundial-2026/page.tsx
//
// Landing SEO de los DIECISEISAVOS de final del Mundial 2026 (ronda de 32).
// Misma fórmula que /grupos/mejores-terceros: server component con datos
// reales del calendario + JSON-LD (FAQPage/BreadcrumbList) + stack de
// conversión (CTA arriba + barra fija + popup) + enlace al simulador.
//
// Los 16 cruces están en data/matches.ts (fase "Dieciseisavos", i73-88) con
// fecha y sede REALES de la FIFA. Los equipos son slots ("1A", "3ABCDF"…)
// hasta que cierre la fase de grupos (27-jun): se muestran en forma legible
// ("1º Grupo A", "Mejor 3º") y la página se autocompleta con los equipos
// reales cuando hf/af dejan de ser "tbd" (mismo patrón de degradado que la
// tabla de terceros). Resolver el slot→selección en vivo (incl. la asignación
// FIFA de terceros) queda para una v2.

import type { Metadata } from "next";
import Link from "next/link";
import { WC_MATCHES } from "@/lib/calendario/time";
import { FINISHED_STATUSES, IN_PLAY_STATUSES } from "@/lib/calendario/live";
import { getLastSnapshotsBulk } from "@/lib/match-center/store";
import { resolveKnockoutTeams } from "@/lib/grupos/bracket";
import { matchSlug } from "@/lib/match-center/slug";
import StickyCta from "@/app/grupos/mejores-terceros/StickyCta";

const BG = "#000000", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#a69a82", DIM = "#6e6552", GREEN = "#22c55e";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Dieciseisavos Mundial 2026: cuadro y cruces",
  description:
    "Cuadro de los dieciseisavos del Mundial 2026: los 16 cruces de la ronda de 32 con sus fechas y sedes. Se actualiza al terminar la fase de grupos.",
  keywords: [
    "dieciseisavos mundial 2026",
    "cuadro dieciseisavos mundial 2026",
    "cruces dieciseisavos mundial 2026",
    "fechas dieciseisavos mundial 2026",
    "ronda de 32 mundial 2026",
  ],
  alternates: { canonical: "/dieciseisavos-mundial-2026" },
  openGraph: {
    title: "Dieciseisavos del Mundial 2026: cuadro y cruces",
    description:
      "Los 16 cruces de la primera ronda eliminatoria del Mundial 2026, con fechas y sedes.",
    url: "/dieciseisavos-mundial-2026",
    siteName: "ZonaMundial",
    type: "website",
    images: ["/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dieciseisavos del Mundial 2026",
    description: "Los 16 cruces de la ronda de 32, con fechas y sedes.",
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

// d = "YYYY-MM-DD" (día local de la sede). Formateamos en UTC a partir de la
// cadena para evitar cualquier desplazamiento por zona horaria del servidor.
function fmtFecha(d: string): string {
  const [y, m, day] = d.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, day));
  return `${DIAS[date.getUTCDay()]} ${day} ${MESES[m - 1]}`;
}

// "1A" -> "1º Grupo A"; "2C" -> "2º Grupo C"; "3ABCDF" -> "Mejor 3º · A/B/C/D/F"
function slotLabel(code: string): string {
  if (/^1[A-L]$/.test(code)) return `1º Grupo ${code.slice(1)}`;
  if (/^2[A-L]$/.test(code)) return `2º Grupo ${code.slice(1)}`;
  if (/^3[A-L]+$/.test(code)) return `Mejor 3º · ${code.slice(1).split("").join("/")}`;
  return code;
}

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "¿Qué son los dieciseisavos de final del Mundial 2026?",
    a: "Son la primera ronda eliminatoria. Por primera vez el Mundial tiene 48 selecciones, y a esta fase pasan 32 equipos: los dos primeros de cada uno de los 12 grupos (24 equipos) más los 8 mejores terceros. De esos 32, la mitad cae y avanzan 16 a octavos.",
  },
  {
    q: "¿Cuándo se juegan los dieciseisavos del Mundial 2026?",
    a: "Del 28 de junio al 3 de julio de 2026, justo después de cerrarse la fase de grupos el 27 de junio.",
  },
  {
    q: "¿Cómo se deciden los cruces?",
    a: "El cuadro está fijado de antemano por la FIFA: cada hueco corresponde a una posición concreta (1º o 2º de un grupo, o uno de los 8 mejores terceros) y a una sede y fecha. Los equipos concretos que ocupan cada hueco se conocen al terminar la fase de grupos.",
  },
  {
    q: "¿Es la primera vez que un Mundial tiene dieciseisavos de final?",
    a: "Sí. Con el formato de 48 equipos estrenado en 2026 aparece por primera vez una ronda de 32 (dieciseisavos); en los Mundiales de 32 equipos la fase eliminatoria empezaba directamente en octavos.",
  },
  {
    q: "¿Qué pasa si un partido de dieciseisavos termina empatado?",
    a: "Al ser eliminatoria directa, si hay empate tras los 90 minutos se juega prórroga y, si persiste, se decide en la tanda de penaltis.",
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
    {
      "@type": "ListItem",
      position: 2,
      name: "Dieciseisavos",
      item: "https://zonamundial.app/dieciseisavos-mundial-2026",
    },
  ],
};

function Lado({ name, flag, align }: { name: string; flag: string; align: "left" | "right" }) {
  const defined = flag !== "tbd";
  const flagEl = defined ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w20/${flag.toLowerCase()}.png`}
      alt=""
      width={20}
      height={14}
      style={{ borderRadius: 2, flexShrink: 0 }}
    />
  ) : null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: align === "right" ? "flex-end" : "flex-start", flex: 1, minWidth: 0 }}>
      {align === "left" && flagEl}
      <span style={{ color: defined ? "#fff" : MID, fontSize: 14, fontWeight: 600, fontStyle: defined ? "normal" : "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {defined ? name : slotLabel(name)}
      </span>
      {align === "right" && flagEl}
    </div>
  );
}

export default async function DieciseisavosPage() {
  const partidos = WC_MATCHES.filter((m) => m.p === "Dieciseisavos").sort((a, b) => a.i - b.i);
  const snaps = await getLastSnapshotsBulk(partidos.map((m) => m.i));
  // Vuelca los 1º/2º reales de los grupos YA CERRADOS (se actualiza cada minuto).
  const slots = await resolveKnockoutTeams();
  const algunoDefinido = partidos.some((m) => m.hf !== "tbd" || slots[m.h] || slots[m.a]);

  // Agrupar por día (las cadenas YYYY-MM-DD ordenan bien lexicográficamente).
  const dias = [...new Set(partidos.map((m) => m.d))].sort();

  return (
    <main style={{ background: BG, minHeight: "100vh", color: MID, padding: "24px 20px 60px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <nav style={{ fontSize: 13, opacity: 0.8 }}>
          <Link href="/" style={{ color: GOLD, textDecoration: "none" }}>Inicio</Link>
          <span style={{ margin: "0 6px", color: DIM }}>/</span>
          <span style={{ color: MID }}>Dieciseisavos</span>
        </nav>

        <p style={{ color: GOLD, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 24, marginBottom: 8, fontWeight: 600 }}>
          La primera ronda eliminatoria del Mundial de 48
        </p>

        <h1 style={{ color: GOLD2, fontSize: 42, fontWeight: 800, margin: "0 0 20px", letterSpacing: "-0.04em", lineHeight: 1.08 }}>
          Dieciseisavos de final del Mundial 2026: el cuadro y los cruces
        </h1>

        <p style={{ fontSize: 17, lineHeight: 1.7, margin: "0 0 14px" }}>
          Por primera vez el Mundial arranca su fase eliminatoria con una <b style={{ color: "#fff" }}>ronda de 32</b>:
          pasan los dos primeros de cada uno de los{" "}
          <Link href="/grupos" style={{ color: GOLD, textDecoration: "none" }}>12 grupos</Link> más los{" "}
          <Link href="/grupos/mejores-terceros" style={{ color: GOLD, textDecoration: "none" }}>8 mejores terceros</Link>.
          Estos son los <b style={{ color: "#fff" }}>16 cruces</b> con su sede y fecha, del 28 de junio al 3 de julio.
        </p>

        {/* CTA arriba (sobre el cuadro): conversión visible sin scroll. */}
        <div style={{
          display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between",
          gap: "12px 16px", margin: "18px 0 4px", padding: "14px 18px", borderRadius: 14,
          border: "1px solid rgba(201,168,76,0.28)",
          background: "linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.03))",
        }}>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.45, color: MID, flex: "1 1 240px" }}>
            <b style={{ color: "#fff" }}>Juega gratis:</b> predice el cuadro completo y compite por{" "}
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

        {/* Cuadro: 16 cruces agrupados por día */}
        <div style={{ margin: "24px 0 10px" }}>
          {dias.map((dia) => (
            <section key={dia} style={{ marginBottom: 18 }}>
              <h2 style={{ color: GOLD2, fontSize: 14, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", margin: "0 0 10px" }}>
                {fmtFecha(dia)}
              </h2>
              <div style={{ display: "grid", gap: 8 }}>
                {partidos.filter((m) => m.d === dia).map((m) => {
                  const snap = snaps[m.i];
                  const showScore = !!snap && (FINISHED_STATUSES.has(snap.status) || IN_PLAY_STATUSES.has(snap.status)) && Array.isArray(snap.score);
                  const live = !!snap && IN_PLAY_STATUSES.has(snap.status);
                  // Prioridad: fixture oficial (hf≠tbd) → volcado calculado → etiqueta de hueco.
                  const home = m.hf !== "tbd" ? { nombre: m.h, flagCode: m.hf } : slots[m.h];
                  const away = m.af !== "tbd" ? { nombre: m.a, flagCode: m.af } : slots[m.a];
                  return (
                    <div key={m.i} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 14px", background: "rgba(255,255,255,0.02)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Lado name={home?.nombre ?? m.h} flag={home?.flagCode ?? m.hf} align="left" />
                        <div style={{ flexShrink: 0, textAlign: "center", minWidth: 44 }}>
                          {showScore ? (
                            <span style={{ color: live ? GREEN : "#fff", fontWeight: 800, fontSize: 16 }}>
                              {snap!.score![0]}<span style={{ color: DIM }}> - </span>{snap!.score![1]}
                            </span>
                          ) : (
                            <span style={{ color: DIM, fontSize: 12, fontWeight: 700 }}>VS</span>
                          )}
                        </div>
                        <Lado name={away?.nombre ?? m.a} flag={away?.flagCode ?? m.af} align="right" />
                      </div>
                      <div style={{ marginTop: 8, fontSize: 12, color: DIM, textAlign: "center" }}>
                        {m.vn} · {m.vc}
                        {m.hf !== "tbd" && m.af !== "tbd" && matchSlug(m.i) ? (
                          <> · <Link href={`/partido/${matchSlug(m.i)}`} style={{ color: GOLD, textDecoration: "none" }}>ficha del partido →</Link></>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <p style={{ fontSize: 13, color: DIM, margin: "0 0 6px" }}>
          {algunoDefinido
            ? "Los 1º y 2º se confirman en cuanto cierra cada grupo (la página se actualiza sola con cada resultado). Los 8 mejores terceros se asignan a su hueco al terminar toda la fase de grupos."
            : "Los equipos se confirman en cuanto cierra cada grupo; hasta entonces verás la posición que ocupará cada hueco. Esta página se actualiza sola con cada resultado."}{" "}
          Horarios de cada partido en tu zona horaria en el{" "}
          <Link href="/calendario" style={{ color: GOLD, textDecoration: "none" }}>calendario completo</Link>.
        </p>

        {/* CTA al simulador */}
        <div style={{ margin: "24px 0 8px", padding: "18px 20px", borderRadius: 16, border: "1px solid rgba(201,168,76,0.22)", background: "rgba(255,255,255,0.02)" }}>
          <p style={{ color: "#fff", fontSize: 18, fontWeight: 800, margin: "0 0 6px" }}>
            ¿Crees que sabes cómo quedará el cuadro?
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.6, margin: "0 0 14px" }}>
            Rellena tú las eliminatorias hasta la final en nuestro simulador, guárdalo y compite con tu pronóstico. Gratis.
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
          Cómo se llega a los dieciseisavos
        </h2>
        <p style={{ fontSize: 16, lineHeight: 1.7, margin: "0 0 12px" }}>
          El salto a 48 selecciones cambió la estructura del torneo: 12 grupos de 4 reparten 24 plazas directas
          (primeros y segundos), y las 8 restantes son para los{" "}
          <Link href="/grupos/mejores-terceros" style={{ color: GOLD, textDecoration: "none" }}>mejores terceros</Link> de
          toda la fase de grupos. Con esos 32 equipos arranca la eliminatoria directa: quien pierde, queda fuera.
          Mira <Link href="/que-necesita-cada-seleccion-mundial-2026" style={{ color: GOLD, textDecoration: "none" }}>qué necesita cada selección para pasar a dieciseisavos</Link> en la última jornada.
          Los 16 ganadores avanzan a los <Link href="/octavos-de-final-mundial-2026" style={{ color: GOLD, textDecoration: "none" }}>octavos de final</Link>.
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.7, margin: "0 0 12px" }}>
          El cuadro de cruces lo fija la FIFA de antemano —cada hueco tiene asignada una posición de grupo y una sede—,
          pero el rival concreto de cada selección no se conoce hasta que termina la fase de grupos, porque depende de
          qué grupos aporten los mejores terceros. Puedes ensayar todas las combinaciones en el{" "}
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
            Vive los dieciseisavos jugando, no solo mirando.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/registro" style={{ display: "inline-block", background: GOLD, color: "#0a0906", fontWeight: 700, fontSize: 15, padding: "12px 24px", borderRadius: 12, textDecoration: "none" }}>
              Crear mi cuenta gratis
            </Link>
            <Link href="/grupos/mejores-terceros" style={{ display: "inline-block", border: `1px solid ${GOLD}`, color: GOLD, fontWeight: 600, fontSize: 15, padding: "12px 24px", borderRadius: 12, textDecoration: "none" }}>
              Ver los mejores terceros
            </Link>
          </div>
        </div>

        <div style={{ height: 64 }} aria-hidden />
      </div>

      <StickyCta />
    </main>
  );
}
