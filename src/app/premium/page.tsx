"use client";

import { useState } from "react";
import Link from "next/link";
import { FeatureIcon } from "@/components/FeatureIcon";
import { useLanguage } from "@/i18n/LanguageContext";
import { StatCounter } from "@/components/StatCounter";
import { ShimmerButton } from "@/components/ShimmerButton";
import { AnimatedSection } from "@/components/AnimatedSection";
import { SvgIcon } from "@/components/icons";

const BG = "#060B14", BG2 = "#0F1D32", BG3 = "#0B1825", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a", DARK = "#4a5570";

export default function PremiumPage() {
  const { t } = useLanguage();
  const pT = t.premium;
  const isEN = t.nav.selecciones === '48 Teams';
  const COMPARISON_DATA = pT.comparison;
  const PRICING_PLANS = pT.plans;
  const PREMIUM_FEATURES = pT.features;
  const [showTable, setShowTable] = useState(false);

  const highlights = isEN
    ? [
        { label: 'Unlimited predictions', icon: 'predicciones', desc: '8 types + multipliers' },
        { label: 'AI Coach Pro', icon: 'ia coach', desc: 'Full analysis & alerts' },
        { label: 'Zero ads', icon: 'streaming', desc: 'Distraction-free' },
        { label: 'Advanced stats', icon: 'ranking', desc: 'xG, xA & more' },
      ]
    : [
        { label: 'Predicciones ilimitadas', icon: 'predicciones', desc: '8 tipos + multiplicadores' },
        { label: 'IA Coach Pro', icon: 'ia coach', desc: 'Análisis y alertas' },
        { label: 'Sin anuncios', icon: 'streaming', desc: 'Experiencia limpia' },
        { label: 'Stats avanzadas', icon: 'ranking', desc: 'xG, xA y más' },
      ];

  const testimonials = isEN
    ? [
        { name: "Alex M.", role: "Fantasy champion 2022", quote: "Premium stats changed everything. I won my private league thanks to the xG data." },
        { name: "Sofia R.", role: "Predictions fanatic", quote: "Unlimited predictions and the AI Coach tips are worth every penny. Never going back." },
        { name: "Marcus T.", role: "Streamer", quote: "The badge and animated avatar look epic on stream. My community loves it." },
      ]
    : [
        { name: "Juan M.", role: "Campeón Fantasy 2022", quote: "Las estadísticas Premium cambiaron todo. Gané mi liga privada gracias a los datos de xG." },
        { name: "Sofía R.", role: "Fanática de predicciones", quote: "Las predicciones ilimitadas y los consejos del IA Coach valen cada céntimo. No vuelvo atrás." },
        { name: "Marcos T.", role: "Streamer", quote: "El badge dorado y el avatar animado quedan épicos en stream. Mi comunidad lo adora." },
      ];

  return (
    <div style={{ background: BG, color: "#fff", fontFamily: "'Outfit',sans-serif", minHeight: "100vh" }}>

      {/* Hero - Impactante y directo */}
      <section className="relative overflow-hidden" style={{ padding: "30px 20px 50px" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center,rgba(201,168,76,0.15) 0%,transparent 60%)" }} />
        <div className="absolute top-0 left-0 w-full h-1" style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="flex justify-center mb-4"><SvgIcon name="fantasy" size={64} /></div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-tight">
            {pT.heroTitle}
          </h1>
          <p className="text-xl sm:text-2xl font-semibold mb-6" style={{ color: GOLD }}>
            {pT.heroSub}
          </p>
          <p className="text-lg max-w-2xl mx-auto mb-8 leading-relaxed" style={{ color: MID }}>
            {pT.heroDesc}
          </p>

          {/* Precio destacado inline */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-6">
            {PRICING_PLANS.map((plan: { region: string; price: string; period: string; badge: string }, i: number) => (
              <div key={i} className="flex items-center gap-3 px-5 sm:px-6 py-3 rounded-2xl border" style={{ borderColor: `${GOLD}40`, background: `${GOLD}08` }}>
                <span className="text-3xl font-black text-white">{plan.price}</span>
                <div className="text-left">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: GOLD }}>{plan.region}</p>
                  <p className="text-xs" style={{ color: DIM }}>{plan.period}</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/registro"
            className="inline-block px-10 py-4 rounded-xl font-bold text-lg no-underline transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(201,168,76,0.4)]"
            style={{ background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: BG }}
          >
            {pT.pricingCta}
          </Link>
        </div>
      </section>

      {/* Stats banner */}
      <AnimatedSection className="border-y border-white/5" style={{ background: BG3 }} y={20}>
        <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center">
            <div className="p-4 rounded-2xl border border-white/5 bg-[#0B0F1A]">
              <div className="text-3xl sm:text-4xl font-black text-[#C9A84C]"><StatCounter value={2847} /></div>
              <div className="text-xs text-gray-500 mt-1">{isEN ? "Premium users" : "Usuarios Premium"}</div>
            </div>
            <div className="p-4 rounded-2xl border border-white/5 bg-[#0B0F1A]">
              <div className="text-3xl sm:text-4xl font-black text-[#C9A84C]"><StatCounter value={98} suffix="%" /></div>
              <div className="text-xs text-gray-500 mt-1">{isEN ? "Would renew" : "Renovarían"}</div>
            </div>
            <div className="p-4 rounded-2xl border border-white/5 bg-[#0B0F1A]">
              <div className="text-3xl sm:text-4xl font-black text-[#C9A84C]"><StatCounter value={24} suffix="h" /></div>
              <div className="text-xs text-gray-500 mt-1">{isEN ? "Priority support" : "Soporte prioritario"}</div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Qué incluye Premium - Visual Grid */}
      <section style={{ padding: "60px 20px", background: BG3 }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              {pT.featuresTitle.split("Premium")[0]}<span style={{ color: GOLD }}>Premium</span>{pT.featuresTitle.split("Premium")[1]}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PREMIUM_FEATURES.map((feature: { iconTitle: string; title: string; desc: string }, i: number) => (
              <div
                key={i}
                className="group p-6 rounded-2xl border border-white/5 hover:border-[#c9a84c]/30 transition-all duration-300 hover:-translate-y-1"
                style={{ background: BG2 }}
              >
                <div className="mb-4">
                  <FeatureIcon title={feature.iconTitle} size={44} />
                </div>
                <h3 className="font-bold text-base mb-2" style={{ color: GOLD }}>{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: DIM }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free vs Premium - 4 key differentiators + toggle */}
      <section style={{ padding: "60px 20px" }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              {pT.tableTitle.split(' vs ')[0]} vs <span style={{ color: GOLD }}>{pT.tableTitle.split(' vs ')[1]}</span>
            </h2>
            <button
              onClick={() => setShowTable(!showTable)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer"
              style={{
                borderColor: `${GOLD}40`,
                color: showTable ? BG : GOLD,
                background: showTable ? GOLD : 'transparent',
              }}
            >
              {showTable
                ? (isEN ? 'Hide comparison' : 'Ocultar comparación')
                : (isEN ? 'View full comparison' : 'Ver comparación completa')
              }
              <span className="transition-transform inline-block" style={{ transform: showTable ? 'rotate(180deg)' : 'none' }}>▼</span>
            </button>
          </div>

          {/* 4 big differentiators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {highlights.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-5 rounded-2xl border border-white/5 hover:border-[#C9A84C]/30 transition-all" style={{ background: BG2 }}>
                <div className="w-12 h-12 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center flex-shrink-0">
                  <SvgIcon name={item.icon} size={28} />
                </div>
                <div>
                  <span className="block text-base text-white font-bold">{item.label}</span>
                  <span className="text-sm" style={{ color: DIM }}>{item.desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Full comparison table (toggle) */}
          {showTable && (
            <div className="rounded-2xl overflow-hidden border border-white/10">
              <div className="grid grid-cols-[2fr_1fr_1fr] text-sm font-bold" style={{ background: BG2, padding: "14px 20px" }}>
                <span>{pT.tableHeader.feature}</span>
                <span className="text-center">{pT.tableHeader.free}</span>
                <span className="text-center" style={{ color: GOLD }}>{pT.tableHeader.premium}</span>
              </div>
              {COMPARISON_DATA.map((row: { feature: string; free: string; premium: string; highlight: boolean }, i: number) => (
                <div
                  key={i}
                  className="grid grid-cols-[2fr_1fr_1fr] text-sm"
                  style={{
                    padding: "12px 20px",
                    background: i % 2 === 0 ? BG3 : BG2,
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span style={{ fontWeight: row.highlight ? 600 : 400 }}>{row.feature}</span>
                  <span className="text-center">
                    {(row.free === "Sí" || row.free === "Yes") ? <svg className="inline" width="16" height="16" viewBox="0 0 24 24" fill={GOLD}><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
                    : row.free === "No" ? <svg className="inline" width="14" height="14" viewBox="0 0 24 24" fill={DARK}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                    : <span style={{ color: DIM }}>{row.free}</span>}
                  </span>
                  <span className="text-center" style={{ color: row.highlight ? GOLD : DIM, fontWeight: row.highlight ? 600 : 400 }}>
                    {(row.premium === "Sí" || row.premium === "Yes") ? <svg className="inline" width="16" height="16" viewBox="0 0 24 24" fill={GOLD}><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
                    : (row.premium !== "No" && row.premium !== "Sí" && row.premium !== "Yes") ? <><svg className="inline mr-1" width="14" height="14" viewBox="0 0 24 24" fill={GOLD}><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>{row.premium}</>
                    : row.premium}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Pricing Cards */}
      <section style={{ padding: "60px 20px", background: BG3 }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-black mb-3">
              <span style={{ color: GOLD }}>{pT.pricingTitle}</span>
            </h2>
            <p style={{ color: MID, fontSize: 16 }}>{pT.pricingSub}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {PRICING_PLANS.map((plan: { badge: string; region: string; name: string; price: string; period: string; description: string }, i: number) => (
              <div key={i} className="relative p-10 rounded-3xl text-center border-2 overflow-hidden" style={{ background: BG2, borderColor: GOLD }}>
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${GOLD}, ${GOLD2})` }} />
                <div className="absolute -top-px left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-b-xl text-[11px] font-bold uppercase tracking-wider" style={{ background: GOLD, color: BG }}>
                  {plan.badge}
                </div>

                <p className="text-xs font-bold uppercase tracking-widest mt-4 mb-3" style={{ color: MID }}>{plan.region}</p>
                <h3 className="text-lg font-bold mb-5" style={{ color: GOLD }}>{plan.name}</h3>

                <div className="flex items-baseline justify-center gap-2 mb-4">
                  <span className="text-5xl font-black">{plan.price}</span>
                  <span className="text-sm" style={{ color: MID }}>{plan.period}</span>
                </div>

                <p className="text-sm mb-8 leading-relaxed" style={{ color: MID }}>{plan.description}</p>

                <Link
                  href="/registro"
                  className="block w-full py-4 rounded-xl font-bold text-base no-underline transition-all hover:shadow-[0_8px_32px_rgba(201,168,76,0.4)] hover:-translate-y-0.5"
                  style={{ background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: BG }}
                >
                  {pT.pricingCta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: "60px 20px" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              {isEN ? "What our Premium users say" : "Qué dicen nuestros usuarios Premium"}
            </h2>
            <p className="text-base" style={{ color: MID }}>
              {isEN ? "Join thousands who already upgraded" : "Únete a miles que ya dieron el salto"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div key={i} className="relative p-6 rounded-2xl border border-white/5 hover:border-[#C9A84C]/20 transition-all" style={{ background: BG2 }}>
                <div className="absolute top-4 right-4 text-4xl leading-none" style={{ color: `${GOLD}30` }}>“</div>
                <p className="text-sm leading-relaxed mb-5" style={{ color: MID }}>{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A84C]/30 to-[#C9A84C]/10 flex items-center justify-center text-sm font-bold text-white">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{t.name}</div>
                    <div className="text-xs" style={{ color: DIM }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final con estadio */}
      <section className="relative overflow-hidden" style={{ padding: "80px 20px" }}>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="relative rounded-3xl border overflow-hidden group" style={{ borderColor: `${GOLD}30` }}>
            <img src="/img/imagenessilviu/Estadio Atmosphere.webp" alt="" role="presentation" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060B14] via-[#060B14]/85 to-[#060B14]/70" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 p-10 sm:p-14">
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#c9a84c]/20 blur-[60px] rounded-full" />
                  <SvgIcon name="unete ahora" size={176} className="relative float-animation drop-shadow-[0_0_40px_rgba(201,168,76,0.4)]" />
                </div>
              </div>
              <div className="text-center lg:text-left flex-1">
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">{pT.cta.title}</h2>
                <p className="text-gray-300 mb-8 text-lg leading-relaxed">{pT.cta.desc}</p>
                <Link
                  href="/registro"
                  className="inline-block px-10 py-4 rounded-xl font-bold text-lg no-underline transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(201,168,76,0.4)]"
                  style={{ background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: BG }}
                >
                  {pT.cta.btn}
                </Link>
                <p className="mt-4 text-sm" style={{ color: DARK }}>{pT.cta.hint}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
