// ZonaMundial — Bracket eliminatorio (octavos→final)
// Server component, layout responsive con CSS grid.

import type { Partido, FasesKO } from "@/types/edicion";

const GOLD = "#c9a84c";

interface Props {
  fasesKO?: FasesKO;
  partido3?: Partido;
  partidoFinal?: Partido;
}

function MatchCard({ p, fase }: { p: Partido; fase?: string }) {
  return (
    <div className="rounded-lg border border-[#241e12] bg-[#14110a]/60 p-2 sm:p-2.5 text-[11px] sm:text-xs">
      {fase && (
        <div className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1">
          {fase}
        </div>
      )}
      <div className="flex items-center gap-1.5 mb-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://flagcdn.com/w20/${p.local.iso2}.png`}
          alt=""
          className="w-4 h-3 object-cover rounded-[1px] flex-shrink-0"
          loading="lazy"
        />
        <span className="font-semibold text-white truncate flex-1">{p.local.pais}</span>
      </div>
      <div className="flex items-center gap-1.5 mb-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://flagcdn.com/w20/${p.visitante.iso2}.png`}
          alt=""
          className="w-4 h-3 object-cover rounded-[1px] flex-shrink-0"
          loading="lazy"
        />
        <span className="font-semibold text-gray-300 truncate flex-1">
          {p.visitante.pais}
        </span>
      </div>
      <div
        className="text-center font-black tabular-nums text-sm border-t border-[#241e12] pt-1"
        style={{ color: GOLD }}
      >
        {p.marcador}
      </div>
    </div>
  );
}

export default function BracketEliminatorio({
  fasesKO,
  partido3,
  partidoFinal,
}: Props) {
  if (!fasesKO && !partidoFinal) return null;

  const octavos = fasesKO?.octavos ?? [];
  const cuartos = fasesKO?.cuartos ?? [];
  const semifinales = fasesKO?.semifinales ?? [];

  const cols: { label: string; partidos: Partido[] }[] = [];
  if (octavos.length > 0) cols.push({ label: "Octavos", partidos: octavos });
  if (cuartos.length > 0) cols.push({ label: "Cuartos", partidos: cuartos });
  if (semifinales.length > 0) cols.push({ label: "Semifinal", partidos: semifinales });
  if (partidoFinal) cols.push({ label: "Final", partidos: [partidoFinal] });

  if (cols.length === 0) return null;

  return (
    <div className="overflow-x-auto -mx-3 sm:mx-0">
      <div className="px-3 sm:px-0 min-w-[600px]">
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(140px, 1fr))` }}
        >
          {cols.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-2">
              <div
                className="text-[10px] font-bold uppercase tracking-wider mb-1 text-center"
                style={{ color: GOLD }}
              >
                {col.label}
              </div>
              <div
                className="flex flex-col"
                style={{
                  gap: ci === 0 ? "8px" : ci === 1 ? "32px" : ci === 2 ? "80px" : "0",
                  justifyContent: "center",
                  flex: 1,
                }}
              >
                {col.partidos.map((p, i) => (
                  <MatchCard key={i} p={p} />
                ))}
              </div>
            </div>
          ))}
        </div>
        {partido3 && (
          <div className="mt-6 pt-4 border-t border-[#241e12]">
            <div
              className="text-[10px] font-bold uppercase tracking-wider mb-2 text-center"
              style={{ color: GOLD }}
            >
              Tercer puesto
            </div>
            <div className="max-w-[200px] mx-auto">
              <MatchCard p={partido3} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
