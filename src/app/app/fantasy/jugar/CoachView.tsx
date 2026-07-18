"use client";

// Coach IA — panel de recomendaciones: análisis del equipo, sugerencia de
// capitán y oportunidades "Diamante" (jugadores baratos en partido de
// multiplicador alto). Acciones: auto-draft, fijar capitán, ir al mercado.

import { useMemo } from "react";
import { analyzeSquad, suggestCaptain, diamondOpportunities } from "@/lib/fantasy/coach";
import type { FantasyTeamState } from "@/lib/fantasy/types";
import { BG2, BG3, GOLD, GOLD2, MID, DIM, GREEN, RED, money, flagUrl, lastName, POS_LABEL, POS_COLOR } from "./fx";

interface Props {
  team: FantasyTeamState;
  ownedIds: Set<string>;
  budgetRemaining: number;
  onAutoDraft: () => void;
  onCaptain: (id: string) => void;
  onGoMarket: () => void;
}

const TONE: Record<"good" | "warn" | "info", { bg: string; border: string; color: string }> = {
  good: { bg: `${GREEN}14`, border: `${GREEN}44`, color: "#bbf7d0" },
  warn: { bg: `${RED}14`, border: `${RED}44`, color: "#fecaca" },
  info: { bg: `${GOLD}14`, border: `${GOLD}44`, color: GOLD2 },
};

export default function CoachView({ team, ownedIds, onAutoDraft, onCaptain, onGoMarket }: Props) {
  const tips = useMemo(() => analyzeSquad(team.slots), [team.slots]);
  const captain = useMemo(() => suggestCaptain(team.slots), [team.slots]);
  const diamonds = useMemo(() => diamondOpportunities(ownedIds, 6), [ownedIds]);
  const captainIsSet = captain && team.captainId === captain.player.id;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
      {/* Análisis */}
      <div>
        <div style={sectionTitle}>🤖 Análisis de tu plantilla</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tips.map((t, i) => {
            const tone = TONE[t.tone];
            return (
              <div key={i} style={{ background: tone.bg, border: `1px solid ${tone.border}`, borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: tone.color }}>{t.icon} {t.title}</div>
                <div style={{ fontSize: 12, color: MID, marginTop: 4, lineHeight: 1.45 }}>{t.body}</div>
              </div>
            );
          })}
        </div>

        <button onClick={onAutoDraft} style={{ marginTop: 12, width: "100%", padding: "12px", borderRadius: 12, border: "none", background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: "#000000", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
          🪄 Optimizar equipo con Auto-draft IA
        </button>
      </div>

      {/* Capitán + Diamantes */}
      <div>
        <div style={sectionTitle}>⭐ Capitán recomendado</div>
        {captain ? (
          <div style={{ background: BG2, border: `1px solid ${GOLD}33`, borderRadius: 14, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src={flagUrl(captain.player.flag)} alt="" style={{ width: 40, height: 27, borderRadius: 3, objectFit: "cover", border: `1px solid ${captain.player.color}` }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{lastName(captain.player.name)}</div>
                <div style={{ fontSize: 11, color: MID }}>{captain.player.teamName} · forma {captain.player.form}/10</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: captain.player.next.tier.color }}>{captain.player.next.tier.emoji} ×{captain.player.next.tier.multiplier}</span>
            </div>
            <div style={{ fontSize: 12, color: MID, marginTop: 10, lineHeight: 1.45 }}>{captain.why}</div>
            <button onClick={() => onCaptain(captain.player.id)} disabled={!!captainIsSet} style={{ marginTop: 12, width: "100%", padding: "10px", borderRadius: 10, border: "none", background: captainIsSet ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg,${GOLD},${GOLD2})`, color: captainIsSet ? MID : "#000000", fontWeight: 800, fontSize: 13, cursor: captainIsSet ? "default" : "pointer" }}>
              {captainIsSet ? "✓ Ya es tu capitán" : "Nombrar capitán"}
            </button>
          </div>
        ) : (
          <div style={{ background: BG2, borderRadius: 14, padding: 20, color: DIM, fontSize: 13, textAlign: "center" }}>Completa tu once para recibir una sugerencia de capitán.</div>
        )}

        <div style={{ ...sectionTitle, marginTop: 18 }}>💎 Oportunidades Diamante</div>
        <div style={{ fontSize: 11, color: DIM, marginBottom: 8 }}>Jugadores asequibles en partido de multiplicador alto.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {diamonds.length === 0 && <div style={{ color: DIM, fontSize: 13, padding: 12, background: BG2, borderRadius: 10 }}>Sin chollos disponibles ahora mismo.</div>}
          {diamonds.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, background: BG2, border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "8px 12px" }}>
              <img src={flagUrl(p.flag)} alt="" style={{ width: 26, height: 18, borderRadius: 2, objectFit: "cover", border: `1px solid ${p.color}` }} />
              <span style={{ fontSize: 9, fontWeight: 900, color: POS_COLOR[p.pos], width: 26 }}>{POS_LABEL[p.pos]}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lastName(p.name)}</div>
                <div style={{ fontSize: 10, color: MID }}>{p.teamName} · {p.next.tier.emoji} ×{p.next.tier.multiplier}</div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: GOLD2 }}>{money(p.price)}</span>
            </div>
          ))}
        </div>
        <button onClick={onGoMarket} style={{ marginTop: 12, width: "100%", padding: "10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: BG3, color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
          📈 Ir al mercado
        </button>
      </div>
    </div>
  );
}

const sectionTitle: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: DIM, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 };
