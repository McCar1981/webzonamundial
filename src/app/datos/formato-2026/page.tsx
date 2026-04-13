'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import { BracketDiagram } from '@/components/BracketDiagram';
import { StatCounter } from '@/components/StatCounter';
import { AnimatedSection } from '@/components/AnimatedSection';
import { ShimmerButton } from '@/components/ShimmerButton';
import { SimuladorTerceros, FAQAccordion } from './_components';
import { ICON_V3, ICON_DESCUBRE } from '@/components/icons';

function FormatoStep({ step, index, total }: { step: any; index: number; total: number }) {
  return (
    <div className="relative pl-8 sm:pl-12">
      {index < total - 1 && (
        <div className="absolute bottom-0 left-[19px] top-12 w-px bg-gradient-to-b from-white/20 to-transparent sm:left-[27px]" />
      )}
      <div
        className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black shadow-lg sm:h-14 sm:w-14 sm:rounded-2xl sm:text-2xl"
        style={{ background: `linear-gradient(135deg, ${step.color}, ${step.color}80)`, color: '#030712' }}
      >
        {step.n}
      </div>
      <div className="pb-10">
        <h3 className="mb-2 text-xl font-bold text-white sm:text-2xl">{step.title}</h3>
        <p className="text-sm leading-relaxed text-[#8a94b0] sm:text-base">{step.desc}</p>
      </div>
    </div>
  );
}

export default function Formato2026Page() {
  const { t, locale } = useLanguage();
  const f = t.formato2026;

  const schema = useMemo(() => {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: f.faq.map((item: any) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    };
  }, [f.faq]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <nav className="mb-4 text-xs text-gray-400 sm:mb-6 sm:text-sm">
        <ol className="flex flex-wrap gap-2">
          <li><Link href="/" className="hover:text-[#C9A84C]">{f.breadcrumbInicio}</Link></li>
          <li>/</li>
          <li><Link href="/datos" className="hover:text-[#C9A84C]">{f.breadcrumbDatos}</Link></li>
          <li>/</li>
          <li className="text-[#C9A84C]">{f.breadcrumbCurrent}</li>
        </ol>
      </nav>

      {/* HERO */}
      <section className="relative mb-10 overflow-hidden rounded-3xl sm:mb-14">
        <div className="absolute inset-0">
          <img
            src="/img/zonamundial-images/stadiums/metlife-stadium.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#060B14] via-[#060B14]/90 to-[#060B14]/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060B14] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 px-6 py-12 sm:px-10 sm:py-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/10 px-3 py-1.5 backdrop-blur-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#c9a84c]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#c9a84c] sm:text-xs">{f.heroBadge}</span>
          </div>

          <h1 className="mb-4 max-w-3xl text-3xl font-black leading-tight text-white sm:text-5xl md:text-6xl">
            {f.heroTitle}
            <span className="bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] bg-clip-text text-transparent">
              {f.heroTitleHighlight}
            </span>
            {f.heroTitleAfter}
          </h1>
          <p className="mb-8 max-w-2xl text-base text-[#8a94b0] sm:text-lg">
            {f.heroSubtitle}
          </p>

          {/* Stats grid */}
          <div className="grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {f.stats.map((d: any, i: number) => {
              const statIcons = [ICON_DESCUBRE.selecciones, ICON_DESCUBRE.grupos, ICON_V3.matchCenter, ICON_V3.microPred];
              return (
                <div key={d.label} className="rounded-xl border border-white/5 bg-[#0B1825]/80 p-4 backdrop-blur-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="w-5 h-5 flex-shrink-0 opacity-70">{statIcons[i]}</span>
                    <div className="text-[10px] text-gray-500 sm:text-xs">{d.sub}</div>
                  </div>
                  <div className="text-2xl font-black text-[#c9a84c] sm:text-3xl">
                    <StatCounter value={d.n} />
                  </div>
                  <div className="mt-1 text-sm font-bold text-white">{d.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PASOS DEL FORMATO */}
      <section className="mb-12 sm:mb-16">
        <AnimatedSection>
          <h2 className="mb-8 text-2xl font-black text-white sm:text-3xl">{f.stepsTitle}</h2>
        </AnimatedSection>
        <AnimatedSection stagger={0.15} y={20}>
          <div className="max-w-2xl">
            {f.steps.map((step: any, i: number) => (
              <FormatoStep key={step.n} step={step} index={i} total={f.steps.length} />
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* BRACKET DIAGRAM */}
      <section className="mb-12 rounded-3xl border border-white/5 bg-gradient-to-b from-[#0B1825]/50 to-transparent p-5 sm:mb-16 sm:p-8">
        <AnimatedSection>
          <h2 className="mb-2 text-2xl font-black text-white sm:text-3xl">{f.bracketTitle}</h2>
          <p className="mb-6 text-sm text-[#8a94b0] sm:text-base">{f.bracketSubtitle}</p>
        </AnimatedSection>
        <BracketDiagram labels={f.bracketRounds} playLabel={f.bracketPlay} />
      </section>

      {/* COMPARATIVA 2022 VS 2026 */}
      <section className="mb-12 sm:mb-16">
        <AnimatedSection>
          <h2 className="mb-8 text-2xl font-black text-white sm:text-3xl">{f.comparisonTitle}</h2>
        </AnimatedSection>
        <AnimatedSection className="grid grid-cols-1 gap-4 sm:grid-cols-2" stagger={0.08}>
          {f.comparisonItems.map((c: any) => (
            <div key={c.label} className="flex items-center gap-4 rounded-2xl border border-white/5 bg-[#0B1825] p-5 transition-colors hover:border-[#c9a84c]/20">
              <div className="flex-1 text-right">
                <div className="text-xl font-black text-gray-500 line-through sm:text-2xl">{c.before}</div>
                <div className="text-xs text-gray-600">{c.label}</div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" />
                  <path d="M13 5l7 7-7 7" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-2xl font-black text-white sm:text-3xl">
                  <StatCounter value={parseInt(c.after)} />
                </div>
                <div className="text-xs font-semibold text-[#c9a84c]">{c.label}</div>
              </div>
            </div>
          ))}
        </AnimatedSection>
      </section>

      {/* SISTEMA DE BRACKETS SEPARADOS */}
      <section className="mb-12 sm:mb-16">
        <AnimatedSection>
          <h2 className="mb-6 text-2xl font-black text-white sm:text-3xl">{f.bracketsSystemTitle}</h2>
        </AnimatedSection>
        <AnimatedSection className="rounded-3xl border border-white/5 bg-[#0B1825] p-6 sm:p-8" stagger={0.1}>
          <p className="mb-6 text-sm leading-relaxed text-[#8a94b0] sm:text-base">
            {f.bracketsSystemDesc}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/5 bg-[#060B14] p-5 transition-all hover:border-[#c9a84c]/20">
              <div className="mb-3 flex items-center gap-2">
                <span className="w-6 h-6 flex-shrink-0">{ICON_V3.rankings}</span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#c9a84c]">{f.bracketPath1Label}</span>
              </div>
              <p className="text-sm text-gray-300">{f.bracketPath1Desc}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#060B14] p-5 transition-all hover:border-[#c9a84c]/20">
              <div className="mb-3 flex items-center gap-2">
                <span className="w-6 h-6 flex-shrink-0">{ICON_V3.rankings}</span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#c9a84c]">{f.bracketPath2Label}</span>
              </div>
              <p className="text-sm text-gray-300">{f.bracketPath2Desc}</p>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* SIMULADOR */}
      <section className="mb-12 sm:mb-16">
        <AnimatedSection>
          <SimuladorTerceros />
        </AnimatedSection>
      </section>

      {/* FAQ */}
      <section className="mb-12 sm:mb-16">
        <AnimatedSection>
          <FAQAccordion title={f.faqTitle} items={f.faq} />
        </AnimatedSection>
      </section>

      {/* CTA */}
      <AnimatedSection className="mb-10 rounded-3xl border border-[#c9a84c]/20 bg-gradient-to-br from-[#c9a84c]/6 to-[#0B1825]/50 p-8 text-center sm:mb-10 sm:p-10">
        <div className="mx-auto mb-4 w-10 h-10 opacity-80">{ICON_V3.predicciones}</div>
        <p className="mb-4 text-base font-semibold text-[#c9a84c]">{f.ctaTitle}</p>
        <Link href="/registro">
          <ShimmerButton>{f.ctaBtn}</ShimmerButton>
        </Link>
      </AnimatedSection>

      {/* Internal links */}
      <AnimatedSection className="grid grid-cols-2 gap-3 sm:grid-cols-3" stagger={0.05} y={10}>
        <Link href="/grupos" className="flex flex-col items-center gap-2 rounded-xl border border-[#1a2a3f] bg-[#0B1825] p-4 text-center text-sm font-semibold text-gray-300 transition-all hover:border-[#C9A84C] hover:text-[#C9A84C]">
          <span className="w-6 h-6">{ICON_DESCUBRE.grupos}</span>
          {f.links.grupos}
        </Link>
        <Link href="/selecciones" className="flex flex-col items-center gap-2 rounded-xl border border-[#1a2a3f] bg-[#0B1825] p-4 text-center text-sm font-semibold text-gray-300 transition-all hover:border-[#C9A84C] hover:text-[#C9A84C]">
          <span className="w-6 h-6">{ICON_DESCUBRE.selecciones}</span>
          {f.links.selecciones}
        </Link>
        <Link href="/calendario" className="flex flex-col items-center gap-2 rounded-xl border border-[#1a2a3f] bg-[#0B1825] p-4 text-center text-sm font-semibold text-gray-300 transition-all hover:border-[#C9A84C] hover:text-[#C9A84C]">
          <span className="w-6 h-6">{ICON_V3.microPred}</span>
          {f.links.calendario}
        </Link>
      </AnimatedSection>
    </>
  );
}
