import { BG2 } from "../constants";

export function WhyDifferentSection({ h }: { h: any }) {
  return (
    <section className="py-24 px-4 relative overflow-hidden" style={{ background: BG2 }}>
      {/* Stadium atmosphere background */}
      <div className="absolute inset-0">
        <img
          src="https://images.pexels.com/photos/14744117/pexels-photo-14744117.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop"
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-[#0F1D32]/90" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F1D32] via-transparent to-[#0F1D32]" />
      </div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-[#C9A84C]/5 blur-[180px] rounded-full pointer-events-none" />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="relative rounded-3xl border-2 border-dashed border-[#C9A84C]/30 bg-gradient-to-br from-[#0B1825] to-[#0F1D32] overflow-hidden p-10 sm:p-14">
          <div className="absolute inset-0 bg-gradient-to-br from-[#C9A84C]/5 via-transparent to-blue-900/10 pointer-events-none" />

          {/* Watermark ilustración sutil — lado derecho */}
          <svg
            className="absolute -right-10 top-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-[0.04] pointer-events-none"
            viewBox="0 0 500 500"
            fill="none"
          >
            <circle cx="250" cy="250" r="180" stroke="#c9a84c" strokeWidth="2" />
            <circle cx="250" cy="250" r="120" stroke="#c9a84c" strokeWidth="1.5" />
            <circle cx="250" cy="250" r="60" stroke="#c9a84c" strokeWidth="1" />
            <polygon points="250,90 280,140 265,195 235,195 220,140" stroke="#c9a84c" strokeWidth="1.5" fill="#c9a84c" fillOpacity="0.1" />
            <polygon points="370,200 350,260 300,280 280,230 310,180" stroke="#c9a84c" strokeWidth="1.5" fill="#c9a84c" fillOpacity="0.1" />
            <polygon points="130,200 150,260 200,280 220,230 190,180" stroke="#c9a84c" strokeWidth="1.5" fill="#c9a84c" fillOpacity="0.1" />
            <polygon points="310,370 280,330 295,270 335,260 355,310" stroke="#c9a84c" strokeWidth="1.5" fill="#c9a84c" fillOpacity="0.1" />
            <polygon points="190,370 220,330 205,270 165,260 145,310" stroke="#c9a84c" strokeWidth="1.5" fill="#c9a84c" fillOpacity="0.1" />
            <line x1="250" y1="70" x2="250" y2="190" stroke="#c9a84c" strokeWidth="0.8" />
            <line x1="420" y1="250" x2="310" y2="250" stroke="#c9a84c" strokeWidth="0.8" />
            <line x1="80" y1="250" x2="190" y2="250" stroke="#c9a84c" strokeWidth="0.8" />
            <line x1="340" y1="400" x2="290" y2="310" stroke="#c9a84c" strokeWidth="0.8" />
            <line x1="160" y1="400" x2="210" y2="310" stroke="#c9a84c" strokeWidth="0.8" />
            <circle cx="100" cy="100" r="3" fill="#c9a84c" />
            <circle cx="400" cy="120" r="2" fill="#c9a84c" />
            <circle cx="420" cy="400" r="3" fill="#c9a84c" />
            <circle cx="80" cy="380" r="2" fill="#c9a84c" />
            <path d="M380,60 L380,90 Q380,110 370,110 L390,110 Q380,110 380,90" stroke="#c9a84c" strokeWidth="1.2" fill="none" />
            <path d="M365,60 L395,60" stroke="#c9a84c" strokeWidth="1.2" />
            <path d="M370,110 L390,110 L385,120 L375,120 Z" stroke="#c9a84c" strokeWidth="1" fill="#c9a84c" fillOpacity="0.15" />
          </svg>

          {/* Watermark ilustración sutil — lado izquierdo */}
          <svg
            className="absolute -left-10 top-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-[0.03] pointer-events-none"
            viewBox="0 0 400 400"
            fill="none"
          >
            <rect x="50" y="80" width="300" height="240" rx="8" stroke="#c9a84c" strokeWidth="1.5" />
            <line x1="200" y1="80" x2="200" y2="320" stroke="#c9a84c" strokeWidth="1.2" />
            <circle cx="200" cy="200" r="50" stroke="#c9a84c" strokeWidth="1.2" />
            <circle cx="200" cy="200" r="3" fill="#c9a84c" />
            <rect x="50" y="140" width="60" height="120" stroke="#c9a84c" strokeWidth="1" />
            <rect x="50" y="170" width="25" height="60" stroke="#c9a84c" strokeWidth="0.8" />
            <rect x="290" y="140" width="60" height="120" stroke="#c9a84c" strokeWidth="1" />
            <rect x="325" y="170" width="25" height="60" stroke="#c9a84c" strokeWidth="0.8" />
            <path d="M110,170 Q130,200 110,230" stroke="#c9a84c" strokeWidth="0.8" fill="none" />
            <path d="M290,170 Q270,200 290,230" stroke="#c9a84c" strokeWidth="0.8" fill="none" />
          </svg>

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <p className="text-[#C9A84C] text-sm font-bold tracking-widest uppercase mb-6">
              {"¿"}
              {h.platform.whyBadge}
              {"?"}
            </p>
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-8">
              {h.platform.whyTitle1}{" "}
              <span className="text-[#C9A84C]">{h.platform.whyTitleBold}</span>{" "}
              {h.platform.whyTitle2}
            </h3>
            <p className="text-gray-300 text-lg sm:text-xl leading-relaxed mb-10">
              {h.platform.whyDesc}{" "}
              <span className="text-white font-bold">{h.platform.whyDescBold}</span>
              {h.platform.whyDescEnd}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[#C9A84C] text-2xl font-black mb-2">48</p>
                <p className="text-white font-semibold mb-1">{h.platform.card1Title}</p>
                <p className="text-gray-400 text-sm">{h.platform.card1Desc}</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[#C9A84C] text-2xl font-black mb-2">100%</p>
                <p className="text-white font-semibold mb-1">{h.platform.card2Title}</p>
                <p className="text-gray-400 text-sm">{h.platform.card2Desc}</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[#C9A84C] text-2xl font-black mb-2">{h.platform.card3Value}</p>
                <p className="text-white font-semibold mb-1">{h.platform.card3Title}</p>
                <p className="text-gray-400 text-sm">{h.platform.card3Desc}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
