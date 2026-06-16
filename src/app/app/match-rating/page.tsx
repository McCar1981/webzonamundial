"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { MATCHES, type Match } from "@/data/matches";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

// ponytail: minimal animation helper - tracks element visibility for stagger effects
function useStaggerAnimation(count: number) {
  return Array.from({ length: count }, (_, i) => ({ delay: i * 50 }));
}

interface RatingEntry {
  watched: boolean;
  rating: number | null;
  tags: string[];
  note: string;
}

type FilterTab = "all" | "watched" | "unwatched" | "rated";

const ROUNDS = [
  { key: "S1", label: "S1", filter: (m: Match) => m.p === "Fase de grupos" && m.j === 1 },
  { key: "S2", label: "S2", filter: (m: Match) => m.p === "Fase de grupos" && m.j === 2 },
  { key: "S3", label: "S3", filter: (m: Match) => m.p === "Fase de grupos" && m.j === 3 },
  { key: "S4", label: "S4", filter: (m: Match) => m.p === "Dieciseisavos" },
  { key: "S5", label: "S5", filter: (m: Match) => m.p === "Octavos de final" },
  { key: "S6", label: "S6", filter: (m: Match) => m.p === "Cuartos de final" },
  { key: "S7", label: "S7", filter: (m: Match) => m.p === "Semifinal" },
  { key: "S8", label: "S8", filter: (m: Match) => m.p === "Tercer puesto" },
  { key: "S9", label: "S9", filter: (m: Match) => m.p === "FINAL" },
];

const TAGS = ["Golazo", "Partidazo", "Sorpresa", "Soporífero", "Arbitraje dudoso", "Penaltis", "Remontada", "Defensa impecable"];

const LEGEND = [
  { label: "Cine puro", color: "#3b82f6", min: 9 },
  { label: "Increíble", color: "#22c55e", min: 8 },
  { label: "Excelente", color: "#84cc16", min: 7 },
  { label: "Bueno", color: "#eab308", min: 6 },
  { label: "Regular", color: "#f97316", min: 5 },
  { label: "Malo", color: "#ef4444", min: 3 },
  { label: "Pésimo", color: "#a855f7", min: 1 },
];

const DEMO_RATINGS: Record<number, RatingEntry> = {
  1: { watched: true, rating: 6, tags: ["Regular"], note: "Partido inaugural correcto." },
  2: { watched: true, rating: 8, tags: ["Partidazo"], note: "Corea sorprendió." },
  7: { watched: true, rating: 9, tags: ["Golazo"], note: "Brasil arrasó en el segundo tiempo." },
  19: { watched: true, rating: 10, tags: ["Partidazo", "Golazo"], note: "Messi lo hizo de nuevo. Cine puro." },
  24: { watched: true, rating: 7, tags: ["Sorpresa"], note: "Colombia sólida." },
  33: { watched: true, rating: 5, tags: ["Soporífero"], note: "Alemania sin brillo." },
  45: { watched: true, rating: 4, tags: ["Malo"], note: "Muy trabado." },
  52: { watched: true, rating: 8, tags: ["Remontada"], note: "Voltereta increíble." },
};

function ratingColor(rating: number): string {
  if (rating >= 9) return "#3b82f6";
  if (rating >= 8) return "#22c55e";
  if (rating >= 7) return "#84cc16";
  if (rating >= 6) return "#eab308";
  if (rating >= 5) return "#f97316";
  if (rating >= 3) return "#ef4444";
  return "#a855f7";
}

function ratingLabel(rating: number): string {
  if (rating >= 9) return "Cine puro";
  if (rating >= 8) return "Increíble";
  if (rating >= 7) return "Excelente";
  if (rating >= 6) return "Bueno";
  if (rating >= 5) return "Regular";
  if (rating >= 3) return "Malo";
  return "Pésimo";
}

function storageKey(userId: string | null): string {
  return `zm-match-ratings-${userId ?? "anon"}`;
}

function formatDate(d: string): string {
  const [y, m, day] = d.split("-");
  return `${day}/${m}`;
}

export default function MatchRatingPage() {
  const router = useRouter();
  const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const [authed, setAuthed] = useState<boolean | null>(hasSupabase ? null : true);
  const [userId, setUserId] = useState<string | null>(hasSupabase ? null : "local-preview");
  const [ratings, setRatings] = useState<Record<number, RatingEntry>>({});
  const [selected, setSelected] = useState<Match | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!hasSupabase) return;
    const sb = createSupabaseBrowserClient();
    sb.auth.getUser().then(({ data }) => {
      setAuthed(!!data.user);
      setUserId(data.user?.id ?? null);
      if (!data.user) {
        router.replace("/login?next=/app/match-rating");
      }
    });
  }, [router, hasSupabase]);

  useEffect(() => {
    if (!userId) return;
    try {
      const raw = localStorage.getItem(storageKey(userId));
      if (raw) setRatings(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    localStorage.setItem(storageKey(userId), JSON.stringify(ratings));
  }, [ratings, userId]);

  const allMatches = useMemo(() => MATCHES.filter((m) => m.p !== "Amistoso"), []);

  const filteredMatchIds = useMemo(() => {
    const term = search.trim().toLowerCase();
    return new Set(
      allMatches.filter((m) => {
        const entry = ratings[m.i];
        if (filter === "watched" && !entry?.watched) return false;
        if (filter === "unwatched" && entry?.watched) return false;
        if (filter === "rated" && entry?.rating == null) return false;
        if (term) {
          const text = `${m.h} ${m.a} ${m.p} ${m.vc}`.toLowerCase();
          return text.includes(term);
        }
        return true;
      }).map((m) => m.i),
    );
  }, [allMatches, ratings, filter, search]);

  const rounds = useMemo(() => {
    return ROUNDS.map((r) => ({
      ...r,
      matches: allMatches.filter(r.filter).sort((a, b) => a.i - b.i),
    }));
  }, [allMatches]);

  const maxRows = useMemo(() => Math.max(...rounds.map((r) => r.matches.length)), [rounds]);

  const stats = useMemo(() => {
    const entries = Object.values(ratings);
    const watched = entries.filter((e) => e.watched).length;
    const rated = entries.filter((e) => e.rating != null);
    const avg = rated.length ? rated.reduce((s, e) => s + (e.rating ?? 0), 0) / rated.length : 0;
    const ratedEntries = rated.map((e) => ({
      id: Number(Object.keys(ratings).find((k) => ratings[Number(k)] === e)!),
      ...e,
    }));
    const best = ratedEntries.length ? ratedEntries.reduce((a, b) => (a.rating! > b.rating! ? a : b)) : null;
    const worst = ratedEntries.length ? ratedEntries.reduce((a, b) => (a.rating! < b.rating! ? a : b)) : null;
    return { watched, rated: rated.length, avg, best, worst, total: allMatches.length };
  }, [ratings, allMatches.length]);

  const distribution = useMemo(() => {
    const dist = Array(10).fill(0);
    Object.values(ratings).forEach((e) => {
      if (e.rating != null) dist[e.rating - 1] += 1;
    });
    const max = Math.max(1, ...dist);
    return dist.map((count) => ({ count, height: `${(count / max) * 100}%` }));
  }, [ratings]);

  const topMatches = useMemo(() => {
    return Object.entries(ratings)
      .filter(([, e]) => e.rating != null)
      .map(([id, entry]) => ({ match: allMatches.find((m) => m.i === Number(id))!, entry }))
      .filter((x) => x.match)
      .sort((a, b) => b.entry.rating! - a.entry.rating!)
      .slice(0, 6);
  }, [ratings, allMatches]);

  const updateRating = (matchId: number, patch: Partial<RatingEntry>) => {
    setRatings((prev) => ({
      ...prev,
      [matchId]: { watched: false, rating: null, tags: [], note: "", ...prev[matchId], ...patch },
    }));
  };

  const seedDemo = () => setRatings(DEMO_RATINGS);
  const clearAll = () => {
    if (typeof window !== "undefined" && window.confirm("¿Borrar todas tus valoraciones?")) {
      setRatings({});
    }
  };

  const selectedRating = selected ? ratings[selected.i] ?? { watched: false, rating: null, tags: [], note: "" } : null;

  if (authed === false) return null;
  if (!authed) {
    return (
      <div className={styles.loading}>
        <span>Cargando...</span>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Mi Mundial | ZonaMundial</title>
        <meta name="description" content="Puntúa los partidos del Mundial 2026 como si fueran episodios." />
      </Head>

      <div className={styles.page}>
        {!hasSupabase && (
          <div className={styles.previewBanner}>
            Modo local: no hay variables de Supabase configuradas. El login está desactivado solo en este entorno.
          </div>
        )}

        <div className={styles.container}>
          <header className={styles.hero}>
            <span className={styles.badge}>⭐ Mi Mundial</span>
            <h1 className={styles.title}>Tu Resumen del Mundial</h1>
            <p className={styles.subtitle}>
              Marca qué partidos has visto, puntúalos episodio a episodio y descubre tu propio análisis del torneo.
            </p>
          </header>

          <section className={styles.dashboard}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Progreso de visionado</div>
              <div className={styles.progressWrap}>
                <div
                  className={styles.progressCircle}
                  style={{ ["--progress" as string]: `${(stats.watched / stats.total) * 100}%` }}
                >
                  <span className={styles.progressValue}>{Math.round((stats.watched / stats.total) * 100)}%</span>
                </div>
                <div className={styles.progressMeta}>
                  <div className={styles.progressLabel}>{stats.watched} de {stats.total} partidos</div>
                  <div className={styles.progressSub}>{stats.rated} puntuados · media {stats.avg ? stats.avg.toFixed(1) : "—"}</div>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>Tus récords</div>
              <div className={styles.statGrid}>
                <div className={styles.stat}>
                  <div className={styles.statValue}>{stats.best?.rating ?? "—"}</div>
                  <div className={styles.statLabel}>Mejor nota</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statValue}>{stats.worst?.rating ?? "—"}</div>
                  <div className={styles.statLabel}>Peor nota</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statValue}>{stats.avg ? stats.avg.toFixed(1) : "—"}</div>
                  <div className={styles.statLabel}>Media</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statValue}>{stats.rated}</div>
                  <div className={styles.statLabel}>Puntuados</div>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>Distribución de notas</div>
              <div className={styles.distribution}>
                {distribution.map((d, i) => (
                  <div
                    key={i}
                    className={styles.distBar}
                    style={{ height: d.height, color: ratingColor(i + 1) }}
                  >
                    <span className={styles.distTooltip}>{i + 1}: {d.count} voto{d.count !== 1 ? "s" : ""}</span>
                  </div>
                ))}
              </div>
              <div className={styles.distLabels}>
                <span>1</span>
                <span>10</span>
              </div>
            </div>
          </section>

          <div className={styles.controls}>
            <div className={styles.tabs}>
              {[
                { key: "all", label: "Todos" },
                { key: "watched", label: "Vistos" },
                { key: "unwatched", label: "Por ver" },
                { key: "rated", label: "Puntuados" },
              ].map((t) => (
                <button
                  key={t.key}
                  className={`${styles.tab} ${filter === t.key ? styles.tabActive : ""}`}
                  onClick={() => setFilter(t.key as FilterTab)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              className={styles.search}
              placeholder="Buscar equipo, fase o sede..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.legend}>
            {LEGEND.map((l) => (
              <span key={l.label} className={styles.legendItem}>
                <span className={styles.dot} style={{ background: l.color }} />
                {l.label}
              </span>
            ))}
          </div>

          <div className={styles.gridWrap}>
            <div className={styles.grid}>
              {rounds.map((round) => (
                <div key={round.key} className={styles.round}>
                  <div className={styles.roundHeader}>{round.label}</div>
                  {Array.from({ length: maxRows }).map((_, idx) => {
                    const match = round.matches[idx];
                    if (!match) {
                      return <div key={idx} className={`${styles.cell} ${styles.cellEmpty}`} />;
                    }
                    const visible = filteredMatchIds.has(match.i);
                    const entry = ratings[match.i];
                    const watched = entry?.watched ?? false;
                    const rating = entry?.rating ?? null;
                    const rated = rating != null;
                    return (
                      <button
                        key={match.i}
                        className={`${styles.cell} ${watched ? styles.cellWatched : ""} ${!visible ? styles.cellEmpty : ""}`}
                        style={
                          rated && visible
                            ? { backgroundColor: `${ratingColor(rating)}22`, borderColor: ratingColor(rating) }
                            : undefined
                        }
                        onClick={() => visible && setSelected(match)}
                        title={visible ? `${match.h} vs ${match.a}` : undefined}
                        disabled={!visible}
                      >
                        {watched && visible && <span className={styles.check}>✓</span>}
                        {visible && (
                          <>
                            <div className={styles.cellFlags}>
                              <img src={`https://flagcdn.com/w40/${match.hf}.png`} alt="" />
                              <span style={{ color: "var(--mr-muted)", fontSize: 10 }}>vs</span>
                              <img src={`https://flagcdn.com/w40/${match.af}.png`} alt="" />
                            </div>
                            <span className={styles.cellNumber}>{rated ? rating.toFixed(1) : "?"}</span>
                            <span className={styles.cellTeams}>{match.h.slice(0, 10)} · {match.a.slice(0, 10)}</span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {topMatches.length > 0 ? (
            <>
              <h2 className={styles.sectionTitle}>
                <span>🏆</span> Tus partidos mejor puntuados
              </h2>
              <div className={styles.topMatches}>
                {topMatches.map(({ match, entry }) => (
                  <button
                    key={match.i}
                    className={styles.topCard}
                    onClick={() => setSelected(match)}
                    style={{ borderColor: `${ratingColor(entry.rating!)}40` }}
                  >
                    <div
                      className={styles.topScore}
                      style={{ backgroundColor: ratingColor(entry.rating!) }}
                    >
                      {entry.rating}
                    </div>
                    <div className={styles.topInfo}>
                      <div className={styles.topTeams}>{match.h} vs {match.a}</div>
                      <div className={styles.topMeta}>{match.p} · {formatDate(match.d)} · {match.vc}</div>
                      {entry.tags.length > 0 && (
                        <div className={styles.topTags}>
                          {entry.tags.map((tag) => (
                            <span key={tag} className={styles.topTag}>{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyTitle}>Aún no has puntuado ningún partido</div>
              <div className={styles.emptyDesc}>
                Toca cualquier celda del grid para empezar, o carga datos de ejemplo para ver cómo queda.
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button className={styles.emptyCta} onClick={seedDemo}>Cargar datos de ejemplo</button>
                <button className={styles.emptyCta} onClick={clearAll} style={{ opacity: 0.7 }}>Borrar todo</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selected && selectedRating && (
        <div className={styles.overlay} onClick={() => setSelected(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>{selected.h} vs {selected.a}</h2>
            <div className={styles.matchRow}>
              <div className={styles.team}>
                <img src={`https://flagcdn.com/w80/${selected.hf}.png`} alt={selected.h} />
                <span className={styles.teamName}>{selected.h}</span>
              </div>
              <span className={styles.vs}>VS</span>
              <div className={styles.team}>
                <img src={`https://flagcdn.com/w80/${selected.af}.png`} alt={selected.a} />
                <span className={styles.teamName}>{selected.a}</span>
              </div>
            </div>
            <div className={styles.meta}>
              {selected.p} · Jornada {selected.j} · {formatDate(selected.d)} {selected.t} ET · {selected.vc}
            </div>

            <label className={styles.watchToggle}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={selectedRating.watched}
                onChange={(e) => updateRating(selected.i, { watched: e.target.checked })}
              />
              {selectedRating.watched ? "✓ Visto" : "Marcar como visto"}
            </label>

            <div className={styles.sectionLabel}>Tu nota — {selectedRating.rating ? ratingLabel(selectedRating.rating) : "Sin puntuar"}</div>
            <div className={styles.ratingRow}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  className={`${styles.ratingBtn} ${selectedRating.rating === n ? styles.ratingBtnActive : ""}`}
                  style={selectedRating.rating === n ? { color: ratingColor(n), borderColor: ratingColor(n) } : undefined}
                  onClick={() => updateRating(selected.i, { rating: n, watched: true })}
                  title={ratingLabel(n)}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className={styles.sectionLabel}>Tags</div>
            <div className={styles.tags}>
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  className={`${styles.tag} ${selectedRating.tags.includes(tag) ? styles.tagActive : ""}`}
                  onClick={() => {
                    const next = selectedRating.tags.includes(tag)
                      ? selectedRating.tags.filter((t) => t !== tag)
                      : [...selectedRating.tags, tag];
                    updateRating(selected.i, { tags: next });
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>

            <textarea
              className={styles.note}
              rows={3}
              placeholder="Nota corta sobre el partido..."
              value={selectedRating.note}
              onChange={(e) => updateRating(selected.i, { note: e.target.value })}
              maxLength={280}
            />

            <div className={styles.actions}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setSelected(null)}>
                Cerrar
              </button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setSelected(null)}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
