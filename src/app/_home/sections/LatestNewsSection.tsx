"use client";

// LatestNewsSection — "Últimas del Mundial" en la home.
//
// page.tsx es "use client", así que NO puede importar getAllPublicNoticias
// (server-only: lee KV). Esta sección hace fetch a /api/noticias/ultimas en
// useEffect, muestra un skeleton mientras carga y pinta una rejilla de
// tarjetas (3 col → 2 tablet → 1 móvil). Si la lista llega vacía, no
// renderiza nada (ni el contenedor).
//
// Reutiliza la paleta de categorías (CAT_LABELS/CAT_COLORS) y el formateo de
// fecha relativa del hub /noticias para coherencia visual. Estilos inline al
// estilo del resto de secciones del home. Oro #c9a84c solo como acento.

import { useEffect, useState } from "react";
import Link from "next/link";

const BG = "#060B14";
const CARD_BG = "#0F1D32";
const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const TEXT = "#cbd5e1";
const MUTED = "#94a3b8";
const DIM = "#6a7a9a";

// Espejo de CAT_LABELS/CAT_COLORS del hub /noticias (NoticiasClient.tsx).
const CAT_LABELS: Record<string, string> = {
  analisis: "Análisis",
  datos: "Datos",
  historia: "Historia",
  sedes: "Sedes",
  selecciones: "Selecciones",
  plataforma: "Plataforma",
};
const CAT_COLORS: Record<string, string> = {
  analisis: "#3b82f6",
  datos: "#22c55e",
  historia: "#f59e0b",
  sedes: "#e879f9",
  selecciones: "#ef4444",
  plataforma: "#06b6d4",
};

interface UltimaNoticia {
  slug: string;
  title: string;
  excerpt: string;
  cat: string;
  date: string;
  readTime: number;
  realImage: string | null;
  flags: string[];
  ingestedAt: string | null;
}

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function fmtDate(d: string): string {
  const [y, m, day] = d.split("-");
  return `${parseInt(day)} ${MONTHS[parseInt(m) - 1]} ${y}`;
}

// Fecha relativa "Hace X" — mismo criterio que el hub /noticias.
function relTime(date: string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "Ahora";
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `Hace ${Math.floor(diff / 86400)} d`;
  return fmtDate(date);
}

export function LatestNewsSection() {
  const [items, setItems] = useState<UltimaNoticia[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/noticias/ultimas");
        if (!r.ok) {
          if (alive) setFailed(true);
          return;
        }
        const data = await r.json();
        if (alive) setItems(Array.isArray(data.items) ? data.items : []);
      } catch {
        if (alive) setFailed(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Si falló el fetch o la lista llegó vacía, no renderizamos la sección.
  if (failed) return null;
  if (items !== null && items.length === 0) return null;

  const loading = items === null;

  return (
    <section
      aria-labelledby="ultimas-mundial"
      style={{
        background: BG,
        padding: "60px 20px 70px",
        position: "relative",
        zIndex: 2,
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Cabecera */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 28,
          }}
        >
          <div>
            <div
              style={{
                color: GOLD,
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              Últimas del Mundial
            </div>
            <h2
              id="ultimas-mundial"
              style={{
                color: GOLD2,
                fontSize: "clamp(24px, 4vw, 36px)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              La actualidad, al minuto
            </h2>
          </div>
          <Link
            href="/noticias"
            style={{
              color: GOLD,
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Ver todas las noticias →
          </Link>
        </div>

        {/* Rejilla: 3 col (auto-fill) → 2 tablet → 1 móvil vía minmax */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 18,
          }}
        >
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            : items!.map((n) => <NewsCard key={n.slug} n={n} />)}
        </div>
      </div>
    </section>
  );
}

function NewsCard({ n }: { n: UltimaNoticia }) {
  const color = CAT_COLORS[n.cat] || GOLD;
  const label = CAT_LABELS[n.cat] || n.cat;
  const when = relTime(n.ingestedAt || n.date);

  return (
    <Link
      href={`/noticias/${n.slug}`}
      style={{
        display: "flex",
        flexDirection: "column",
        borderRadius: 16,
        overflow: "hidden",
        background: CARD_BG,
        border: "1px solid rgba(255,255,255,0.06)",
        textDecoration: "none",
      }}
    >
      {/* Imagen o fallback elegante (degradado dorado tenue) */}
      <div
        style={{
          position: "relative",
          aspectRatio: "16 / 9",
          background: n.realImage
            ? "#0B1825"
            : "linear-gradient(135deg, rgba(201,168,76,0.10), rgba(11,24,37,0.65))",
          overflow: "hidden",
        }}
      >
        {n.realImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={n.realImage}
            alt={n.title}
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              color: "rgba(201,168,76,0.35)",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            ZonaMundial
          </div>
        )}
        {/* Pill de categoría sobre la imagen */}
        <span
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "4px 10px",
            borderRadius: 999,
            background: `${color}26`,
            border: `1px solid ${color}66`,
            color,
            backdropFilter: "blur(4px)",
          }}
        >
          {label}
        </span>
      </div>

      {/* Cuerpo */}
      <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
        <h3
          style={{
            color: "#fff",
            fontSize: 17,
            fontWeight: 800,
            lineHeight: 1.3,
            letterSpacing: "-0.01em",
            margin: "0 0 8px",
          }}
        >
          {n.title}
        </h3>
        <p
          style={{
            color: TEXT,
            fontSize: 13.5,
            lineHeight: 1.55,
            margin: "0 0 14px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {n.excerpt}
        </p>
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: MUTED,
            fontWeight: 600,
          }}
        >
          <span>{when}</span>
          <span aria-hidden style={{ color: DIM }}>
            ·
          </span>
          <span>{n.readTime} min de lectura</span>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div
      aria-hidden
      style={{
        borderRadius: 16,
        overflow: "hidden",
        background: CARD_BG,
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div style={{ aspectRatio: "16 / 9", background: "rgba(255,255,255,0.04)" }} />
      <div style={{ padding: "16px 18px 18px" }}>
        <div style={{ height: 14, borderRadius: 6, background: "rgba(255,255,255,0.07)", marginBottom: 10 }} />
        <div style={{ height: 14, width: "70%", borderRadius: 6, background: "rgba(255,255,255,0.07)", marginBottom: 16 }} />
        <div style={{ height: 10, width: "45%", borderRadius: 6, background: "rgba(255,255,255,0.05)" }} />
      </div>
    </div>
  );
}
