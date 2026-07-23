"use client";

// El corazón del hub /ligas: directorio del catálogo que se convierte en FEED
// PERSONAL cuando el usuario elige sus ligas (una o varias).
//
//  - SSR / cargando / anónimo / Google: el catálogo completo por regiones
//    (idéntico al de siempre — el SEO y el anónimo no pierden nada).
//  - Logueado sin selección: catálogo + invitación a elegir sus ligas.
//  - Logueado con selección: SOLO sus ligas (en vivo + próximos partidos de
//    cada una, vía /api/ligas/mi-feed cacheado por liga) y el catálogo
//    completo PLEGADO debajo ("Explorar todas las ligas").
//
// Sin emojis; dorado solo acento; clases zl-* del layout de /ligas.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { COMPETITIONS, type Competition, type CompetitionRegion } from "@/data/competitions";
import MisNoticias from "./MisNoticias";

const GOLD = "#c9a84c";

const REGION_LABEL: Record<CompetitionRegion, string> = {
  americas: "América",
  europa: "Europa",
  global: "Internacional",
};
const REGION_ORDER: CompetitionRegion[] = ["americas", "europa", "global"];

const FINISHED = new Set(["FT", "AET", "PEN"]);
const LIVE = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"]);

interface Team { id: number; name: string; logo: string }
interface Fixture {
  fixtureId: number;
  kickoff: string;
  status: string;
  elapsed: number | null;
  home: Team;
  away: Team;
  score: { home: number | null; away: number | null };
}
interface LigaFeed { slug: string; name: string; short: string; live: Fixture[]; upcoming: Fixture[] }

function fmtKickoff(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso.slice(0, 16).replace("T", " ");
  }
}

function CompCard({ c }: { c: Competition }) {
  return (
    <Link
      href={`/ligas/${c.slug}`}
      className="zl-card zl-tap"
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", textDecoration: "none" }}
    >
      {c.flag ? (
        <img src={`https://flagcdn.com/32x24/${c.flag}.png`} alt="" width={28} height={21} loading="lazy" style={{ width: 28, height: 21, objectFit: "cover", borderRadius: 3, flexShrink: 0 }} />
      ) : (
        <span style={{ width: 28, height: 21, borderRadius: 3, background: "rgba(201,168,76,0.18)", flexShrink: 0 }} aria-hidden />
      )}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: "var(--zl-text)" }}>{c.name}</span>
        <span style={{ display: "block", fontSize: 12, color: "var(--zl-muted)" }}>{c.country}</span>
      </span>
      <span aria-hidden className="zl-chev" style={{ color: GOLD, fontSize: 18 }}>&rsaquo;</span>
    </Link>
  );
}

function Catalogo() {
  return (
    <>
      {REGION_ORDER.map((region) => {
        const comps = COMPETITIONS.filter((c) => c.region === region);
        if (!comps.length) return null;
        return (
          <section key={region} style={{ marginTop: 28 }}>
            <h2 className="zl-h2">{REGION_LABEL[region]}</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {comps.map((c) => <CompCard key={c.slug} c={c} />)}
            </div>
          </section>
        );
      })}
    </>
  );
}

function FeedRow({ f, slug }: { f: Fixture; slug: string }) {
  const finished = FINISHED.has(f.status);
  const live = LIVE.has(f.status);
  return (
    <Link href={`/ligas/${slug}/${f.fixtureId}`} className="zl-row" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 2px", textDecoration: "none" }}>
      <span style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 7 }}>
        <span style={{ fontSize: 13.5, color: "var(--zl-text)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{f.home.name}</span>
        {f.home.logo ? <img src={f.home.logo} alt="" width={18} height={18} loading="lazy" style={{ width: 18, height: 18, objectFit: "contain", flexShrink: 0 }} /> : null}
      </span>
      <span className="zl-num" style={{ minWidth: 58, textAlign: "center", fontSize: live || finished ? 14.5 : 11.5, color: live ? "var(--zl-live)" : finished ? "var(--zl-text)" : "var(--zl-muted)" }}>
        {live ? `${f.score.home ?? 0}-${f.score.away ?? 0} · ${f.elapsed != null ? `${f.elapsed}'` : "VIVO"}` : finished ? `${f.score.home ?? 0}-${f.score.away ?? 0}` : fmtKickoff(f.kickoff)}
      </span>
      <span style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 7 }}>
        {f.away.logo ? <img src={f.away.logo} alt="" width={18} height={18} loading="lazy" style={{ width: 18, height: 18, objectFit: "contain", flexShrink: 0 }} /> : null}
        <span style={{ fontSize: 13.5, color: "var(--zl-text)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{f.away.name}</span>
      </span>
    </Link>
  );
}

export default function LigasDirectory() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [ligas, setLigas] = useState<string[]>([]);
  const [feed, setFeed] = useState<LigaFeed[] | null>(null);
  const [editing, setEditing] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Puerta de bienvenida (patrón de arquetipo de OneFootball): al usuario nuevo
  // le hacemos UNA pregunta amable en vez de soltarle 21 chips. Se descarta al
  // responder o al omitir.
  const [gateDone, setGateDone] = useState(false);

  const loadFeed = useCallback(() => {
    fetch("/api/ligas/mi-feed")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setFeed(j && Array.isArray(j.ligas) ? j.ligas : []))
      .catch(() => setFeed([]));
  }, []);

  useEffect(() => {
    fetch("/api/ligas/mis-ligas")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j) { setAuthed(false); return; }
        setAuthed(!!j.authed);
        const l = Array.isArray(j.ligas) ? j.ligas : [];
        setLigas(l);
        setSel(new Set(l));
        if (j.authed && l.length) loadFeed();
      })
      .catch(() => setAuthed(false));
  }, [loadFeed]);

  const toggle = useCallback((slug: string) => {
    setSel((prev) => {
      const nxt = new Set(prev);
      if (nxt.has(slug)) nxt.delete(slug);
      else nxt.add(slug);
      return nxt;
    });
  }, []);

  const save = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/ligas/mis-ligas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ligas: [...sel] }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        const l = Array.isArray(j.ligas) ? j.ligas : [...sel];
        setLigas(l);
        setEditing(false);
        setFeed(null);
        if (l.length) loadFeed();
      } else if (j?.error === "not_available") {
        setError("Disponible en breve.");
      } else {
        setError("No se pudo guardar. Inténtalo de nuevo.");
      }
    } catch {
      setError("Sin conexión. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }, [busy, sel, loadFeed]);

  // Selector de ligas (chips multi-selección sobre el catálogo).
  const editor = (
    <div className="zl-card--raised" style={{ marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <h2 className="zl-h3">Elige tus ligas</h2>
        {ligas.length > 0 && (
          <button onClick={() => { setEditing(false); setSel(new Set(ligas)); setError(""); }} style={{ border: "none", background: "none", color: "var(--zl-muted)", fontSize: 12.5, cursor: "pointer", padding: 0 }}>Cancelar</button>
        )}
      </div>
      <p style={{ margin: "4px 0 12px", fontSize: 12.5, color: "var(--zl-muted)" }}>Puedes elegir varias. El hub mostrará solo lo tuyo; el resto queda a un toque.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {COMPETITIONS.map((c) => {
          const on = sel.has(c.slug);
          return (
            <button key={c.slug} onClick={() => toggle(c.slug)}
              aria-pressed={on}
              style={{
                border: on ? "1px solid transparent" : "1px solid rgba(201,168,76,0.4)",
                background: on ? `linear-gradient(135deg, ${GOLD}, #e8d48b)` : "rgba(201,168,76,0.06)",
                color: on ? "var(--zl-gold-ink)" : "var(--zl-text)",
                fontSize: 12.5, fontWeight: on ? 700 : 500, padding: "8px 12px", borderRadius: 99, cursor: "pointer",
              }}>
              {c.short}
            </button>
          );
        })}
      </div>
      <button onClick={save} disabled={busy} className="zl-cta" style={{ marginTop: 14, fontSize: 13, padding: "10px 18px" }}>
        {busy ? "Guardando…" : sel.size ? `Guardar (${sel.size})` : "Quitar mi selección"}
      </button>
      {error ? <p style={{ margin: "10px 0 0", fontSize: 12, color: "#ef6a6a" }}>{error}</p> : null}
    </div>
  );

  // Logueado CON selección: su feed y el catálogo plegado.
  if (authed && ligas.length > 0 && !editing) {
    return (
      <>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginTop: 28 }}>
          <h2 className="zl-h2" style={{ marginBottom: 0 }}>Mis ligas</h2>
          <button onClick={() => setEditing(true)} style={{ border: "none", background: "none", color: GOLD, fontSize: 12.5, cursor: "pointer", padding: 0 }}>Editar</button>
        </div>

        {feed === null ? (
          <div aria-hidden style={{ marginTop: 14, height: 120, borderRadius: 14, background: "rgba(255,255,255,0.02)" }} />
        ) : (
          feed.map((l) => (
            <section key={l.slug} className="zl-card" style={{ marginTop: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
                <h3 className="zl-h3">{l.name}</h3>
                <Link href={`/ligas/${l.slug}`} style={{ fontSize: 12.5, color: GOLD, textDecoration: "none", flexShrink: 0 }}>Ver liga <span className="zl-chev">&rsaquo;</span></Link>
              </div>
              {l.live.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 6 }}>
                  <span className="zl-live-dot" aria-hidden />
                  <span className="zl-label" style={{ color: "var(--zl-live)" }}>En vivo</span>
                </div>
              )}
              {l.live.map((f) => <FeedRow key={f.fixtureId} f={f} slug={l.slug} />)}
              {l.upcoming.length > 0
                ? l.upcoming.map((f) => <FeedRow key={f.fixtureId} f={f} slug={l.slug} />)
                : l.live.length === 0 && <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "var(--zl-muted)" }}>Sin partidos próximos anunciados. Vuelve cuando se publique la jornada.</p>}
            </section>
          ))
        )}

        <MisNoticias />

        <details style={{ marginTop: 24 }}>
          <summary style={{ cursor: "pointer", fontSize: 13.5, fontWeight: 600, color: "var(--zl-muted)", listStyle: "none", padding: "10px 0" }}>
            Explorar todas las ligas <span aria-hidden style={{ color: GOLD }}>+</span>
          </summary>
          <Catalogo />
        </details>
      </>
    );
  }

  // Logueado editando: el editor de chips (abierto desde el gate o desde "Editar").
  if (authed && editing) {
    return <>{editor}</>;
  }

  // Logueado nuevo (sin club ni ligas): la puerta de arquetipo antes del catálogo.
  if (authed && ligas.length === 0 && !gateDone) {
    const openEditor = (preset: string[]) => { setSel(new Set(preset)); setEditing(true); };
    const gotoClub = () => {
      try { document.getElementById("zl-mi-club")?.scrollIntoView({ behavior: "smooth", block: "center" }); } catch { /* ok */ }
      setGateDone(true);
    };
    const opciones: { label: string; sub: string; onClick: () => void }[] = [
      { label: "Tengo un club favorito", sub: "Lo sigues a todo: su calendario, resultados y noticias arriba del todo.", onClick: gotoClub },
      { label: "Sigo varios clubes, sin uno favorito", sub: "Elige las ligas que te importan y verás solo esas.", onClick: () => openEditor([]) },
      { label: "Disfruto del fútbol en general", sub: "Te mostramos lo que se juega hoy en todas las ligas.", onClick: () => setGateDone(true) },
      { label: "Sobre todo fútbol internacional", sub: "Champions, Libertadores y Sudamericana.", onClick: () => openEditor(["champions-league", "libertadores", "sudamericana"]) },
    ];
    return (
      <>
        <section className="zl-card--raised" style={{ marginTop: 16 }}>
          <h2 className="zl-h3">¿Cómo vives el fútbol de clubes?</h2>
          <p style={{ margin: "4px 0 12px", fontSize: 12.5, color: "var(--zl-muted)" }}>Una pregunta y dejamos este espacio a tu gusto. Podrás cambiarlo cuando quieras.</p>
          <div style={{ display: "grid", gap: 10 }}>
            {opciones.map((o) => (
              <button key={o.label} onClick={o.onClick} className="zl-card zl-tap" style={{ textAlign: "left", cursor: "pointer", padding: "13px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--zl-text)" }}>{o.label}</span>
                  <span style={{ display: "block", fontSize: 12, color: "var(--zl-muted)", marginTop: 2 }}>{o.sub}</span>
                </span>
                <span aria-hidden className="zl-chev" style={{ color: GOLD, fontSize: 18, flexShrink: 0 }}>&rsaquo;</span>
              </button>
            ))}
          </div>
          <button onClick={() => setGateDone(true)} style={{ marginTop: 12, border: "none", background: "none", color: "var(--zl-muted)", fontSize: 12.5, cursor: "pointer", padding: 0 }}>Omitir por ahora</button>
        </section>
        <Catalogo />
      </>
    );
  }

  // Logueado que omitió el gate y no tiene selección: catálogo completo.
  if (authed) {
    return <Catalogo />;
  }

  // SSR / cargando / anónimo: catálogo completo (SEO intacto) + gancho si anónimo.
  return (
    <>
      {authed === false && (
        <a href="/registro?next=/ligas" className="zl-card--raised zl-tap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 16, textDecoration: "none" }}>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--zl-text)" }}>Haz este hub tuyo</span>
            <span style={{ display: "block", fontSize: 12, color: "var(--zl-muted)" }}>Elige tus ligas y aquí solo verás lo que te importa.</span>
          </span>
          <span className="zl-cta" style={{ flexShrink: 0, fontSize: 13, padding: "9px 14px" }}>Empezar</span>
        </a>
      )}
      <Catalogo />
    </>
  );
}
