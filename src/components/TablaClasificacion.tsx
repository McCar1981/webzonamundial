"use client";

import { Seleccion } from "@/data/selecciones";
import { useLanguage } from "@/i18n/LanguageContext";
import FlagImage from "@/components/FlagImage";
import { standingsOrder, type TeamMeta } from "@/lib/grupos/standings";
import type { LiveMap } from "@/lib/calendario/live";

interface TablaClasificacionProps {
  selecciones: Seleccion[];
  groupColor: string;
  /** Estado en vivo (matchId → marcador/estado). Vacío fuera del torneo: la
   *  tabla queda a cero y ordenada por ranking FIFA, como antes. */
  liveMap?: LiveMap;
}

export default function TablaClasificacion({ selecciones, groupColor, liveMap = {} }: TablaClasificacionProps) {
  const { t } = useLanguage();
  const isEN = t.nav.selecciones === "48 Teams";

  const labels = isEN
    ? { title: "Standings", team: "Team", pj: "MP", g: "W", e: "D", p: "L", gf: "GF", ga: "GA", gd: "GD", pts: "Pts",
        live: "LIVE", updated: "Live table", qualify: "Advance", third: "Best 3rd in contention", out: "Eliminated", pending: "Updates as matches finish" }
    : { title: "Tabla de clasificación", team: "Equipo", pj: "PJ", g: "G", e: "E", p: "P", gf: "GF", ga: "GA", gd: "GD", pts: "Pts",
        live: "EN VIVO", updated: "Tabla en vivo", qualify: "Clasifican", third: "En lucha por mejor tercero", out: "Eliminado", pending: "Se actualiza al terminar cada partido" };

  const grupo = selecciones[0]?.grupo ?? "";
  const teams: TeamMeta[] = selecciones.map((s) => ({
    flagCode: s.flagCode,
    nombre: s.nombre,
    rankingFIFA: s.rankingFIFA,
  }));
  const byFlag = new Map(selecciones.map((s) => [s.flagCode, s]));

  const { ordered, anyPlayed, anyLive } = standingsOrder(grupo, teams, liveMap);

  // Posición: 1-2 verde (clasifican), 3 amarillo (opción mejor tercero), 4 rojo (eliminado)
  const positionBorderColor = (pos: number) => {
    if (pos <= 2) return "border-l-green-500";
    if (pos === 3) return "border-l-yellow-500";
    return "border-l-red-800";
  };

  return (
    <div className="rounded-xl border border-white/5 bg-[#0B0F1A] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <svg className="w-5 h-5 shrink-0" style={{ color: groupColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 6h18M3 14h18M3 18h18" />
        </svg>
        <h3 className="text-white font-semibold text-base">{labels.title}</h3>
        {anyLive ? (
          <span className="ml-auto flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide" style={{ color: "#ff6b57" }}>
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute h-full w-full animate-ping rounded-full opacity-75" style={{ background: "#ff6b57" }} />
              <span className="relative h-1.5 w-1.5 rounded-full" style={{ background: "#ff6b57" }} />
            </span>
            {labels.live}
          </span>
        ) : anyPlayed ? (
          <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-[#6a7a9a]">{labels.updated}</span>
        ) : null}
      </div>

      {/* Table wrapper — scrollable on mobile */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px] text-sm">
          <thead>
            <tr className="text-[#c9a84c] uppercase text-[11px] tracking-wider border-b border-white/5">
              <th className="py-2 px-3 text-center w-8">#</th>
              <th className="py-2 px-3 text-left">{labels.team}</th>
              <th className="py-2 px-2 text-center">{labels.pj}</th>
              <th className="py-2 px-2 text-center">{labels.g}</th>
              <th className="py-2 px-2 text-center">{labels.e}</th>
              <th className="py-2 px-2 text-center">{labels.p}</th>
              <th className="py-2 px-2 text-center">{labels.gf}</th>
              <th className="py-2 px-2 text-center">{labels.ga}</th>
              <th className="py-2 px-2 text-center">{labels.gd}</th>
              <th className="py-2 px-2 text-center font-bold">{labels.pts}</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((team, idx) => {
              const pos = idx + 1;
              const r = team.row;
              const sel = byFlag.get(team.flagCode);
              return (
                <tr
                  key={team.flagCode}
                  className={`border-b border-white/5 last:border-b-0 hover:bg-white/[0.03] transition-colors border-l-4 ${positionBorderColor(pos)}`}
                >
                  <td className="py-2.5 px-3 text-center text-white/50 text-xs font-medium">{pos}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <FlagImage code={team.flagCode} alt={team.nombre} width={24} className="rounded-sm shadow-sm" />
                      <span className="text-white text-sm font-medium truncate">{sel?.nombre ?? team.nombre}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-center text-white/60">{r.pj}</td>
                  <td className="py-2.5 px-2 text-center text-white/60">{r.g}</td>
                  <td className="py-2.5 px-2 text-center text-white/60">{r.e}</td>
                  <td className="py-2.5 px-2 text-center text-white/60">{r.p}</td>
                  <td className="py-2.5 px-2 text-center text-white/60">{r.gf}</td>
                  <td className="py-2.5 px-2 text-center text-white/60">{r.ga}</td>
                  <td className="py-2.5 px-2 text-center text-white/60">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                  <td className="py-2.5 px-2 text-center text-white font-bold">{r.pts}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 border-t border-white/5 text-[10px] text-[#6a7a9a]">
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-1 rounded-sm bg-green-500" />{labels.qualify}</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-1 rounded-sm bg-yellow-500" />{labels.third}</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-1 rounded-sm bg-red-800" />{labels.out}</span>
        {!anyPlayed && <span className="ml-auto italic">{labels.pending}</span>}
      </div>
    </div>
  );
}
