"use client";

// Cliente del preview. Renderiza CelebrationOverlay con un BracketState
// mock para forzar el campeón pasado por query param. Botones de
// shortcut para saltar entre varias selecciones rápido.

import { useState, useMemo } from "react";
import Link from "next/link";
import CelebrationOverlay from "@/components/bracket/CelebrationOverlay";
import { BRACKET_TEAMS, TEAM_BY_ID } from "@/lib/bracket/teams";
import type { BracketState, Pick } from "@/lib/bracket/types";

const QUICK_TEAMS = [
  "ARG", // Argentina (celeste)
  "BRA", // Brasil (verde)
  "ESP", // España (rojo)
  "FRA", // Francia (azul)
  "GER", // Alemania (negro → fallback dorado)
  "POR", // Portugal (rojo oscuro)
  "MEX", // México (verde)
  "JPN", // Japón (rojo intenso)
  "MAR", // Marruecos (rojo)
  "USA", // USA (azul navy)
];

function buildMockState(teamId: string, totalGoals: number): BracketState {
  // 104 picks falsos con goles repartidos para que sumen totalGoals.
  const picks: Record<string, Pick> = {};
  const matchCount = 104;
  const goalsPerMatch = Math.max(1, Math.floor(totalGoals / matchCount));
  let remainder = totalGoals - goalsPerMatch * matchCount;

  for (let i = 0; i < matchCount; i++) {
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder--;
    const total = goalsPerMatch + extra;
    const a = Math.ceil(total / 2);
    const b = total - a;
    picks[`match-${i}`] = {
      matchId: `match-${i}`,
      winner: "MOCK",
      scoreA: a,
      scoreB: b,
      ts: Date.now(),
    };
  }

  return {
    matches: [],
    picks,
    history: [],
    currentPhaseIdx: 6,
    champion: teamId,
  };
}

export default function PreviewCelebrationClient({
  teamId,
  totalGoals,
}: {
  teamId: string;
  totalGoals: number;
}) {
  const teamExists = !!TEAM_BY_ID[teamId];
  const [show, setShow] = useState(true);

  const state = useMemo(
    () => buildMockState(teamExists ? teamId : "ARG", totalGoals),
    [teamId, teamExists, totalGoals],
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000000",
        color: "#fff",
        fontFamily:
          "var(--zm-font-outfit, 'Outfit', system-ui, sans-serif)",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
        }}
      >
        <Link
          href="/bracket"
          style={{
            color: "#C9A84C",
            textDecoration: "none",
            fontSize: 13,
            letterSpacing: "0.04em",
          }}
        >
          ← Volver al bracket
        </Link>

        <h1
          style={{
            margin: "20px 0 6px",
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: "-0.02em",
          }}
        >
          Preview Victory Screen
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: 14,
            marginBottom: 24,
            lineHeight: 1.6,
          }}
        >
          Página interna de QA para visualizar el overlay con cualquier
          campeón sin completar el bracket entero. Cambia el team con los
          botones o editando <code style={{ color: "#FDE68A" }}>?team=XXX</code>{" "}
          en la URL.
        </p>

        {!teamExists && (
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(239,14,44,0.1)",
              border: "1px solid rgba(239,14,44,0.4)",
              borderRadius: 8,
              color: "#FCA5A5",
              marginBottom: 20,
              fontSize: 13,
            }}
          >
            ⚠ Team ID “{teamId}” no encontrado. Usando ARG por defecto.
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 20,
          }}
        >
          {QUICK_TEAMS.map((id) => {
            const t = TEAM_BY_ID[id];
            const isActive = id === teamId;
            return (
              <Link
                key={id}
                href={`/bracket/preview-celebration?team=${id}&goals=${totalGoals}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  background: isActive
                    ? "rgba(201,168,76,0.15)"
                    : "rgba(255,255,255,0.04)",
                  border: isActive
                    ? "1px solid #C9A84C"
                    : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: isActive ? "#FDE68A" : "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    background: t?.color || "#999",
                    borderRadius: 2,
                    boxShadow: `0 0 8px ${t?.color || "#999"}`,
                  }}
                />
                {t?.name || id}
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          style={{
            padding: "10px 18px",
            background: show
              ? "rgba(255,255,255,0.06)"
              : "linear-gradient(135deg, #C9A84C, #E8C76B)",
            color: show ? "#fff" : "#000000",
            border: show ? "1px solid rgba(255,255,255,0.15)" : "none",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          {show ? "Ocultar overlay" : "Mostrar overlay"}
        </button>

        <div
          style={{
            marginTop: 28,
            padding: "16px 20px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
            fontSize: 12,
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.7,
          }}
        >
          <strong style={{ color: "#fff" }}>Cosas a comprobar:</strong>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
            <li>
              Los <em>colores</em> del confeti, glow del trofeo, gradient del
              título y borde del card cambian según el team.
            </li>
            <li>
              La <em>bandera</em> y el <em>nombre del campeón</em> son los
              correctos.
            </li>
            <li>
              El número de <em>goles predichos</em> (
              {totalGoals}) sale en la stat del medio.
            </li>
            <li>
              El botón <em>“Compartir mi Mundial”</em> tiene el sweep light
              animado.
            </li>
            <li>
              En mobile (DevTools 375px) el fondo cambia a la versión
              vertical mobile.
            </li>
          </ul>
          <p style={{ marginTop: 12 }}>
            URL params disponibles:{" "}
            <code style={{ color: "#FDE68A" }}>?team=XXX</code> (ID 3 letras)
            ,{" "}
            <code style={{ color: "#FDE68A" }}>?goals=N</code> (total goles
            predichos).
          </p>
        </div>
      </div>

      <CelebrationOverlay
        state={state}
        show={show}
        onEdit={() => setShow(false)}
        onShare={() => {
          // En preview, simplemente mostramos un alert
          alert("Share action triggered (preview mode)");
        }}
      />
    </div>
  );
}
