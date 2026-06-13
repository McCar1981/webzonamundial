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
  IconSparkle,
  IconArrowLeft,
} from "./icons";
import {
  type Collection,
  type TradeOffer,
  type TabKey,
  ProgressBar,
  RarityStats,
  OpenPackCard,
  FilterTabs,
  CromoGrid,
  AchievementsSection,
  TradesSection,
  EmptyAlbumView,
  PackResultModal,
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
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [collection, setCollection] = useState<Collection | null>(null);
  const [packStatus, setPackStatus] = useState({ canOpen: true, nextPackAt: null as string | null, secondsLeft: 0 });
  const [achievements, setAchievements] = useState<AchievementView[]>(
    ALBUM_ACHIEVEMENTS.map((a) => ({ ...a, unlocked: false, unlockedAt: null })),
  );
  const [offers, setOffers] = useState<TradeOffer[]>([]);
  const [showCreateTrade, setShowCreateTrade] = useState(false);

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

      setCollection(await colRes.json());

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
        setPackResult(data.cromos);
        setPackStatus({
          canOpen: false,
          nextPackAt: data.nextPackAt ?? null,
          secondsLeft: data.secondsLeft ?? 14400,
        });
        setTimeout(() => load(), 1500);
      }
    } catch {
      setError(isES ? "No se pudo abrir el sobre" : "Could not open pack");
    } finally {
      setOpening(false);
    }
  };

  const visibleCromos = (() => {
    const owned = new Set(collection?.ownedIds ?? []);
    if (activeTab === "owned") return CROMOS.filter((c) => owned.has(c.id));
    if (activeTab === "missing") return CROMOS.filter((c) => !owned.has(c.id));
    return CROMOS;
  })();

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

          <header className={styles.header}>
            <span className={styles.badge}>
              <IconSparkle /> {isES ? "Tu colección" : "Your collection"}
            </span>
            <h1 className={styles.title}>{t.title}</h1>
            <p className={styles.subtitle}>{t.subtitle}</p>
          </header>

          {loading ? (
            <div className={styles.spinnerBox}>
              <div className={styles.spinner} />
              <p style={{ color: "var(--album-muted)" }}>{isES ? "Cargando tu álbum..." : "Loading your album..."}</p>
            </div>
          ) : collection?.collected === 0 ? (
            <EmptyAlbumView
              onOpen={open}
              opening={opening}
              canOpen={packStatus.canOpen}
              secondsLeft={packStatus.secondsLeft}
              t={t}
              isES={isES}
            />
          ) : (
            <>
              <ProgressBar collection={collection} progressPct={progressPct} t={t} />

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

              <CromoGrid
                cromos={visibleCromos}
                ownedIds={collection?.ownedIds ?? []}
                emptyMessage={activeTab === "missing" ? t.emptyMissing : t.emptyOwned}
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

      {packResult && <PackResultModal cromos={packResult} onClose={() => setPackResult(null)} t={t} isES={isES} />}

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
