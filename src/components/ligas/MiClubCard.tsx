"use client";

// "Mi club": el ancla de la temporada. El usuario elige su liga y su club UNA
// vez y la Zona de Ligas gira a su alrededor: próximo partido, último resultado
// y las noticias que mencionan a su club. Tres estados:
//   - anónimo: gancho de registro ("elige tu club").
//   - logueado sin club: selector en dos pasos (liga del catálogo -> club).
//   - logueado con club: la tarjeta viva del club (partidos + noticias).
// Sin emojis; dorado solo acento; sin librerías. Datos: /api/ligas/mi-club y
// /api/ligas/equipos (ambos cacheados en servidor).

import { useCallback, useEffect, useState } from "react";
import { COMPETITIONS } from "@/data/competitions";

const GOLD = "#c9a84c";
const DIM = "#9db0c9";

interface Team { id: number; name: string; logo: string }
interface Fixture {
  fixtureId: number;
  kickoff: string;
  status: string;
  leagueName: string;
  home: Team;
  away: Team;
  score: { home: number | null; away: number | null };
}
interface News { slug: string; title: string; date: string }
interface Club { ligaSlug: string | null; clubId: number; clubName: string; clubLogo: string | null }

const FINISHED = new Set(["FT", "AET", "PEN"]);
const LIVE = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"]);

function fmtKickoff(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso.slice(0, 16).replace("T", " ");
  }
}

export default function MiClubCard() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [next, setNext] = useState<Fixture | null>(null);
  const [last, setLast] = useState<Fixture | null>(null);
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
        setClub(j.club ?? null);
        setNext(j.next ?? null);
        setLast(j.last ?? null);
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
        setClub({ ligaSlug: pickLiga, clubId: t.id, clubName: t.name, clubLogo: t.logo });
        load(); // trae partidos y noticias del club recién elegido
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

  const box: React.CSSProperties = { marginTop: 14 };

  if (authed === null) return <div aria-hidden style={{ height: 72, marginTop: 14, borderRadius: 14, background: "rgba(255,255,255,0.02)" }} />;

  // Anónimo: el club como gancho de registro.
  if (!authed) {
    return (
      <a href="/registro?next=/ligas" className="zl-card--featured zl-tap" style={{ ...box, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, textDecoration: "none" }}>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: "#fff" }}>Elige tu club y no te pierdas nada</span>
          <span style={{ display: "block", fontSize: 12.5, color: DIM, marginTop: 2 }}>Su próximo partido, sus resultados y sus noticias, siempre arriba.</span>
        </span>
        <span className="zl-cta" style={{ flexShrink: 0, fontSize: 13, padding: "9px 14px" }}>Empezar</span>
      </a>
    );
  }

  // Logueado sin club (o cambiando): selector liga -> club.
  if (!club || picking) {
    return (
      <section className="zl-card--featured" style={box}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#fff" }}>{club ? "Cambiar mi club" : "Elige tu club"}</h2>
          {picking && club && (
            <button onClick={() => setPicking(false)} style={{ border: "none", background: "none", color: DIM, fontSize: 12.5, cursor: "pointer", padding: 0 }}>Cancelar</button>
          )}
        </div>
        <p style={{ margin: "4px 0 12px", fontSize: 12.5, color: DIM }}>Tu liga y tu club, siempre arriba: próximo partido, resultados y noticias.</p>

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
              {teams.map((t) => (
                <button key={t.id} onClick={() => chooseTeam(t)} disabled={busy}
                  style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "#fff", fontSize: 12.5, padding: "9px 10px", borderRadius: 10, cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1, textAlign: "left" }}>
                  {t.logo ? <img src={t.logo} alt="" width={20} height={20} loading="lazy" style={{ width: 20, height: 20, objectFit: "contain", flexShrink: 0 }} /> : null}
                  <span style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{t.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {error ? <p style={{ margin: "10px 0 0", fontSize: 12, color: "#ef6a6a" }}>{error}</p> : null}
      </section>
    );
  }

  // Logueado con club: la tarjeta viva.
  const lastPlayed = last && (FINISHED.has(last.status) || LIVE.has(last.status));
  return (
    <section className="zl-card--featured" style={box}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {club.clubLogo ? <img src={club.clubLogo} alt="" width={38} height={38} style={{ width: 38, height: 38, objectFit: "contain", flexShrink: 0 }} /> : null}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, color: GOLD }}>MI CLUB</div>
          <a href={`/ligas/equipo/${club.clubId}`} style={{ fontSize: 17, fontWeight: 600, color: "#fff", textDecoration: "none", display: "block", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{club.clubName}</a>
        </div>
        <button onClick={() => { setPicking(true); setPickLiga(club.ligaSlug); if (club.ligaSlug) openLiga(club.ligaSlug); }}
          style={{ border: "none", background: "none", color: DIM, fontSize: 12, cursor: "pointer", flexShrink: 0, padding: 0 }}>
          Cambiar
        </button>
      </div>

      {(next || last) && (
        <div style={{ display: "grid", gridTemplateColumns: next && last ? "1fr 1fr" : "1fr", gap: 10, marginTop: 12 }}>
          {next && (
            <a href={`/ligas/equipo/${club.clubId}`} style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", textDecoration: "none" }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 1, color: DIM, marginBottom: 4 }}>PRÓXIMO · {next.leagueName}</div>
              <div style={{ fontSize: 13, color: "#fff", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{next.home.name} vs {next.away.name}</div>
              <div style={{ fontSize: 11.5, color: GOLD, marginTop: 2 }}>{fmtKickoff(next.kickoff)}</div>
            </a>
          )}
          {last && lastPlayed && (
            <a href={`/ligas/equipo/${club.clubId}`} style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", textDecoration: "none" }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 1, color: DIM, marginBottom: 4 }}>ÚLTIMO · {last.leagueName}</div>
              <div style={{ fontSize: 13, color: "#fff", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{last.home.name} {last.score.home ?? 0}-{last.score.away ?? 0} {last.away.name}</div>
            </a>
          )}
        </div>
      )}

      {news.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 1, color: DIM, marginBottom: 6 }}>NOTICIAS DE TU CLUB</div>
          {news.map((n) => (
            <a key={n.slug} href={`/noticias/${n.slug}`} style={{ display: "block", fontSize: 13, color: "#cbd5e1", textDecoration: "none", padding: "5px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              {n.title}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
