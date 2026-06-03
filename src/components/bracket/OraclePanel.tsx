// src/components/bracket/OraclePanel.tsx
//
// IA Coach MODO 4: Oráculo / Monte Carlo. Panel que pide al endpoint la
// simulación (decenas de miles de torneos) y su narración. Envía el campeón
// elegido por el usuario para que el Oráculo lo contraste con las odds reales.

"use client";

import { useCallback, useState } from "react";
import type { BracketState } from "@/lib/bracket/types";
import { TEAM_BY_ID } from "@/lib/bracket/teams";
import { IconCrystalBall } from "@/components/ia-coach/icons";
import type {
  OracleNarration,
  OracleResponse,
  OracleErrorResponse,
} from "@/lib/ia-coach/oracle-types";
import type { TeamOdds } from "@/lib/ia-coach/oracle-sim";

// Paleta alineada con el resto del bracket (dorado ZonaMundial).
const BG2 = "#12161D";
const BG3 = "#1A2029";
const GOLD = "#C9A84C";
const GOLD2 = "#FDE68A";
const MID = "#C7CEDA";
const DIM = "#8A93A3";
const RED = "#E5604D";
const GREEN = "#4EC28A";

function teamName(id: string): string {
  return TEAM_BY_ID[id]?.name ?? id;
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function oracleError(code: string): string {
  switch (code) {
    case "sim_failed":
      return "El Oráculo no pudo correr la simulación. Inténtalo en un momento.";
    case "anthropic_failed":
      return "El Oráculo enmudeció. Inténtalo de nuevo en un momento.";
    default:
      return "El Oráculo no respondió. Inténtalo de nuevo.";
  }
}

export default function OraclePanel({ state }: { state: BracketState }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [narration, setNarration] = useState<OracleNarration | null>(null);
  const [top, setTop] = useState<TeamOdds[]>([]);
  const [userChampion, setUserChampion] = useState<TeamOdds | null>(null);
  const [iterations, setIterations] = useState(0);
  const [cached, setCached] = useState(false);

  const consult = useCallback(async () => {
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 32_000);
    try {
      const res = await fetch("/api/ia-coach/oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ champion: state.champion ?? null }),
        signal: controller.signal,
      });
      const data = (await res.json()) as OracleResponse | OracleErrorResponse;
      if (data.ok) {
        setNarration(data.narration);
        setTop(data.top);
        setUserChampion(data.userChampion);
        setIterations(data.iterations);
        setCached(data.cached);
      } else {
        setError(oracleError("error" in data ? data.error : "unknown"));
        setNarration(null);
      }
    } catch (err) {
      setError(
        (err as Error).name === "AbortError"
          ? "El Oráculo tardó demasiado. Inténtalo de nuevo."
          : "Error de red al consultar al Oráculo.",
      );
      setNarration(null);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, [state.champion]);

  const maxChampion = top.length > 0 ? top[0].champion : 1;

  return (
    <div
      style={{
        marginTop: 18,
        background: BG2,
        border: `1px solid ${GOLD}33`,
        borderRadius: 14,
        padding: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ color: GOLD2, display: "inline-flex" }}>
          <IconCrystalBall size={20} />
        </span>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontWeight: 700, color: GOLD2, fontSize: 15 }}>El Oráculo</div>
          <div style={{ color: DIM, fontSize: 12 }}>
            Simulación Monte Carlo del Mundial 2026
          </div>
        </div>
        <button
          onClick={consult}
          disabled={loading}
          style={{
            background: GOLD,
            color: "#0C0F14",
            border: "none",
            borderRadius: 9,
            padding: "9px 16px",
            fontWeight: 700,
            fontSize: 13,
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.7 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "Consultando…" : narration ? "Consultar de nuevo" : "Consultar al Oráculo"}
        </button>
      </div>

      {!narration && !error && !loading && (
        <div style={{ color: DIM, fontSize: 12.5, marginTop: 10 }}>
          El Oráculo simula el torneo decenas de miles de veces y lee tus
          probabilidades de campeón. Tu campeón elegido se contrasta con los números.
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: 12,
            background: `${RED}1A`,
            border: `1px solid ${RED}55`,
            borderRadius: 9,
            padding: "10px 12px",
            color: RED,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {narration && !loading && (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Proclamación */}
          <div
            style={{
              borderLeft: `3px solid ${GOLD}`,
              paddingLeft: 12,
            }}
          >
            <div style={{ color: GOLD2, fontWeight: 700, fontSize: 17, lineHeight: 1.3 }}>
              {narration.proclamation}
            </div>
            <div style={{ color: MID, fontSize: 13.5, marginTop: 7, lineHeight: 1.5 }}>
              {narration.reading}
            </div>
          </div>

          {/* Tabla de odds */}
          {top.length > 0 && (
            <div>
              <div
                style={{
                  color: GOLD,
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 8,
                }}
              >
                Probabilidad de campeón
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {top.map((t) => (
                  <OddsBar key={t.id} team={t} max={maxChampion} />
                ))}
              </div>
            </div>
          )}

          {/* Favorito / Tapado */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <VerdictCard
              label="Favorito"
              team={narration.favorite.team}
              take={narration.favorite.take}
              color={GOLD2}
            />
            <VerdictCard
              label="Tapado"
              team={narration.darkHorse.team}
              take={narration.darkHorse.take}
              color={GREEN}
            />
          </div>

          {/* Veredicto del campeón del usuario */}
          {narration.userVerdict && (
            <div
              style={{
                background: BG3,
                borderRadius: 11,
                padding: "11px 13px",
                borderLeft: `3px solid ${GOLD}`,
              }}
            >
              <div style={{ fontSize: 11, color: DIM, textTransform: "uppercase", letterSpacing: 1 }}>
                Tu campeón · {teamName(narration.userVerdict.team)}
              </div>
              <div style={{ color: MID, fontSize: 13.5, marginTop: 5, lineHeight: 1.45 }}>
                {narration.userVerdict.take}
              </div>
            </div>
          )}

          {/* Campeón del usuario fuera del top (solo dato) */}
          {userChampion && !narration.userVerdict && (
            <div style={{ color: DIM, fontSize: 12.5 }}>
              Tu campeón, {userChampion.name}, gana en {pct(userChampion.champion)} de las
              simulaciones (ranking FIFA #{userChampion.rank}).
            </div>
          )}

          <div style={{ color: DIM, fontSize: 11, textAlign: "right" }}>
            {iterations.toLocaleString("es")} torneos simulados · Confianza:{" "}
            {narration.confidence}
            {cached ? " · lectura en caché" : ""}
          </div>
        </div>
      )}
    </div>
  );
}

function OddsBar({ team, max }: { team: TeamOdds; max: number }) {
  const width = max > 0 ? (team.champion / max) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 96, flexShrink: 0, color: MID, fontSize: 12.5, fontWeight: 600 }}>
        {team.name}
      </div>
      <div style={{ flex: 1, height: 14, background: BG3, borderRadius: 99, overflow: "hidden" }}>
        <div
          style={{
            width: `${Math.max(width, 2)}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${GOLD}, ${GOLD2})`,
            borderRadius: 99,
          }}
        />
      </div>
      <div style={{ width: 48, flexShrink: 0, textAlign: "right", color: GOLD2, fontSize: 12.5, fontWeight: 700 }}>
        {pct(team.champion)}
      </div>
    </div>
  );
}

function VerdictCard({
  label,
  team,
  take,
  color,
}: {
  label: string;
  team: string;
  take: string;
  color: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 180,
        background: BG3,
        borderRadius: 11,
        padding: "11px 13px",
      }}
    >
      <div style={{ fontSize: 11, color: DIM, textTransform: "uppercase", letterSpacing: 1 }}>
        {label} · <span style={{ color }}>{teamName(team)}</span>
      </div>
      <div style={{ color: MID, fontSize: 13, marginTop: 5, lineHeight: 1.45 }}>{take}</div>
    </div>
  );
}
