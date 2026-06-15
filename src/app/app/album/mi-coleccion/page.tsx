"use client";

import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CROMOS, TOTAL_CROMOS, type Cromo } from "@/lib/cromos/catalog";
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
  CategoryStats,
  CollectionMilestones,
  OpenPackCard,
  FilterTabs,
  FilterBar,
  CromoGrid,
  AchievementsSection,
  TradesSection,
  EmptyAlbumView,
  PackResultModal,
  PackOpeningAnimation,
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

  useEffect(() => {
    const sb = createSupabaseBrowserClient();
    sb.auth.getUser().then(({ data }) => {
      setAuthed(!!data.user);
      setUserId(data.user?.id ?? null);
      if (!data.user) router.replace("/login?next=/app/album/mi-coleccion");
    });
  }, [router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [colRes, packRes, achRes, tradeRes] = await Promise.all([
        fetch("/api/cromos/mine"),
        fetch("/api/cromos/pack-status"),
        fetch("/api/cromos/achievements"),
        fetch("/api/cromos/trades"),
      ]);

      if (colRes.status === 401) {
        router.replace("/login?next=/app/album/mi-coleccion");
        return;
      }

      const colData = await colRes.json();
      setCollection(colData);
      setFavoriteIds(colData.favoriteIds ?? []);

      const packData = await packRes.json();
      setPackStatus({
        canOpen: packData.canOpen ?? true,
        nextPackAt: packData.nextPackAt ?? null,
        secondsLeft: packData.secondsLeft ?? 0,
      });

      if (achRes.ok) {
        const achData = await achRes.json();
        setAchievements(achData.achievements);
      }

      if (tradeRes.ok) {
        const tradeData = await tradeRes.json();
        setOffers(tradeData.offers ?? []);
      }
    } catch {
      setError(isES ? "Error cargando tu colección" : "Error loading your collection");
    } finally {
      setLoading(false);
    }
  }, [isES, router]);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  useEffect(() => {
    if (packStatus.canOpen) return;
    const id = setInterval(() => {
      setPackStatus((prev) => {
        const next = Math.max(0, prev.secondsLeft - 1);
        return { ...prev, secondsLeft: next, canOpen: next <= 0 };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [packStatus.canOpen]);

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
        setShowPackAnimation(true);
        setPackResult(data.cromos);
        const nextAt = data.nextPackAt ? new Date(data.nextPackAt).getTime() : 0;
        const secondsLeft = nextAt > 0 ? Math.max(0, Math.ceil((nextAt - Date.now()) / 1000)) : 14400;
        setPackStatus({
          canOpen: false,
          nextPackAt: data.nextPackAt ?? null,
          secondsLeft,
        });
        setTimeout(() => load(), 2500);
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
      if (!res.ok) return;
      const { favorited } = await res.json();
      setFavoriteIds((prev) =>
        favorited ? [...prev, cromoId] : prev.filter((id) => id !== cromoId)
      );
    } catch {
      // ignore
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

      <div className={styles.page}>
        <span aria-hidden className={styles.topLine} />

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
                <CategoryStats collection={collection} isES={isES} />
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

              <div className={styles.gridHeader}>
                <h2 className={styles.gridTitle}>{isES ? "Cromos del álbum" : "Album stickers"}</h2>
                <span className={styles.gridCount}>
                  {visibleCromos.length} {isES ? "cromos" : "stickers"}
                </span>
              </div>

              <CromoGrid
                cromos={visibleCromos}
                ownedIds={collection?.ownedIds ?? []}
                favoriteIds={favoriteIds}
                emptyMessage={activeTab === "missing" ? t.emptyMissing : t.emptyOwned}
                isES={isES}
                onCromoClick={setSelectedCromo}
                onToggleFavorite={toggleFavorite}
              />

              <AchievementsSection achievements={achievements} isES={isES} />

              <TradesSection
                offers={offers}
                userId={userId}
                onAccept={async (id) => {
                  const res = await fetch(`/api/cromos/trades/${id}/accept`, { method: "POST" });
                  if (res.ok) load();
                }}
                onCancel={async (id) => {
                  const res = await fetch(`/api/cromos/trades/${id}`, { method: "DELETE" });
                  if (res.ok) load();
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
          isES={isES}
        />
      )}

      {packResult && !showPackAnimation && (
        <PackResultModal cromos={packResult} onClose={() => setPackResult(null)} t={t} isES={isES} />
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
