"use client";

/**
 * Noticias hub — ESPN-style editorial layout.
 * Top story (full-bleed) + 3 secondary cards + tag bar + dense article list
 * + sidebar with "Lo más leído" + app CTA.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Noticia } from "@/data/noticias";
import styles from "./NoticiasIndex.module.css";

const CAT_LABELS: Record<string, string> = {
  all: "Todo",
  analisis: "Análisis",
  datos: "Datos",
  historia: "Historia",
  sedes: "Sedes",
  selecciones: "Selecciones",
  plataforma: "Plataforma",
};
const CAT_COLORS: Record<string, string> = {
  all: "#c9a84c",
  analisis: "#3b82f6",
  datos: "#22c55e",
  historia: "#f59e0b",
  sedes: "#e879f9",
  selecciones: "#ef4444",
  plataforma: "#06b6d4",
};

const flagUrl = (c: string) => `https://flagcdn.com/w40/${c}.png`;
const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const fmtDate = (d: string) => {
  const [y, m, day] = d.split("-");
  return `${parseInt(day)} ${MONTHS[parseInt(m) - 1]} ${y}`;
};

function relTime(date: string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "Ahora";
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `Hace ${Math.floor(diff / 86400)} d`;
  return fmtDate(date);
}

function CatPill({ cat, big = false }: { cat: string; big?: boolean }) {
  const color = CAT_COLORS[cat] || "#c9a84c";
  const label = CAT_LABELS[cat] || cat;
  return (
    <span
      className={`${styles.catPill} ${big ? styles.catPillBig : ""}`}
      style={{ background: `${color}1a`, borderColor: `${color}55`, color }}
    >
      {label}
    </span>
  );
}

function FlagsRow({ flags, max = 3 }: { flags: string[]; max?: number }) {
  if (!flags?.length) return null;
  return (
    <span className={styles.flagsRow}>
      {flags.slice(0, max).map((f) => (
        <img key={f} src={flagUrl(f)} alt="" />
      ))}
    </span>
  );
}

export default function NoticiasClient({
  posts,
  totalCount,
}: {
  posts: Noticia[];
  totalCount: number;
}) {
  const searchParams = useSearchParams();
  const initialCat = searchParams.get("cat") || "all";
  const [cat, setCat] = useState(initialCat);
  const tickerRef = useRef<HTMLDivElement>(null);
  const tickerLaneRef = useRef<HTMLDivElement>(null);
  const [tickerDuration, setTickerDuration] = useState<number>(15);

  useEffect(() => {
    const c = searchParams.get("cat");
    if (c && c !== cat) setCat(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Mantener velocidad de scroll del ticker constante (~140 px/s) sin importar
  // cuántos items haya o lo largos que sean los titulares. Recalcula al
  // montar y al cambiar el viewport.
  useEffect(() => {
    const PX_PER_SEC = 140;
    const compute = () => {
      const lane = tickerLaneRef.current;
      if (!lane) return;
      // La lane está duplicada (items × 2) y el keyframe va de 0 → -50%,
      // así que la distancia recorrida en cada loop es scrollWidth / 2.
      const distance = lane.scrollWidth / 2;
      if (distance > 0) {
        const seconds = Math.max(8, Math.min(30, distance / PX_PER_SEC));
        setTickerDuration(seconds);
      }
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [posts]);

  const filtered = useMemo(() => {
    if (cat === "all") return posts;
    return posts.filter((p) => p.cat === cat);
  }, [cat, posts]);

  const top = filtered[0];
  const secondary = filtered.slice(1, 4);
  const list = filtered.slice(4);

  const trending = useMemo(() => posts.slice(0, 5), [posts]);

  // Breaking ticker copy (reuse latest 5 headlines)
  const tickerItems = useMemo(() => posts.slice(0, 6), [posts]);

  return (
    <div className={styles.page}>
      {/* Breaking ticker */}
      <div className={styles.ticker} aria-label="Última hora">
        <span className={styles.tickerLabel}>EN VIVO</span>
        <div className={styles.tickerTrack} ref={tickerRef}>
          <div
            className={styles.tickerLane}
            ref={tickerLaneRef}
            style={{ animationDuration: `${tickerDuration}s` }}
          >
            {[...tickerItems, ...tickerItems].map((p, i) => (
              <Link key={`${p.id}-${i}`} href={`/noticias/${p.slug}`} className={styles.tickerItem}>
                <span className={styles.tickerDot} style={{ background: CAT_COLORS[p.cat] }} />
                {p.title}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Hero header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <span className={styles.eyebrow}>NOTICIAS · MUNDIAL 2026</span>
          <h1 className={styles.h1}>
            La actualidad del <em>Mundial</em>, sin filtros.
          </h1>
          <p className={styles.headerSub}>
            Análisis, datos, historia y guías para vivir la Copa del Mundo 2026 como un experto. Cobertura editorial diaria de selecciones, sedes, jugadores y mercados.
          </p>
          <div className={styles.headerStats}>
            <span><strong>{totalCount}</strong> artículos</span>
            <span aria-hidden>·</span>
            <span>Actualizado <strong>{posts[0] ? relTime(posts[0].date) : "hoy"}</strong></span>
            <span aria-hidden>·</span>
            <span>6 categorías</span>
          </div>
        </div>
      </header>

      {/* Category bar */}
      <nav className={styles.catBar} aria-label="Categorías">
        <div className={styles.catBarInner}>
          {(["all","selecciones","analisis","datos","sedes","historia","plataforma"] as const).map((id) => {
            const active = cat === id;
            const color = CAT_COLORS[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => setCat(id)}
                className={`${styles.catBtn} ${active ? styles.catBtnActive : ""}`}
                style={
                  active
                    ? { background: `${color}1c`, borderColor: `${color}88`, color }
                    : undefined
                }
              >
                {CAT_LABELS[id]}
              </button>
            );
          })}
        </div>
      </nav>

      {/* MAIN GRID */}
      <main className={styles.main}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>No hay artículos en esta categoría aún.</div>
        ) : (
          <>
            {/* TOP STORY ROW */}
            <section className={styles.topRow}>
              {top && (
                <Link href={`/noticias/${top.slug}`} className={styles.topStory}>
                  {top.realImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={top.realImage} alt={top.imageCaption || top.title} className={styles.topImg} />
                  )}
                  <div className={styles.topOverlay} />
                  <div className={styles.topBody}>
                    <div className={styles.topMeta}>
                      <CatPill cat={top.cat} big />
                      <FlagsRow flags={top.flags} />
                      <span className={styles.timeRel}>{relTime(top.date)}</span>
                    </div>
                    <h2 className={styles.topTitle}>{top.title}</h2>
                    <p className={styles.topExcerpt}>{top.excerpt}</p>
                    <span className={styles.topCta}>
                      Leer artículo
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M5 12h14" /><path d="M13 6l6 6-6 6" />
                      </svg>
                    </span>
                  </div>
                </Link>
              )}

              <div className={styles.topSecondary}>
                {secondary.map((p) => (
                  <Link key={p.id} href={`/noticias/${p.slug}`} className={styles.secCard}>
                    {p.realImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.realImage} alt="" className={styles.secImg} />
                    )}
                    <div className={styles.secBody}>
                      <CatPill cat={p.cat} />
                      <h3>{p.title}</h3>
                      <span className={styles.secMeta}>
                        {fmtDate(p.date)} · {p.readTime} min
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* CONTENT + SIDEBAR */}
            <section className={styles.bottomRow}>
              <div className={styles.listColumn}>
                <h2 className={styles.sectionH}>Más artículos</h2>
                {list.length === 0 ? (
                  <p className={styles.muted}>Pronto añadiremos más historias en esta categoría.</p>
                ) : (
                  <ul className={styles.articleList}>
                    {list.map((p) => (
                      <li key={p.id}>
                        <Link href={`/noticias/${p.slug}`} className={styles.listItem}>
                          {p.realImage && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.realImage} alt="" className={styles.listThumb} />
                          )}
                          <div className={styles.listBody}>
                            <div className={styles.listMeta}>
                              <CatPill cat={p.cat} />
                              <FlagsRow flags={p.flags} max={2} />
                              <span className={styles.listDate}>{fmtDate(p.date)}</span>
                            </div>
                            <h3>{p.title}</h3>
                            <p>{p.excerpt}</p>
                            <span className={styles.listRead}>{p.readTime} min de lectura</span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* SIDEBAR */}
              <aside className={styles.sidebar}>
                <div className={styles.sideBlock}>
                  <h3>Lo más leído</h3>
                  <ol>
                    {trending.map((p, i) => (
                      <li key={p.id}>
                        <span className={styles.rank}>{i + 1}</span>
                        <Link href={`/noticias/${p.slug}`}>
                          <strong>{p.title}</strong>
                          <span>{CAT_LABELS[p.cat]} · {p.readTime} min</span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className={`${styles.sideBlock} ${styles.sidePromo}`}>
                  <small>JUEGA GRATIS</small>
                  <h3>Predicciones del Mundial 2026</h3>
                  <p>Compite con creadores y amigos. Lista de espera abierta.</p>
                  <Link href="/registro">Pre-regístrate →</Link>
                </div>

                <div className={styles.sideBlock}>
                  <h3>Síguenos</h3>
                  <div className={styles.sideSocial}>
                    <a href="https://www.instagram.com/zona.mundial" target="_blank" rel="noopener noreferrer">Instagram</a>
                    <a href="https://www.facebook.com/share/1Ay733gLRU/" target="_blank" rel="noopener noreferrer">Facebook</a>
                    <a href="https://www.tiktok.com/@zonamundialfutbol" target="_blank" rel="noopener noreferrer">TikTok</a>
                    <a href="/noticias/rss.xml">RSS</a>
                  </div>
                </div>
              </aside>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
