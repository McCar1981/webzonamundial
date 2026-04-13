import { GOLD } from "../constants";

export function GuaranteesBar({ items }: { items: string[] }) {
  return (
    <div className="w-full border-y border-white/5 py-6 relative overflow-hidden" style={{ background: "#050a12" }}>
      <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}33, transparent)` }} />
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          {items.map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] text-xs sm:text-sm font-semibold text-white/90 tracking-wide hover:border-[#C9A84C]/40 hover:bg-white/[0.06] transition-all"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
              {item}
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}33, transparent)` }} />
    </div>
  );
}
