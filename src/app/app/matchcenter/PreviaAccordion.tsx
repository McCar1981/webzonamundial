"use client";

// Acordeón de PREVIA dentro de la pestaña General del Match Center. Muestra el
// análisis editorial que el cron publica ~1h antes del partido (mismo texto que
// la noticia en /noticias), colapsable, con las FOTOS REALES de ambas
// selecciones (jugador estrella de la BIBLIA) en la cabecera. Si la previa aún
// no se ha generado, muestra las fotos + el aviso de cuándo estará.

import { useEffect, useState } from "react";

const BG2 = "#0F1D32";
const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const MID = "#8a94b0";
const DIM = "#6a7a9a";

interface NoticiaBlock {
  type: "p" | "h2" | "h3" | "quote" | "list" | "callout";
  text?: string;
  items?: string[];
  title?: string;
}
interface PreviaData {
  found: boolean;
  slug?: string;
  title?: string;
  excerpt?: string;
  image?: string | null;
  blocks?: NoticiaBlock[];
  photos: { home: string | null; away: string | null };
}

function TeamPhoto({ src, color }: { src: string | null; color: string }) {
  if (!src) {
    return <span style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: `2px solid ${color}`, display: "inline-block", flexShrink: 0 }} />;
  }
  return (
    <img
      src={src}
      alt=""
      style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", objectPosition: "top center", border: `2px solid ${color}`, flexShrink: 0, background: "#0b1825" }}
    />
  );
}

export default function PreviaAccordion({
  matchId,
  home,
  away,
}: {
  matchId: number;
  home: { name: string; color: string };
  away: { name: string; color: string };
}) {
  const [data, setData] = useState<PreviaData | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/match-center/previa/${matchId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: PreviaData | null) => { if (alive && d) setData(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, [matchId]);

  if (!data) return null;

  const hasPrevia = data.found && Array.isArray(data.blocks) && data.blocks.length > 0;

  return (
    <section style={{ background: BG2, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: "14px clamp(12px,4vw,20px)", marginBottom: 14 }}>
      <button
        type="button"
        onClick={() => hasPrevia && setOpen((o) => !o)}
        aria-expanded={open}
        style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", background: "transparent", border: "none", padding: 0, cursor: hasPrevia ? "pointer" : "default", textAlign: "left", color: "inherit" }}
      >
        {/* Fotos reales de las dos selecciones */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <TeamPhoto src={data.photos.home} color={home.color} />
          <span style={{ fontSize: 11, fontWeight: 800, color: GOLD2 }}>VS</span>
          <TeamPhoto src={data.photos.away} color={away.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: GOLD2, marginBottom: 3 }}>
            Previa del partido
          </span>
          <span className="mc-condensed" style={{ display: "block", fontSize: "clamp(15px,4vw,20px)", fontWeight: 700, lineHeight: 1.2, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {hasPrevia ? data.title : `${home.name} – ${away.name}`}
          </span>
        </div>
        {hasPrevia && (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0, transition: "transform .25s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
            <path d="M6 9l6 6 6-6" stroke={GOLD2} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {!hasPrevia && (
        <p style={{ margin: "10px 0 0", fontSize: 12.5, color: MID, fontWeight: 600 }}>
          El análisis previo se publica una hora antes del saque.
        </p>
      )}
      {hasPrevia && !open && (
        <p style={{ margin: "10px 0 0", fontSize: 12.5, color: MID, fontWeight: 600 }}>
          {data.excerpt || "Toca para leer la previa: claves, jugadores a seguir e historial."}
        </p>
      )}

      {hasPrevia && open && (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          {data.image && (
            <img src={data.image} alt="" style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 12, background: "#0b1825" }} />
          )}
          {data.blocks!.map((b, i) => {
            if (b.type === "h2" || b.type === "h3") {
              return <h3 key={i} className="mc-condensed" style={{ fontSize: 16, fontWeight: 800, color: GOLD2, margin: "8px 0 0" }}>{b.text}</h3>;
            }
            if (b.type === "list") {
              return (
                <ul key={i} style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 5 }}>
                  {(b.items || []).map((it, j) => (
                    <li key={j} style={{ fontSize: 14, lineHeight: 1.55, color: "#d7deec" }}>{it}</li>
                  ))}
                </ul>
              );
            }
            if (b.type === "callout") {
              return (
                <div key={i} style={{ background: "rgba(201,168,76,0.1)", border: `1px solid ${GOLD}44`, borderRadius: 10, padding: "10px 14px" }}>
                  {b.title && <div style={{ fontSize: 12, fontWeight: 800, color: GOLD2, marginBottom: 3 }}>{b.title}</div>}
                  <div style={{ fontSize: 13.5, color: "#d7deec", lineHeight: 1.5 }}>{b.text}</div>
                </div>
              );
            }
            if (b.type === "quote") {
              return <blockquote key={i} style={{ margin: 0, paddingLeft: 12, borderLeft: `3px solid ${GOLD}`, fontSize: 14, fontStyle: "italic", color: "#cfd8ea" }}>{b.text}</blockquote>;
            }
            return <p key={i} style={{ margin: 0, fontSize: 14.5, lineHeight: 1.65, color: "#d7deec" }}>{b.text}</p>;
          })}
          {data.slug && (
            <a href={`/noticias/${data.slug}`} style={{ fontSize: 13, fontWeight: 700, color: GOLD2, textDecoration: "none", marginTop: 4 }}>
              Leer la previa completa →
            </a>
          )}
          <p style={{ margin: "2px 0 0", fontSize: 11, color: DIM, lineHeight: 1.5 }}>
            Análisis editorial con datos reales (fichas oficiales, historial y forma). Las alineaciones se confirman cerca del saque.
          </p>
        </div>
      )}
    </section>
  );
}
