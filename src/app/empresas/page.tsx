// src/app/empresas/page.tsx
//
// Landing comercial de "Porra Corporativa para Empresas". Página pública e
// indexable dirigida a RRHH, managers y dueños de pymes: explica el producto,
// cómo funciona, qué gana la empresa y los planes, con CTA al panel de alta.
// Espejo de src/app/bares/page.tsx adaptado al comprador B2B. Estética
// ZonaMundial (azul marino + dorado). Mobile-first y orientada a conversión.
//
// Sin fotos: el visual del hero y del bloque "en acción" usa mockups CSS/SVG
// (predicción + ranking por departamentos), sin imágenes corporativas todavía.

import type { Metadata } from "next";
import Link from "next/link";
import {
  Trophy, Users, Mail, Repeat, BarChart3, Palette, ArrowRight,
  Lock, Megaphone, Monitor, FileText, Sparkles, Medal,
} from "lucide-react";
import EmpresaPlanCards from "./EmpresaPlanCards";
// Reutiliza el cargador de imagen con fallback de /bares (genérico, no toca /bares).
import BarPhoto from "../bares/BarPhoto";

const EMPRESAS_TITLE = "Porra Corporativa para Empresas · ZonaMundial";
const EMPRESAS_DESCRIPTION =
  "Crea la liga del Mundial 2026 para tu empresa: liga privada solo para empleados, ranking por departamentos, kit de comunicación interna y premios que define tu equipo. Pago único, sin suscripción.";

export const metadata: Metadata = {
  title: EMPRESAS_TITLE,
  description: EMPRESAS_DESCRIPTION,
  keywords: [
    "porra empresa mundial 2026", "team building mundial", "liga empresa mundial",
    "porra oficina", "quiniela empresa", "actividades equipo mundial 2026",
  ],
  alternates: { canonical: "/empresas" },
  robots: { index: true, follow: true },
  // OG/Twitter propios para que el preview (WhatsApp, Telegram, redes) sea de
  // la Porra Corporativa y no herede el genérico de ZM del layout raíz. La
  // imagen la inyecta automáticamente src/app/empresas/opengraph-image.tsx.
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "/empresas",
    siteName: "ZonaMundial",
    title: EMPRESAS_TITLE,
    description: EMPRESAS_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    site: "@zonamundial",
    creator: "@zonamundial",
    title: EMPRESAS_TITLE,
    description: EMPRESAS_DESCRIPTION,
  },
};

const GOLD = "#c9a84c";
const GOLD_GRAD = "linear-gradient(135deg, #C9A84C, #E8C76B 50%, #FDE68A)";

// CTA de alta: lleva el tipo "empresa" para que la porra nazca marcada como tal.
// El panel lo lee de ?tipo=empresa y crea la porra con kind='empresa' (su kit
// usará el cartel de empresa automáticamente, sin tocar la BD a mano).
const CTA_HREF = "/bar-dashboard?tipo=empresa";

/* ─── Mockups decorativos (UI de producto, SVG/JSX — sin fotos) ───────────── */

// Teléfono con una predicción de un empleado.
function PhoneMockup() {
  return (
    <div
      className="relative w-[170px] rounded-[26px] p-2.5"
      style={{ background: "linear-gradient(160deg,#1b2a40,#0a1220)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 30px 60px -24px rgba(0,0,0,0.8)" }}
    >
      <div className="rounded-[20px] overflow-hidden" style={{ background: "#0b1622", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="px-3 pt-3 pb-2 flex items-center justify-between" style={{ background: "rgba(201,168,76,0.08)" }}>
          <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: GOLD }}>Liga · TuEmpresa</span>
          <Trophy size={12} color={GOLD} />
        </div>
        <div className="p-3">
          <p className="text-[9px] text-zm-text-muted">Jornada de grupos</p>
          <div className="mt-2 flex items-center justify-between text-white">
            <span className="text-[11px] font-bold">ESP</span>
            <span className="text-[15px] font-black" style={{ color: GOLD }}>2 – 1</span>
            <span className="text-[11px] font-bold">ARG</span>
          </div>
          <div className="mt-3 flex gap-1.5">
            <div className="flex-1 h-7 rounded-lg grid place-items-center text-[10px] font-black" style={{ background: GOLD_GRAD, color: "#1A1208" }}>Local</div>
            <div className="flex-1 h-7 rounded-lg grid place-items-center text-[10px] font-bold" style={{ background: "rgba(255,255,255,0.06)", color: "#cbd5e1" }}>Empate</div>
            <div className="flex-1 h-7 rounded-lg grid place-items-center text-[10px] font-bold" style={{ background: "rgba(255,255,255,0.06)", color: "#cbd5e1" }}>Visita</div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[8.5px]" style={{ color: GOLD }}>
            <Trophy size={10} /> Suma puntos para tu departamento
          </div>
        </div>
      </div>
    </div>
  );
}

// Ranking por equipos/departamentos (reutilizado en hero y en bloque "en acción").
function RankingMockup({
  place,
  rows,
  maxWidth = 300,
}: {
  place: string;
  rows: { p: string; n: string; pts: string }[];
  maxWidth?: number;
}) {
  return (
    <div className="w-full" style={{ maxWidth }}>
      <div
        className="rounded-2xl p-3.5"
        style={{ background: "linear-gradient(160deg,#0e1c2e,#091320)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 30px 60px -24px rgba(0,0,0,0.8)" }}
      >
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider" style={{ color: GOLD }}>
            <BarChart3 size={12} /> Ranking por equipos
          </span>
          <span className="text-[9px] text-zm-text-muted">{place}</span>
        </div>
        <div className="mt-3 space-y-1.5">
          {rows.map((r, i) => (
            <div
              key={r.p}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5"
              style={{ background: i === 0 ? "rgba(201,168,76,0.16)" : "rgba(255,255,255,0.04)" }}
            >
              <span className="w-4 text-[11px] font-black" style={{ color: i === 0 ? GOLD : "#94a3b8" }}>{r.p}</span>
              <span className="flex-1 text-[11px] font-bold text-white">{r.n}</span>
              <span className="text-[11px] font-black" style={{ color: GOLD }}>{r.pts}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 mx-auto h-1.5 w-16 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }} />
    </div>
  );
}

/* ─── Datos ───────────────────────────────────────────────────────────────── */

const STEPS = [
  { n: 1, icon: Palette, title: "Configura la liga de tu empresa", text: "Crea la página de tu empresa, añade el logo, define los premios internos y los equipos por departamento." },
  { n: 2, icon: Mail, title: "Invita a tu equipo", text: "Comparte el enlace o código privado por email, Slack o Teams. Solo entra tu gente: la liga es cerrada." },
  { n: 3, icon: Repeat, title: "Compiten durante todo el Mundial", text: "Cada empleado predice los partidos, suma puntos para su departamento y sigue el ranking jornada a jornada." },
];

const WINS = [
  { icon: BarChart3, title: "Ranking por departamentos", text: "Los puntos individuales suman para el equipo. La rivalidad sana entre departamentos mantiene viva la competición." },
  { icon: Users, title: "Conversación de oficina durante 5 semanas", text: "Cada jornada del torneo es un motivo para comentar, picarse y seguir la clasificación." },
  { icon: Sparkles, title: "Team building sin organizar nada", text: "Sin logística, sin reservas, sin presupuesto de evento. La actividad corre sola durante todo el Mundial." },
];

const FEATURES = [
  { icon: Lock, title: "Liga privada y cerrada", text: "Solo tu equipo. Acceso por invitación o código de empresa, nadie de fuera.", big: false },
  { icon: BarChart3, title: "Ranking por departamentos", text: "Clasificación individual y por equipos. Tú defines los grupos.", big: true },
  { icon: Palette, title: "Landing con tu marca", text: "Tu empresa con su propia página del Mundial, con logo y colores.", big: false },
  { icon: Megaphone, title: "Kit de comunicación interna", text: "Email de lanzamiento listo para reenviar, banner para Slack/Teams y cartel para la oficina.", big: false },
  { icon: Monitor, title: "Pantalla para la oficina", text: "Muestra el ranking y el premio en la TV de la oficina o en la cocina.", big: false },
  { icon: FileText, title: "Informe final de participación", text: "Resumen en PDF con ganadores, participación y estadísticas. Listo para enseñar a dirección.", big: false },
];

/* ─── Página ──────────────────────────────────────────────────────────────── */

export default function EmpresasLandingPage() {
  return (
    <main
      className="min-h-screen text-zm-text overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 75% 45% at 50% -5%, rgba(201,168,76,0.10), transparent 60%), linear-gradient(180deg, #0A111E 0%, #0E1B2C 45%, #0B1622 100%)",
      }}
    >
      <div className="max-w-6xl mx-auto px-5 py-14 sm:py-20">
        {/* ── HERO ─────────────────────────────────────────── */}
        <section className="grid lg:grid-cols-2 gap-10 lg:gap-8 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase font-bold px-3 py-1.5 rounded-full" style={{ color: GOLD, background: "rgba(201,168,76,0.10)", border: "1px solid rgba(201,168,76,0.25)" }}>
              <Trophy size={13} /> Para empresas y equipos · Mundial 2026
            </div>
            <h1 className="mt-5 text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
              La liga del Mundial de tu empresa, sin el{" "}
              <span
                style={{
                  backgroundImage: GOLD_GRAD,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}
              >
                Excel de siempre
              </span>
            </h1>
            <p className="mt-5 max-w-xl mx-auto lg:mx-0 text-lg text-zm-text-muted leading-relaxed">
              Crea una competición privada para tu equipo: cada empleado predice, los departamentos
              compiten y el ranking se vive en la oficina durante todo el torneo.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <Link
                href={CTA_HREF}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-black transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
                style={{ background: GOLD_GRAD, color: "#1A1208", boxShadow: "0 12px 34px -10px rgba(201,168,76,0.7)" }}
              >
                Crear la liga de mi empresa <ArrowRight size={18} />
              </Link>
              <Link
                href="#planes"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold transition-transform active:scale-[0.98]"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", color: "#E2E8F0" }}
              >
                Ver planes
              </Link>
            </div>
            <p className="mt-4 text-[12px] text-zm-text-muted flex flex-wrap items-center justify-center lg:justify-start gap-x-2 gap-y-1">
              <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} /> Pago único</span>
              <span className="opacity-40">·</span>
              <span>Sin suscripción</span>
              <span className="opacity-40">·</span>
              <span>Liga privada solo para tu equipo</span>
            </p>
          </div>

          {/* Visual del hero: marco con degradado + mockups (predicción + ranking), sin foto */}
          <div className="relative flex items-center justify-center lg:justify-end">
            <div
              className="absolute inset-0 -z-10 blur-3xl opacity-50"
              style={{ background: "radial-gradient(circle at 60% 40%, rgba(201,168,76,0.20), transparent 60%)" }}
            />
            <div
              className="relative w-full max-w-[440px] aspect-[4/5] sm:aspect-[5/4] rounded-[28px] overflow-hidden"
              style={{
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow: "0 40px 90px -40px rgba(0,0,0,0.85)",
              }}
            >
              {/* Foto del hero (slot): aparece sola al subir el .webp; mientras, el mockup */}
              <BarPhoto
                src="/images/empresas/hero-porra-empresa.webp"
                alt="Equipo de una empresa participando en la liga del Mundial"
                priority
                objectPosition="center"
              >
                <div
                  className="w-full h-full"
                  style={{
                    background:
                      "radial-gradient(120% 80% at 80% 10%, rgba(201,168,76,0.16), transparent 55%), linear-gradient(150deg, #16273E 0%, #0E1B2C 55%, #0A1422 100%)",
                  }}
                />
              </BarPhoto>

              {/* Overlay para legibilidad de los mockups sobre la foto */}
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(180deg, rgba(10,17,30,0.45) 0%, rgba(10,17,30,0.30) 45%, rgba(10,17,30,0.68) 100%)" }}
              />

              {/* Ranking por departamentos, centrado */}
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <RankingMockup
                  place="TuEmpresa S.L."
                  maxWidth={260}
                  rows={[
                    { p: "1", n: "Equipo Ventas", pts: "540" },
                    { p: "2", n: "Equipo Marketing", pts: "512" },
                    { p: "3", n: "Equipo Almacén", pts: "498" },
                  ]}
                />
              </div>

              {/* Teléfono con predicción, flotando */}
              <div className="absolute -left-3 bottom-4 hidden sm:block scale-90 origin-bottom-left drop-shadow-2xl">
                <PhoneMockup />
              </div>

              {/* Chip invitación privada */}
              <div
                className="absolute right-4 top-4 rounded-2xl px-3 py-2 flex items-center gap-1.5 backdrop-blur-sm"
                style={{ background: "rgba(12,22,38,0.72)", border: "1px solid rgba(201,168,76,0.3)", boxShadow: "0 18px 40px -18px rgba(0,0,0,0.8)" }}
              >
                <Lock size={12} color={GOLD} />
                <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: GOLD }}>
                  Invitación privada
                </span>
              </div>

              {/* Badge pago único */}
              <span
                className="absolute left-4 top-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                style={{ background: GOLD_GRAD, color: "#1A1208", boxShadow: "0 8px 20px -8px rgba(201,168,76,0.8)" }}
              >
                Pago único
              </span>
            </div>
          </div>
        </section>

        {/* ── CÓMO FUNCIONA ────────────────────────────────── */}
        <section className="mt-24">
          <h2 className="text-3xl font-black text-center" style={{ color: "#F4F1E9" }}>Cómo funciona</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.title}
                className="group relative rounded-3xl border p-7 overflow-hidden transition-transform hover:-translate-y-1.5"
                style={{
                  borderColor: "rgba(255,255,255,0.07)",
                  background: "linear-gradient(165deg, rgba(30,46,71,0.55) 0%, rgba(15,27,44,0.45) 100%)",
                  boxShadow: "0 24px 50px -34px rgba(0,0,0,0.7)",
                }}
              >
                <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.6), transparent)" }} />
                <span
                  className="absolute top-5 right-6 text-6xl font-black leading-none select-none"
                  style={{ color: "rgba(201,168,76,0.12)" }}
                >
                  {s.n}
                </span>
                <span
                  className="flex items-center justify-center w-16 h-16 rounded-2xl transition-transform group-hover:scale-105"
                  style={{
                    background: "linear-gradient(150deg, rgba(201,168,76,0.22), rgba(201,168,76,0.08))",
                    color: GOLD,
                    boxShadow: "inset 0 0 0 1px rgba(201,168,76,0.28), 0 10px 26px -12px rgba(201,168,76,0.5)",
                  }}
                >
                  <s.icon size={30} />
                </span>
                <h3 className="mt-6 text-lg font-black" style={{ color: "#F4F1E9" }}>{s.title}</h3>
                <p className="mt-2 text-sm text-zm-text-muted leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── BLOQUE VISUAL: tu empresa en acción ──────────── */}
        <section
          className="mt-24 rounded-[32px] border overflow-hidden"
          style={{ borderColor: "rgba(201,168,76,0.22)", background: "linear-gradient(135deg, rgba(201,168,76,0.10), rgba(11,24,37,0.5) 55%)" }}
        >
          <div className="grid lg:grid-cols-2 gap-10 items-center p-8 sm:p-12">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase font-bold" style={{ color: GOLD }}>
                <Medal size={14} /> Tu empresa en acción
              </div>
              <h2 className="mt-3 text-3xl font-black leading-tight" style={{ color: "#F4F1E9" }}>Ventas contra Marketing. Que gane el mejor.</h2>
              <p className="mt-4 max-w-md mx-auto lg:mx-0 text-zm-text-muted leading-relaxed">
                Cada empresa tiene su liga privada, su ranking individual y su clasificación por
                departamentos. La excusa perfecta para que el Mundial una al equipo.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {WINS.map((w) => (
                  <div key={w.title} className="rounded-2xl p-4 text-left" style={{ background: "linear-gradient(160deg, rgba(30,46,71,0.5), rgba(13,24,40,0.4))", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <span className="flex items-center justify-center w-9 h-9 rounded-xl mb-2" style={{ background: "rgba(201,168,76,0.14)", color: GOLD }}>
                      <w.icon size={18} />
                    </span>
                    <p className="text-sm font-bold" style={{ color: "#F4F1E9" }}>{w.title}</p>
                    <p className="mt-1 text-[12px] text-zm-text-muted leading-snug">{w.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative flex justify-center">
              <div
                className="relative w-full max-w-[420px] aspect-[4/3] rounded-[26px] overflow-hidden"
                style={{
                  border: "1px solid rgba(255,255,255,0.10)",
                  boxShadow: "0 40px 90px -42px rgba(0,0,0,0.85)",
                }}
              >
                {/* Foto de oficina (slot): aparece sola al subir el .webp; mientras, el mockup */}
                <BarPhoto
                  src="/images/empresas/empresa-ranking-oficina.webp"
                  alt="Pantalla en la oficina mostrando el ranking por departamentos durante el Mundial"
                  objectPosition="center"
                >
                  <div
                    className="w-full h-full"
                    style={{
                      background:
                        "radial-gradient(110% 90% at 20% 0%, rgba(201,168,76,0.14), transparent 55%), linear-gradient(150deg, #16273E, #0C1626)",
                    }}
                  />
                </BarPhoto>
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,17,30,0.30) 30%, rgba(10,17,30,0.6) 100%)" }} />
                <div className="absolute inset-0 flex items-center justify-center p-5">
                  <RankingMockup
                    place="TuEmpresa S.L."
                    rows={[
                      { p: "1", n: "Ventas", pts: "1.840" },
                      { p: "2", n: "Marketing", pts: "1.712" },
                      { p: "3", n: "Operaciones", pts: "1.689" },
                      { p: "4", n: "Dirección", pts: "1.520" },
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TODO LO QUE INCLUYE ──────────────────────────── */}
        <section className="mt-24">
          <h2 className="text-3xl font-black text-center" style={{ color: "#F4F1E9" }}>Todo lo que incluye</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`rounded-2xl border p-5 transition-transform hover:-translate-y-1 ${f.big ? "sm:col-span-2 lg:col-span-1" : ""}`}
                style={{
                  borderColor: f.big ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.06)",
                  background: f.big
                    ? "linear-gradient(135deg, rgba(201,168,76,0.16), rgba(13,24,40,0.45))"
                    : "linear-gradient(160deg, rgba(30,46,71,0.5), rgba(13,24,40,0.35))",
                  boxShadow: "0 22px 46px -34px rgba(0,0,0,0.65)",
                }}
              >
                <span
                  className="flex items-center justify-center w-12 h-12 rounded-xl"
                  style={{ background: f.big ? "rgba(201,168,76,0.22)" : "rgba(201,168,76,0.12)", color: GOLD }}
                >
                  <f.icon size={24} />
                </span>
                <h3 className="mt-4 font-black" style={{ color: "#F4F1E9" }}>{f.title}</h3>
                <p className="mt-1.5 text-sm text-zm-text-muted leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── PLANES ───────────────────────────────────────── */}
        <section id="planes" className="mt-24 scroll-mt-24">
          <h2 className="text-3xl font-black text-center" style={{ color: "#F4F1E9" }}>Elige el plan de tu empresa</h2>
          <p className="mt-3 text-center text-zm-text-muted">
            Pago único válido para todo el Mundial 2026. Sin suscripciones. Con factura. Precios para España.
          </p>
          <div className="mt-12">
            <EmpresaPlanCards />
          </div>
          <p className="mt-8 text-center text-sm text-zm-text-muted">
            ¿Más de 150 empleados o varias oficinas? Escríbenos a{" "}
            <a href="mailto:gol@zonamundial.app" style={{ color: GOLD }}>gol@zonamundial.app</a>{" "}
            y lo montamos contigo.
          </p>
          <p className="mt-3 mx-auto max-w-xl text-center text-[11px] text-zm-text-muted leading-relaxed">
            Emitimos factura. Actividad interna de empresa, sin premios en metálico gestionados por la plataforma.
          </p>
          <p className="mt-2 text-center text-[11px] text-zm-text-muted">
            ¿Tu empresa está en LATAM?{" "}
            <a href="mailto:gol@zonamundial.app?subject=Porra%20Empresas%20LATAM" style={{ color: GOLD }}>Escríbenos</a>{" "}
            y te pasamos precios locales.
          </p>
        </section>

        {/* ── CTA FINAL ────────────────────────────────────── */}
        <section
          className="mt-24 relative text-center rounded-[32px] border overflow-hidden p-10 sm:p-16"
          style={{ borderColor: "rgba(201,168,76,0.3)", boxShadow: "0 40px 90px -50px rgba(0,0,0,0.85)" }}
        >
          {/* Foto de cierre (slot): aparece sola al subir el .webp; mientras, degradado */}
          <div className="absolute inset-0 -z-20">
            <BarPhoto src="/images/empresas/cta-final-empresa.webp" alt="" objectPosition="center">
              <div className="w-full h-full" style={{ background: "linear-gradient(180deg, #142536, #0B1622)" }} />
            </BarPhoto>
          </div>
          <div
            className="absolute inset-0 -z-10"
            style={{ background: "radial-gradient(ellipse 70% 90% at 50% 0%, rgba(201,168,76,0.20), transparent 60%), linear-gradient(180deg, rgba(10,17,30,0.82), rgba(11,22,37,0.92))" }}
          />
          <h2 className="text-3xl sm:text-4xl font-black leading-tight">
            El Mundial ya está aquí. Tu equipo todavía está a tiempo.
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-zm-text-muted leading-relaxed">
            La fase de grupos dura hasta el 27 de junio: más de 70 partidos por delante. Monta la liga
            hoy y mañana tu equipo ya está prediciendo.
          </p>
          <Link
            href={CTA_HREF}
            className="mt-8 inline-flex items-center gap-2 px-9 py-4 rounded-full font-black transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            style={{ background: GOLD_GRAD, color: "#1A1208", boxShadow: "0 14px 38px -10px rgba(201,168,76,0.75)" }}
          >
            Crear la liga de mi empresa <ArrowRight size={18} />
          </Link>
          <p className="mt-5 text-[12px] text-zm-text-muted">
            Pago único · Liga privada · Lista en 10 minutos
          </p>
        </section>

        {/* ── NOTA LEGAL / CONFIANZA ───────────────────────── */}
        <p
          className="mt-12 mx-auto max-w-2xl text-center text-[12px] text-zm-text-muted leading-relaxed rounded-2xl px-5 py-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          ZonaMundial no es una casa de apuestas. Las ligas corporativas son un juego de predicciones
          sin premios en metálico gestionados por la plataforma; los incentivos los define cada empresa
          bajo su responsabilidad.
        </p>
      </div>
    </main>
  );
}
