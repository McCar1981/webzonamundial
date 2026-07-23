"use client";

// "Noticias de tu fútbol": feed personalizado e INTERACTIVO. Prioridad:
// 1º su(s) club(es), 2º sus ligas. Tres capas:
//   - BREVES: titulares flash (drafts frescos del ingest) con fuente y enlace
//     al medio original — publicación en minutos, solo de tu club/liga.
//   - Artículos de TU CLUB y de TUS LIGAS (pipeline editorial completo).
// Filtros por chip, "hace X min", badge NUEVO (<3 h) y auto-refresco cada 2 min
// (solo con la pestaña visible). Se oculta si no hay nada personal.
// Datos: /api/ligas/mis-noticias.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

const GOLD = "#c9a84c";
const DIM = "#a69a82";
const TEXT = "#F5F8FD";
const REFRESH_MS = 120_000;
const NEW_WINDOW_MS = 3 * 60 * 60 * 1000;

// AUTOSUFICIENTE: el widget vive en /ligas Y en el lobby /app, y las clases
// zl-* solo existen bajo el layout de /ligas. Aquí van sus propios estilos
// (mismo lenguaje visual "Palco bajo Focos", prefijo zmn- para no colisionar).
const ZMN_CSS = `
.zmn-card{background:linear-gradient(180deg,#14110a,#0a0906);border:1px solid rgba(255,255,255,.07);border-radius:14px;box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 4px 14px -6px rgba(0,0,0,.5)}
.zmn-h2{position:relative;margin:0;padding-bottom:7px;font-size:19px;font-weight:700;letter-spacing:-.2px;color:${TEXT}}
.zmn-h2::after{content:"";position:absolute;left:0;bottom:0;width:28px;height:3px;border-radius:3px;background:linear-gradient(90deg,#c9a84c,#e8d48b)}
.zmn-tap{transition:transform .16s cubic-bezier(.2,.7,.2,1)}
.zmn-tap:active{transform:scale(.985)}
@keyframes zmnNewPulse{0%,100%{opacity:1}50%{opacity:.35}}
@media (prefers-reduced-motion: reduce){.zmn-tap{transition:none}.zmn-tap:active{transform:none}.zmn-new{animation:none !important}}
`;

type Lite = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  image: string | null;
  isTransfer: boolean;
  ts: string | null;
  club: string | null;
};
type Breve = {
  title: string;
  source: string | null;
  url: string | null;
  ts: string;
  isTransfer: boolean;
  club: string | null;
};
type Payload = {
  authed: boolean;
  club: Lite[];
  league: Lite[];
  breves: Breve[];
  clubs: { name: string; logo: string | null }[];
};

type Filtro = "todo" | "club" | "ligas" | "fichajes";

function fmtAgo(ts: string | null, fallbackDate?: string): string {
  const t = ts ? Date.parse(ts) : NaN;
  if (Number.isFinite(t)) {
    const mins = Math.floor((Date.now() - t) / 60_000);
    if (mins < 1) return "Ahora";
    if (mins < 60) return `Hace ${mins} min`;
    const h = Math.floor(mins / 60);
    if (h < 24) return `Hace ${h} h`;
    const d = Math.floor(h / 24);
    if (d === 1) return "Ayer";
    if (d < 7) return `Hace ${d} días`;
  }
  if (!fallbackDate) return "";
  try {
    return new Date(`${fallbackDate}T12:00:00`).toLocaleDateString("es", { day: "numeric", month: "short" });
  } catch {
    return fallbackDate;
  }
}

function isNew(ts: string | null): boolean {
  const t = ts ? Date.parse(ts) : NaN;
  return Number.isFinite(t) && Date.now() - t < NEW_WINDOW_MS;
}

function TransferBadge() {
  return (
    <span style={{ alignSelf: "flex-start", flexShrink: 0, fontSize: 9.5, fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase", color: "#0a0906", background: `linear-gradient(135deg, ${GOLD}, #e8d48b)`, borderRadius: 5, padding: "2px 6px" }}>Fichajes</span>
  );
}

function NewDot() {
  return (
    <span className="zmn-new" aria-label="Nuevo" title="Nuevo" style={{ width: 7, height: 7, borderRadius: "50%", background: GOLD, boxShadow: `0 0 6px ${GOLD}`, flexShrink: 0, animation: "zmnNewPulse 1.6s ease-in-out infinite" }} />
  );
}

function Crest({ logo }: { logo: string | null }) {
  if (!logo) return null;
  return <img src={logo} alt="" width={18} height={18} loading="lazy" style={{ width: 18, height: 18, objectFit: "contain", flexShrink: 0 }} />;
}

export default function MisNoticias() {
  const [data, setData] = useState<Payload | null>(null);
  const [filtroRaw, setFiltro] = useState<Filtro>("todo");
  const alive = useRef(true);

  const fetchData = useCallback(() => {
    fetch("/api/ligas/mis-noticias")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: Payload | null) => {
        if (!alive.current) return;
        if (j && j.authed) {
          setData({ authed: true, club: j.club || [], league: j.league || [], breves: j.breves || [], clubs: j.clubs || [] });
        } else if (j) {
          // Respuesta válida sin sesión: sí es un vacío real.
          setData({ authed: false, club: [], league: [], breves: [], clubs: [] });
        } else {
          // Respuesta no-OK (500 transitorio): no pisar datos ya cargados.
          setData((prev) => prev ?? { authed: false, club: [], league: [], breves: [], clubs: [] });
        }
      })
      .catch(() => {
        // Fallo transitorio (red móvil): NO pisar datos ya cargados; solo fijar
        // el estado vacío si aún no había nada (para no dejar el widget colgado).
        if (alive.current) setData((prev) => prev ?? { authed: false, club: [], league: [], breves: [], clubs: [] });
      });
  }, []);

  useEffect(() => {
    alive.current = true;
    fetchData();
    // Auto-refresco: solo con la pestaña visible (no quemar red en background)
    // y refresco inmediato al volver a la app (el caso móvil típico).
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") fetchData();
    }, REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchData();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive.current = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchData]);

  if (!data || (data.club.length === 0 && data.league.length === 0 && data.breves.length === 0)) return null;

  const logoOf = (club: string | null): string | null =>
    club ? (data.clubs.find((c) => c.name === club)?.logo ?? null) : null;

  const hasClubData = data.club.length > 0 || data.breves.some((b) => b.club != null);
  const hasLigaData = data.league.length > 0 || data.breves.some((b) => b.club == null);
  const transferCount = data.breves.filter((b) => b.isTransfer).length + data.club.filter((n) => n.isTransfer).length + data.league.filter((n) => n.isTransfer).length;
  const totalItems = data.breves.length + data.club.length + data.league.length;
  // Un chip solo se muestra si PARTICIONA de verdad (subconjunto propio de
  // "Todo"). Si solo hay noticias de liga, "Tus ligas" == "Todo" → no aporta y
  // confunde; el split club/ligas solo tiene sentido si hay de AMBOS. Igual con
  // "Fichajes": solo si además hay noticias que no son de fichajes.
  const split = hasClubData && hasLigaData;
  const hasTransfer = transferCount > 0 && transferCount < totalItems;
  const chips: { id: Filtro; label: string; show: boolean }[] = [
    { id: "todo", label: "Todo", show: true },
    { id: "club", label: "Tu club", show: split },
    { id: "ligas", label: "Tus ligas", show: split },
    { id: "fichajes", label: "Fichajes", show: hasTransfer },
  ];
  const visibleChips = chips.filter((c) => c.show);
  // Con un solo chip ("Todo") no hay nada que filtrar: ocultamos la barra.
  const showChipBar = visibleChips.length > 1;
  // Si el chip activo se quedó sin datos tras un refresco (p.ej. las breves de
  // fichajes caducaron), caemos a "todo" en vez de renderizar un widget vacío.
  const filtro = visibleChips.some((c) => c.id === filtroRaw) ? filtroRaw : "todo";

  // Filtro activo → qué se muestra en cada capa.
  const breves = data.breves.filter((b) => {
    if (filtro === "fichajes") return b.isTransfer;
    if (filtro === "club") return b.club != null;
    if (filtro === "ligas") return b.club == null;
    return true;
  });
  const clubArts = filtro === "todo" || filtro === "club" ? data.club : filtro === "fichajes" ? data.club.filter((n) => n.isTransfer) : [];
  const leagueArts = filtro === "todo" || filtro === "ligas" ? data.league : filtro === "fichajes" ? data.league.filter((n) => n.isTransfer) : [];

  return (
    <section style={{ marginTop: 30 }}>
      <style dangerouslySetInnerHTML={{ __html: ZMN_CSS }} />

      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <h2 className="zmn-h2">Noticias de tu fútbol</h2>
        <Link href="/noticias" style={{ fontSize: 12, color: GOLD, textDecoration: "none", flexShrink: 0 }}>Ver todas <span aria-hidden>&rsaquo;</span></Link>
      </div>

      {/* Chips de filtro (solo si hay más de una vista) */}
      {showChipBar && (
      <div style={{ display: "flex", gap: 6, marginTop: 10, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 2 }}>
        {visibleChips.map((c) => {
          const active = filtro === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setFiltro(c.id)}
              className="zmn-tap"
              style={{
                flexShrink: 0,
                fontSize: 12,
                fontWeight: active ? 700 : 500,
                color: active ? "#0a0906" : "#e6decb",
                background: active ? `linear-gradient(135deg, ${GOLD}, #e8d48b)` : "#1c1710",
                border: active ? "1px solid transparent" : "1px solid rgba(201,168,76,0.25)",
                borderRadius: 999,
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>
      )}

      {/* BREVES: titulares flash de tu club/liga, con fuente y enlace */}
      {breves.length > 0 && (
        <div className="zmn-card" style={{ marginTop: 12, padding: "4px 12px", background: "#17120b", border: "1px solid rgba(201,168,76,0.22)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0 2px" }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: GOLD }}>Breves</span>
            <span style={{ fontSize: 10.5, color: DIM }}>· al minuto, de tu fútbol</span>
          </div>
          {breves.map((b, i) => {
            const inner = (
              <span style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "9px 0", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <Crest logo={logoOf(b.club)} />
                <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {isNew(b.ts) ? <NewDot /> : null}
                    {b.isTransfer ? <TransferBadge /> : null}
                    <span style={{ fontSize: 10.5, color: DIM }}>{fmtAgo(b.ts)}{b.source ? ` · ${b.source}` : ""}</span>
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: TEXT, lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{b.title}</span>
                </span>
                {b.url ? <span aria-hidden style={{ color: DIM, fontSize: 14, flexShrink: 0, marginTop: 2 }}>&#8599;</span> : null}
              </span>
            );
            return b.url ? (
              <a key={`${b.ts}-${i}`} href={b.url} target="_blank" rel="nofollow noopener noreferrer" style={{ display: "block", textDecoration: "none" }} className="zmn-tap">
                {inner}
              </a>
            ) : (
              <div key={`${b.ts}-${i}`}>{inner}</div>
            );
          })}
        </div>
      )}

      {/* Artículos completos: tu club primero, luego tus ligas */}
      {clubArts.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: DIM, margin: "16px 0 2px" }}>Tu club</div>
          {clubArts.map((n) => <NewsCard key={n.slug} n={n} crest={logoOf(n.club)} />)}
        </>
      )}
      {leagueArts.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: DIM, margin: "16px 0 2px" }}>De tus ligas</div>
          {leagueArts.map((n) => <NewsCard key={n.slug} n={n} crest={null} />)}
        </>
      )}
    </section>
  );
}

function NewsCard({ n, crest }: { n: Lite; crest: string | null }) {
  const thumb = n.image ?? crest;
  return (
    <Link
      href={`/noticias/${n.slug}`}
      className="zmn-card zmn-tap"
      style={{ display: "flex", gap: 12, alignItems: "stretch", padding: 10, marginTop: 8, textDecoration: "none" }}
    >
      {thumb ? (
        <img
          src={thumb}
          alt=""
          width={78}
          height={78}
          loading="lazy"
          style={{ width: 78, height: 78, borderRadius: 10, objectFit: n.image ? "cover" : "contain", flexShrink: 0, background: "#241e12", padding: n.image ? 0 : 10 }}
        />
      ) : null}
      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 3 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {isNew(n.ts) ? <NewDot /> : null}
          {n.isTransfer ? <TransferBadge /> : null}
        </span>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: TEXT, lineHeight: 1.25, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{n.title}</span>
        <span style={{ fontSize: 11, color: DIM }}>{fmtAgo(n.ts, n.date)}</span>
      </span>
    </Link>
  );
}
