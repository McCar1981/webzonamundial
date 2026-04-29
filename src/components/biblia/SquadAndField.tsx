"use client";

// Sección 9 + 10 — Plantilla 26 + 11 ideal en campo digital.
// Client component porque tiene tabs/filtros interactivos.

import { useEffect, useMemo, useState } from "react";
import type { NationalTeam, Player, StartingXI } from "@/types/team";
import SectionCard, { SectionHeader } from "./SectionCard";

type PosFilter = "ALL" | "GK" | "DEF" | "MID" | "FWD";

const POSITION_LABELS: Record<Exclude<PosFilter, "ALL">, string> = {
  GK: "Porteros",
  DEF: "Defensas",
  MID: "Mediocampo",
  FWD: "Delanteros",
};

const STATUS_LABELS: Record<"fixed" | "probable" | "bubble", string> = {
  fixed: "Fijo",
  probable: "Probable",
  bubble: "Burbuja",
};

const STATUS_COLORS: Record<"fixed" | "probable" | "bubble", { bg: string; text: string }> =
  {
    fixed: { bg: "rgba(34,197,94,0.12)", text: "#4ade80" },
    probable: { bg: "rgba(234,179,8,0.12)", text: "#facc15" },
    bubble: { bg: "rgba(148,163,184,0.12)", text: "#94a3b8" },
  };

export default function SquadAndField({ team }: { team: NationalTeam }) {
  const squad = team.wc_2026?.likely_squad ?? [];
  const xi = team.wc_2026?.starting_xi;

  const [view, setView] = useState<"squad" | "xi">("squad");

  // Si el usuario llega con hash #once (desde MiniNav o link directo),
  // activamos automáticamente la vista XI. También al cambiar el hash
  // mientras la página ya está abierta.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkHash = () => {
      if (window.location.hash === "#once" && xi) {
        setView("xi");
      }
    };
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, [xi]);

  if (squad.length === 0) return null;

  return (
    <SectionCard id="plantilla">
      <SectionHeader
        eyebrow="Posibles convocados"
        title={`Plantilla ${team.name_es}`}
        subtitle="Proyección de los 26 convocados al Mundial 2026."
        action={
          <div
            className="inline-flex rounded-xl border p-1"
            style={{
              borderColor: "var(--bb-border-subtle)",
              background: "rgba(11,24,37,0.6)",
            }}
            role="tablist"
            aria-label="Vista de plantilla"
          >
            <ToggleButton
              active={view === "squad"}
              onClick={() => setView("squad")}
              label="26 Convocados"
            />
            <ToggleButton
              active={view === "xi"}
              onClick={() => setView("xi")}
              label="11 Ideal"
              disabled={!xi}
            />
          </div>
        }
      />

      {/* Ancla "once" SIEMPRE presente en el DOM (aunque la vista activa
          sea Squad). El MiniNav scrollea aquí y nuestro useEffect del
          hashchange activa setView("xi") en paralelo. */}
      <span id="once" className="sr-only" aria-hidden />

      {view === "squad" ? <SquadGrid squad={squad} /> : null}
      {view === "xi" && xi ? (
        <DigitalField xi={xi} squad={squad} teamName={team.name_es} />
      ) : null}
    </SectionCard>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      disabled={disabled}
      className="bb-focusable px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed bb-touch"
      style={{
        background: active ? "linear-gradient(135deg, #C9A84C, #A8893D)" : "transparent",
        color: active ? "#030712" : "var(--bb-text-soft)",
      }}
    >
      {label}
    </button>
  );
}

/* ─────── 26 convocados ─────── */

function SquadGrid({ squad }: { squad: Player[] }) {
  const [filter, setFilter] = useState<PosFilter>("ALL");

  const counts = useMemo(() => {
    const c: Record<PosFilter, number> = { ALL: squad.length, GK: 0, DEF: 0, MID: 0, FWD: 0 };
    for (const p of squad) c[p.position]++;
    return c;
  }, [squad]);

  const filtered = filter === "ALL" ? squad : squad.filter((p) => p.position === filter);

  return (
    <div>
      {/* Filtros por posición */}
      <div className="flex flex-wrap gap-2 mb-5">
        <FilterChip
          label="Todos"
          active={filter === "ALL"}
          count={counts.ALL}
          onClick={() => setFilter("ALL")}
        />
        {(["GK", "DEF", "MID", "FWD"] as const).map((p) => (
          <FilterChip
            key={p}
            label={POSITION_LABELS[p]}
            active={filter === p}
            count={counts[p]}
            onClick={() => setFilter(p)}
          />
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((p) => (
          <PlayerCard key={p.id ?? p.full_name} player={p} />
        ))}
      </div>

      {/* Atribución global de fotos (cumple licencia Wikipedia Commons) */}
      {squad.some((p) => p.photo_url) ? (
        <p className="text-[10px] text-[var(--bb-text-dim)] mt-4 italic">
          Fotos:{" "}
          <a
            href="https://commons.wikimedia.org"
            target="_blank"
            rel="noopener noreferrer"
            className="bb-focusable underline decoration-dotted underline-offset-2 hover:text-[var(--bb-gold)]"
          >
            Wikipedia Commons
          </a>{" "}
          (licencias CC BY-SA / CC BY / dominio público según cada autor).
        </p>
      ) : null}
    </div>
  );
}

function FilterChip({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border"
      style={{
        background: active
          ? "linear-gradient(135deg, #C9A84C, #A8893D)"
          : "rgba(11,24,37,0.5)",
        color: active ? "#030712" : "#cbd5e1",
        borderColor: active ? "#C9A84C" : "rgba(255,255,255,0.06)",
      }}
    >
      {label}
      <span
        className="text-[10px] px-1.5 py-0.5 rounded-md font-mono"
        style={{
          background: active ? "rgba(0,0,0,0.18)" : "rgba(201,168,76,0.1)",
          color: active ? "#030712" : "#C9A84C",
        }}
      >
        {count}
      </span>
    </button>
  );
}

function PlayerCard({ player }: { player: Player }) {
  const status = STATUS_COLORS[player.status];
  return (
    <article
      className="rounded-xl border p-4 transition-all hover:border-[#C9A84C]/30"
      style={{
        borderColor: "rgba(255,255,255,0.06)",
        background: "rgba(11,24,37,0.5)",
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        {/* Avatar — usa <img> con object-position top para enfocar la cara
            (las fotos Wikipedia suelen ser de cuerpo entero) */}
        <span
          className="relative w-14 h-14 rounded-full flex items-center justify-center text-base font-black flex-shrink-0 overflow-hidden border-2"
          style={{
            background: player.photo_url
              ? "linear-gradient(135deg, #1a2438, #0B1825)"
              : "linear-gradient(135deg, rgba(201,168,76,0.25), rgba(201,168,76,0.08))",
            color: "#C9A84C",
            borderColor: "rgba(201,168,76,0.35)",
          }}
          aria-hidden
        >
          {player.photo_url ? (
            <img
              src={player.photo_url}
              alt=""
              loading="lazy"
              decoding="async"
              className="w-full h-full"
              style={{
                objectFit: "cover",
                objectPosition: "center top",
                // 1.15 escala ligeramente para que el rostro
                // (que suele estar arriba de la imagen) llene el círculo
                transform: "scale(1.15)",
                transformOrigin: "center top",
              }}
            />
          ) : (
            (player.shirt_number_expected ?? "?")
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-white truncate">
            {player.display_name ?? player.full_name}
          </div>
          <div className="text-[11px] text-[var(--bb-text-muted)] truncate">
            {player.detailed_position ?? player.position}
            {player.shirt_number_expected
              ? ` · #${player.shirt_number_expected}`
              : ""}
          </div>
        </div>
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex-shrink-0"
          style={{ background: status.bg, color: status.text }}
        >
          {STATUS_LABELS[player.status]}
        </span>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-[var(--bb-text-muted)]">
        {player.club?.country_iso ? (
          <img
            src={`https://flagcdn.com/w20/${player.club.country_iso}.png`}
            alt=""
            aria-hidden
            className="w-4 h-3 object-cover rounded-sm flex-shrink-0"
          />
        ) : null}
        <span className="truncate">
          {player.club?.name}
          {player.club?.league ? ` · ${player.club.league}` : ""}
        </span>
      </div>
    </article>
  );
}

/* ─────── 11 Ideal — Campo digital ─────── */

function DigitalField({
  xi,
  squad,
  teamName,
}: {
  xi: StartingXI;
  squad: Player[];
  teamName: string;
}) {
  const playerById = useMemo(() => {
    const map = new Map<string, Player>();
    for (const p of squad) {
      if (p.id) map.set(p.id, p);
    }
    return map;
  }, [squad]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-[var(--bb-text-muted)]">
          <strong className="text-white">{xi.formation}</strong> · 11 ideal de{" "}
          {teamName}
        </div>
      </div>

      {/* Campo */}
      <div
        className="relative mx-auto rounded-2xl overflow-hidden border border-[#C9A84C]/15"
        style={{
          aspectRatio: "2 / 3",
          maxWidth: 520,
          background: `
            linear-gradient(180deg, #14532d 0%, #166534 100%)
          `,
        }}
      >
        {/* Líneas del campo */}
        <FieldLines />

        {/* Jugadores */}
        {xi.players.map((p) => {
          const player = playerById.get(p.player_id);
          if (!player) return null;
          return (
            <PlayerDot
              key={p.player_id}
              x={p.position.x}
              y={p.position.y}
              player={player}
            />
          );
        })}
      </div>

      <p className="text-[11px] text-[var(--bb-text-muted)] mt-3 text-center italic">
        Proyección — alineación habitual del DT durante el ciclo.
      </p>
    </div>
  );
}

function FieldLines() {
  // Líneas de campo en SVG. Coordenadas 0-100 x/y, igual que las de los jugadores.
  return (
    <svg
      viewBox="0 0 100 150"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none"
    >
      {/* Bordes */}
      <rect
        x="2"
        y="2"
        width="96"
        height="146"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="0.5"
      />
      {/* Línea media */}
      <line
        x1="2"
        y1="75"
        x2="98"
        y2="75"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="0.4"
      />
      {/* Círculo central */}
      <circle
        cx="50"
        cy="75"
        r="9"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="0.4"
      />
      {/* Punto medio */}
      <circle cx="50" cy="75" r="0.5" fill="rgba(255,255,255,0.3)" />
      {/* Áreas — abajo (defensa nuestra) */}
      <rect
        x="25"
        y="135"
        width="50"
        height="13"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="0.4"
      />
      <rect
        x="35"
        y="143"
        width="30"
        height="5"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="0.4"
      />
      {/* Áreas — arriba (rival) */}
      <rect
        x="25"
        y="2"
        width="50"
        height="13"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="0.4"
      />
      <rect
        x="35"
        y="2"
        width="30"
        height="5"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="0.4"
      />
      {/* Punto penal arriba/abajo */}
      <circle cx="50" cy="11" r="0.5" fill="rgba(255,255,255,0.3)" />
      <circle cx="50" cy="139" r="0.5" fill="rgba(255,255,255,0.3)" />
    </svg>
  );
}

function PlayerDot({
  x,
  y,
  player,
}: {
  x: number;
  y: number;
  player: Player;
}) {
  // Coordenadas 0-100 sobre el SVG del campo (top:0 = ataque rival,
  // top:100 = portería propia).
  const left = `${x}%`;
  const top = `${y}%`;

  // Apellido (último componente del display_name)
  const lastName = (player.display_name ?? player.full_name)
    .split(" ")
    .slice(-1)[0];

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 group"
      style={{ left, top }}
    >
      <div className="flex flex-col items-center gap-1.5">
        {/* Avatar con foto + dorsal flotante */}
        <span className="relative">
          {/* Glow dorado detrás (capa lejana) */}
          <span
            aria-hidden
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(201,168,76,0.55), transparent 70%)",
              filter: "blur(8px)",
              transform: "scale(1.4)",
            }}
          />
          {/* Avatar real */}
          <span
            className="relative block w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-base font-black shadow-xl border-2"
            style={{
              background: player.photo_url
                ? "linear-gradient(135deg, #1a2438, #0B1825)"
                : "linear-gradient(135deg, #C9A84C, #A8893D)",
              color: "#030712",
              borderColor: "rgba(232,212,139,0.85)",
              boxShadow:
                "0 0 0 1px rgba(0,0,0,0.5), 0 4px 14px rgba(0,0,0,0.5), 0 0 24px rgba(201,168,76,0.25)",
            }}
            aria-hidden
          >
            {player.photo_url ? (
              <img
                src={player.photo_url}
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full h-full"
                style={{
                  objectFit: "cover",
                  objectPosition: "center top",
                  transform: "scale(1.15)",
                  transformOrigin: "center top",
                }}
              />
            ) : (
              (player.shirt_number_expected ?? "?")
            )}
          </span>
          {/* Dorsal flotante (badge) */}
          {player.shirt_number_expected ? (
            <span
              className="absolute -bottom-1 -right-1 min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center text-[10px] font-black border-2 leading-none"
              style={{
                background: "linear-gradient(135deg, #C9A84C, #A8893D)",
                color: "#030712",
                borderColor: "#0B1825",
                boxShadow: "0 0 8px rgba(201,168,76,0.6)",
              }}
              aria-hidden
            >
              {player.shirt_number_expected}
            </span>
          ) : null}
        </span>
        {/* Apellido bajo la foto */}
        <span
          className="text-[10px] font-bold text-white px-2 py-0.5 rounded whitespace-nowrap leading-none"
          style={{
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.08)",
            maxWidth: "92px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textShadow: "0 1px 2px rgba(0,0,0,0.8)",
          }}
        >
          {lastName}
        </span>
        {/* Tooltip con full name al hover (a11y screen readers ya leen
            el nombre via texto debajo) */}
        <span className="sr-only">
          {player.display_name ?? player.full_name}
          {player.detailed_position ? ` · ${player.detailed_position}` : ""}
        </span>
      </div>
    </div>
  );
}
