"use client";

import Link from 'next/link';
import FormularioRegistro from '@/components/FormularioRegistro';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Creador } from '@/data/creadores';
import { StatCounter } from '@/components/StatCounter';
import { ShimmerButton } from '@/components/ShimmerButton';
import { ICON_SOCIAL, ICON_UI, ICON_V3 } from '@/components/icons';

interface Props {
  c: Creador;
  otrosCreadores: Creador[];
}

function getMockStats(c: Creador) {
  const base = c.slug.length + c.nombre.length;
  return {
    contenidos: 40 + (base % 80),
    predicciones: 75 + (base % 20),
  };
}

function getMockContent(c: Creador) {
  return [
    {
      title: `Análisis táctico: el rol de ${c.pais} en el Mundial 2026`,
      type: 'Video',
      views: '120K',
    },
    {
      title: `Predicciones de ${c.nombre}: fase de grupos`,
      type: 'Artículo',
      views: '85K',
    },
    {
      title: `Directo especial con ${c.nombre}: sorteo y reacciones`,
      type: 'Stream',
      views: '210K',
    },
  ];
}

function SocialLarge({
  url,
  plataforma,
  usuario,
  color,
}: {
  url: string;
  plataforma: string;
  usuario: string;
  color: string;
}) {
  const icons = ICON_SOCIAL;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300"
      style={{ minWidth: 90 }}
    >
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center mb-1 transition-transform group-hover:scale-110"
        style={{ background: `${color}20` }}
      >
        {icons[plataforma] || null}
      </div>
      <span className="text-xs font-bold text-white uppercase">{plataforma}</span>
      <span className="text-xs text-gray-400">{usuario}</span>
    </a>
  );
}

export default function RegistroCreadorClient({ c, otrosCreadores }: Props) {
  const { t } = useLanguage();
  const rT = t.registroCreador;
  const nav = t.nav;
  const stats = getMockStats(c);
  const latest = getMockContent(c);

  const InfluencerModal = () => (
    <div
      className="p-6 rounded-3xl border overflow-hidden relative"
      style={{
        borderColor: `${c.colorPrimario}30`,
        background: `linear-gradient(135deg, ${c.colorPrimario}08, rgba(15,23,42,0.6))`,
      }}
    >
      <div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: c.colorPrimario }}
      />
      <div className="relative">
        <div className="flex flex-col items-center text-center">
          <div
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden flex-shrink-0 border-2 mb-4"
            style={{
              borderColor: c.colorPrimario,
              boxShadow: `0 0 30px ${c.colorPrimario}30`,
            }}
          >
            <img src={c.imagen} alt={c.nombre} className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">{c.nombre}</h2>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl font-bold" style={{ color: c.colorPrimario }}>
              {c.seguidores}
            </span>
            <span className="text-sm text-gray-500">{rT.seguidores}</span>
          </div>
          <span
            className="px-3 py-1 rounded-full text-xs font-bold mb-4"
            style={{
              background: `${c.colorPrimario}20`,
              color: c.colorPrimario,
            }}
          >
            {c.plataformaPrincipal}
          </span>
          <div
            className="w-full p-4 rounded-2xl text-center border"
            style={{
              background: `${c.colorPrimario}08`,
              borderColor: `${c.colorPrimario}20`,
            }}
          >
            <div className="text-xs text-gray-400 mb-1">{rT.fansRegistrados}</div>
            <div className="text-3xl sm:text-4xl font-black" style={{ color: c.colorPrimario }}>
              —
            </div>
            <div className="text-xs text-gray-500 mt-1">{rT.seDeLos}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const BenefitsModal = () => (
    <div
      className="p-6 rounded-3xl border border-[#1E293B]/50"
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.5), rgba(15,23,42,0.2))',
        backdropFilter: 'blur(12px)',
      }}
    >
      <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
        <span className="w-6 h-6 flex-shrink-0">{ICON_V3.stories}</span> {rT.alUnirte}
      </h3>
      <div className="space-y-3">
        {[
          { icon: ICON_V3.ligas },
          { icon: ICON_V3.rankings },
          { icon: ICON_V3.streaming },
          { icon: ICON_V3.fantasy },
          { icon: ICON_V3.trivia },
        ].map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-3 rounded-xl transition-colors hover:bg-white/5"
            style={{ background: 'rgba(11,24,37,0.3)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{ background: `${c.colorPrimario}15` }}
            >
              {item.icon}
            </div>
            <span className="text-gray-300 text-sm font-medium">
              {rT.benefits[i]?.text}
            </span>
            <span className="ml-auto flex-shrink-0" style={{ color: c.colorPrimario }}>
              {ICON_UI.check}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const OtherCreatorsModal = () => (
    <div
      className="p-6 rounded-3xl border border-[#1E293B]/50"
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.5), rgba(15,23,42,0.2))',
        backdropFilter: 'blur(12px)',
      }}
    >
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
        {rT.tambiénPuedes}
      </h3>
      <div className="space-y-3">
        {otrosCreadores.map((cr) => (
          <Link
            key={cr.slug}
            href={`/registro/${cr.slug}`}
            className="flex items-center gap-3 p-3 rounded-xl border border-[#1E293B]/30 hover:border-[#C9A84C]/30 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
              <img src={cr.imagen} alt={cr.nombre} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white text-sm truncate group-hover:text-[#C9A84C] transition-colors">
                {cr.nombre}
              </div>
              <div className="text-xs text-gray-500">{cr.seguidores}</div>
            </div>
            <span className="text-sm">{cr.emoji}</span>
          </Link>
        ))}
      </div>
    </div>
  );

  const FormModal = () => (
    <div
      className="p-6 sm:p-8 rounded-3xl border overflow-hidden relative"
      style={{
        borderColor: `${c.colorPrimario}25`,
        background: 'linear-gradient(135deg, rgba(15,23,42,0.8), rgba(11,24,37,0.6))',
        backdropFilter: 'blur(20px)',
        boxShadow: `0 25px 50px -12px ${c.colorPrimario}15, 0 0 0 1px ${c.colorPrimario}10`,
      }}
    >
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl"
          style={{
            background: `linear-gradient(135deg, ${c.colorPrimario}20, ${c.colorSecundario}10)`,
            border: `1px solid ${c.colorPrimario}30`,
          }}
        >
          {c.emoji}
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{rT.formTitle}</h2>
        <p className="text-sm text-gray-400">{rT.formSub}</p>
      </div>
      <FormularioRegistro creadorPreseleccionado={c.slug} />
      <div className="mt-6 pt-6 border-t border-[#1E293B]/50">
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500 flex-wrap">
          <span className="flex items-center gap-1.5" style={{ color: c.colorPrimario }}>
            {ICON_UI.circleCheck}
            {rT.free}
          </span>
          <span className="flex items-center gap-1.5" style={{ color: c.colorPrimario }}>
            {ICON_UI.lock}
            {rT.secure}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/4 w-[800px] h-[600px] rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle, ${c.colorPrimario}30 0%, transparent 70%)`,
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full opacity-15"
          style={{
            background: `radial-gradient(circle, ${c.colorSecundario}20 0%, transparent 70%)`,
            filter: 'blur(100px)',
          }}
        />
      </div>

      {/* Top line */}
      <div
        className="fixed top-0 left-0 right-0 h-[3px] z-50"
        style={{
          background: `linear-gradient(90deg, transparent, ${c.colorPrimario}, ${c.colorSecundario}, transparent)`,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-0 pb-8 sm:pb-12">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 mb-8">
          <ol className="flex gap-2 items-center flex-wrap">
            <li>
              <Link href="/" className="hover:text-[#C9A84C] transition-colors">
                {nav.inicio}
              </Link>
            </li>
            <li className="text-gray-600">/</li>
            <li>
              <Link href="/registro" className="hover:text-[#C9A84C] transition-colors">
                {rT.registro}
              </Link>
            </li>
            <li className="text-gray-600">/</li>
            <li style={{ color: c.colorPrimario }} className="font-medium">
              {c.nombre}
            </li>
          </ol>
        </nav>

        {/* Custom Banner */}
        <div
          className="relative overflow-hidden rounded-3xl mb-8 sm:mb-10"
          style={{
            background: `linear-gradient(135deg, ${c.colorPrimario}15, ${c.colorSecundario}08)`,
            border: `1px solid ${c.colorPrimario}25`,
          }}
        >
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 100% 0%, ${c.colorPrimario}25 0%, transparent 60%)`,
            }}
          />
          <div className="relative z-10 px-6 sm:px-10 py-10 sm:py-14 flex flex-col sm:flex-row sm:items-center gap-6">
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex-shrink-0 border-2"
              style={{
                borderColor: c.colorPrimario,
                boxShadow: `0 0 40px ${c.colorPrimario}30`,
              }}
            >
              <img src={c.imagen} alt={c.nombre} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-3"
                style={{
                  background: `${c.colorPrimario}15`,
                  color: c.colorPrimario,
                  border: `1px solid ${c.colorPrimario}30`,
                }}
              >
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: c.colorPrimario }} />
                {rT.badge} {c.nombre}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3">
                {rT.heroTitle}{' '}
                <span style={{ color: c.colorPrimario }}>{c.nombre}</span>
              </h1>
              <p className="text-gray-300 text-base sm:text-lg max-w-2xl leading-relaxed">
                {c.bio} {rT.heroBioSuffix}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Banner */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 sm:mb-10"
        >
          {[
            { label: rT.seguidores, value: c.seguidoresNum },
            { label: rT.statContent, value: stats.contenidos },
            { label: rT.statPredictions, value: stats.predicciones },
          ].map((s) => (
            <div
              key={s.label}
              className="p-5 rounded-2xl border text-center"
              style={{
                background: `${c.colorPrimario}08`,
                borderColor: `${c.colorPrimario}20`,
              }}
            >
              <div
                className="text-3xl sm:text-4xl font-black mb-1"
                style={{ color: c.colorPrimario }}
              >
                <StatCounter value={s.value} />
                {s.label === rT.statPredictions ? '%' : ''}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Latest Content */}
        <div className="mb-8 sm:mb-10">
          <h2 className="text-xl sm:text-2xl font-black text-white mb-4">{rT.latestContent}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {latest.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border hover:border-[#C9A84C]/30 transition-all group"
                style={{
                  background: 'rgba(15,23,42,0.4)',
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
                    style={{ background: `${c.colorPrimario}20`, color: c.colorPrimario }}
                  >
                    {item.type}
                  </span>
                  <span className="text-xs text-gray-500">{item.views} views</span>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#C9A84C] transition-colors leading-snug">
                  {item.title}
                </h3>
              </div>
            ))}
          </div>
        </div>

        {/* Socials Big */}
        {c.redes && c.redes.length > 0 && (
          <div className="mb-8 sm:mb-10">
            <h2 className="text-xl sm:text-2xl font-black text-white mb-4">
              {rT.followOn}
            </h2>
            <div className="flex flex-wrap gap-3">
              {c.redes.map((red) => (
                <SocialLarge
                  key={red.plataforma}
                  url={red.url}
                  plataforma={red.plataforma}
                  usuario={red.usuario}
                  color={c.colorPrimario}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <Link href="/creadores">
            <ShimmerButton className="text-sm">← {rT.volverLista}</ShimmerButton>
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
            <div
              className="p-6 sm:p-8 rounded-3xl border overflow-hidden relative"
              style={{
                borderColor: `${c.colorPrimario}30`,
                background: `linear-gradient(135deg, ${c.colorPrimario}08, rgba(15,23,42,0.6))`,
              }}
            >
              <div
                className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-30 blur-3xl pointer-events-none"
                style={{ background: c.colorPrimario }}
              />
              <div className="relative">
                <div className="flex items-center gap-5 mb-6">
                  <div
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex-shrink-0 border-2"
                    style={{
                      borderColor: c.colorPrimario,
                      boxShadow: `0 0 30px ${c.colorPrimario}30`,
                    }}
                  >
                    <img src={c.imagen} alt={c.nombre} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">{c.nombre}</h2>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold" style={{ color: c.colorPrimario }}>
                        {c.seguidores}
                      </span>
                      <span className="text-sm text-gray-500">{rT.seguidores}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className="px-2 py-0.5 rounded-md text-xs font-bold"
                        style={{
                          background: `${c.colorPrimario}20`,
                          color: c.colorPrimario,
                        }}
                      >
                        {c.plataformaPrincipal}
                      </span>
                      <span className="text-lg">{c.emoji}</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">{c.contenido}</p>
                <div
                  className="p-4 rounded-2xl text-center border"
                  style={{
                    background: `${c.colorPrimario}08`,
                    borderColor: `${c.colorPrimario}20`,
                  }}
                >
                  <div className="text-xs text-gray-400 mb-1">{rT.fansRegistrados}</div>
                  <div
                    className="text-3xl sm:text-4xl font-black"
                    style={{ color: c.colorPrimario }}
                  >
                    —
                  </div>
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
            <Link href="/creadores">
              <div className="block w-full py-3 rounded-xl text-center text-sm font-medium text-gray-400 border border-[#1E293B] hover:border-[#C9A84C]/30 hover:text-[#C9A84C] transition-all duration-300 bg-[#0B1825]/30 cursor-pointer">
                ← {rT.volverLista}
              </div>
            </Link>
            <div
              className="mt-6 p-5 rounded-2xl border border-[#1E293B] text-center"
              style={{ background: 'rgba(15,23,42,0.3)' }}
            >
              <p className="text-xs text-gray-400 mb-3">{rT.conocesAlguien}</p>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Únete al equipo de ${c.nombre} en ZonaMundial para el torneo 2026 🏆⚽ https://zonamundial.app/registro/${c.slug}`
                )}`}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #25D366, #128C7E)',
                  boxShadow: '0 4px 16px rgba(37,211,102,0.25)',
                }}
              >
                {ICON_SOCIAL.whatsapp}
                {rT.invitarWhatsapp}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
