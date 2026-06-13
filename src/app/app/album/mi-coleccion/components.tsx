"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { CROMOS, TOTAL_CROMOS, type Cromo, RARITIES, CATEGORIES } from "@/lib/cromos/catalog";
import type { AchievementView } from "@/lib/cromos/achievements";
import {
  IconPack,
  IconClock,
  IconSparkle,
  IconGrid,
  IconCheck,
  IconLock,
  IconArrowLeft,
  IconTrophy,
  IconSwap,
} from "./icons";
import styles from "./page.module.css";

export const rarityColor = (rarity: string) => {
  if (rarity === "Legendario") return "#f59e0b";
  if (rarity === "Oro") return "#eab308";
  return "#94a3b8";
};

export const rarityGlow = (rarity: string) => {
  if (rarity === "Legendario") return "rgba(245,158,11,0.45)";
  if (rarity === "Oro") return "rgba(234,179,8,0.35)";
  return "rgba(148,163,184,0.25)";
};

export function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

export type TabKey = "owned" | "missing" | "all";

export type Collection = {
  ownedIds: number[];
  total: number;
  collected: number;
  progress: number;
  byRarity: Record<string, { collected: number; total: number }>;
  byCategory: Record<string, { collected: number; total: number }>;
};

export type TradeOffer = {
  id: string;
  creatorId: string;
  creatorName: string | null;
  creatorAvatar: string | null;
  status: string;
  message: string | null;
  createdAt: string;
  offered: Cromo[];
  wanted: Cromo[];
};

export type Translations = Record<string, string>;

export function ProgressBar({ collection, progressPct, t }: { collection: Collection | null; progressPct: number; t: Translations }) {
  return (
    <div className={styles.box} data-reveal>
      <div className={styles.progressHeader}>
        <span className={styles.progressLabel}>{t.progress}</span>
        <span className={styles.progressCount}>
          {collection?.collected ?? 0} / {TOTAL_CROMOS} ({progressPct}%)
        </span>
      </div>
      <div className={styles.track}>
        <div className={styles.bar} style={{ width: `${progressPct}%` }} />
      </div>
    </div>
  );
}

export function RarityStats({ collection, isES }: { collection: Collection | null; isES: boolean }) {
  return (
    <div className={`${styles.box} ${styles.staggerContainer}`} data-reveal>
      <h3>{isES ? "Por rareza" : "By rarity"}</h3>
      <div>
        {RARITIES.map((r) => {
          const stat = collection?.byRarity[r.key] ?? { collected: 0, total: r.count };
          const pct = Math.round((stat.collected / stat.total) * 100);
          return (
            <div key={r.key} className={`${styles.rarityRow} ${styles.staggerItem}`}>
              <div className={styles.rarityHeader}>
                <span className={styles.rarityName} style={{ color: r.color }}>{isES ? r.label.es : r.label.en}</span>
                <span className={styles.rarityCount}>{stat.collected}/{stat.total}</span>
              </div>
              <div className={styles.rarityTrack}>
                <div className={styles.rarityBar} style={{ width: `${pct}%`, background: r.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function OpenPackCard({
  canOpen,
  opening,
  secondsLeft,
  error,
  onOpen,
  t,
  isES,
}: {
  canOpen: boolean;
  opening: boolean;
  secondsLeft: number;
  error: string | null;
  onOpen: () => void;
  t: Translations;
  isES: boolean;
}) {
  return (
    <div className={styles.packCard} data-reveal>
      <div className={`${styles.packIcon} ${opening ? styles.opening : ""}`}>
        <IconPack />
      </div>
      <button onClick={onOpen} disabled={!canOpen || opening} className={styles.btnPrimary}>
        {opening ? (
          <>{isES ? "Abriendo..." : "Opening..."}</>
        ) : canOpen ? (
          <><IconPack /> {t.openPack}</>
        ) : (
          <><IconClock /> {t.wait}: {formatCountdown(secondsLeft)}</>
        )}
      </button>
      <p className={styles.packHint}>{t.openHint}</p>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

export function FilterTabs({ activeTab, onChange, collection, t, isES }: {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
  collection: Collection | null;
  t: Translations;
  isES: boolean;
}) {
  const tabs = [
    { key: "all" as const, label: t.all, icon: <IconGrid /> },
    { key: "owned" as const, label: `${t.obtained} (${collection?.collected ?? 0})`, icon: <IconCheck /> },
    { key: "missing" as const, label: `${t.missing} (${(collection?.total ?? TOTAL_CROMOS) - (collection?.collected ?? 0)})`, icon: <IconLock /> },
  ];

  return (
    <div className={styles.tabs}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ""}`}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );
}

export function CromoMiniCard({ cromo, owned }: { cromo: Cromo; owned: boolean }) {
  const color = rarityColor(cromo.rarity);
  const glow = rarityGlow(cromo.rarity);

  return (
    <div className={`${styles.cromoCard} ${owned ? styles.cromoOwned : ""}`}>
      <div className={styles.cromoImgWrap}>
        <img src={cromo.path} alt={cromo.name} loading="lazy" className={styles.cromoImg} style={{ filter: owned ? "none" : "grayscale(100%)" }} />
        {!owned && (
          <div className={styles.cromoLocked}>
            <IconLock />
          </div>
        )}
        {owned && (
          <div className={styles.cromoCheck} style={{ background: color, boxShadow: `0 0 10px ${glow}` }}>
            <IconCheck />
          </div>
        )}
      </div>
      <div className={styles.cromoInfo}>
        <div className={styles.cromoRarity} style={{ color: owned ? color : "var(--album-muted)" }}>{cromo.rarity}</div>
        <div className={styles.cromoNumber}>#{String(cromo.number).padStart(3, "0")}</div>
      </div>
    </div>
  );
}

export function CromoGrid({ cromos, ownedIds, emptyMessage }: { cromos: Cromo[]; ownedIds: number[]; emptyMessage: string }) {
  if (cromos.length === 0) {
    return <div className={styles.empty}>{emptyMessage}</div>;
  }

  const ownedSet = new Set(ownedIds);
  return (
    <div className={styles.grid}>
      {cromos.map((cromo) => (
        <CromoMiniCard key={cromo.id} cromo={cromo} owned={ownedSet.has(cromo.id)} />
      ))}
    </div>
  );
}

export function AchievementsSection({ achievements, isES }: { achievements: AchievementView[]; isES: boolean }) {
  return (
    <section className={styles.section} data-reveal>
      <div className={styles.sectionHeader}>
        <IconTrophy />
        <h2 className={styles.sectionTitle}>{isES ? "Logros" : "Achievements"}</h2>
      </div>
      <div className={`${styles.achievementGrid} ${styles.staggerContainer}`}>
        {achievements.map((ach) => (
          <div key={ach.id} className={`${styles.achievementCard} ${ach.unlocked ? styles.achievementUnlocked : ""} ${styles.staggerItem}`}>
            <div className={styles.achievementEmoji}>{ach.emoji}</div>
            <div className={styles.achievementName}>{isES ? ach.name.es : ach.name.en}</div>
            <div className={styles.achievementDesc}>{isES ? ach.description.es : ach.description.en}</div>
            {ach.unlocked && ach.unlockedAt && (
              <div className={styles.achievementDate}>
                ✓ {new Date(ach.unlockedAt).toLocaleDateString(isES ? "es-ES" : "en-US")}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function TradeOfferCard({ offer, isMine, onAccept, onCancel, t, isES }: {
  offer: TradeOffer;
  isMine: boolean;
  onAccept: () => void;
  onCancel: () => void;
  t: Translations;
  isES: boolean;
}) {
  return (
    <div className={styles.tradeCard}>
      <div className={styles.tradeUser}>
        <div className={styles.tradeAvatar}>{offer.creatorName?.[0]?.toUpperCase() || "?"}</div>
        <div>
          <div className={styles.tradeName}>{offer.creatorName || (isES ? "Usuario" : "User")}</div>
          {offer.message && <div className={styles.tradeMessage}>{offer.message}</div>}
        </div>
      </div>

      <div className={styles.tradeColumns}>
        <div>
          <div className={`${styles.tradeLabel} ${styles.tradeLabelOffered}`}>{t.offered}</div>
          <div className={styles.tradeThumbs}>
            {offer.offered.map((c) => (
              <img key={c.id} src={c.path} alt="" className={styles.tradeThumb} />
            ))}
          </div>
        </div>
        <div>
          <div className={styles.tradeLabel} style={{ color: "var(--album-muted)" }}>{t.wanted}</div>
          <div className={styles.tradeThumbs}>
            {offer.wanted.map((c) => (
              <img key={c.id} src={c.path} alt="" className={styles.tradeThumb} />
            ))}
          </div>
        </div>
      </div>

      {isMine ? (
        <button onClick={onCancel} className={styles.btnDanger}>{t.cancel}</button>
      ) : (
        <button onClick={onAccept} className={styles.btnPrimary}>{t.accept}</button>
      )}
    </div>
  );
}

export function TradesSection({ offers, userId, onAccept, onCancel, onCreate, t, isES }: {
  offers: TradeOffer[];
  userId: string | null;
  onAccept: (id: string) => void;
  onCancel: (id: string) => void;
  onCreate: () => void;
  t: Translations;
  isES: boolean;
}) {
  return (
    <section className={styles.section} data-reveal>
      <div className={styles.tradeHeader}>
        <div className={styles.sectionHeader}>
          <IconSwap />
          <h2 className={styles.sectionTitle}>{isES ? "Intercambios" : "Trades"}</h2>
        </div>
        <button onClick={onCreate} className={styles.btnPrimary}>{t.createTrade}</button>
      </div>

      {offers.length === 0 ? (
        <div className={styles.tradeEmpty}>{t.noOffers}</div>
      ) : (
        <div className={`${styles.tradeList} ${styles.staggerContainer}`}>
          {offers.map((offer) => (
            <div key={offer.id} className={styles.staggerItem}>
              <TradeOfferCard
                offer={offer}
                isMine={offer.creatorId === userId}
                onAccept={() => onAccept(offer.id)}
                onCancel={() => onCancel(offer.id)}
                t={t}
                isES={isES}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function EmptyAlbumView({
  onOpen,
  opening,
  canOpen,
  secondsLeft,
  cromos,
  ownedIds,
  t,
  isES,
}: {
  onOpen: () => void;
  opening: boolean;
  canOpen: boolean;
  secondsLeft: number;
  cromos: Cromo[];
  ownedIds: number[];
  t: Translations;
  isES: boolean;
}) {
  return (
    <div className={styles.emptyAlbum} data-reveal>
      <span className={styles.badge}>
        <IconSparkle /> {isES ? "Empezar colección" : "Start collection"}
      </span>
      <h2 className={styles.emptyTitle}>{isES ? "¡Tu álbum te espera!" : "Your album is waiting!"}</h2>
      <p className={styles.emptyDesc}>
        {isES
          ? "Abre tu primer sobre gratis y descubre los primeros cromos del Mundial 2026."
          : "Open your first free pack and discover your first 2026 World Cup stickers."}
      </p>

      <button
        onClick={onOpen}
        disabled={!canOpen || opening}
        className={`${styles.packImageBtn} ${opening ? styles.packImageOpening : styles.packImageIdle}`}
      >
        <img
          src="/sobres/sobre1.png"
          alt={isES ? "Sobre de cromos" : "Sticker pack"}
          className={styles.packImage}
        />
      </button>

      <div className={styles.openActions}>
        <button onClick={onOpen} disabled={!canOpen || opening} className={styles.btnPrimary}>
          {opening ? (
            <>{isES ? "Abriendo..." : "Opening..."}</>
          ) : canOpen ? (
            <><IconPack /> {t.openPack}</>
          ) : (
            <><IconClock /> {t.wait}: {formatCountdown(secondsLeft)}</>
          )}
        </button>
        <p className={styles.packHint}>{t.openHint}</p>
      </div>

      <div style={{ marginTop: 60 }}>
        <h3 className={styles.sectionTitle}>{isES ? "Cromos del álbum" : "Album stickers"}</h3>
        <CromoGrid cromos={cromos} ownedIds={ownedIds} emptyMessage={isES ? "No hay cromos para mostrar" : "No stickers to show"} />
      </div>
    </div>
  );
}

export function PackResultModal({ cromos, onClose, t, isES }: { cromos: Cromo[]; onClose: () => void; t: Translations; isES: boolean }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const confetti = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.6}s`,
    duration: `${1.8 + Math.random() * 1.2}s`,
    color: ["#c9a84c", "#e8d48b", "#f59e0b", "#3b82f6", "#ef4444"][Math.floor(Math.random() * 5)],
  }));

  return (
    <div onClick={onClose} className={styles.modalOverlay}>
      {confetti.map((c) => (
        <span
          key={c.id}
          className={styles.confetti}
          style={{ left: c.left, background: c.color, animationDelay: c.delay, animationDuration: c.duration }}
        />
      ))}
      <div onClick={(e) => e.stopPropagation()} className={styles.modalContent}>
        <h2 className={styles.modalTitle}>{t.newCromos}</h2>
        <p style={{ color: "var(--album-muted)", marginBottom: 28 }}>
          {isES ? `Has conseguido ${cromos.length} cromos nuevos` : `You got ${cromos.length} new stickers`}
        </p>

        <div className={styles.modalGrid}>
          {cromos.map((c, i) => (
            <div
              key={c.id}
              className={`${styles.modalCard} ${styles.cromoReveal}`}
              style={{
                borderColor: `${rarityColor(c.rarity)}55`,
                boxShadow: `0 0 30px ${rarityGlow(c.rarity)}`,
                animationDelay: `${i * 120}ms`,
              }}
            >
              <img src={c.path} alt={c.name} style={{ width: "100%", height: "auto", display: "block" }} />
            </div>
          ))}
        </div>

        <button onClick={onClose} className={styles.btnPrimary}>{t.close}</button>
      </div>
    </div>
  );
}

export function CreateTradeModal({ ownedIds, onClose, onCreated, t, isES }: {
  ownedIds: number[];
  onClose: () => void;
  onCreated: () => void;
  t: Translations;
  isES: boolean;
}) {
  const owned = CROMOS.filter((c) => ownedIds.includes(c.id));
  const missing = CROMOS.filter((c) => !ownedIds.includes(c.id));
  const [offeredIds, setOfferedIds] = useState<number[]>([]);
  const [wantedIds, setWantedIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggle = (id: number, list: number[], set: (v: number[]) => void) => {
    if (list.includes(id)) set(list.filter((x) => x !== id));
    else set([...list, id]);
  };

  const submit = async () => {
    if (offeredIds.length === 0 || wantedIds.length === 0) return;
    setSubmitting(true);
    const res = await fetch("/api/cromos/trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offeredCromoIds: offeredIds, wantedCromoIds: wantedIds }),
    });
    setSubmitting(false);
    if (res.ok) onCreated();
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div onClick={onClose} className={styles.modalOverlay}>
      <div onClick={(e) => e.stopPropagation()} className={styles.modalContentWide}>
        <h2 className={styles.sectionTitle}>{t.createTrade}</h2>

        <div style={{ margin: "24px 0" }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: "var(--album-gold)" }}>{t.selectOffered}</div>
          <div className={styles.pickerGrid}>
            {owned.map((c) => {
              const selected = offeredIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggle(c.id, offeredIds, setOfferedIds)}
                  className={`${styles.pickerBtn} ${selected ? styles.pickerBtnSelected : ""}`}
                >
                  <img src={c.path} alt="" className={styles.pickerImg} />
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ margin: "24px 0" }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: "var(--album-muted)" }}>{t.selectWanted}</div>
          <div className={styles.pickerGrid}>
            {missing.map((c) => {
              const selected = wantedIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggle(c.id, wantedIds, setWantedIds)}
                  className={`${styles.pickerBtn} ${selected ? styles.pickerBtnSelected : ""}`}
                >
                  <img src={c.path} alt="" className={`${styles.pickerImg} ${styles.pickerImgDim}`} />
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} className={styles.btnSecondary}>{t.cancel}</button>
          <button
            onClick={submit}
            disabled={submitting || offeredIds.length === 0 || wantedIds.length === 0}
            className={styles.btnPrimary}
            style={{ opacity: offeredIds.length === 0 || wantedIds.length === 0 ? 0.5 : 1 }}
          >
            {submitting ? "..." : t.publish}
          </button>
        </div>
      </div>
    </div>
  );
}
