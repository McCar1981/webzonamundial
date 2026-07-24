"use client";

// "Ranking de tu liga" — sustituye al antiguo "Ranking global" en el lobby.
// Muestra el top de PREDICTORES por Fútcoins de la liga que sigue el usuario
// (reutiliza /api/ligas/leaderboard, RPC liga_prediction_leaderboard). Con
// varias ligas seguidas, un selector compacto de pastillas (por defecto la
// primaria). Sin ligas (invitado) invita a seguir una. Card clara, coherente
// con el lobby. Fail-soft: si el RPC no está aplicado, sale el vacío "sé el
// primero" sin romper.

import { useEffect, useState } from "react";
import Link from "next/link";
import { COMPETITIONS } from "@/data/competitions";

const GOLD = "#c9a84c";
const INK = "#14110a";
const MUT = "#6b6552";

type Entry = {
  position: number;
  user: { id: string; display_name: string; avatar_url: string | null };
  coins: number;
  correct_count: number;
  predictions_count: number;
};
type Board = { rankings: Entry[]; my_position: number | null };

function shortOf(slug: string): string {
  return COMPETITIONS.find((c) => c.slug === slug)?.short ?? slug;
}

const MEDALS: Record<number, { bg: string; c: string; ring: string }> = {
  1: { bg: "linear-gradient(135deg,#f3df8a,#dcae3c)", c: "#6b4e0a", ring: "#e8cf6a" },
  2: { bg: "linear-gradient(135deg,#eef2f8,#c4cedd)", c: "#4d5a70", ring: "#cdd7e5" },
  3: { bg: "linear-gradient(135deg,#f0cfae,#cf9054)", c: "#6e3f12", ring: "#dca873" },
};

export default function LigaRankingCard({ authed }: { authed: boolean }) {
  const [slugs, setSlugs] = useState<string[] | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [board, setBoard] = useState<Board | null>(null);

  // Ligas seguidas por el usuario (primera = primaria).
  useEffect(() => {
    if (!authed) { setSlugs([]); return; }
    let on = true;
    fetch("/api/ligas/mis-ligas")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { ligas?: string[] } | null) => {
        if (!on) return;
        const ls = Array.isArray(d?.ligas) ? d!.ligas! : [];
        setSlugs(ls);
        setSlug(ls[0] ?? null);
      })
      .catch(() => { if (on) setSlugs([]); });
    return () => { on = false; };
  }, [authed]);

  // Leaderboard de la liga seleccionada.
  useEffect(() => {
    if (!slug) { setBoard(null); return; }
    let on = true;
    setBoard(null);
    fetch(`/api/ligas/leaderboard?slug=${encodeURIComponent(slug)}&limit=20`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Board | null) => { if (on) setBoard(d ?? { rankings: [], my_position: null }); })
      .catch(() => { if (on) setBoard({ rankings: [], my_position: null }); });
    return () => { on = false; };
  }, [slug]);

  if (slugs === null) return null; // cargando: sin parpadeo

  const cardStyle: React.CSSProperties = {
    marginBottom: 26, borderRadius: 18, padding: "20px 20px",
    background: "#f6f4ee", border: "1px solid rgba(20,17,10,0.06)",
    boxShadow: "0 16px 36px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.8)",
  };

  // Sin ligas seguidas (típicamente invitado): invitación a seguir una.
  if (slugs.length === 0) {
    return (
      <section data-reveal style={cardStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, marginBottom: 6 }}>Ranking de tu liga</h2>
        <p style={{ fontSize: 13, color: MUT, lineHeight: 1.5, marginBottom: 12 }}>
          Sigue una liga y compite con el resto de aficionados por las predicciones.
        </p>
        <Link href="/ligas" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 800, color: "#8a6a13", textDecoration: "none" }}>
          Explorar ligas <span aria-hidden>→</span>
        </Link>
      </section>
    );
  }

  const rankings = board?.rankings ?? [];
  const top = rankings.slice(0, 5);
  const myPos = board?.my_position ?? null;
  const me = myPos && myPos > 5 ? rankings[myPos - 1] ?? null : null;

  return (
    <section data-reveal style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: INK }}>Ranking de tu liga</h2>
        <Link href="/app/rankings#tablero" style={{ fontSize: 12.5, fontWeight: 800, color: "#8a6a13", textDecoration: "none", flexShrink: 0 }}>Ver completo →</Link>
      </div>

      {/* Selector de liga (solo con más de una seguida) */}
      {slugs.length > 1 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto", paddingBottom: 2 }}>
          {slugs.map((s) => {
            const active = s === slug;
            return (
              <button
                key={s}
                onClick={() => setSlug(s)}
                style={{
                  flexShrink: 0, fontSize: 12, fontWeight: active ? 800 : 600,
                  color: active ? "#0a0906" : "#6b6552",
                  background: active ? `linear-gradient(135deg,${GOLD},#e8d48b)` : "#fff",
                  border: active ? "1px solid transparent" : "1px solid rgba(20,17,10,0.12)",
                  borderRadius: 999, padding: "6px 12px", cursor: "pointer",
                }}
              >
                {shortOf(s)}
              </button>
            );
          })}
        </div>
      )}

      {/* Filas del top */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {top.length > 0 ? top.map((e) => {
          const medal = MEDALS[e.position] ?? null;
          const mine = myPos != null && e.position === myPos;
          return (
            <div key={e.user.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", borderRadius: 10, background: mine ? "linear-gradient(90deg,#fff8e2,#fffdf6)" : "#fff", border: mine ? "1px solid #e8d9a8" : "1px solid rgba(20,17,10,0.05)" }}>
              {medal ? (
                <span style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 11.5, color: medal.c, background: medal.bg, border: `1px solid ${medal.ring}` }}>{e.position}</span>
              ) : (
                <span style={{ width: 22, textAlign: "center", fontWeight: 900, color: "#9aa6bd", fontSize: 14 }}>{e.position}</span>
              )}
              <span style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, background: e.user.avatar_url ? `url(${e.user.avatar_url}) center/cover no-repeat` : "#e2e8f3", color: "#0a0906", fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }} aria-hidden>{!e.user.avatar_url ? (e.user.display_name.charAt(0).toUpperCase() || "?") : ""}</span>
              <span style={{ flex: 1, color: mine ? "#8a6a13" : INK, fontSize: 13.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mine ? "Tú" : e.user.display_name}</span>
              <span style={{ color: "#b8902f", fontSize: 12.5, fontWeight: 800 }}>{e.coins.toLocaleString()} 🪙</span>
            </div>
          );
        }) : (
          <p style={{ fontSize: 12.5, color: MUT, textAlign: "center", padding: "10px 0", lineHeight: 1.5 }}>
            Aún no hay ranking en {shortOf(slug ?? "")}. {authed ? "Predice partidos de tu liga y sé el primero." : "Crea tu cuenta y compite."}
          </p>
        )}
      </div>

      {/* Tu posición si estás fuera del top-5 mostrado */}
      {me && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, marginTop: 9, background: "linear-gradient(90deg,#fff8e2,#fffdf6)", border: "1px solid #e8d9a8" }}>
          <span style={{ minWidth: 34, textAlign: "center", fontWeight: 900, color: "#8a6a13", fontSize: 13 }}>#{me.position.toLocaleString()}</span>
          <span style={{ flex: 1, color: INK, fontSize: 13.5, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Tú</span>
          <span style={{ color: "#b8902f", fontSize: 12.5, fontWeight: 800 }}>{me.coins.toLocaleString()} 🪙</span>
        </div>
      )}
    </section>
  );
}
