"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { CROMOS, CATEGORIES, RARITIES, TOTAL_CROMOS, type Cromo } from "@/lib/cromos/catalog";
import { useLanguage } from "@/i18n/LanguageContext";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/* ─────────── Paleta ─────────── */
const NAVY = "#0a0906";
const NAVY_LIGHT = "#14110a";
const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const TXT = "#eef2fb";
const TXT_MUT = "#a69a82";
const LINE = "rgba(255,255,255,0.08)";

/* ─────────── Iconos inline ─────────── */
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
);
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const IconGrid = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const IconSparkle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z" />
  </svg>
);
const IconChevronLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6" />
  </svg>
);
const IconChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

/* ─────────── Helpers ─────────── */
function rarityGlow(rarity: string): string {
  if (rarity === "Legendario") return "rgba(245,158,11,0.5)";
  if (rarity === "Oro") return "rgba(234,179,8,0.4)";
  return "rgba(148,163,184,0.3)";
}
function rarityBorder(rarity: string): string {
  if (rarity === "Legendario") return "rgba(245,158,11,0.6)";
  if (rarity === "Oro") return "rgba(234,179,8,0.5)";
  return "rgba(148,163,184,0.35)";
}
function rarityText(rarity: string): string {
  if (rarity === "Legendario") return "#f59e0b";
  if (rarity === "Oro") return "#eab308";
  return "#a69a82";
}

/* ─────────── StatPill ─────────── */
function StatPill({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "8px 14px", borderRadius: 999,
      background: "rgba(255,255,255,0.04)", border: `1px solid ${LINE}`,
    }}>
      <span style={{ fontSize: 13, fontWeight: 800, color: color || GOLD2 }}>{value}</span>
      <span style={{ fontSize: 12, color: TXT_MUT }}>{label}</span>
    </div>
  );
}

/* ─────────── CromoCard ─────────── */
function CromoCard({ cromo, onClick }: { cromo: Cromo; onClick: (c: Cromo) => void }) {
  const [loaded, setLoaded] = useState(false);
  const glow = rarityGlow(cromo.rarity);
  const border = rarityBorder(cromo.rarity);
  const text = rarityText(cromo.rarity);

  return (
    <button
      onClick={() => onClick(cromo)}
      className="cromo-card"
      style={{
        position: "relative",
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        width: "100%",
        textAlign: "left",
        borderRadius: 16,
        overflow: "hidden",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-6px) scale(1.02)";
        (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 40px rgba(0,0,0,0.4), 0 0 30px ${glow}`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "none";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Glow de rareza detrás */}
      <div style={{
        position: "absolute", inset: -2, borderRadius: 18,
        background: `radial-gradient(ellipse at center, ${glow}, transparent 70%)`,
        opacity: 0.6, zIndex: 0, pointerEvents: "none",
      }} />
      {/* Marco/borde por rareza */}
      <div style={{
        position: "relative", zIndex: 1,
        borderRadius: 16,
        border: `2px solid ${border}`,
        background: NAVY_LIGHT,
        overflow: "hidden",
        padding: 3,
      }}>
        <div style={{
          position: "relative",
          borderRadius: 12,
          overflow: "hidden",
          background: "#000000",
          aspectRatio: "3/4",
        }}>
          {!loaded && (
            <div style={{
              position: "absolute", inset: 0,
              background: `linear-gradient(110deg, ${NAVY_LIGHT} 30%, #14110a 50%, ${NAVY_LIGHT} 70%)`,
              backgroundSize: "200% 100%",
              animation: "cromo-shimmer 1.4s ease infinite",
            }} />
          )}
          <img
            src={cromo.path}
            alt={cromo.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              display: "block",
              opacity: loaded ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
          />
          {/* Overlay sutil en la parte inferior */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            height: "35%",
            background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
            pointerEvents: "none",
          }} />
          {/* Info superpuesta */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "10px 12px",
            zIndex: 2,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 800, letterSpacing: 1,
              textTransform: "uppercase", color: text,
              textShadow: "0 1px 3px rgba(0,0,0,0.8)",
            }}>
              {cromo.rarity}
            </div>
            <div style={{
              fontSize: 13, fontWeight: 700, color: TXT,
              marginTop: 2,
              textShadow: "0 1px 3px rgba(0,0,0,0.8)",
            }}>
              #{String(cromo.number).padStart(3, "0")}
            </div>
          </div>
          {/* Brillo esquina para legendario/oro */}
          {(cromo.rarity === "Legendario" || cromo.rarity === "Oro") && (
            <div style={{
              position: "absolute", top: 6, right: 6,
              width: 8, height: 8, borderRadius: "50%",
              background: text,
              boxShadow: `0 0 12px ${text}, 0 0 24px ${glow}`,
              zIndex: 2,
            }} />
          )}
        </div>
      </div>
    </button>
  );
}

/* ─────────── Lightbox / Modal ─────────── */
function Lightbox({ cromo, onClose, onPrev, onNext, hasPrev, hasNext }: {
  cromo: Cromo; onClose: () => void;
  onPrev: () => void; onNext: () => void;
  hasPrev: boolean; hasNext: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  const glow = rarityGlow(cromo.rarity);
  const text = rarityText(cromo.rarity);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
        animation: "cromo-fade-in 0.2s ease",
      }}
    >
      {/* Botón cerrar */}
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 20, right: 20,
          width: 44, height: 44, borderRadius: "50%",
          background: "rgba(255,255,255,0.08)", border: `1px solid ${LINE}`,
          color: TXT, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 10,
        }}
      >
        <IconX />
      </button>

      {/* Navegación prev */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          style={{
            position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
            width: 48, height: 48, borderRadius: "50%",
            background: "rgba(255,255,255,0.08)", border: `1px solid ${LINE}`,
            color: TXT, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 10,
          }}
        >
          <IconChevronLeft />
        </button>
      )}

      {/* Navegación next */}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          style={{
            position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
            width: 48, height: 48, borderRadius: "50%",
            background: "rgba(255,255,255,0.08)", border: `1px solid ${LINE}`,
            color: TXT, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 10,
          }}
        >
          <IconChevronRight />
        </button>
      )}

      {/* Contenido */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          maxWidth: 520, width: "100%",
          animation: "cromo-scale-in 0.25s ease",
        }}
      >
        <div style={{
          position: "relative",
          borderRadius: 20,
          padding: 4,
          background: `linear-gradient(135deg, ${glow.replace("0.5)", "0.6)")}, ${glow.replace("0.5)", "0.2)")})`,
          boxShadow: `0 0 60px ${glow.replace("0.5)", "0.25)")}`,
        }}>
          <div style={{
            borderRadius: 16, overflow: "hidden",
            background: "#000000",
          }}>
            <img
              src={cromo.path}
              alt={cromo.name}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>
        </div>

        {/* Info del cromo */}
        <div style={{
          marginTop: 20, textAlign: "center",
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 16px", borderRadius: 999,
            background: `${text}15`, border: `1px solid ${text}40`,
            color: text, fontSize: 12, fontWeight: 800,
            letterSpacing: 1.5, textTransform: "uppercase",
          }}>
            {cromo.rarity === "Legendario" && <IconSparkle />}
            {cromo.rarity}
          </div>
          <h2 style={{
            fontSize: "clamp(24px,5vw,36px)", fontWeight: 900,
            color: TXT, margin: "12px 0 4px",
          }}>
            {cromo.name}
          </h2>
          <p style={{ color: TXT_MUT, fontSize: 15, margin: 0 }}>
            {CATEGORIES.find(c => c.key === cromo.category)?.label.es}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════ PÁGINA ════════════════════════════ */
export default function CromosPage() {
  const { locale } = useLanguage();
  const isES = locale === "es";

  const t = {
    title: isES ? "Colección de Cromos" : "Sticker Collection",
    subtitle: isES
      ? "150 cromos únicos del Mundial 2026. Explora por categoría, rareza o número."
      : "150 unique World Cup 2026 stickers. Explore by category, rarity or number.",
    searchPlaceholder: isES ? "Buscar por número o nombre..." : "Search by number or name...",
    allCategories: isES ? "Todas las categorías" : "All categories",
    allRarities: isES ? "Todas las rarezas" : "All rarities",
    total: isES ? "Total" : "Total",
    legendarios: isES ? "Legendarios" : "Legendary",
    oro: isES ? "Oro" : "Gold",
    plata: isES ? "Plata" : "Silver",
    showing: isES ? "Mostrando" : "Showing",
    of: isES ? "de" : "of",
    noResults: isES ? "No se encontraron cromos" : "No stickers found",
    tryAnother: isES ? "Prueba con otro filtro o búsqueda" : "Try a different filter or search",
    close: isES ? "Cerrar" : "Close",
    myAlbum: isES ? "Mi álbum" : "My album",
  };

  /* ── Auth ── */
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    const sb = createSupabaseBrowserClient();
    sb.auth.getUser().then(({ data }) => setAuthed(!!data.user));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => setAuthed(!!session?.user));
    return () => sub.subscription.unsubscribe();
  }, []);

  /* ── Estado de filtros ── */
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");
  const [activeRarity, setActiveRarity] = useState<string | "all">("all");
  const [lightboxCromo, setLightboxCromo] = useState<Cromo | null>(null);

  /* ── Filtrado ── */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CROMOS.filter((c) => {
      if (activeCategory !== "all" && c.category !== activeCategory) return false;
      if (activeRarity !== "all" && c.rarity !== activeRarity) return false;
      if (q) {
        const numMatch = String(c.number).includes(q);
        const nameMatch = c.name.toLowerCase().includes(q);
        const rarityMatch = c.rarity.toLowerCase().includes(q);
        return numMatch || nameMatch || rarityMatch;
      }
      return true;
    });
  }, [search, activeCategory, activeRarity]);

  /* ── Conteos ── */
  const counts = useMemo(() => ({
    legendario: CROMOS.filter(c => c.rarity === "Legendario").length,
    oro: CROMOS.filter(c => c.rarity === "Oro").length,
    plata: CROMOS.filter(c => c.rarity === "Plata").length,
  }), []);

  /* ── Lightbox nav ── */
  const lightboxIndex = useMemo(() =>
    lightboxCromo ? filtered.findIndex(c => c.id === lightboxCromo.id) : -1,
  [lightboxCromo, filtered]);

  const goPrev = useCallback(() => {
    if (lightboxIndex > 0) setLightboxCromo(filtered[lightboxIndex - 1]);
  }, [lightboxIndex, filtered]);

  const goNext = useCallback(() => {
    if (lightboxIndex < filtered.length - 1) setLightboxCromo(filtered[lightboxIndex + 1]);
  }, [lightboxIndex, filtered]);

  /* ── Scroll reveal ── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-cromo-reveal]:not(.cromo-in)"));
    if (!els.length) return;
    els.forEach((el) => el.classList.add("cromo-reveal"));
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("cromo-in"); io.unobserve(en.target); }
      }),
      { threshold: 0.05, rootMargin: "0px 0px -4% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [filtered]);

  return (
    <>
      <Head>
        <title>{isES ? "Colección de Cromos | ZonaMundial" : "Sticker Collection | ZonaMundial"}</title>
        <meta name="description" content={isES
          ? "Explora los 150 cromos del Mundial 2026 en ZonaMundial. Partidos, ediciones especiales, grupos y sedes."
          : "Explore all 150 World Cup 2026 stickers on ZonaMundial. Matches, special editions, groups and venues."
        } />
      </Head>

      <div style={{
        minHeight: "100vh",
        backgroundColor: NAVY,
        backgroundImage: `
          radial-gradient(1200px 600px at 50% -10%, #1b160d 0%, ${NAVY} 55%),
          radial-gradient(circle at 1px 1px, rgba(255,255,255,0.022) 1px, transparent 1.6px)
        `,
        backgroundSize: "100% 100%, 22px 22px",
        color: TXT,
        fontFamily: "'Outfit',sans-serif",
        overflowX: "hidden",
      }}>
        {/* Filo dorado superior */}
        <span aria-hidden style={{
          position: "fixed", top: 0, left: 0, right: 0, height: 2, zIndex: 60,
          background: `linear-gradient(90deg, transparent, ${GOLD}aa 30%, ${GOLD2} 50%, ${GOLD}aa 70%, transparent)`,
          pointerEvents: "none",
        }} />

        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

        <style>{`
          @keyframes cromo-shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          @keyframes cromo-fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes cromo-scale-in {
            from { opacity: 0; transform: scale(0.92); }
            to { opacity: 1; transform: scale(1); }
          }
          .cromo-reveal {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.5s ease, transform 0.5s ease;
          }
          .cromo-in {
            opacity: 1;
            transform: none;
          }
          .cromo-card:hover { z-index: 2; }
          @media (max-width: 640px) {
            .cromo-card:active {
              transform: translateY(-3px) scale(1.01) !important;
            }
          }
        `}</style>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "24px 16px 100px" }}>

          {/* ═══ HEADER ═══ */}
          <header style={{ textAlign: "center", marginBottom: 32, position: "relative" }}>
            <div style={{
              position: "absolute", inset: 0,
              background: `radial-gradient(ellipse at center, ${GOLD}12 0%, transparent 60%)`,
              pointerEvents: "none",
            }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 999,
                background: `${GOLD}12`, border: `1px solid ${GOLD}40`,
                color: GOLD, fontSize: 11, fontWeight: 800,
                letterSpacing: 2, textTransform: "uppercase",
                marginBottom: 16,
              }}>
                <IconSparkle />
                {isES ? "Mundial 2026" : "World Cup 2026"}
              </span>
              <h1 style={{
                fontSize: "clamp(32px,6vw,52px)", fontWeight: 900,
                lineHeight: 1.1, margin: "0 0 12px",
              }}>
                {isES ? "Colección de " : "Sticker "}
                <span style={{
                  background: `linear-gradient(110deg, ${GOLD}, ${GOLD2}, #fff7dd, ${GOLD2}, ${GOLD})`,
                  backgroundSize: "220% 100%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                  {isES ? "Cromos" : "Collection"}
                </span>
              </h1>
              <p style={{ color: TXT_MUT, fontSize: 17, maxWidth: 520, margin: "0 auto", lineHeight: 1.6 }}>
                {t.subtitle}
              </p>
              {authed && (
                <Link
                  href="/app/album/mi-coleccion"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    marginTop: 20, padding: "12px 24px", borderRadius: 14,
                    background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
                    color: NAVY, textDecoration: "none",
                    fontSize: 14, fontWeight: 800,
                    boxShadow: `0 8px 24px ${GOLD}30`,
                  }}
                >
                  {t.myAlbum} →
                </Link>
              )}
            </div>
          </header>

          {/* ═══ STATS PILLS ═══ */}
          <div style={{
            display: "flex", flexWrap: "wrap", justifyContent: "center",
            gap: 10, marginBottom: 28,
          }}>
            <StatPill label={t.total} value={TOTAL_CROMOS} />
            <StatPill label={t.legendarios} value={counts.legendario} color="#f59e0b" />
            <StatPill label={t.oro} value={counts.oro} color="#eab308" />
            <StatPill label={t.plata} value={counts.plata} color="#a69a82" />
          </div>

          {/* ═══ FILTROS ═══ */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${LINE}`,
            borderRadius: 20,
            padding: "16px",
            marginBottom: 28,
            backdropFilter: "blur(8px)",
          }}>
            {/* Búsqueda */}
            <div style={{ position: "relative", marginBottom: 14 }}>
              <span style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                color: TXT_MUT, pointerEvents: "none",
              }}>
                <IconSearch />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                style={{
                  width: "100%",
                  padding: "12px 42px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${LINE}`,
                  color: TXT,
                  fontSize: 15,
                  fontFamily: "inherit",
                  outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = `${GOLD}60`;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${GOLD}15`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = LINE;
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{
                    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", color: TXT_MUT,
                    cursor: "pointer", padding: 4,
                  }}
                >
                  <IconX />
                </button>
              )}
            </div>

            {/* Filtros de categoría */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
              <FilterChip
                active={activeCategory === "all"}
                onClick={() => setActiveCategory("all")}
                label={t.allCategories}
                icon={<IconGrid />}
              />
              {CATEGORIES.map((cat) => (
                <FilterChip
                  key={cat.key}
                  active={activeCategory === cat.key}
                  onClick={() => setActiveCategory(activeCategory === cat.key ? "all" : cat.key)}
                  label={isES ? cat.label.es : cat.label.en}
                  count={cat.count}
                />
              ))}
            </div>

            {/* Filtros de rareza */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <FilterChip
                active={activeRarity === "all"}
                onClick={() => setActiveRarity("all")}
                label={t.allRarities}
              />
              {RARITIES.map((r) => (
                <FilterChip
                  key={r.key}
                  active={activeRarity === r.key}
                  onClick={() => setActiveRarity(activeRarity === r.key ? "all" : r.key)}
                  label={isES ? r.label.es : r.label.en}
                  count={r.count}
                  color={r.color}
                />
              ))}
            </div>
          </div>

          {/* ═══ RESULT COUNT ═══ */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 20,
          }}>
            <span style={{ color: TXT_MUT, fontSize: 14 }}>
              {t.showing} <strong style={{ color: TXT }}>{filtered.length}</strong> {t.of} {TOTAL_CROMOS}
            </span>
            {(activeCategory !== "all" || activeRarity !== "all" || search) && (
              <button
                onClick={() => { setActiveCategory("all"); setActiveRarity("all"); setSearch(""); }}
                style={{
                  background: "none", border: "none", color: GOLD,
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {isES ? "Limpiar filtros" : "Clear filters"}
              </button>
            )}
          </div>

          {/* ═══ GRID ═══ */}
          {filtered.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "80px 20px",
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${LINE}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
                color: TXT_MUT,
              }}>
                <IconSearch />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: TXT, margin: "0 0 8px" }}>
                {t.noResults}
              </h3>
              <p style={{ color: TXT_MUT, fontSize: 15, margin: 0 }}>{t.tryAnother}</p>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: "16px",
            }}>
              {filtered.map((cromo, idx) => (
                <div
                  key={cromo.id}
                  data-cromo-reveal
                  style={{ transitionDelay: `${Math.min(idx % 12, 11) * 30}ms` }}
                >
                  <CromoCard cromo={cromo} onClick={setLightboxCromo} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ LIGHTBOX ═══ */}
      {lightboxCromo && (
        <Lightbox
          cromo={lightboxCromo}
          onClose={() => setLightboxCromo(null)}
          onPrev={goPrev}
          onNext={goNext}
          hasPrev={lightboxIndex > 0}
          hasNext={lightboxIndex < filtered.length - 1}
        />
      )}
    </>
  );
}

/* ─────────── FilterChip ─────────── */
function FilterChip({
  active, onClick, label, count, color, icon,
}: {
  active: boolean; onClick: () => void; label: string;
  count?: number; color?: string; icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "8px 14px", borderRadius: 999,
        fontSize: 13, fontWeight: active ? 800 : 600,
        fontFamily: "inherit", cursor: "pointer",
        border: active
          ? `1.5px solid ${color || GOLD}`
          : `1.5px solid ${LINE}`,
        background: active
          ? (color ? `${color}18` : `${GOLD}18`)
          : "rgba(255,255,255,0.03)",
        color: active ? (color || GOLD2) : TXT_MUT,
        transition: "all 0.2s ease",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = `${color || GOLD}50`;
          e.currentTarget.style.color = color || GOLD2;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = LINE;
          e.currentTarget.style.color = TXT_MUT;
        }
      }}
    >
      {icon}
      {label}
      {typeof count === "number" && (
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: active ? (color || GOLD2) : "#5a6885",
          marginLeft: 2,
        }}>
          {count}
        </span>
      )}
    </button>
  );
}
