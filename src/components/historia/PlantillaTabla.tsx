// ZonaMundial — Tabla de plantilla (campeón / subcampeón)
// Server component: agrupa por posición, marca capitán y goleadores.

import type { JugadorPlantilla } from "@/types/edicion";

const POS_ORDER: JugadorPlantilla["posicion"][] = ["GK", "DEF", "MID", "FWD"];
const POS_LABEL: Record<JugadorPlantilla["posicion"], string> = {
  GK: "Porteros",
  DEF: "Defensas",
  MID: "Mediocampistas",
  FWD: "Delanteros",
};

const GOLD = "#c9a84c";

interface Props {
  plantilla: JugadorPlantilla[];
  titulo?: string;
}

export default function PlantillaTabla({ plantilla, titulo }: Props) {
  if (!plantilla || plantilla.length === 0) return null;

  const grouped = POS_ORDER.map((pos) => ({
    pos,
    jugadores: plantilla
      .filter((j) => j.posicion === pos)
      .sort((a, b) => (a.dorsal ?? 99) - (b.dorsal ?? 99)),
  })).filter((g) => g.jugadores.length > 0);

  return (
    <div>
      {titulo && (
        <h3 className="text-base sm:text-lg font-bold text-white mb-3">{titulo}</h3>
      )}
      <div className="rounded-2xl border border-[#1E293B] overflow-hidden bg-[#0F1D32]/40">
        {grouped.map(({ pos, jugadores }) => (
          <div key={pos}>
            <div
              className="px-3 sm:px-4 py-2 bg-[#0B1825] text-[10px] font-bold uppercase tracking-wider"
              style={{ color: GOLD }}
            >
              {POS_LABEL[pos]} · {jugadores.length}
            </div>
            {jugadores.map((j, i) => (
              <div
                key={`${pos}-${j.dorsal ?? j.nombre}-${i}`}
                className="grid items-center gap-3 px-3 sm:px-4 py-2.5 border-b border-[#0F172A] last:border-b-0"
                style={{
                  gridTemplateColumns: "32px 1fr auto auto",
                  background: i % 2 === 0 ? "transparent" : "rgba(15,23,42,0.3)",
                }}
              >
                <span
                  className="text-xs sm:text-sm font-black tabular-nums text-center"
                  style={{ color: j.capitan ? GOLD : "#64748B" }}
                >
                  {j.dorsal ?? "—"}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">
                    {j.nombre}
                    {j.capitan && (
                      <span
                        className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          color: GOLD,
                          background: "rgba(201,168,76,0.12)",
                        }}
                      >
                        C
                      </span>
                    )}
                  </div>
                  {j.clubOrigen && (
                    <div className="text-[10px] text-gray-500 truncate">
                      {j.clubOrigen}
                      {j.edad ? ` · ${j.edad}a` : ""}
                    </div>
                  )}
                </div>
                {j.goles !== undefined && j.goles > 0 && (
                  <span
                    className="text-xs font-bold flex items-center gap-1"
                    style={{ color: GOLD }}
                  >
                    <span>⚽</span>
                    <span className="tabular-nums">{j.goles}</span>
                  </span>
                )}
                {j.partidosJugados !== undefined && (
                  <span className="text-[10px] tabular-nums text-gray-500 hidden sm:inline">
                    {j.partidosJugados}p
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="text-[10px] text-gray-600 mt-2 px-1">
        Plantilla completa · {plantilla.length} jugadores · {" "}
        <span style={{ color: GOLD }}>C</span> = Capitán · ⚽ goles del torneo
      </div>
    </div>
  );
}
