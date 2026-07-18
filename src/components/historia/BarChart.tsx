// ZonaMundial — Bar chart CSS-only (server component)

interface Item {
  label: string;
  value: number;
  highlight?: boolean;
}

interface Props {
  data: Item[];
  unit?: string;
  decimals?: number;
  maxOverride?: number;
}

const GOLD = "#c9a84c";

export default function BarChart({ data, unit = "", decimals = 0, maxOverride }: Props) {
  const max = maxOverride ?? Math.max(...data.map((d) => d.value));
  const fmt = (v: number) =>
    decimals > 0 ? v.toFixed(decimals) : new Intl.NumberFormat("es-ES").format(v);

  return (
    <div className="space-y-1.5">
      {data.map((d, i) => {
        const pct = max === 0 ? 0 : (d.value / max) * 100;
        return (
          <div key={`${d.label}-${i}`} className="flex items-center gap-3 text-xs">
            <div className="w-16 sm:w-20 text-right text-gray-400 tabular-nums shrink-0">
              {d.label}
            </div>
            <div className="flex-1 h-7 bg-[#0a0906] rounded-md overflow-hidden border border-[#241e12] relative">
              <div
                className="h-full rounded-md transition-all"
                style={{
                  width: `${pct}%`,
                  background: d.highlight
                    ? `linear-gradient(90deg, ${GOLD}, #e8d48b)`
                    : "linear-gradient(90deg, #1E40AF, #3B82F6)",
                }}
              />
              <div
                className="absolute inset-0 flex items-center px-2 text-[10px] sm:text-xs font-bold tabular-nums"
                style={{ color: pct > 30 ? "#fff" : d.highlight ? GOLD : "#a69a82" }}
              >
                {fmt(d.value)}
                {unit && <span className="text-[9px] ml-1 opacity-80">{unit}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
