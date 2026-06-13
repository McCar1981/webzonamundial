"use client";

import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { MATCHES, type Match } from "@/data/matches";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

interface RatingEntry {
  watched: boolean;
  rating: number | null;
  tags: string[];
  note: string;
}

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

const TAGS = ["Golazo", "Partidazo", "Sorpresa", "Soporífero", "Arbitraje dudoso", "Penaltis", "Remontada"];

function ratingColor(rating: number): string {
  if (rating >= 9) return "#3b82f6"; // Absolute Cinema
  if (rating >= 8) return "#22c55e"; // Awesome
  if (rating >= 7) return "#84cc16"; // Great
  if (rating >= 6) return "#eab308"; // Good
  if (rating >= 5) return "#f97316"; // Average
  if (rating >= 3) return "#ef4444"; // Bad
  return "#a855f7"; // Garbage
}

function ratingLabel(rating: number): string {
  if (rating >= 9) return "Absolute Cinema";
  if (rating >= 8) return "Awesome";
  if (rating >= 7) return "Great";
  if (rating >= 6) return "Good";
  if (rating >= 5) return "Average";
  if (rating >= 3) return "Bad";
  return "Garbage";
}

function storageKey(userId: string | null): string {
  return `zm-match-ratings-${userId ?? "anon"}`;
}

export default function MatchRatingPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<number, RatingEntry>>({});
  const [selected, setSelected] = useState<Match | null>(null);

  useEffect(() => {
    const sb = createSupabaseBrowserClient();
    sb.auth.getUser().then(({ data }) => {
      setAuthed(!!data.user);
      setUserId(data.user?.id ?? null);
      if (!data.user) {
        router.replace("/login?next=/app/match-rating");
      }
    });
  }, [router]);

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

  const rounds = useMemo(() => {
    return ROUNDS.map((r) => ({
      ...r,
      matches: MATCHES.filter((m) => m.p !== "Amistoso").filter(r.filter).sort((a, b) => a.i - b.i),
    }));
  }, []);

  const maxRows = useMemo(() => Math.max(...rounds.map((r) => r.matches.length)), [rounds]);

  const stats = useMemo(() => {
    const entries = Object.values(ratings);
    const watched = entries.filter((e) => e.watched).length;
    const rated = entries.filter((e) => e.rating != null);
    const avg = rated.length ? rated.reduce((s, e) => s + (e.rating ?? 0), 0) / rated.length : 0;
    return { watched, rated: rated.length, avg };
  }, [ratings]);

  const updateRating = (matchId: number, patch: Partial<RatingEntry>) => {
    setRatings((prev) => ({
      ...prev,
      [matchId]: { watched: false, rating: null, tags: [], note: "", ...prev[matchId], ...patch },
    }));
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
        <title>Match Ratings | ZonaMundial</title>
        <meta name="description" content="Puntúa los partidos del Mundial 2026 como si fueran episodios." />
      </Head>
      <main className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Mi Series Graph del Mundial</h1>
            <p className={styles.subtitle}>Marca qué partidos has visto y puntúalos episodio a episodio.</p>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statValue}>{stats.watched}</div>
              <div className={styles.statLabel}>Vistos</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{stats.rated}</div>
              <div className={styles.statLabel}>Puntuados</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{stats.avg ? stats.avg.toFixed(1) : "—"}</div>
              <div className={styles.statLabel}>Media</div>
            </div>
          </div>
        </header>

        <div className={styles.legend}>
          {[
            { label: "Absolute Cinema", color: "#3b82f6" },
            { label: "Awesome", color: "#22c55e" },
            { label: "Great", color: "#84cc16" },
            { label: "Good", color: "#eab308" },
            { label: "Average", color: "#f97316" },
            { label: "Bad", color: "#ef4444" },
            { label: "Garbage", color: "#a855f7" },
          ].map((l) => (
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
                  const entry = ratings[match.i];
                  const watched = entry?.watched ?? false;
                  const rating = entry?.rating ?? null;
                  const rated = rating != null;
                  return (
                    <button
                      key={match.i}
                      className={`${styles.cell} ${watched ? styles.cellWatched : ""} ${rated ? styles.cellRated : ""}`}
                      style={rated ? { backgroundColor: `${ratingColor(rating)}22`, borderColor: ratingColor(rating) } : undefined}
                      onClick={() => setSelected(match)}
                      title={`${match.h} vs ${match.a}`}
                    >
                      {watched && <span className={styles.check}>✓</span>}
                      <span className={styles.cellNumber}>{rated ? rating.toFixed(1) : "?"}</span>
                      <span className={styles.cellTeams}>{match.h.slice(0, 10)} · {match.a.slice(0, 10)}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </main>

      {selected && selectedRating && (
        <div className={styles.overlay} onClick={() => setSelected(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>{selected.h} vs {selected.a}</h2>
            <div className={styles.matchRow}>
              <div className={styles.team}>
                <img
                  src={`https://flagcdn.com/w40/${selected.hf}.png`}
                  alt={selected.h}
                  width={40}
                  height={28}
                  style={{ borderRadius: 4, objectFit: "cover" }}
                />
                <span className={styles.teamName}>{selected.h}</span>
              </div>
              <span className={styles.vs}>VS</span>
              <div className={styles.team}>
                <img
                  src={`https://flagcdn.com/w40/${selected.af}.png`}
                  alt={selected.a}
                  width={40}
                  height={28}
                  style={{ borderRadius: 4, objectFit: "cover" }}
                />
                <span className={styles.teamName}>{selected.a}</span>
              </div>
            </div>
            <div className={styles.meta}>
              {selected.p} · Jornada {selected.j} · {selected.d} {selected.t} ET · {selected.vc}
            </div>

            <label className={styles.watchToggle}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={selectedRating.watched}
                onChange={(e) => updateRating(selected.i, { watched: e.target.checked })}
              />
              {selectedRating.watched ? "Visto" : "Marcar como visto"}
            </label>

            <div className={styles.sectionLabel}>Tu nota</div>
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
