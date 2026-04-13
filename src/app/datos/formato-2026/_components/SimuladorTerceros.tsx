'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

interface TeamRow {
  id: number;
  name: string;
  pts: number;
  gf: number;
  dg: number;
  fp: number;
  ranking: number;
}

const INITIAL_DATA = [
  { pts: 4, gf: 3, dg: -1, fp: 4, ranking: 12 },
  { pts: 3, gf: 2, dg: -2, fp: 5, ranking: 28 },
  { pts: 4, gf: 4, dg: 0, fp: 3, ranking: 18 },
  { pts: 3, gf: 3, dg: -1, fp: 6, ranking: 22 },
  { pts: 2, gf: 2, dg: -3, fp: 7, ranking: 35 },
  { pts: 4, gf: 3, dg: -1, fp: 4, ranking: 14 },
  { pts: 3, gf: 2, dg: -2, fp: 5, ranking: 30 },
  { pts: 4, gf: 5, dg: 1, fp: 2, ranking: 10 },
  { pts: 3, gf: 1, dg: -3, fp: 8, ranking: 42 },
  { pts: 4, gf: 4, dg: 0, fp: 3, ranking: 16 },
  { pts: 2, gf: 2, dg: -2, fp: 6, ranking: 38 },
  { pts: 3, gf: 3, dg: -1, fp: 5, ranking: 24 },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function SimuladorTerceros() {
  const { t } = useLanguage();
  const f = t.formato2026;

  const initialTeams = useMemo<TeamRow[]>(() => {
    return INITIAL_DATA.map((d, idx) => {
      const group = String.fromCharCode(65 + idx);
      return {
        id: idx,
        name: f.simulatorTeamLabel.replace('{group}', group),
        ...d,
      };
    });
  }, [f.simulatorTeamLabel]);

  const [teams, setTeams] = useState<TeamRow[]>(initialTeams);
  const [calculated, setCalculated] = useState(false);

  const updateTeam = (id: number, field: keyof TeamRow, value: number) => {
    setTeams((prev) => prev.map((team) => (team.id === id ? { ...team, [field]: value } : team)));
    setCalculated(false);
  };

  const sorted = useMemo(() => {
    return [...teams].sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.dg !== a.dg) return b.dg - a.dg;
      if (b.gf !== a.gf) return b.gf - a.gf;
      if (a.fp !== b.fp) return a.fp - b.fp;
      return a.ranking - b.ranking;
    });
  }, [teams]);

  const qualified = sorted.slice(0, 8);
  const eliminated = sorted.slice(8);

  const isQualified = (id: number) => calculated && qualified.some((t) => t.id === id);
  const isEliminated = (id: number) => calculated && eliminated.some((t) => t.id === id);

  return (
    <div className="rounded-3xl border border-white/5 bg-gradient-to-b from-[#0B1825]/50 to-transparent p-5 sm:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-xl font-black text-white sm:text-2xl">{f.simulatorTitle}</h3>
          <p className="text-sm text-[#8a94b0]">{f.simulatorSubtitle}</p>
        </div>
        <button
          onClick={() => setCalculated(true)}
          className="rounded-xl bg-gradient-to-r from-[#c9a84c] to-[#b08d3b] px-4 py-2 text-sm font-bold text-[#030712] shadow-lg transition hover:brightness-110"
        >
          {f.simulatorBtn}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-[#6a7a9a]">
              <th className="pb-3 pl-3">#</th>
              <th className="pb-3">{f.simulatorColTeam}</th>
              <th className="pb-3">{f.simulatorColPts}</th>
              <th className="pb-3">{f.simulatorColGF}</th>
              <th className="pb-3">{f.simulatorColDG}</th>
              <th className="pb-3">{f.simulatorColFP}</th>
              <th className="pb-3 pr-3">{f.simulatorColRanking}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {teams.map((team, idx) => {
              const q = isQualified(team.id);
              const e = isEliminated(team.id);
              return (
                <tr
                  key={team.id}
                  className={`transition-colors ${q ? 'bg-green-500/10' : e ? 'bg-red-500/5' : 'bg-transparent hover:bg-white/[0.02]'}`}
                >
                  <td className="py-3 pl-3 text-[#6a7a9a]">{idx + 1}</td>
                  <td className="py-3 font-medium text-white">{team.name}</td>
                  <td className="py-3">
                    <input
                      type="number"
                      value={team.pts}
                      onChange={(ev) => updateTeam(team.id, 'pts', clamp(parseInt(ev.target.value) || 0, 0, 9))}
                      className="w-16 rounded-lg border border-white/10 bg-[#060B14] px-2 py-1 text-white outline-none focus:border-[#c9a84c]/50"
                    />
                  </td>
                  <td className="py-3">
                    <input
                      type="number"
                      value={team.gf}
                      onChange={(ev) => updateTeam(team.id, 'gf', clamp(parseInt(ev.target.value) || 0, 0, 99))}
                      className="w-16 rounded-lg border border-white/10 bg-[#060B14] px-2 py-1 text-white outline-none focus:border-[#c9a84c]/50"
                    />
                  </td>
                  <td className="py-3">
                    <input
                      type="number"
                      value={team.dg}
                      onChange={(ev) => updateTeam(team.id, 'dg', clamp(parseInt(ev.target.value) || -20, -20, 20))}
                      className="w-16 rounded-lg border border-white/10 bg-[#060B14] px-2 py-1 text-white outline-none focus:border-[#c9a84c]/50"
                    />
                  </td>
                  <td className="py-3">
                    <input
                      type="number"
                      value={team.fp}
                      onChange={(ev) => updateTeam(team.id, 'fp', clamp(parseInt(ev.target.value) || 0, -20, 20))}
                      className="w-16 rounded-lg border border-white/10 bg-[#060B14] px-2 py-1 text-white outline-none focus:border-[#c9a84c]/50"
                    />
                  </td>
                  <td className="py-3 pr-3">
                    <input
                      type="number"
                      value={team.ranking}
                      onChange={(ev) => updateTeam(team.id, 'ranking', clamp(parseInt(ev.target.value) || 1, 1, 210))}
                      className="w-20 rounded-lg border border-white/10 bg-[#060B14] px-2 py-1 text-white outline-none focus:border-[#c9a84c]/50"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {calculated && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#22c55e]/20 bg-[#22c55e]/10 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#22c55e]">{f.simulatorQualified} (8)</p>
            <div className="flex flex-wrap gap-2">
              {qualified.map((t) => (
                <span key={t.id} className="rounded-lg bg-[#060B14] px-2 py-1 text-xs font-medium text-white">{t.name}</span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-red-400">{f.simulatorEliminated} (4)</p>
            <div className="flex flex-wrap gap-2">
              {eliminated.map((t) => (
                <span key={t.id} className="rounded-lg bg-[#060B14] px-2 py-1 text-xs font-medium text-white/70">{t.name}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-white/5 bg-[#060B14] p-4">
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#c9a84c]">{f.simulatorWhy32}</p>
        <p className="text-sm text-[#8a94b0]">{f.simulatorWhy32Desc}</p>
      </div>
    </div>
  );
}
