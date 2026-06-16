"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CROMOS, TOTAL_CROMOS, CATEGORIES, type Cromo } from "@/lib/cromos/catalog";
import { ALBUM_ACHIEVEMENTS, type AchievementView } from "@/lib/cromos/achievements";
import { useLanguage } from "@/i18n/LanguageContext";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  IconArrowLeft,
} from "./icons";
import {
  type Collection,
  type TradeOffer,
  type TabKey,
  AlbumHeader,
  RarityStats,
  CollectionMilestones,
  OpenPackCard,
  FilterTabs,
  FilterBar,
  AlbumSections,
  AchievementsSection,
  TradesSection,
  EmptyAlbumView,
  PackResultModal,
  PackOpeningAnimation,
  CelebrationOverlay,
  CromoDetailModal,
  CreateTradeModal,
} from "./components";
import { useRevealOnScroll } from "./useRevealOnScroll";
import styles from "./page.module.css";

const TABS: TabKey[] = ["all", "owned", "missing"];

export default function MiColeccionPage() {
  const { locale } = useLanguage();
  const router = useRouter();
  const isES = locale === "es";

  const [authed, setAuthed] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [packResult, setPackResult] = useState<Cromo[] | null>(null);
  const [showPackAnimation, setShowPackAnimation] = useState(false);
  const [fx, setFx] = useState(true);
  const [celebration, setCelebration] = useState<{ title: string; subtitle?: string } | null>(null);
  const prevCompleteRef = useRef<Set<string>>(new Set());
  const justOpenedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [rarityFilter, setRarityFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedCromo, setSelectedCromo] = useState<Cromo | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [packStatus, setPackStatus] = useState({ canOpen: true, nextPackAt: null as string | null, secondsLeft: 0 });
  const [achievements, setAchievements] = useState<AchievementView[]>(
    ALBUM_ACHIEVEMENTS.map((a) => ({ ...a, unlocked: false, unlockedAt: null })),
  );
  const [offers, setOffers] = useState<TradeOffer[]>([]);
  const [showCreateTrade, setShowCreateTrade] = useState(false);
  const closePackAnimation = useCallback(() => setShowPackAnimation(false), []);

  useRevealOnScroll([loading, collection, activeTab, achievements, offers]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const colRes = await fetch("/api/cromos/mine");
      if (colRes.status === 401) {
        setAuthed(false);
        router.replace("/login?next=/app/album/mi-coleccion");
        return;
      }
      if (!colRes.ok) throw new Error(`Collection fetch failed: ${colRes.status}`);

      const colData = await colRes.json();
      setCollection(colData);
      setFavoriteIds(colData.favoriteIds ?? []);

      try {
        const packRes = await fetch("/api/cromos/pack-status");
        if (packRes.ok) {
          const packData = await packRes.json();
          setPackStatus({
            canOpen: packData.canOpen ?? true,
            nextPackAt: packData.nextPackAt ?? null,
            secondsLeft: packData.secondsLeft ?? 0,
          });
        }
      } catch {
        setPackStatus({ canOpen: true, nextPackAt: null, secondsLeft: 0 });
      }

      try {
        const achRes = await fetch("/api/cromos/achievements");
        if (achRes.ok) {
          const achData = await achRes.json();
          setAchievements(achData.achievements);
        }
      } catch {
        // silently fail, achievements are optional
      }

      try {
        const tradeRes = await fetch("/api/cromos/trades");
        if (tradeRes.ok) {
          const tradeData = await tradeRes.json();
          setOffers(tradeData.offers ?? []);
        }
      } catch {
        // silently fail, trades are optional
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : (isES ? "Error cargando tu colección" : "Error loading your collection");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isES, router]);

  useEffect(() => {
    let mounted = true;
    const sb = createSupabaseBrowserClient();
    sb.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const user = data.user;
      setUserId(user?.id ?? null);
      if (!user) {
        setAuthed(false);
        router.replace("/login?next=/app/album/mi-coleccion");
      } else {
        setAuthed(true);
        load();
      }
    });
    return () => { mounted = false; };
  }, [router, load]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (packStatus.canOpen) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setPackStatus((prev) => {
        const next = Math.max(0, prev.secondsLeft - 1);
        return { ...prev, secondsLeft: next, canOpen: next <= 0 };
      });
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [packStatus.canOpen]);

  // Efectos cinematográficos: ON por defecto, salvo "reducir movimiento" del sistema
  // (que se puede forzar con el interruptor). Persistido en localStorage.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("album_fx");
      if (saved === "off") setFx(false);
      else if (saved === "on") setFx(true);
      else setFx(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch { /* noop */ }
  }, []);

  const toggleFx = () => setFx((v) => {
    const nv = !v;
    try { localStorage.setItem("album_fx", nv ? "on" : "off"); } catch { /* noop */ }
    if (!nv) document.documentElement.style.setProperty("--album-parallax", "0px");
    return nv;
  });

  // Parallax del fondo + holo de las cartas siguiendo el cursor (solo con fx).
  useEffect(() => {
    if (!fx) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--album-parallax", `${window.scrollY * 0.16}px`);
        raf = 0;
      });
    };
    const sel = `.${styles.cromoOwned}`;
    const onMove = (e: PointerEvent) => {
      const el = (e.target as HTMLElement)?.closest?.(sel) as HTMLElement | null;
      if (!el) return;
      const b = el.getBoundingClientRect();
      const px = (e.clientX - b.left) / b.width;
      const py = (e.clientY - b.top) / b.height;
      el.style.setProperty("--hx", `${px * 100}%`);
      el.style.setProperty("--hy", `${py * 100}%`);
      el.style.transform = `perspective(700px) rotateX(${(0.5 - py) * 7}deg) rotateY(${(px - 0.5) * 7}deg) scale(1.04) translateY(-6px)`;
      el.dataset.tilt = "1";
    };
    const onOut = (e: PointerEvent) => {
      const el = (e.target as HTMLElement)?.closest?.(sel) as HTMLElement | null;
      if (el && el.dataset.tilt) { el.style.transform = ""; delete el.dataset.tilt; }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerout", onOut);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onOut);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [fx]);

  // Celebración al completar una página/sección o el álbum tras abrir un sobre.
  useEffect(() => {
    if (!collection) return;
    const nowComplete = new Set<string>();
    for (const [k, v] of Object.entries(collection.byCategory)) {
      if (v.total > 0 && v.collected === v.total) nowComplete.add(k);
    }
    const albumComplete = collection.total > 0 && collection.collected >= collection.total;
    if (justOpenedRef.current && fx) {
      justOpenedRef.current = false;
      if (albumComplete && !prevCompleteRef.current.has("__album__")) {
        setCelebration({ title: isES ? "ÁLBUM" : "ALBUM", subtitle: isES ? "¡Álbum completo!" : "Album complete!" });
      } else {
        const newly = [...nowComplete].find((k) => !prevCompleteRef.current.has(k));
        if (newly) {
          const cat = CATEGORIES.find((c) => c.key === newly);
          const label = cat ? (isES ? cat.label.es : cat.label.en) : newly;
          setCelebration({ title: isES ? "COMPLETA" : "DONE", subtitle: isES ? `¡Página de ${label} completa!` : `${label} page complete!` });
        }
      }
    } else {
      justOpenedRef.current = false;
    }
    if (albumComplete) nowComplete.add("__album__");
    prevCompleteRef.current = nowComplete;
  }, [collection, fx, isES]);

  const open = async () => {
    if (opening || !packStatus.canOpen) return;
    setOpening(true);
    setError(null);
    try {
      const res = await fetch("/api/cromos/open-pack", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setPackStatus({
          canOpen: false,
          nextPackAt: data.nextPackAt ?? null,
          secondsLeft: data.secondsLeft ?? 0,
        });
        setError(isES ? "Espera antes de abrir otro sobre" : "Wait before opening another pack");
      } else {
        if (!Array.isArray(data.cromos) || data.cromos.length === 0) {
          setError(isES ? "Error: cromos inválidos" : "Error: invalid cromos");
          setOpening(false);
          return;
        }
        setShowPackAnimation(true);
        setPackResult(data.cromos);
        justOpenedRef.current = true;
        const nextAt = data.nextPackAt ? new Date(data.nextPackAt).getTime() : 0;
        const secondsLeft = nextAt > 0 ? Math.max(0, Math.ceil((nextAt - Date.now()) / 1000)) : 14400;
        setPackStatus({
          canOpen: false,
          nextPackAt: data.nextPackAt ?? null,
          secondsLeft,
        });
        setTimeout(() => load(), 2400);
      }
    } catch {
      setError(isES ? "No se pudo abrir el sobre" : "Could not open pack");
    } finally {
      setOpening(false);
    }
  };

  const visibleCromos = (() => {
    const owned = new Set(collection?.ownedIds ?? []);
    const q = searchQuery.trim().toLowerCase();
    return CROMOS.filter((c) => {
      if (activeTab === "owned" && !owned.has(c.id)) return false;
      if (activeTab === "missing" && owned.has(c.id)) return false;
      if (rarityFilter.length > 0 && !rarityFilter.includes(c.rarity)) return false;
      if (categoryFilter && c.category !== categoryFilter) return false;
      if (q) {
        const byName = c.name.toLowerCase().includes(q);
        const byNumber = String(c.number).includes(q);
        if (!byName && !byNumber) return false;
      }
      return true;
    });
  })();

  const toggleFavorite = async (cromoId: number) => {
    try {
      const res = await fetch("/api/cromos/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cromoId }),
      });
      if (!res.ok) {
        setError(isES ? "No se pudo actualizar favoritos" : "Could not update favorites");
        return;
      }
      const { favorited } = await res.json();
      setFavoriteIds((prev) =>
        favorited ? [...prev, cromoId] : prev.filter((id) => id !== cromoId)
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : (isES ? "Error con favoritos" : "Error with favorites");
      setError(msg);
    }
  };

  const progressPct = Math.round((collection?.progress ?? 0) * 100);

  const t = {
    title: isES ? "Mi Álbum" : "My Album",
    subtitle: isES
      ? "Abre sobres, completa el Mundial 2026 e intercambia con otros jugadores."
      : "Open packs, complete the 2026 World Cup and trade with other players.",
    back: isES ? "Volver al catálogo" : "Back to catalog",
    openPack: isES ? "Abrir sobre gratis" : "Open free pack",
    wait: isES ? "Espera" : "Wait",
    obtained: isES ? "Obtenidos" : "Obtained",
    missing: isES ? "Faltan" : "Missing",
    all: isES ? "Todos" : "All",
    progress: isES ? "Progreso del álbum" : "Album progress",
    emptyOwned: isES ? "Aún no tienes cromos aquí" : "You don't have any stickers here yet",
    emptyMissing: isES ? "¡Colección completa! No te falta ningún cromo." : "Collection complete! No stickers missing.",
    openHint: isES ? "Nuevo sobre disponible cada 4 horas" : "New pack available every 4 hours",
    searchPlaceholder: isES ? "Buscar por nombre o número..." : "Search by name or number...",
    filterRarity: isES ? "Rareza" : "Rarity",
    filterCategory: isES ? "Categoría" : "Category",
    clearFilters: isES ? "Limpiar filtros" : "Clear filters",
    detailTitle: isES ? "Detalle del cromo" : "Sticker detail",
    ownedLabel: isES ? "En tu colección" : "In your collection",
    missingLabel: isES ? "Te falta" : "You're missing",
    favorites: isES ? "Favoritos" : "Favorites",
    milestones: isES ? "Hitos" : "Milestones",
    byCategory: isES ? "Por categoría" : "By category",
    close: isES ? "¡Genial!" : "Awesome",
    newCromos: isES ? "¡Nuevos cromos!" : "New stickers!",
    achievements: isES ? "Logros desbloqueados" : "Unlocked achievements",
    trades: isES ? "Intercambios con otros jugadores" : "Trades with other players",
    createTrade: isES ? "Crear intercambio" : "Create trade",
    noOffers: isES ? "Nadie ha publicado un intercambio todavía" : "No one has posted a trade yet",
    offered: isES ? "Ofrece" : "Offers",
    wanted: isES ? "Quiere" : "Wants",
    accept: isES ? "Aceptar intercambio" : "Accept trade",
    cancel: isES ? "Cancelar" : "Cancel",
    myOffers: isES ? "Mis ofertas" : "My offers",
    selectOffered: isES ? "Selecciona cromos para ofrecer" : "Select stickers to offer",
    selectWanted: isES ? "Selecciona cromos que quieres" : "Select stickers you want",
    publish: isES ? "Publicar oferta" : "Publish offer",
  };

  if (authed === false) return null;

  return (
    <>
      <Head>
        <title>{isES ? "Mi Álbum de Cromos | ZonaMundial" : "My Sticker Album | ZonaMundial"}</title>
      </Head>

      <div className={styles.page} data-album-fx={fx ? "on" : "off"}>
        <span aria-hidden className={styles.topLine} />
        <div aria-hidden className={styles.parallaxLayer} />

        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

        <style>{`
          @keyframes pack-bounce {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-12px) scale(1.03); }
          }
          @keyframes pack-shake {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-4deg); }
            75% { transform: rotate(4deg); }
          }
        `}</style>

        <div className={styles.container}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <Link href="/cromos" className={styles.backLink}>
              <IconArrowLeft /> {t.back}
            </Link>
            <button
              type="button"
              onClick={toggleFx}
              className={styles.fxToggle}
              style={{ marginLeft: "auto" }}
              aria-pressed={fx}
              title={isES ? "Efectos cinematográficos (sobre que se rasga, holo, celebraciones)" : "Cinematic effects"}
            >
              {isES ? "Efectos" : "Effects"}: {fx ? "ON" : "OFF"}
            </button>
          </div>

          {loading ? (
            <div className={styles.spinnerBox}>
              <div className={styles.spinner} />
              <p style={{ color: "var(--album-muted)" }}>{isES ? "Cargando tu álbum..." : "Loading your album..."}</p>
            </div>
          ) : error && !collection ? (
            <div className={styles.spinnerBox}>
              <p style={{ color: "var(--album-muted)", maxWidth: 360, textAlign: "center" }}>{error}</p>
              <button
                onClick={() => load()}
                style={{ marginTop: 12, padding: "10px 20px", borderRadius: 12, border: "none", background: "var(--album-gold)", color: "#1a1205", fontWeight: 700, cursor: "pointer" }}
              >
                {isES ? "Reintentar" : "Retry"}
              </button>
            </div>
          ) : collection?.collected === 0 ? (
            <EmptyAlbumView
              onOpen={open}
              opening={opening}
              canOpen={packStatus.canOpen}
              secondsLeft={packStatus.secondsLeft}
              cromos={visibleCromos}
              ownedIds={collection?.ownedIds ?? []}
              favoriteIds={favoriteIds}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              rarityFilter={rarityFilter}
              onRarityToggle={(r) => setRarityFilter((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r])}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
              onCromoClick={setSelectedCromo}
              onToggleFavorite={toggleFavorite}
              collection={collection}
              t={t}
              isES={isES}
            />
          ) : (
            <>
              <AlbumHeader collection={collection} progressPct={progressPct} t={t} isES={isES} />

              <CollectionMilestones progress={collection?.progress ?? 0} isES={isES} />

              <div className={styles.statsGrid}>
                <RarityStats collection={collection} isES={isES} />
                <OpenPackCard
                  canOpen={packStatus.canOpen}
                  opening={opening}
                  secondsLeft={packStatus.secondsLeft}
                  error={error}
                  onOpen={open}
                  t={t}
                  isES={isES}
                />
              </div>

              <FilterTabs activeTab={activeTab} onChange={setActiveTab} collection={collection} t={t} isES={isES} />

              <FilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                rarityFilter={rarityFilter}
                onRarityToggle={(r) => setRarityFilter((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r])}
                categoryFilter={categoryFilter}
                onCategoryChange={setCategoryFilter}
                collection={collection}
                isES={isES}
              />

              <AlbumSections
                cromos={visibleCromos}
                ownedIds={collection?.ownedIds ?? []}
                favoriteIds={favoriteIds}
                collection={collection}
                activeTab={activeTab}
                isES={isES}
                onCromoClick={setSelectedCromo}
                onToggleFavorite={toggleFavorite}
                t={t}
              />

              <AchievementsSection achievements={achievements} isES={isES} />

              <TradesSection
                offers={offers}
                userId={userId}
                onAccept={async (id) => {
                  try {
                    const res = await fetch(`/api/cromos/trades/${id}/accept`, { method: "POST" });
                    if (!res.ok) {
                      setError(isES ? "No se pudo aceptar el intercambio" : "Could not accept trade");
                      return;
                    }
                    await load();
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : (isES ? "Error aceptando intercambio" : "Error accepting trade");
                    setError(msg);
                  }
                }}
                onCancel={async (id) => {
                  try {
                    const res = await fetch(`/api/cromos/trades/${id}`, { method: "DELETE" });
                    if (!res.ok) {
                      setError(isES ? "No se pudo cancelar el intercambio" : "Could not cancel trade");
                      return;
                    }
                    await load();
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : (isES ? "Error cancelando intercambio" : "Error canceling trade");
                    setError(msg);
                  }
                }}
                onCreate={() => setShowCreateTrade(true)}
                t={t}
                isES={isES}
              />
            </>
          )}
        </div>
      </div>

      {showPackAnimation && packResult && (
        <PackOpeningAnimation
          cromos={packResult}
          onDone={closePackAnimation}
          fx={fx}
          isES={isES}
        />
      )}

      {packResult && !showPackAnimation && (
        <PackResultModal cromos={packResult} onClose={() => setPackResult(null)} t={t} isES={isES} />
      )}

      {celebration && fx && !showPackAnimation && !packResult && (
        <CelebrationOverlay title={celebration.title} subtitle={celebration.subtitle} onDone={() => setCelebration(null)} />
      )}

      {selectedCromo && collection && (
        <CromoDetailModal
          cromo={selectedCromo}
          owned={collection.ownedIds.includes(selectedCromo.id)}
          isFavorite={favoriteIds.includes(selectedCromo.id)}
          onClose={() => setSelectedCromo(null)}
          onToggleFavorite={() => toggleFavorite(selectedCromo.id)}
          isES={isES}
        />
      )}

      {showCreateTrade && collection && (
        <CreateTradeModal
          ownedIds={collection.ownedIds}
          onClose={() => setShowCreateTrade(false)}
          onCreated={() => { setShowCreateTrade(false); load(); }}
          t={t}
          isES={isES}
        />
      )}
    </>
  );
}
