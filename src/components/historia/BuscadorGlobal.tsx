// ZonaMundial — Buscador global
// Client component: filtrado en cliente sobre índice precargado

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

const GOLD = "#c9a84c";

export interface SearchItem {
  type:
    | "edicion"
    | "jugador"
    | "seleccion"
    | "balon"
    | "mascota"
    | "estadio"
    | "arbitro"
    | "polemica"
    | "gol"
    | "trofeo"
    | "premio"
    | "era"
    | "curiosidad"
    | "entrenador"
    | "partido"
    | "confederacion"
    | "camiseta"
    | "momento"
    | "sociopolitica";
  title: string;
  subtitle: string;
  href: string;
  // Texto adicional para matchear (oculto)
  searchExtra?: string;
}

const TYPE_LABELS: Record<SearchItem["type"], { label: string; color: string }> = {
  edicion: { label: "Edición", color: "#C9A84C" },
  jugador: { label: "Jugador", color: "#EC4899" },
  seleccion: { label: "Selección", color: "#3B82F6" },
  balon: { label: "Balón", color: "#F59E0B" },
  mascota: { label: "Mascota", color: "#10B981" },
  estadio: { label: "Estadio", color: "#8B5CF6" },
  arbitro: { label: "Árbitro", color: "#A78BFA" },
  polemica: { label: "Polémica", color: "#DC2626" },
  gol: { label: "Gol", color: "#22C55E" },
  trofeo: { label: "Trofeo", color: "#FBBF24" },
  premio: { label: "Premio", color: "#FBBF24" },
  era: { label: "Era", color: "#a69a82" },
  curiosidad: { label: "Curiosidad", color: "#8b8168" },
  entrenador: { label: "Entrenador", color: "#06B6D4" },
  partido: { label: "Partido", color: "#F97316" },
  confederacion: { label: "Confederación", color: "#0EA5E9" },
  camiseta: { label: "Camiseta", color: "#FB7185" },
  momento: { label: "Momento", color: "#A3E635" },
  sociopolitica: { label: "Sociopolítica", color: "#EF4444" },
};

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface Props {
  items: SearchItem[];
}

export default function BuscadorGlobal({ items }: Props) {
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<SearchItem["type"] | "all">("all");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const queryNorm = useMemo(() => normalizar(query), [query]);

  const filtered = useMemo(() => {
    if (!queryNorm && activeType === "all") return items.slice(0, 50);
    return items
      .filter((item) => {
        if (activeType !== "all" && item.type !== activeType) return false;
        if (!queryNorm) return true;
        const haystack = normalizar(
          `${item.title} ${item.subtitle} ${item.searchExtra ?? ""}`
        );
        return queryNorm.split(" ").every((token) => haystack.includes(token));
      })
      .slice(0, 100);
  }, [queryNorm, activeType, items]);

  const counts = useMemo(() => {
    const out: Record<string, number> = { all: items.length };
    for (const item of items) {
      out[item.type] = (out[item.type] ?? 0) + 1;
    }
    return out;
  }, [items]);

  const types = Object.keys(TYPE_LABELS) as Array<SearchItem["type"]>;

  return (
    <div>
      <div className="sticky top-16 z-20 bg-[#000000]/95 backdrop-blur py-3 -mx-3 sm:-mx-5 px-3 sm:px-5 border-b border-[#241e12]">
        <div className="relative">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar jugador, edición, gol, polémica… (Ctrl+K)"
            className="w-full px-5 py-3 sm:py-4 rounded-xl bg-[#14110a] border border-[#241e12] text-white placeholder:text-gray-500 text-base focus:border-[#C9A84C] focus:outline-none transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex gap-1.5 sm:gap-2 mt-3 overflow-x-auto -mx-3 sm:-mx-5 px-3 sm:px-5 pb-1">
          <FilterChip
            label="Todos"
            count={counts.all}
            active={activeType === "all"}
            onClick={() => setActiveType("all")}
          />
          {types.map((t) => {
            const c = counts[t];
            if (!c) return null;
            return (
              <FilterChip
                key={t}
                label={TYPE_LABELS[t].label}
                count={c}
                active={activeType === t}
                color={TYPE_LABELS[t].color}
                onClick={() => setActiveType(t)}
              />
            );
          })}
        </div>
      </div>

      {/* RESULTADOS */}
      <div className="mt-5">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="text-4xl mb-3">🔍</div>
            <div className="text-sm">Sin resultados para «{query}»</div>
            <div className="text-xs text-gray-600 mt-2">
              Prueba: Maradona · México 86 · Mineirazo · Naranjito
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item, i) => {
              const meta = TYPE_LABELS[item.type];
              return (
                <Link
                  key={`${item.type}-${item.href}-${i}`}
                  href={item.href}
                  className="block p-3 sm:p-4 rounded-xl border border-[#241e12] bg-[#14110a]/60 hover:border-[#C9A84C]/40 transition-all no-underline group"
                >
                  <div className="flex items-baseline gap-3 mb-1 flex-wrap">
                    <span
                      className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{
                        color: meta.color,
                        background: `${meta.color}15`,
                      }}
                    >
                      {meta.label}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white truncate">
                      {item.title}
                    </h3>
                    <span className="ml-auto text-[10px] text-gray-600 group-hover:text-[#C9A84C] transition-colors">
                      →
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{item.subtitle}</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-[10px] text-gray-600 mt-4 text-center">
        Indexa {items.length} elementos · {filtered.length} resultados visibles
      </div>
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  color,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold whitespace-nowrap transition-all"
      style={{
        background: active ? (color ? `${color}20` : "rgba(201,168,76,0.15)") : "#14110a",
        borderColor: active ? (color ?? GOLD) : "#241e12",
        color: active ? (color ?? GOLD) : "#a69a82",
      }}
    >
      <span>{label}</span>
      <span className="text-[9px] tabular-nums opacity-70">{count}</span>
    </button>
  );
}
