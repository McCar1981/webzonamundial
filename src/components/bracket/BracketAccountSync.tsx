"use client";

// Sincroniza el bracket (anónimo, en localStorage) con la cuenta del usuario
// (mejora F): guarda los picks en el backend para que cuenten en las ligas y
// muestra la puntuación del bracket cuando el torneo ya tiene resultados.
// Solo iconos SVG (lucide-react), nunca emojis.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CloudUpload, LogIn, Trophy } from "lucide-react";
import { BRACKET_TEAMS } from "@/lib/bracket/teams";

const STORAGE_KEY = "zm:bracket:v1";
const BG2 = "#14110a", BG3 = "#0a0906";
const GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#a69a82", DIM = "#6e6552", GREEN = "#22c55e";
const CARD_BORDER = "1px solid rgba(255,255,255,0.07)";

interface Pick { matchId: string; winner: string | null; scoreA: number; scoreB: number; ts: number }
interface ScoreView { score: number; reached_counts: Record<string, number>; champion_correct: boolean; scored_at: string | null }
interface ApiState {
  bracket: { picks: Record<string, Pick>; champion: string | null; total_goals: number; updated_at: string | null } | null;
  score: ScoreView | null;
  max_score: number;
}

const teamName = (id: string | null) => (id ? BRACKET_TEAMS.find((t) => t.id === id)?.name ?? id : null);

function readLocalBracket(): { picks: Record<string, Pick>; champion: string | null; totalGoals: number; count: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { picks?: Record<string, Pick> };
    const picks = parsed.picks ?? {};
    const count = Object.keys(picks).length;
    if (!count) return null;
    let totalGoals = 0;
    for (const p of Object.values(picks)) totalGoals += (p.scoreA ?? 0) + (p.scoreB ?? 0);
    const champion = picks["FINAL-0"]?.winner ?? null;
    return { picks, champion, totalGoals, count };
  } catch {
    return null;
  }
}

export default function BracketAccountSync() {
  const [auth, setAuth] = useState<"loading" | "anon" | "user">("loading");
  const [api, setApi] = useState<ApiState | null>(null);
  const [local, setLocal] = useState<ReturnType<typeof readLocalBracket>>(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/predictions/bracket");
    if (res.status === 401) { setAuth("anon"); return; }
    if (res.ok) { setApi(await res.json()); setAuth("user"); }
  }, []);

  useEffect(() => { setLocal(readLocalBracket()); void load(); }, [load]);
  useEffect(() => { if (flash) { const id = setTimeout(() => setFlash(null), 3500); return () => clearTimeout(id); } }, [flash]);

  const save = useCallback(async () => {
    const lb = readLocalBracket();
    if (!lb) { setFlash("Aún no has hecho predicciones en tu bracket"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/predictions/bracket", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ picks: lb.picks, champion: lb.champion, total_goals: lb.totalGoals }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) { setFlash("Bracket guardado en tu cuenta"); await load(); }
      else setFlash(j.message || "No se pudo guardar el bracket");
    } finally { setBusy(false); }
  }, [load]);

  if (auth === "loading") return null;

  const wrap: React.CSSProperties = { maxWidth: 1100, margin: "16px auto", padding: "0 16px" };

  // No autenticado → invitación a iniciar sesión para competir.
  if (auth === "anon") {
    return (
      <div style={wrap}>
        <div style={{ background: BG2, border: CARD_BORDER, borderRadius: 14, padding: "14px 16px", display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ flex: "1 1 260px", minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
              <Trophy size={18} color={GOLD2} /> Compite con tu bracket
            </div>
            <div style={{ color: MID, fontSize: 13, marginTop: 4 }}>
              Inicia sesión para guardar tu bracket en tu cuenta. Acierta qué selecciones llegan a cada ronda y al campeón para sumar puntos en tus ligas.
            </div>
          </div>
          <Link href="/login?next=/bracket" style={{ background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: "#1a1206", border: CARD_BORDER, borderRadius: 12, fontWeight: 900, fontSize: 14, padding: "11px 18px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7 }}>
            <LogIn size={16} /> Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  // Autenticado.
  const saved = api?.bracket ?? null;
  const score = api?.score ?? null;
  const maxScore = api?.max_score ?? 0;
  const localCount = local?.count ?? 0;
  const championPick = teamName(local?.champion ?? saved?.champion ?? null);

  return (
    <div style={wrap}>
      <div style={{ background: BG2, border: CARD_BORDER, borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ flex: "1 1 260px", minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
              <Trophy size={18} color={GOLD2} /> Tu bracket en la cuenta
            </div>
            <div style={{ color: MID, fontSize: 13, marginTop: 4 }}>
              {saved
                ? <>Guardado{saved.updated_at ? ` · actualizado ${new Date(saved.updated_at).toLocaleDateString("es")}` : ""}. Vuelve a guardar para subir tus últimos cambios.</>
                : <>Guarda tu bracket para que cuente en tus ligas. {localCount > 0 ? `Llevas ${localCount} predicciones.` : "Aún no has empezado tu bracket."}</>}
              {championPick && <> Campeón: <strong style={{ color: GOLD2 }}>{championPick}</strong>.</>}
            </div>
          </div>
          <button
            onClick={save}
            disabled={busy || localCount === 0}
            style={{
              cursor: localCount === 0 ? "default" : "pointer",
              background: localCount === 0 ? BG3 : `linear-gradient(135deg,${GOLD},${GOLD2})`,
              color: localCount === 0 ? DIM : "#1a1206", border: CARD_BORDER, borderRadius: 12,
              fontWeight: 900, fontSize: 14, padding: "11px 18px", display: "inline-flex", alignItems: "center", gap: 7,
            }}
          >
            <CloudUpload size={16} /> {saved ? "Actualizar" : "Guardar en mi cuenta"}
          </button>
        </div>

        {/* Puntuación del bracket (cuando ya hay resultados reales) */}
        {score && (
          <div style={{ background: BG3, border: CARD_BORDER, borderRadius: 12, padding: "11px 13px" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 900, fontSize: 14, color: GOLD2 }}>
                {score.score} <span style={{ color: DIM, fontWeight: 700, fontSize: 12 }}>/ {maxScore} pts</span>
              </span>
              {score.champion_correct && (
                <span style={{ color: GREEN, fontSize: 12, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <CheckCircle2 size={14} /> Campeón acertado
                </span>
              )}
            </div>
            <div style={{ height: 8, background: BG2, borderRadius: 99, marginTop: 8, overflow: "hidden", border: CARD_BORDER }}>
              <div style={{ width: `${maxScore > 0 ? Math.round((score.score / maxScore) * 100) : 0}%`, height: "100%", background: `linear-gradient(90deg,${GOLD},${GOLD2})` }} />
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8, color: MID, fontSize: 11.5 }}>
              {(["R32", "R16", "QF", "SF", "FINAL"] as const).map((ph) => (
                <span key={ph}>{ph}: <strong style={{ color: GOLD2 }}>{score.reached_counts?.[ph] ?? 0}</strong></span>
              ))}
            </div>
          </div>
        )}
      </div>

      {flash && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: BG2, border: `1px solid ${GOLD}`, color: GOLD2, borderRadius: 12, padding: "11px 18px", fontWeight: 700, fontSize: 13.5, zIndex: 50, boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }}>
          {flash}
        </div>
      )}
    </div>
  );
}
