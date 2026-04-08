"use client";

import Link from 'next/link';
import FormularioRegistro from '@/components/FormularioRegistro';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Creador } from '@/data/creadores';

interface Props {
  c: Creador;
  otrosCreadores: Creador[];
}

export default function RegistroCreadorClient({ c, otrosCreadores }: Props) {
  const { t } = useLanguage();
  const rT = t.registroCreador;
  const nav = t.nav;

  const InfluencerModal = () => (
    <div className="p-6 rounded-3xl border overflow-hidden relative"
      style={{ borderColor: `${c.colorPrimario}30`, background: `linear-gradient(135deg, ${c.colorPrimario}08, rgba(15,23,42,0.6))` }}>
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-30 blur-3xl pointer-events-none" style={{ background: c.colorPrimario }} />
      <div className="relative">
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden flex-shrink-0 border-2 mb-4"
            style={{ borderColor: c.colorPrimario, boxShadow: `0 0 30px ${c.colorPrimario}30` }}>
            <img src={c.imagen} alt={c.nombre} className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">{c.nombre}</h2>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl font-bold" style={{ color: c.colorPrimario }}>{c.seguidores}</span>
            <span className="text-sm text-gray-500">{rT.seguidores}</span>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold mb-4"
            style={{ background: `${c.colorPrimario}20`, color: c.colorPrimario }}>
            {c.plataformaPrincipal}
          </span>
          <div className="w-full p-4 rounded-2xl text-center border" style={{ background: `${c.colorPrimario}08`, borderColor: `${c.colorPrimario}20` }}>
            <div className="text-xs text-gray-400 mb-1">{rT.fansRegistrados}</div>
            <div className="text-3xl sm:text-4xl font-black" style={{ color: c.colorPrimario }}>—</div>
            <div className="text-xs text-gray-500 mt-1">{rT.seDeLos}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const BenefitsModal = () => (
    <div className="p-6 rounded-3xl border border-[#1E293B]/50"
      style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.5), rgba(15,23,42,0.2))', backdropFilter: 'blur(12px)' }}>
      <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
        <span className="text-xl">✨</span> {rT.alUnirte}
      </h3>
      <div className="space-y-3">
        {[
          { icon: '👥' }, { icon: '🏆' }, { icon: '📺' }, { icon: '🎁' }, { icon: '⚡' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-xl transition-colors hover:bg-white/5"
            style={{ background: 'rgba(11,24,37,0.3)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: `${c.colorPrimario}15` }}>
              {item.icon}
            </div>
            <span className="text-gray-300 text-sm font-medium">{rT.benefits[i]?.text}</span>
            <svg className="w-5 h-5 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: c.colorPrimario }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );

  const OtherCreatorsModal = () => (
    <div className="p-6 rounded-3xl border border-[#1E293B]/50"
      style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.5), rgba(15,23,42,0.2))', backdropFilter: 'blur(12px)' }}>
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">{rT.tambiénPuedes}</h3>
      <div className="space-y-3">
        {otrosCreadores.map((cr) => (
          <Link key={cr.slug} href={`/registro/${cr.slug}`}
            className="flex items-center gap-3 p-3 rounded-xl border border-[#1E293B]/30 hover:border-[#C9A84C]/30 transition-all group">
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
              <img src={cr.imagen} alt={cr.nombre} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white text-sm truncate group-hover:text-[#C9A84C] transition-colors">{cr.nombre}</div>
              <div className="text-xs text-gray-500">{cr.seguidores}</div>
            </div>
            <span className="text-sm">{cr.emoji}</span>
          </Link>
        ))}
      </div>
    </div>
  );

  const FormModal = () => (
    <div className="p-6 sm:p-8 rounded-3xl border overflow-hidden relative"
      style={{
        borderColor: `${c.colorPrimario}25`,
        background: 'linear-gradient(135deg, rgba(15,23,42,0.8), rgba(11,24,37,0.6))',
        backdropFilter: 'blur(20px)',
        boxShadow: `0 25px 50px -12px ${c.colorPrimario}15, 0 0 0 1px ${c.colorPrimario}10`
      }}>
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: `linear-gradient(135deg, ${c.colorPrimario}20, ${c.colorSecundario}10)`, border: `1px solid ${c.colorPrimario}30` }}>
          {c.emoji}
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{rT.formTitle}</h2>
        <p className="text-sm text-gray-400">{rT.formSub}</p>
      </div>
      <FormularioRegistro creadorPreseleccionado={c.slug} />
      <div className="mt-6 pt-6 border-t border-[#1E293B]/50">
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500 flex-wrap">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: c.colorPrimario }}>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {rT.free}
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: c.colorPrimario }}>
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            {rT.secure}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[800px] h-[600px] rounded-full opacity-20"
          style={{ background: `radial-gradient(circle, ${c.colorPrimario}30 0%, transparent 70%)`, filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full opacity-15"
          style={{ background: `radial-gradient(circle, ${c.colorSecundario}20 0%, transparent 70%)`, filter: 'blur(100px)' }} />
      </div>

      <div className="fixed top-0 left-0 right-0 h-[3px] z-50"
        style={{ background: `linear-gradient(90deg, transparent, ${c.colorPrimario}, ${c.colorSecundario}, transparent)` }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-0 pb-8 sm:pb-12">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 mb-8">
          <ol className="flex gap-2 items-center flex-wrap">
            <li><Link href="/" className="hover:text-[#C9A84C] transition-colors">{nav.inicio}</Link></li>
            <li className="text-gray-600">/</li>
            <li><Link href="/registro" className="hover:text-[#C9A84C] transition-colors">{rT.registro}</Link></li>
            <li className="text-gray-600">/</li>
            <li style={{ color: c.colorPrimario }} className="font-medium">{c.nombre}</li>
          </ol>
        </nav>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold tracking-wider uppercase mb-6"
            style={{ borderColor: `${c.colorPrimario}40`, background: `linear-gradient(135deg, ${c.colorPrimario}10, transparent)`, color: c.colorPrimario }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: c.colorPrimario }} />
            {rT.badge} {c.nombre}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
            {rT.heroTitle}{' '}
            <span style={{ color: c.colorPrimario }}>{c.nombre}</span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            {c.bio} {rT.heroBioSuffix}
          </p>
        </div>

        <div className="mb-6">
          <Link href="/creadores"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-400 border border-[#1E293B] hover:border-[#C9A84C]/30 hover:text-[#C9A84C] transition-all duration-300 bg-[#0B1825]/30">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {rT.volverLista}
          </Link>
        </div>

        {/* MOBILE LAYOUT */}
        <div className="lg:hidden space-y-6">
          <InfluencerModal />
          <FormModal />
          <BenefitsModal />
          <OtherCreatorsModal />
        </div>

        {/* DESKTOP LAYOUT */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* LEFT */}
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl border overflow-hidden relative"
              style={{ borderColor: `${c.colorPrimario}30`, background: `linear-gradient(135deg, ${c.colorPrimario}08, rgba(15,23,42,0.6))` }}>
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-30 blur-3xl pointer-events-none" style={{ background: c.colorPrimario }} />
              <div className="relative">
                <div className="flex items-center gap-5 mb-6">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex-shrink-0 border-2"
                    style={{ borderColor: c.colorPrimario, boxShadow: `0 0 30px ${c.colorPrimario}30` }}>
                    <img src={c.imagen} alt={c.nombre} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">{c.nombre}</h2>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold" style={{ color: c.colorPrimario }}>{c.seguidores}</span>
                      <span className="text-sm text-gray-500">{rT.seguidores}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold" style={{ background: `${c.colorPrimario}20`, color: c.colorPrimario }}>
                        {c.plataformaPrincipal}
                      </span>
                      <span className="text-lg">{c.emoji}</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">{c.contenido}</p>
                <div className="p-4 rounded-2xl text-center border" style={{ background: `${c.colorPrimario}08`, borderColor: `${c.colorPrimario}20` }}>
                  <div className="text-xs text-gray-400 mb-1">{rT.fansRegistrados}</div>
                  <div className="text-3xl sm:text-4xl font-black" style={{ color: c.colorPrimario }}>—</div>
                  <div className="text-xs text-gray-500 mt-1">{rT.seDeLos}</div>
                </div>
              </div>
            </div>
            <BenefitsModal />
            <OtherCreatorsModal />
          </div>

          {/* RIGHT */}
          <div className="lg:sticky lg:top-24 space-y-4">
            <FormModal />
            <Link href="/creadores"
              className="block w-full py-3 rounded-xl text-center text-sm font-medium text-gray-400 border border-[#1E293B] hover:border-[#C9A84C]/30 hover:text-[#C9A84C] transition-all duration-300 bg-[#0B1825]/30">
              ← {rT.volverLista}
            </Link>
            <div className="mt-6 p-5 rounded-2xl border border-[#1E293B] text-center" style={{ background: 'rgba(15,23,42,0.3)' }}>
              <p className="text-xs text-gray-400 mb-3">{rT.conocesAlguien}</p>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Únete al equipo de ${c.nombre} en ZonaMundial para el torneo 2026 🏆⚽ https://zonamundial.app/registro/${c.slug}`)}`}
                target="_blank" rel="noopener"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', boxShadow: '0 4px 16px rgba(37,211,102,0.25)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 00.914.914l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.387 0-4.592-.826-6.326-2.209l-.362-.29-3.053 1.024 1.024-3.053-.29-.362A9.935 9.935 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                {rT.invitarWhatsapp}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
