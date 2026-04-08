// src/app/registro/page.tsx
// ZonaMundial.app — Página de pre-registro

"use client";

import Link from 'next/link';
import FormularioRegistro from '@/components/FormularioRegistro';
import { FeatureIcon } from '@/components/FeatureIcon';
import { getTotalSeguidores, getCreadoresActivos } from '@/data/creadores';
import { useLanguage } from '@/i18n/LanguageContext';

const FEATURE_COLORS = ['#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6', '#f97316', '#06b6d4', '#14b8a6', '#eab308'];

export default function RegistroPage() {
  const { t } = useLanguage();
  const rT = t.registro;
  const totalSeg = getTotalSeguidores();
  const numCreadores = getCreadoresActivos().length;
  const creadores = getCreadoresActivos();
  const FEATURES = rT.features.map((f, i) => ({ ...f, color: FEATURE_COLORS[i] }));

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.3) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-0 pb-8 sm:pb-12">

        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 mb-8">
          <ol className="flex gap-2 items-center">
            <li><Link href="/" className="hover:text-[#C9A84C] transition-colors">{t.nav.inicio}</Link></li>
            <li className="text-gray-600">/</li>
            <li className="text-[#C9A84C] font-medium">{rT.formTitle}</li>
          </ol>
        </nav>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#C9A84C]/30 text-xs font-bold text-[#C9A84C] tracking-wider uppercase mb-6 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.1), rgba(201,168,76,0.02))' }}>
            <span className="w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse" />
            {rT.badge}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
            {rT.title1}{' '}
            <span className="bg-gradient-to-r from-[#C9A84C] via-[#FDE68A] to-[#C9A84C] bg-clip-text text-transparent">
              {rT.title2}
            </span>
          </h1>

          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            {rT.subtitle.replace('{n}', numCreadores.toString()).replace('{s}', totalSeg)}
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-12">
            {[
              { value: totalSeg, label: rT.stats.seguidores, icon: '/img/zonamundial-images/imagenes/logos para sustuir emojis/creadores.png' },
              { value: numCreadores.toString(), label: rT.stats.creadores, icon: '/img/zonamundial-images/imagenes/logos para sustuir emojis/48 selecciones.png' },
              { value: '104', label: rT.stats.partidos, icon: '/img/zonamundial-images/imagenes/logos para sustuir emojis/match center.png' },
              { value: '8', label: rT.stats.modos, icon: '/img/zonamundial-images/imagenes/logos para sustuir emojis/fantasy.png' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-[#1E293B]/50 cursor-default"
                style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.6), rgba(15,23,42,0.3))' }}>
                <img src={stat.icon} alt="" className="w-10 h-10 object-contain" />
                <div className="text-left">
                  <div className="text-xl sm:text-2xl font-black text-[#C9A84C]">{stat.value}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">

          {/* LEFT: Features & Creadores - En móvil aparece segundo (order-2) */}
          <div className="space-y-8 order-2 lg:order-1">
            {/* Features Grid */}
            <div className="p-6 sm:p-8 rounded-3xl border border-[#1E293B]/50"
              style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.5), rgba(15,23,42,0.2))', backdropFilter: 'blur(12px)' }}>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <FeatureIcon title="Predicciones" size={32} /> {rT.includes}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {FEATURES.map((f, i) => (
                  <div key={i} 
                    className="p-4 rounded-2xl border border-[#1E293B]/30 hover:border-[#C9A84C]/30 transition-all duration-300 group cursor-default"
                    style={{ background: 'rgba(11,24,37,0.5)' }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                      style={{ background: `${f.color}15`, border: `1px solid ${f.color}30` }}>
                      <FeatureIcon title={f.iconTitle} size={36} />
                    </div>
                    <div className="font-bold text-white text-sm mb-1">{f.title}</div>
                    <div className="text-xs text-gray-500">{f.desc}</div>
                  </div>
                ))}
              </div>
              
              {/* And more... */}
              <div className="mt-6 p-4 rounded-2xl border border-[#C9A84C]/20 text-center"
                style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.02))' }}>
                <p className="text-sm text-[#C9A84C] font-medium flex items-center justify-center gap-2">
                  <img src="/img/zonamundial-images/imagenes/logos para sustuir emojis/stories.png" alt="" className="w-5 h-5 object-contain" />
                  {rT.surprises}
                </p>
              </div>
            </div>

            {/* Creadores Destacados */}
            <div className="p-6 sm:p-8 rounded-3xl border border-[#1E293B]/50"
              style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.5), rgba(15,23,42,0.2))', backdropFilter: 'blur(12px)' }}>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <FeatureIcon title="Creadores" size={32} /> {rT.featuredCreators}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {creadores.slice(0, 4).map((c) => (
                  <Link key={c.slug} href={`/registro/${c.slug}`}
                    className="flex flex-col items-center p-5 rounded-2xl border border-[#1E293B]/30 hover:border-[#C9A84C]/30 transition-all duration-300 group hover:scale-[1.02]"
                    style={{ background: 'rgba(11,24,37,0.4)' }}>
                    <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 mb-3 shadow-lg"
                      style={{ borderColor: `${c.colorPrimario}60`, boxShadow: `0 4px 20px ${c.colorPrimario}20` }}>
                      <img src={c.imagen} alt={c.nombre} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-white text-base mb-1 group-hover:text-[#C9A84C] transition-colors">{c.nombre}</div>
                      <div className="text-sm text-gray-400 font-medium">{c.seguidores} seguidores</div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link href="/creadores"
                className="block text-center mt-6 text-sm font-medium text-[#C9A84C] hover:text-[#E8D48B] transition-colors">
                {rT.verCreadores}
              </Link>
            </div>
          </div>

          {/* RIGHT: Form - En móvil aparece primero (order-1) */}
          <div className="order-1 lg:order-2 lg:sticky lg:top-24">
            <div className="p-8 sm:p-10 rounded-3xl border border-[#C9A84C]/20"
              style={{ 
                background: 'linear-gradient(135deg, rgba(15,23,42,0.8), rgba(11,24,37,0.6))', 
                backdropFilter: 'blur(20px)',
                boxShadow: '0 25px 50px -12px rgba(201,168,76,0.15), 0 0 0 1px rgba(201,168,76,0.1)'
              }}>
              
              {/* Form Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.05))', border: '1px solid rgba(201,168,76,0.3)' }}>
                  <img 
                    src="/img/zonamundial-images/imagenes/IMG-20260302-WA0016-removebg-preview.png" 
                    alt="ZonaMundial" 
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{rT.formTitle}</h2>
                <p className="text-sm text-gray-400">{rT.formSub}</p>
              </div>

              <FormularioRegistro />

              {/* Trust badges */}
              <div className="mt-6 pt-6 border-t border-[#1E293B]/50">
                <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#C9A84C]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {rT.trust.free}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#C9A84C]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    {rT.trust.secure}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#C9A84C]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {rT.trust.noSpam}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Sponsor */}
            <a href="https://rotulemos.com" target="_blank" rel="noopener noreferrer" className="lg:hidden mt-6 rounded-2xl border border-[#1E293B] flex items-center justify-center py-3"
              data-sponsor-slot="registro-mobile">
              <img src="/img/imagenessilviu/rotulemos320x50.png" alt="Rotulemos" className="rounded-lg" style={{maxWidth:"100%",height:"auto"}} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
