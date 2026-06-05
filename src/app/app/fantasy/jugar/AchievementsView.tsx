"use client";

// Logros — el diferenciador del Fantasy Mundial (Fase 4). Mural de medallas,
// rachas, mejor jornada y "diferenciales" (jugadores tuyos con baja propiedad).
// Todo se deriva del estado del equipo: no hay llamadas al servidor.

import { useMemo } from "react";
import {
  computeAchievements,
  achievementSummary,
  bestGameweek,
  positiveStreak,
  improvingStreak,
  avgPerGameweek,
  diferenciales,
  type Achievement,
} from "@/lib/fantasy/achievements";
import type { FantasyTeamState } from "@/lib/fantasy/types";
import { BG2, BG3, GOLD, GOLD2, MID, DIM, GREEN, money, flagUrl, lastName, POS_LABEL, POS_COLOR } from "./fx";

interface Props {
  team: FantasyTeamState;
}

const TIER_COLOR: Record<Achievement["tier"], string> = {
  bronce: "#cd7f32",
  plata: "#cbd5e1",
  oro: "#fbbf24",
  leyenda: "#a855f7",
};

export default function AchievementsView({ team }: Props) {
  const achievements = useMemo(() => computeAchievements(team), [team]);
  const summary = useMemo(() => achievementSummary(team), [team]);
  const best = useMemo(() => bestGameweek(team), [team]);
  const streak = useMemo(() => positiveStreak(team), [team]);
  const improve = useMemo(() => improvingStreak(team), [team]);
  const avg = useMemo(() => avgPerGameweek(team), [team]);
  const diffs = useMemo(() => diferenciales(team, 8, 6), [team]);

  const pctUnlocked = Math.round((summary.unlocked / summary.total) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Resumen de medallas */}
      <div style={{ background: `linear-gradient(135deg,${BG2},${BG3})`, border: `1px solid ${GOLD}33`, borderRadius: 16, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: GOLD2 }}>🏅 Tus logros</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{summary.unlocked}<span style={{ color: MID }}>/{summary.total} medallas</span></div>
        </div>
        <div style={{ height: 8, borderRadius: 8, background: "rgba(255,255,255,0.1)", marginTop: 10, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pctUnlocked}%`, background: `linear-gradient(90deg,${GOLD},${GOLD2})`, transition: "width .4s" }} />
        </div>
      </div>

      {/* Estadísticas clave */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
        <KpiCard icon="🔥" label="Racha activa" value={streak > 0 ? `${streak} jorn.` : "—"} hint="puntuando seguido" />
        <KpiCard icon="📈" label="En ascenso" value={improve > 0 ? `${improve} jorn.` : "—"} hint="mejorando tu marca" />
        <KpiCard icon="⚡" label="Mejor jornada" value={best ? `${best.points} pts` : "—"} hint={best ? `Jornada ${best.gw}` : "sin jugar"} />
        <KpiCard icon="📊" label="Media/jornada" value={team.history.length ? avg.toFixed(1) : "—"} hint={`${team.history.length} jugadas`} />
      </div>

      {/* Diferenciales */}
      <div>
        <div style={sectionTitle}>💎 Tus diferenciales</div>
        <div style={{ fontSize: 12, color: MID, marginBottom: 10, lineHeight: 1.45 }}>
          Titulares con baja propiedad (≤ 8%). Si puntúan, te separan del resto de managers.
        </div>
        {diffs.length === 0 ? (
          <div style={{ background: BG2, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 14, fontSize: 13, color: MID }}>
            Tu once no tiene diferenciales todavía. Busca joyas poco fichadas en el Mercado para distinguirte.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
            {diffs.map((d) => (
              <div key={d.player.id} style={{ display: "flex", alignItems: "center", gap: 11, background: BG2, border: `1px solid ${GOLD}22`, borderRadius: 12, padding: "10px 12px" }}>
                <img src={flagUrl(d.player.flag)} alt={d.player.teamName} width={26} height={18} style={{ borderRadius: 3, objectFit: "cover" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lastName(d.player.name)}</div>
                  <div style={{ fontSize: 10.5, color: MID }}>
                    <span style={{ color: POS_COLOR[d.player.pos], fontWeight: 800 }}>{POS_LABEL[d.player.pos]}</span> · {money(d.player.price)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: GOLD2 }}>{d.ownership.toFixed(1)}%</div>
                  <div style={{ fontSize: 9, color: DIM, textTransform: "uppercase", letterSpacing: 1 }}>propiedad</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mural de medallas */}
      <div>
        <div style={sectionTitle}>🏅 Mural de medallas</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 10 }}>
          {achievements.map((a) => (
            <AchievementCard key={a.id} a={a} />
          ))}
        </div>
      </div>
    </div>
  );
}

function AchievementCard({ a }: { a: Achievement }) {
  const tier = TIER_COLOR[a.tier];
  return (
    <div
      style={{
        position: "relative",
        background: a.unlocked ? `${tier}14` : BG2,
        border: `1px solid ${a.unlocked ? tier + "66" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 14,
        padding: "12px 14px",
        opacity: a.unlocked ? 1 : 0.78,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <div
          style={{
            width: 42,
            height: 42,
            flex: "0 0 auto",
            borderRadius: 11,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            background: a.unlocked ? `${tier}26` : "rgba(255,255,255,0.05)",
            border: `1px solid ${a.unlocked ? tier + "55" : "rgba(255,255,255,0.08)"}`,
            filter: a.unlocked ? "none" : "grayscale(1)",
          }}
        >
          {a.unlocked ? a.icon : "🔒"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: a.unlocked ? "#fff" : MID }}>{a.title}</span>
            <span style={{ fontSize: 8.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: tier }}>{a.tier}</span>
          </div>
          <div style={{ fontSize: 11.5, color: MID, marginTop: 2, lineHeight: 1.4 }}>{a.desc}</div>
        </div>
      </div>
      {!a.unlocked && (
        <div style={{ marginTop: 10 }}>
          <div style={{ height: 5, borderRadius: 5, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.round(a.progress * 100)}%`, background: tier, transition: "width .4s" }} />
          </div>
          <div style={{ fontSize: 10, color: DIM, marginTop: 4, textAlign: "right" }}>{a.progressLabel}</div>
        </div>
      )}
      {a.unlocked && (
        <div style={{ position: "absolute", top: 10, right: 12, fontSize: 11, fontWeight: 800, color: GREEN }}>✓</div>
      )}
    </div>
  );
}

function KpiCard({ icon, label, value, hint }: { icon: string; label: string; value: string; hint: string }) {
  return (
    <div style={{ background: BG2, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "11px 13px" }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: DIM, textTransform: "uppercase", letterSpacing: 1 }}>{icon} {label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginTop: 3, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 10, color: MID, marginTop: 2 }}>{hint}</div>
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  color: GOLD,
  marginBottom: 8,
};
