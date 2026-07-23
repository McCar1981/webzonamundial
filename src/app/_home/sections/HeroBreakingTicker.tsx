"use client";

// Cinta "ÚLTIMA HORA" del hero: una sola línea con la noticia más reciente del
// CLUB (y liga) que sigue el usuario. Prioriza las BREVES (drafts flash del
// ingest, publicación en minutos) y rota entre ellas cada 5 s para dar vida.
// Personal: se AUTO-OCULTA para invitados o si no hay nada del usuario — en el
// landing la mayoría son invitados y no verán nada, es intencional. Reutiliza
// /api/ligas/mis-noticias (mismo endpoint que el widget del lobby).

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

const GOLD = "#c9a84c";
const REFRESH_MS = 120_000;
const ROTATE_MS = 5000;

type Lite = { slug: string; title: string; club: string | null; isTransfer: boolean; ts: string | null };
type Breve = { title: string; url: string | null; ts: string; isTransfer: boolean; club: string | null };
type Payload = { authed: boolean; club: Lite[]; league: Lite[]; breves: Breve[]; clubs: { name: string; logo: string | null }[] };

type Item = { title: string; href: string; external: boolean; club: string | null; isTransfer: boolean };

const ZHB_CSS = `
.zhb-wrap{max-width:1200px;margin:0 auto;padding:0 20px}
.zhb-bar{display:flex;align-items:center;gap:10px;width:100%;padding:9px 14px;border-radius:999px;
  background:linear-gradient(90deg,rgba(201,168,76,.12),rgba(201,168,76,.04) 40%,transparent);
  border:1px solid rgba(201,168,76,.28);text-decoration:none;overflow:hidden;
  transition:border-color .16s ease,transform .16s ease}
.zhb-bar:hover{border-color:rgba(201,168,76,.5)}
.zhb-bar:active{transform:scale(.99)}
.zhb-eyebrow{display:inline-flex;align-items:center;gap:7px;flex-shrink:0;font-size:10.5px;font-weight:800;
  letter-spacing:1.2px;text-transform:uppercase;color:${GOLD}}
.zhb-dot{width:7px;height:7px;border-radius:50%;background:${GOLD};box-shadow:0 0 8px ${GOLD};
  animation:zhbPulse 1.6s ease-in-out infinite}
.zhb-sep{flex-shrink:0;width:1px;height:14px;background:rgba(201,168,76,.32)}
.zhb-crest{width:18px;height:18px;object-fit:contain;flex-shrink:0}
.zhb-title{flex:1;min-width:0;font-size:13px;font-weight:600;color:#F5F8FD;white-space:nowrap;
  overflow:hidden;text-overflow:ellipsis;transition:opacity .28s ease}
.zhb-tag{flex-shrink:0;font-size:9px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;
  color:#0a0906;background:linear-gradient(135deg,${GOLD},#e8d48b);border-radius:4px;padding:2px 5px}
.zhb-arrow{flex-shrink:0;color:${GOLD};font-size:15px;line-height:1}
.zhb-fade{opacity:0}
@keyframes zhbPulse{0%,100%{opacity:1}50%{opacity:.3}}
@media (prefers-reduced-motion: reduce){.zhb-dot,.zhb-title{animation:none;transition:none}}
`;

export default function HeroBreakingTicker() {
  const [data, setData] = useState<Payload | null>(null);
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(false);
  const alive = useRef(true);
  const paused = useRef(false);

  useEffect(() => {
    alive.current = true;
    const load = () => {
      fetch("/api/ligas/mis-noticias")
        .then((r) => (r.ok ? r.json() : null))
        .then((j: Payload | null) => {
          if (alive.current && j) setData(j);
        })
        .catch(() => {});
    };
    load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, REFRESH_MS);
    return () => {
      alive.current = false;
      clearInterval(timer);
    };
  }, []);

  const items = useMemo<Item[]>(() => {
    if (!data || !data.authed) return [];
    const out: Item[] = [];
    // 1º breves (lo más fresco). 2º artículos de club. 3º de liga.
    for (const b of data.breves) {
      out.push({ title: b.title, href: b.url ?? "/ligas", external: !!b.url, club: b.club, isTransfer: b.isTransfer });
    }
    for (const n of data.club) out.push({ title: n.title, href: `/noticias/${n.slug}`, external: false, club: n.club, isTransfer: n.isTransfer });
    for (const n of data.league) out.push({ title: n.title, href: `/noticias/${n.slug}`, external: false, club: n.club, isTransfer: n.isTransfer });
    return out.slice(0, 6);
  }, [data]);

  const logoFor = (club: string | null): string | null =>
    club && data ? (data.clubs.find((c) => c.name === club)?.logo ?? null) : null;

  // Rotación entre titulares con fundido corto. Se salta si solo hay uno o si el
  // usuario tiene el puntero encima (pausa).
  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => {
      if (paused.current || document.visibilityState !== "visible") return;
      setFade(true);
      setTimeout(() => {
        if (!alive.current) return;
        setIdx((i) => (i + 1) % items.length);
        setFade(false);
      }, 280);
    }, ROTATE_MS);
    return () => clearInterval(t);
  }, [items.length]);

  if (items.length === 0) return null;
  const it = items[Math.min(idx, items.length - 1)];
  const crest = logoFor(it.club);

  const inner = (
    <>
      <span className="zhb-eyebrow"><span className="zhb-dot" />Última hora</span>
      <span className="zhb-sep" />
      {crest ? <img className="zhb-crest" src={crest} alt="" width={18} height={18} loading="lazy" /> : null}
      {it.isTransfer ? <span className="zhb-tag">Fichajes</span> : null}
      <span className={`zhb-title${fade ? " zhb-fade" : ""}`}>{it.title}</span>
      <span className="zhb-arrow" aria-hidden>{it.external ? "↗" : "›"}</span>
    </>
  );

  return (
    <div className="zhb-wrap" onMouseEnter={() => (paused.current = true)} onMouseLeave={() => (paused.current = false)}>
      <style dangerouslySetInnerHTML={{ __html: ZHB_CSS }} />
      {it.external ? (
        <a className="zhb-bar" href={it.href} target="_blank" rel="nofollow noopener noreferrer">{inner}</a>
      ) : (
        <Link className="zhb-bar" href={it.href}>{inner}</Link>
      )}
    </div>
  );
}
