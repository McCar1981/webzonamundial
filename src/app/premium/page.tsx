"use client";

import { useState } from "react";
import Link from "next/link";
import { FeatureIcon } from "@/components/FeatureIcon";
import { useLanguage } from "@/i18n/LanguageContext";
import { StatCounter } from "@/components/StatCounter";
import { SvgIcon } from "@/components/icons";
import { FOUNDERS_PASS_PRICES } from "@/lib/stripe/pricing";

const BG = "#000000",
  BG2 = "#14110a",
  BG3 = "#0a0906",
  GOLD = "#c9a84c",
  GOLD2 = "#e8d48b",
  MID = "#a69a82",
  DIM = "#6e6552";

/* ─── tiny check / cross icons ─── */
const Check = ({ gold }: { gold?: boolean }) => (
  <svg className="inline" width="16" height="16" viewBox="0 0 24 24" fill={gold ? GOLD : "#22c55e"} aria-hidden>
    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
  </svg>
);
const Cross = () => (
  <svg className="inline" width="14" height="14" viewBox="0 0 24 24" fill="#475569" aria-hidden>
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);

export default function PremiumPage() {
  const { t } = useLanguage();
  const pT = t.premium;
  const isEN = t.nav.selecciones === "48 Teams";
  const COMPARISON_DATA = pT.comparison;
  // Precios desde el catálogo server (fuente única de verdad) para evitar
  // desincronización si cambia el precio en el catálogo.
  // Los textos (name, region label, description, badge, period) siguen en i18n.
  const i18nPlans = pT.plans as Array<{
    badge: string; region: string; name: string; price: string; period: string; description: string;
  }>;
  const PRICING_PLANS = i18nPlans.map((plan, idx) => ({
    ...plan,
    // Sobrescribimos el precio con el del catálogo: idx 0 = EUR, idx 1 = USD
    price: idx === 0 ? FOUNDERS_PASS_PRICES.eur.display : FOUNDERS_PASS_PRICES.usd.display,
  }));
  const PREMIUM_FEATURES = pT.features;
  const [showTable, setShowTable] = useState(false);

  const highlights = isEN
    ? [
        { label: "Unlimited predictions", icon: "predicciones", desc: "8 types + multipliers" },
        { label: "AI Coach Pro", icon: "ia coach", desc: "Full analysis & alerts" },
        { label: "Zero ads", icon: "streaming", desc: "Distraction-free" },
        { label: "Advanced stats", icon: "ranking", desc: "xG, xA & more" },
      ]
    : [
        { label: "Predicciones ilimitadas", icon: "predicciones", desc: "8 tipos + multiplicadores" },
        { label: "IA Coach Pro", icon: "ia coach", desc: "Análisis y alertas" },
        { label: "Sin anuncios", icon: "streaming", desc: "Experiencia limpia" },
        { label: "Stats avanzadas", icon: "ranking", desc: "xG, xA y más" },
      ];

  return (
    <div
      style={{ background: BG, color: "#fff", fontFamily: "'Outfit',sans-serif", minHeight: "100vh" }}
      className="relative overflow-hidden"
    >
      {/* ═══════ HERO ═══════ */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-24 px-5">
        {/* Cinematic background — desktop & mobile variants */}
        <picture>
          <source media="(min-width: 768px)" srcSet="/img/premium/bg-desktop.webp" />
          <img
            src="/img/premium/bg-mobile.webp"
            alt=""
            role="presentation"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            loading="eager"
            decoding="async"
          />
        </picture>
        {/* Dark overlay to ensure text readability */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "rgba(0,0,0,0.35)" }} />
        {/* Top gold line */}
        <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: `linear-gradient(90deg, transparent 5%, ${GOLD}, transparent 95%)` }} />

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          {/* Pill */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{
              border: `1px solid ${GOLD}30`,
              background: `${GOLD}08`,
            }}
          >
            <span style={{ color: GOLD, fontSize: 14 }}>&#10022;</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
              {isEN ? "Premium Experience" : "Experiencia Premium"}
            </span>
          </div>

          <h1
            className="font-black text-white mb-5 leading-[1.08]"
            style={{ fontSize: "clamp(32px, 5.5vw, 60px)", letterSpacing: "-0.03em" }}
          >
            {pT.heroTitle.split(" ").slice(0, -1).join(" ")}{" "}
            <span className="bg-gradient-to-r from-[#C9A84C] via-[#FDE68A] to-[#C9A84C] bg-clip-text text-transparent">
              {pT.heroTitle.split(" ").slice(-1)[0]}
            </span>
          </h1>

          <p
            className="text-lg sm:text-xl font-medium mb-4 leading-relaxed"
            style={{ color: GOLD2 }}
          >
            {pT.heroSub}
          </p>
          <p className="text-base max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: MID }}>
            {pT.heroDesc}
          </p>

          {/* Price chips */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-5 mb-8">
            {PRICING_PLANS.map((plan: { region: string; price: string; period: string; badge: string }, i: number) => (
              <div
                key={i}
                className="group relative flex items-center gap-3 px-5 sm:px-7 py-4 rounded-2xl border overflow-hidden transition-all hover:-translate-y-0.5"
                style={{
                  borderColor: `${GOLD}30`,
                  background: "linear-gradient(135deg, rgba(20,17,10,0.95), rgba(10,9,6,0.85))",
                }}
              >
                {/* Subtle top line */}
                <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}50, transparent)` }} />
                <span className="text-3xl sm:text-4xl font-black text-white">{plan.price}</span>
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>{plan.region}</p>
                  <p className="text-xs" style={{ color: DIM }}>{plan.period}</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/cuenta/comprar"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full font-bold text-base no-underline transition-all hover:-translate-y-0.5"
            style={{
              background: `linear-gradient(135deg, ${GOLD} 0%, #E8C76B 50%, #FDE68A 100%)`,
              color: "#1A1208",
              boxShadow: `0 0 0 1px rgba(255,255,255,0.15) inset, 0 0 30px -8px rgba(201,168,76,0.55)`,
            }}
          >
            {pT.pricingCta}
          </Link>

          <p className="mt-4 text-xs" style={{ color: DIM }}>
            {pT.cta.hint}
          </p>
        </div>
      </section>

      {/* ═══════ STATS BANNER ═══════ */}
      <section className="relative border-y" style={{ borderColor: "rgba(201,168,76,0.12)" }}>
        <div className="max-w-5xl mx-auto px-5 py-8 sm:py-10">
          <div className="grid grid-cols-1 gap-3 sm:gap-5">
            {[
              {
                val: 24, suffix: "h", label: isEN ? "Priority support" : "Soporte prioritario",
                icon: (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                  </svg>
                ),
              },
            ].map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-4 py-4 sm:py-5 px-5 sm:px-6 rounded-2xl border"
                style={{
                  borderColor: `${GOLD}18`,
                  background: "linear-gradient(135deg, rgba(20,17,10,0.85), rgba(10,9,6,0.7))",
                }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    border: `1.5px solid ${GOLD}40`,
                    background: `${GOLD}08`,
                  }}
                >
                  {s.icon}
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black" style={{ color: GOLD }}>
                    <StatCounter value={s.val} suffix={s.suffix} />
                  </div>
                  <div className="text-[10px] sm:text-xs" style={{ color: DIM }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FEATURES GRID ═══════ */}
      <section className="relative px-5 py-16 sm:py-20">
        {/* Ambient glow */}
        <div
          aria-hidden
          className="absolute left-[-200px] top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(201,168,76,0.08), transparent 70%)", filter: "blur(60px)" }}
        />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <span
              className="inline-block text-[10px] font-bold uppercase tracking-[0.25em] mb-4"
              style={{ color: GOLD }}
            >
              {isEN ? "What's included" : "Qué incluye"}
            </span>
            <h2
              className="font-black text-white leading-tight"
              style={{ fontSize: "clamp(26px, 4vw, 40px)", letterSpacing: "-0.02em" }}
            >
              {pT.featuresTitle.split("Premium")[0]}
              <span className="bg-gradient-to-r from-[#C9A84C] via-[#FDE68A] to-[#C9A84C] bg-clip-text text-transparent">
                Premium
              </span>
              {pT.featuresTitle.split("Premium")[1]}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PREMIUM_FEATURES.map((feature: { iconTitle: string; title: string; desc: string }, i: number) => (
              <div
                key={i}
                className="group relative p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                style={{
                  borderColor: "rgba(255,255,255,0.06)",
                  background: "linear-gradient(135deg, rgba(20,17,10,0.95), rgba(10,9,6,0.85))",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${GOLD}40`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
                }}
              >
                {/* Hover glow */}
                <div
                  aria-hidden
                  className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${GOLD}15, transparent 70%)` }}
                />
                <div className="relative z-10">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}20` }}
                  >
                    <FeatureIcon title={feature.iconTitle} size={28} />
                  </div>
                  <h3 className="font-bold text-sm mb-2 text-white">{feature.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: DIM }}>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FREE vs PREMIUM ═══════ */}
      <section className="relative px-5 py-16 sm:py-20" style={{ background: BG3 }}>
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <h2
              className="font-black text-white mb-4 leading-tight"
              style={{ fontSize: "clamp(26px, 4vw, 40px)", letterSpacing: "-0.02em" }}
            >
              Free vs{" "}
              <span className="bg-gradient-to-r from-[#C9A84C] via-[#FDE68A] to-[#C9A84C] bg-clip-text text-transparent">
                Premium
              </span>
            </h2>
          </div>

          {/* 4 key highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8">
            {highlights.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl border transition-all hover:border-[#C9A84C]/30"
                style={{
                  borderColor: "rgba(255,255,255,0.06)",
                  background: "linear-gradient(135deg, rgba(20,17,10,0.95), rgba(10,9,6,0.85))",
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}20` }}
                >
                  <SvgIcon name={item.icon} size={24} />
                </div>
                <div className="min-w-0">
                  <span className="block text-sm text-white font-bold leading-tight">{item.label}</span>
                  <span className="text-xs" style={{ color: DIM }}>{item.desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Toggle */}
          <div className="text-center mb-6">
            <button
              onClick={() => setShowTable(!showTable)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              style={{
                borderColor: `${GOLD}40`,
                color: showTable ? "#1A1208" : GOLD,
                background: showTable ? `linear-gradient(135deg, ${GOLD}, ${GOLD2})` : "transparent",
              }}
            >
              {showTable
                ? (isEN ? "Hide comparison" : "Ocultar comparación")
                : (isEN ? "View full comparison" : "Ver comparación completa")}
              <span className="transition-transform inline-block" style={{ transform: showTable ? "rotate(180deg)" : "none" }}>
                ▼
              </span>
            </button>
          </div>

          {/* Comparison table */}
          {showTable && (
            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: `${GOLD}20` }}>
              {/* Header */}
              <div
                className="grid grid-cols-[2fr_1fr_1fr] text-xs sm:text-sm font-bold px-4 sm:px-6 py-3.5"
                style={{ background: `${GOLD}08`, borderBottom: `1px solid ${GOLD}15` }}
              >
                <span style={{ color: MID }}>{pT.tableHeader.feature}</span>
                <span className="text-center" style={{ color: MID }}>{pT.tableHeader.free}</span>
                <span className="text-center" style={{ color: GOLD }}>{pT.tableHeader.premium}</span>
              </div>
              {/* Rows */}
              {COMPARISON_DATA.map((row: { feature: string; free: string; premium: string; highlight: boolean }, i: number) => (
                <div
                  key={i}
                  className="grid grid-cols-[2fr_1fr_1fr] text-xs sm:text-sm items-center px-4 sm:px-6 py-3"
                  style={{
                    background: i % 2 === 0 ? "rgba(20,17,10,0.5)" : "rgba(10,9,6,0.3)",
                    borderTop: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <span className={row.highlight ? "font-semibold text-white" : ""} style={{ color: row.highlight ? undefined : MID }}>
                    {row.feature}
                  </span>
                  <span className="text-center">
                    {row.free === "Sí" || row.free === "Yes" ? <Check />
                      : row.free === "No" ? <Cross />
                      : <span style={{ color: DIM }}>{row.free}</span>}
                  </span>
                  <span className="text-center" style={{ color: row.highlight ? GOLD : undefined, fontWeight: row.highlight ? 600 : 400 }}>
                    {row.premium === "Sí" || row.premium === "Yes" ? <Check gold />
                      : row.premium === "No" ? <Cross />
                      : <span className="inline-flex items-center gap-1">{row.premium !== "Sí" && row.premium !== "Yes" && <Check gold />}{row.premium}</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════ PRICING CARDS ═══════ */}
      <section className="relative px-5 py-16 sm:py-20">
        {/* Ambient glow */}
        <div
          aria-hidden
          className="absolute right-[-200px] top-1/3 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(201,168,76,0.08), transparent 70%)", filter: "blur(60px)" }}
        />

        <div className="max-w-3xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.25em] mb-4" style={{ color: GOLD }}>
              {isEN ? "Pricing" : "Precios"}
            </span>
            <h2
              className="font-black text-white mb-3 leading-tight"
              style={{ fontSize: "clamp(26px, 4vw, 40px)", letterSpacing: "-0.02em" }}
            >
              <span className="bg-gradient-to-r from-[#C9A84C] via-[#FDE68A] to-[#C9A84C] bg-clip-text text-transparent">
                {pT.pricingTitle}
              </span>
            </h2>
            <p className="text-sm sm:text-base" style={{ color: MID }}>{pT.pricingSub}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {PRICING_PLANS.map((plan: { badge: string; region: string; name: string; price: string; period: string; description: string }, i: number) => (
              <div
                key={i}
                className="relative rounded-3xl overflow-hidden border-2 transition-all hover:-translate-y-1"
                style={{
                  borderColor: `${GOLD}40`,
                  background: "linear-gradient(135deg, rgba(20,17,10,0.95), rgba(10,9,6,0.85))",
                }}
              >
                {/* Top gradient line */}
                <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${GOLD}, ${GOLD2}, ${GOLD})` }} />

                {/* Badge */}
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-b-xl text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`, color: "#1A1208" }}
                >
                  {plan.badge}
                </div>

                <div className="p-8 sm:p-10 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] mt-3 mb-3" style={{ color: MID }}>
                    {plan.region}
                  </p>
                  <h3 className="text-base font-bold mb-6" style={{ color: GOLD }}>{plan.name}</h3>

                  <div className="flex items-baseline justify-center gap-1.5 mb-2">
                    <span className="text-5xl sm:text-6xl font-black text-white">{plan.price}</span>
                  </div>
                  <p className="text-xs mb-6" style={{ color: DIM }}>{plan.period}</p>

                  <p className="text-sm mb-8 leading-relaxed" style={{ color: MID }}>{plan.description}</p>

                  <Link
                    href="/cuenta/comprar"
                    className="block w-full py-4 rounded-full font-bold text-sm no-underline transition-all hover:-translate-y-0.5"
                    style={{
                      background: `linear-gradient(135deg, ${GOLD} 0%, #E8C76B 50%, #FDE68A 100%)`,
                      color: "#1A1208",
                      boxShadow: `0 0 0 1px rgba(255,255,255,0.15) inset, 0 8px 24px -8px rgba(201,168,76,0.45)`,
                    }}
                  >
                    {pT.pricingCta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="relative px-5 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto relative z-10">
          <div
            className="relative rounded-3xl border overflow-hidden"
            style={{ borderColor: `${GOLD}25` }}
          >
            {/* Stadium bg */}
            <img
              src="/img/imagenessilviu/Estadio Atmosphere.webp"
              alt=""
              role="presentation"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/90 to-[#000000]/75" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 p-8 sm:p-12 lg:p-16">
              <div className="flex-shrink-0">
                <div className="relative">
                  <div
                    aria-hidden
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ background: `${GOLD}15`, filter: "blur(50px)" }}
                  />
                  <SvgIcon
                    name="unete ahora"
                    size={160}
                    className="relative drop-shadow-[0_0_40px_rgba(201,168,76,0.35)]"
                  />
                </div>
              </div>

              <div className="text-center lg:text-left flex-1">
                <h2
                  className="font-black text-white mb-4 leading-tight"
                  style={{ fontSize: "clamp(24px, 3.5vw, 38px)", letterSpacing: "-0.02em" }}
                >
                  {pT.cta.title}
                </h2>
                <p className="text-sm sm:text-base mb-8 leading-relaxed" style={{ color: MID }}>
                  {pT.cta.desc}
                </p>

                <Link
                  href="/cuenta/comprar"
                  className="inline-flex items-center gap-2 px-10 py-4 rounded-full font-bold text-base no-underline transition-all hover:-translate-y-0.5"
                  style={{
                    background: `linear-gradient(135deg, ${GOLD} 0%, #E8C76B 50%, #FDE68A 100%)`,
                    color: "#1A1208",
                    boxShadow: `0 0 0 1px rgba(255,255,255,0.15) inset, 0 0 30px -8px rgba(201,168,76,0.55)`,
                  }}
                >
                  {pT.cta.btn}
                </Link>

                <p className="mt-5 text-xs" style={{ color: DIM }}>{pT.cta.hint}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
