"use client";

// FilterSheet — todos los filtros del calendario en un panel bajo demanda:
// bottom-sheet en móvil, modal centrado en escritorio. Saca de la página la
// antigua pila fija de controles (tabs de fase + 2 desplegables + favoritos +
// 12 chips de grupo) que empujaba los partidos 2 pantallas hacia abajo.

import { useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { PHASES, GROUPS, GOLD, MID } from "@/data/matches";
import { Dropdown } from "./Dropdown";
import { FilterBtn } from "./FilterBtn";

interface Option {
  value: string;
  label: string;
  icon?: string;
}

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  phase: string;
  setPhase: (p: string) => void;
  group: string;
  setGroup: (g: string) => void;
  teamFilter: string;
  setTeamFilter: (v: string) => void;
  venueFilter: string;
  setVenueFilter: (v: string) => void;
  favoritesOnly: boolean;
  setFavoritesOnly: (b: boolean) => void;
  teamOptions: Option[];
  venueOptions: Option[];
  resultCount: number;
  hasActiveFilters: boolean;
  onClear: () => void;
}

export function FilterSheet({
  open,
  onClose,
  phase,
  setPhase,
  group,
  setGroup,
  teamFilter,
  setTeamFilter,
  venueFilter,
  setVenueFilter,
  favoritesOnly,
  setFavoritesOnly,
  teamOptions,
  venueOptions,
  resultCount,
  hasActiveFilters,
  onClear,
}: FilterSheetProps) {
  const { t } = useLanguage();
  const cT = t.calendario;

  // Escape cierra + bloqueo del scroll de fondo (mismo patrón que MatchModal).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={cT.filtros}
      onClick={onClose}
      className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center sm:p-5"
      style={{ background: "rgba(6,11,20,0.8)", backdropFilter: "blur(6px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[84vh] w-full flex-col overflow-hidden rounded-t-[24px] border border-white/10 bg-[#0F1D32] sm:max-w-lg sm:rounded-3xl"
      >
        {/* Asa + cabecera */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-base font-black text-white">{cT.filtros}</h2>
          <button
            onClick={onClose}
            aria-label="✕"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8a94b0] transition-colors hover:bg-white/5 hover:text-white"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Fase */}
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#6a7a9a]">
            {cT.faseLabel}
          </p>
          <div className="mb-5 flex flex-wrap gap-1.5">
            <FilterBtn
              label={cT.todas}
              active={phase === "all"}
              onClick={() => {
                setPhase("all");
                setGroup("all");
              }}
            />
            {PHASES.map((p) => (
              <FilterBtn
                key={p}
                label={cT.phases[p] ?? p}
                active={phase === p}
                onClick={() => {
                  setPhase(p);
                  setGroup("all");
                }}
              />
            ))}
          </div>

          {/* Grupos (solo con fase de grupos a la vista) */}
          {(phase === "all" || phase === "Fase de grupos") && (
            <>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#6a7a9a]">
                {cT.gruposTitulo}
              </p>
              <div className="mb-5 flex flex-wrap gap-1.5">
                <button
                  onClick={() => setGroup("all")}
                  className="rounded-xl px-3.5 py-1.5 text-[13px] transition-all"
                  style={{
                    border: group === "all" ? `2px solid ${GOLD}` : "1px solid rgba(255,255,255,0.08)",
                    background: group === "all" ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.03)",
                    color: group === "all" ? GOLD : MID,
                    fontWeight: group === "all" ? 800 : 500,
                  }}
                >
                  {cT.todos}
                </button>
                {GROUPS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGroup(g)}
                    className="min-w-[38px] rounded-xl px-3 py-1.5 text-[13px] transition-all"
                    style={{
                      border: group === g ? `2px solid ${GOLD}` : "1px solid rgba(255,255,255,0.08)",
                      background: group === g ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.03)",
                      color: group === g ? GOLD : MID,
                      fontWeight: group === g ? 800 : 500,
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Selección + Sede */}
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Dropdown
              label={cT.seleccion}
              value={teamFilter}
              options={teamOptions}
              onChange={setTeamFilter}
            />
            <Dropdown
              label={cT.sede}
              value={venueFilter}
              options={venueOptions}
              onChange={(v) => {
                if (!v.startsWith("__header_")) setVenueFilter(v);
              }}
            />
          </div>

          {/* Favoritos */}
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
              favoritesOnly
                ? "border-[#c9a84c]/40 bg-[#c9a84c]/15 text-[#c9a84c]"
                : "border-white/8 bg-[#0B1825] text-[#8a94b0] hover:border-white/15"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill={favoritesOnly ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              {cT.soloFavoritos}
            </span>
            <span
              className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${
                favoritesOnly ? "justify-end bg-[#c9a84c]" : "justify-start bg-white/10"
              }`}
            >
              <span className="h-4 w-4 rounded-full bg-white shadow" />
            </span>
          </button>
        </div>

        {/* Pie: limpiar + aplicar */}
        <div className="flex items-center gap-3 border-t border-white/[0.06] px-5 py-4">
          {hasActiveFilters && (
            <button
              onClick={onClear}
              className="text-sm font-semibold text-[#c9a84c] hover:underline"
            >
              {cT.limpiar}
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto rounded-xl bg-gradient-to-br from-[#c9a84c] to-[#e8d48b] px-6 py-2.5 text-sm font-extrabold text-[#060B14] transition-transform hover:scale-[1.02]"
          >
            {cT.aplicar} ({resultCount})
          </button>
        </div>
      </div>
    </div>
  );
}
