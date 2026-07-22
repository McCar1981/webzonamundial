"use client";

// "Mis clubes": el ancla de la temporada. El usuario elige su(s) liga(s) y su(s)
// club(es) y la Zona de Ligas gira a su alrededor. Ahora soporta VARIOS clubes
// (migración 2026-53), no uno solo: se listan todos, se añaden y se quitan.
// Estados:
//   - anónimo: gancho de registro ("elige tu club").
//   - logueado sin clubes: selector en dos pasos (liga del catálogo -> club).
//   - logueado con clubes: la lista de clubes (con su próximo/último partido) +
//     "Añadir club" + quitar. Datos: /api/ligas/mi-club y /api/ligas/equipos.
// Sin emojis; dorado solo acento; sin librerías.

import { useCallback, useEffect, useState } from "react";
import { COMPETITIONS } from "@/data/competitions";

const GOLD = "#c9a84c";
const DIM = "#a69a82";

interface Team { id: number; name: string; logo: string }
interface Fixture {
  fixtureId: number;
  kickoff: string;
  status: string;
  leagueName?: string;
  home: Team;
  away: Team;
  score: { home: number | null; away: number | null };
}
interface News { slug: string; title: string; date: string }
interface Club {
  ligaSlug: string | null;
  clubId: number;
  clubName: string;
  clubLogo: string | null;
  next?: Fixture | null;
  last?: Fixture | null;
}

const FINISHED = new Set(["FT", "AET", "PEN"]);
const LIVE = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"]);

function fmtFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" });
  } catch {
    return iso.slice(0, 10);
  }
}
function fmtHora(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso.slice(11, 16);
  }
}

// Línea compacta del partido más relevante del club: en vivo / próximo / último.
function matchLine(c: Club): { label: string; text: string; live: boolean } | null {
  const f = c.next ?? c.last ?? null;
  if (!f) return null;
  const live = LIVE.has(f.status);
  const played = live || FINISHED.has(f.status);
  const score = played ? `${f.score.home ?? 0}-${f.score.away ?? 0}` : "vs";
  const rival = f.home.id === c.clubId ? f.away.name : f.home.name;
  const when = played ? (live ? "En vivo" : "Final") : `${fmtFecha(f.kickoff)} · ${fmtHora(f.kickoff)}`;
  const label = c.next && !played ? "Próximo" : live ? "En vivo" : "Último";
  return { label, text: `${rival} · ${played ? score : when}`, live };
}

export default function MiClubCard() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [news, setNews] = useState<News[]>([]);
  // Selector
  const [picking, setPicking] = useState(false);
  const [pickLiga, setPickLiga] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    fetch("/api/ligas/mi-club")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j) { setAuthed(false); return; }
        setAuthed(!!j.authed);
        setClubs(Array.isArray(j.clubs) ? j.clubs : []);
        setNews(Array.isArray(j.news) ? j.news : []);
      })
      .catch(() => setAuthed(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const openLiga = useCallback((slug: string) => {
    setPickLiga(slug);
    setTeams(null);
    setError("");
    fetch(`/api/ligas/equipos?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setTeams(j && Array.isArray(j.teams) ? j.teams : []))
      .catch(() => setTeams([]));
  }, []);

  const chooseTeam = useCallback(async (t: Team) => {
    if (busy || !pickLiga) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/ligas/mi-club", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ligaSlug: pickLiga, teamId: t.id, teamName: t.name, teamLogo: t.logo }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        setPicking(false);
        setPickLiga(null);
        setTeams(null);
        load(); // recarga la lista con el club recién añadido
      } else if (j?.error === "not_available") {
        setError("Esta función estará disponible en breve.");
      } else {
        setError("No se pudo guardar. Inténtalo de nuevo.");
      }
    } catch {
      setError("Sin conexión. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }, [busy, pickLiga, load]);

  const removeClub = useCallback(async (clubId: number) => {
    // Optimista: quita al instante; si falla, recarga.
    setClubs((prev) => prev.filter((c) => c.clubId !== clubId));
    try {
      const r = await fetch(`/api/ligas/mi-club?teamId=${clubId}`, { method: "DELETE" });
      if (!r.ok) load();
    } catch {
      load();
    }
  }, [load]);

  const box: React.CSSProperties = { marginTop: 14 };

  if (authed === null) return <div aria-hidden style={{ height: 72, marginTop: 14, borderRadius: 14, background: "rgba(255,255,255,0.02)" }} />;

  // Anónimo: el club como gancho de registro.
  if (!authed) {
    return (
      <a href="/registro?next=/ligas" className="zl-card--featured zl-tap" style={{ ...box, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, textDecoration: "none" }}>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: "#fff" }}>Elige tus clubes y no te pierdas nada</span>
          <span style={{ display: "block", fontSize: 12.5, color: DIM, marginTop: 2 }}>Sus próximos partidos, resultados y noticias, siempre arriba.</span>
        </span>
        <span className="zl-cta" style={{ flexShrink: 0, fontSize: 13, padding: "9px 14px" }}>Empezar</span>
      </a>
    );
  }

  // Logueado sin clubes, o añadiendo uno: selector liga -> club.
  if (clubs.length === 0 || picking) {
    return (
      <section className="zl-card--featured" style={box}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#fff" }}>{clubs.length > 0 ? "Añadir club" : "Elige tu club"}</h2>
          {picking && clubs.length > 0 && (
            <button onClick={() => { setPicking(false); setPickLiga(null); setTeams(null); }} style={{ border: "none", background: "none", color: DIM, fontSize: 12.5, cursor: "pointer", padding: 0 }}>Cancelar</button>
          )}
        </div>
        <p style={{ margin: "4px 0 12px", fontSize: 12.5, color: DIM }}>Puedes seguir varios clubes. Todos aparecerán en tu lobby con sus partidos.</p>

        {!pickLiga ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {COMPETITIONS.filter((c) => c.scope === "domestic").map((c) => (
              <button key={c.slug} onClick={() => openLiga(c.slug)}
                style={{ border: "1px solid rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.06)", color: "#fff", fontSize: 12.5, fontWeight: 500, padding: "8px 12px", borderRadius: 99, cursor: "pointer" }}>
                {c.short}
              </button>
            ))}
          </div>
        ) : teams === null ? (
          <p style={{ margin: 0, fontSize: 13, color: DIM }}>Cargando equipos…</p>
        ) : teams.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: DIM }}>
            No hay equipos disponibles ahora mismo.{" "}
            <button onClick={() => setPickLiga(null)} style={{ border: "none", background: "none", color: GOLD, fontSize: 13, cursor: "pointer", padding: 0 }}>Elegir otra liga</button>
          </p>
        ) : (
          <>
            <button onClick={() => setPickLiga(null)} style={{ border: "none", background: "none", color: GOLD, fontSize: 12.5, cursor: "pointer", padding: 0, marginBottom: 10 }}>&larr; Otra liga</button>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
              {teams.map((t) => {
                const already = clubs.some((c) => c.clubId === t.id);
                return (
                  <button key={t.id} onClick={() => !already && chooseTeam(t)} disabled={busy || already}
                    style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid rgba(255,255,255,0.1)", background: already ? "rgba(201,168,76,0.14)" : "rgba(255,255,255,0.03)", color: "#fff", fontSize: 12.5, padding: "9px 10px", borderRadius: 10, cursor: busy || already ? "default" : "pointer", opacity: busy ? 0.6 : 1, textAlign: "left" }}>
                    {t.logo ? <img src={t.logo} alt="" width={20} height={20} loading="lazy" style={{ width: 20, height: 20, objectFit: "contain", flexShrink: 0 }} /> : null}
                    <span style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", flex: 1 }}>{t.name}</span>
                    {already ? <span style={{ fontSize: 11, color: GOLD, flexShrink: 0 }}>✓</span> : null}
                  </button>
                );
              })}
            </div>
          </>
        )}
        {error ? <p style={{ margin: "10px 0 0", fontSize: 12, color: "#ef6a6a" }}>{error}</p> : null}
      </section>
    );
  }

  // Logueado con clubes: la lista.
  return (
    <section className="zl-card--featured" style={box}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, color: GOLD }}>MIS CLUBES</div>
        <button onClick={() => { setPicking(true); setPickLiga(null); setTeams(null); }}
          style={{ border: "1px solid rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.06)", color: GOLD, fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0, padding: "5px 11px", borderRadius: 99 }}>
          + Añadir club
        </button>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {clubs.map((c) => {
          const line = matchLine(c);
          return (
            <div key={c.clubId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <a href={`/ligas/equipo/${c.clubId}`} style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, textDecoration: "none" }}>
                {c.clubLogo ? <img src={c.clubLogo} alt="" width={30} height={30} style={{ width: 30, height: 30, objectFit: "contain", flexShrink: 0 }} /> : <span style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.08)", flexShrink: 0 }} aria-hidden />}
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: "#fff", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{c.clubName}</span>
                  {line ? (
                    <span style={{ display: "block", fontSize: 11.5, color: line.live ? "#ff6b5a" : DIM, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                      {line.label}: {line.text}
                    </span>
                  ) : (
                    <span style={{ display: "block", fontSize: 11.5, color: DIM }}>Sin partidos anunciados</span>
                  )}
                </span>
              </a>
              <button onClick={() => removeClub(c.clubId)} aria-label={`Quitar ${c.clubName}`} title="Quitar club"
                style={{ border: "none", background: "none", color: DIM, fontSize: 18, lineHeight: 1, cursor: "pointer", flexShrink: 0, padding: "0 2px" }}>
                ×
              </button>
            </div>
          );
        })}
      </div>

      {news.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 1, color: DIM, marginBottom: 6 }}>NOTICIAS DE TUS CLUBES</div>
          {news.map((n) => (
            <a key={n.slug} href={`/noticias/${n.slug}`} style={{ display: "block", fontSize: 13, color: "#e6decb", textDecoration: "none", padding: "5px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              {n.title}
            </a>
          ))}
        </div>
      )}
      {error ? <p style={{ margin: "10px 0 0", fontSize: 12, color: "#ef6a6a" }}>{error}</p> : null}
    </section>
  );
}
