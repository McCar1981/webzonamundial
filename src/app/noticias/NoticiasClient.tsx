"use client";

/**
 * Noticias hub — ESPN-style editorial layout con filtros y paginación.
 *
 * Mejoras MVP UX (mayo 2026):
 *  - Buscador por título / excerpt / tags / país
 *  - Paginación "Cargar más" (12 inicial, +12 cada click)
 *  - Filtro por selección (banderas clickables → filtra por país)
 *  - Click en tags individuales → filtra por tag
 *  - URL persistente: ?q=&cat=&pais=&tag= todas sincronizadas
 *  - Limpiar todos los filtros con un solo botón
 *
 * Top story (full-bleed) + 3 secondary cards + tag bar + dense article list
 * + sidebar with "Lo más leído" + app CTA.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Noticia } from "@/data/noticias";
import AdSidebar from "@/components/ads/AdSidebar";
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

const PAGE_SIZE = 12;

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

function CatPill({
  cat,
  big = false,
  onClick,
}: {
  cat: string;
  big?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const color = CAT_COLORS[cat] || "#c9a84c";
  const label = CAT_LABELS[cat] || cat;
  return (
    <span
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick(e as unknown as React.MouseEvent);
              }
            }
          : undefined
      }
      className={`${styles.catPill} ${big ? styles.catPillBig : ""}`}
      style={{
        background: `${color}1a`,
        borderColor: `${color}55`,
        color,
        cursor: onClick ? "pointer" : undefined,
      }}
    >
      {label}
    </span>
  );
}

function FlagsRow({
  flags,
  max = 3,
  onFlagClick,
}: {
  flags: string[];
  max?: number;
  onFlagClick?: (flag: string, e: React.MouseEvent) => void;
}) {
  if (!flags?.length) return null;
  return (
    <span className={styles.flagsRow}>
      {flags.slice(0, max).map((f) => (
        <img
          key={f}
          src={flagUrl(f)}
          alt={f}
          title={onFlagClick ? `Filtrar por ${f.toUpperCase()}` : undefined}
          onClick={
            onFlagClick
              ? (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onFlagClick(f, e);
                }
              : undefined
          }
          style={onFlagClick ? { cursor: "pointer" } : undefined}
        />
      ))}
    </span>
  );
}

/** Normaliza string para búsqueda case-insensitive y sin acentos. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function NoticiasClient({
  posts,
  totalCount,
}: {
  posts: Noticia[];
  totalCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estado leído desde URL al montar y sincronizado con cambios.
  const initialQ = searchParams.get("q") || "";
  const initialCat = searchParams.get("cat") || "all";
  const initialPais = searchParams.get("pais") || "";
  const initialTag = searchParams.get("tag") || "";

  const [q, setQ] = useState(initialQ);
  const [cat, setCat] = useState(initialCat);
  const [pais, setPais] = useState(initialPais);
  const [tag, setTag] = useState(initialTag);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const tickerRef = useRef<HTMLDivElement>(null);
  const tickerLaneRef = useRef<HTMLDivElement>(null);
  const [tickerDuration, setTickerDuration] = useState<number>(15);

  // Sync URL whenever any filter changes. Usa replace para no spammear history.
  useEffect(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (cat && cat !== "all") params.set("cat", cat);
    if (pais) params.set("pais", pais);
    if (tag) params.set("tag", tag);
    const next = params.toString();
    const current = searchParams.toString();
    if (next !== current) {
      router.replace(next ? `/noticias?${next}` : "/noticias", { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, cat, pais, tag]);

  // Reset visible al cambiar filtros para no quedar paginado al fondo.
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [q, cat, pais, tag]);

  // Ticker speed constant (~140px/s)
  useEffect(() => {
    const PX_PER_SEC = 140;
    const compute = () => {
      const lane = tickerLaneRef.current;
      if (!lane) return;
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

  // Aplica TODOS los filtros en orden: cat → pais → tag → q
  const filtered = useMemo(() => {
    let list = posts;
    if (cat !== "all") {
      list = list.filter((p) => p.cat === cat);
    }
    if (pais) {
      list = list.filter((p) => p.flags?.includes(pais));
    }
    if (tag) {
      const tagNorm = normalize(tag);
      list = list.filter((p) =>
        (p.tags || []).some((t) => normalize(t) === tagNorm),
      );
    }
    const qTrim = q.trim();
    if (qTrim.length >= 2) {
      const qn = normalize(qTrim);
      list = list.filter((p) => {
        const haystack = normalize(
          `${p.title} ${p.excerpt} ${(p.tags || []).join(" ")}`,
        );
        return haystack.includes(qn);
      });
    }
    return list;
  }, [posts, cat, pais, tag, q]);

  // Paginación: solo el primer 'visible' artículos se renderizan.
  // Pero el top story + secundarias siempre vienen del filtered.
  const top = filtered[0];
  const secondary = filtered.slice(1, 4);
  const listAll = filtered.slice(4);
  const list = listAll.slice(0, visible);
  const hasMore = listAll.length > visible;

  const trending = useMemo(() => posts.slice(0, 5), [posts]);
  const tickerItems = useMemo(() => posts.slice(0, 6), [posts]);

  const hasActiveFilters =
    q.trim().length > 0 || cat !== "all" || pais !== "" || tag !== "";

  // Lista única de banderas presentes en los posts actuales (para sugerir
  // filtros rápidos de país más comunes).
  const topFlags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of posts) {
      for (const f of p.flags || []) {
        counts.set(f, (counts.get(f) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([flag]) => flag);
  }, [posts]);

  const clearAll = useCallback(() => {
    setQ("");
    setCat("all");
    setPais("");
    setTag("");
  }, []);

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
            {/* Usa ingestedAt (ISO timestamp real de entrada al sistema)
                cuando existe; fallback a date (YYYY-MM-DD del medio). Esto
                evita el bug de "Hace 3d" cuando GNews trunca la fecha al
                día anterior. */}
            <span>Actualizado <strong>{posts[0] ? relTime(posts[0].ingestedAt || posts[0].date) : "hoy"}</strong></span>
            <span aria-hidden>·</span>
            <span>6 categorías</span>
          </div>
        </div>
      </header>

      {/* Category + Search bar */}
      <nav className={styles.catBar} aria-label="Filtros y búsqueda">
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

          {/* Separador visual y buscador */}
          <div className={styles.catBarSpacer} />

          <div className={styles.searchWrap}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className={styles.searchIcon}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar título, jugador, equipo, tag…"
              className={styles.searchInput}
              aria-label="Buscar noticias"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className={styles.searchClear}
                aria-label="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Active filters chips + flag suggestions */}
      {(hasActiveFilters || topFlags.length > 0) && (
        <div className={styles.filterBar}>
          <div className={styles.filterBarInner}>
            {hasActiveFilters && (
              <>
                <span className={styles.filterBarLabel}>Filtros activos:</span>
                {q.trim() && (
                  <span className={styles.filterChip}>
                    🔍 “{q.trim()}”
                    <button onClick={() => setQ("")} aria-label="Quitar búsqueda">✕</button>
                  </span>
                )}
                {cat !== "all" && (
                  <span className={styles.filterChip}>
                    {CAT_LABELS[cat] || cat}
                    <button onClick={() => setCat("all")} aria-label="Quitar categoría">✕</button>
                  </span>
                )}
                {pais && (
                  <span className={styles.filterChip}>
                    <img src={flagUrl(pais)} alt="" width={16} height={12} style={{ borderRadius: 2, verticalAlign: "middle", marginRight: 6 }} />
                    {pais.toUpperCase()}
                    <button onClick={() => setPais("")} aria-label="Quitar país">✕</button>
                  </span>
                )}
                {tag && (
                  <span className={styles.filterChip}>
                    #{tag}
                    <button onClick={() => setTag("")} aria-label="Quitar tag">✕</button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={clearAll}
                  className={styles.filterClearAll}
                >
                  Limpiar todo
                </button>
              </>
            )}
            {!hasActiveFilters && topFlags.length > 0 && (
              <>
                <span className={styles.filterBarLabel}>Selecciones populares:</span>
                {topFlags.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setPais(f)}
                    className={styles.flagChip}
                    aria-label={`Filtrar por ${f.toUpperCase()}`}
                  >
                    <img src={flagUrl(f)} alt="" />
                    <span>{f.toUpperCase()}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* MAIN GRID */}
      <main className={styles.main}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <p>No encontramos artículos con esos filtros.</p>
            {hasActiveFilters && (
              <button type="button" onClick={clearAll} className={styles.emptyClear}>
                Limpiar filtros y ver todo
              </button>
            )}
          </div>
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
                      <CatPill cat={top.cat} big onClick={(e) => { e.preventDefault(); setCat(top.cat); }} />
                      <FlagsRow
                        flags={top.flags}
                        onFlagClick={(f) => setPais(f)}
                      />
                      <span className={styles.timeRel}>{relTime(top.ingestedAt || top.date)}</span>
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
                      <CatPill cat={p.cat} onClick={(e) => { e.preventDefault(); setCat(p.cat); }} />
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
                <div className={styles.listHeader}>
                  <h2 className={styles.sectionH}>
                    Más artículos
                    <span className={styles.listCount}>{listAll.length}</span>
                  </h2>
                </div>
                {list.length === 0 ? (
                  <p className={styles.muted}>Pronto añadiremos más historias en esta categoría.</p>
                ) : (
                  <>
                    <ul className={styles.articleList}>
                      {list.map((p) => (
                        <li key={p.id}>
                          <Link href={`/noticias/${p.slug}`} className={styles.listItem}>
                            {p.realImage && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.realImage} alt="" className={styles.listThumb} loading="lazy" />
                            )}
                            <div className={styles.listBody}>
                              <div className={styles.listMeta}>
                                <CatPill cat={p.cat} onClick={(e) => { e.preventDefault(); setCat(p.cat); }} />
                                <FlagsRow flags={p.flags} max={2} onFlagClick={(f) => setPais(f)} />
                                <span className={styles.listDate}>{fmtDate(p.date)}</span>
                              </div>
                              <h3>{p.title}</h3>
                              <p>{p.excerpt}</p>
                              <div className={styles.listFooter}>
                                <span className={styles.listRead}>{p.readTime} min de lectura</span>
                                {p.tags && p.tags.length > 0 && (
                                  <span className={styles.listTags}>
                                    {p.tags.slice(0, 3).map((t) => (
                                      <button
                                        key={t}
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setTag(t);
                                        }}
                                        className={styles.tagBtn}
                                      >
                                        #{t}
                                      </button>
                                    ))}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {hasMore && (
                      <div className={styles.loadMoreWrap}>
                        <button
                          type="button"
                          onClick={() => setVisible((v) => v + PAGE_SIZE)}
                          className={styles.loadMoreBtn}
                        >
                          Cargar {Math.min(PAGE_SIZE, listAll.length - visible)} más
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </button>
                        <p className={styles.loadMoreMeta}>
                          Mostrando {Math.min(visible, listAll.length)} de {listAll.length} resultados
                        </p>
                      </div>
                    )}
                  </>
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

                {/* AdSense: sidebar en columna lateral. */}
                <AdSidebar />

                <div className={`${styles.sideBlock} ${styles.sidePromo}`}>
                  <small>JUEGA GRATIS</small>
                  <h3>Predicciones del Mundial 2026</h3>
                  <p>Compite con creadores y amigos. Juega gratis ahora.</p>
                  <Link href="/registro">Regístrate gratis →</Link>
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
