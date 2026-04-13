import { SaulTicker } from "../components/SaulTicker";

export function SocialProofTicker({ items }: { items: string[] }) {
  return (
    <div className="w-full py-5 relative overflow-hidden" style={{ background: "#07101C" }}>
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#07101C] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#07101C] to-transparent z-10 pointer-events-none" />
      <SaulTicker
        items={items}
        speed={40}
        className="text-gray-400 text-sm sm:text-base font-medium"
        itemClassName="opacity-80 hover:opacity-100 transition-opacity"
      />
    </div>
  );
}
