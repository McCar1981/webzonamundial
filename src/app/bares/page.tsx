// src/app/bares/page.tsx
//
// Landing comercial de "Porras Digitales para Bares" (FASE 2). Página pública e
// indexable dirigida a dueños de bares: explica el producto, cómo funciona, qué
// gana el bar y los planes, con CTA al panel del bar. Estética ZonaMundial
// (azul marino + dorado). Mobile-first y orientada a conversión.

import type { Metadata } from "next";
import Link from "next/link";
import {
  QrCode, Trophy, Tv, Gift, BarChart3, Palette, ArrowRight, Smartphone,
  Beer, Repeat, Sparkles, Medal,
} from "lucide-react";
import PlanCards from "./PlanCards";
import BarPhoto from "./BarPhoto";

const BARES_TITLE = "Porra Digital para Bares · ZonaMundial";
const BARES_DESCRIPTION =
  "Crea la porra digital de tu bar para el Mundial 2026: QR en la barra, predicciones, ranking del local y premios que defines tú. Pago único, sin suscripción.";

export const metadata: Metadata = {
  title: BARES_TITLE,
  description: BARES_DESCRIPTION,
  alternates: { canonical: "/bares" },
  // OG/Twitter propios para que el preview (WhatsApp, Telegram, redes) sea de
  // la Porra Digital y no herede el genérico de ZM del layout raíz. La imagen
  // la inyecta automáticamente src/app/bares/opengraph-image.tsx.
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "/bares",
    siteName: "ZonaMundial",
    title: BARES_TITLE,
    description: BARES_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    site: "@zonamundial",
    creator: "@zonamundial",
    title: BARES_TITLE,
    description: BARES_DESCRIPTION,
  },
};

const GOLD = "#c9a84c";
const GOLD_GRAD = "linear-gradient(135deg, #C9A84C, #E8C76B 50%, #FDE68A)";

/* ─── Mockups decorativos (UI de producto, SVG/JSX — sin fotos) ───────────── */

// QR estilizado (decorativo, no escaneable). Patrón premium dorado/marfil.
function BarQr({ size = 96 }: { size?: number }) {
  const c = 7; // celdas
  const cells = [
    "1111111","1000001","1011101","1011101","1011101","1000001","1111111",
  ].map((r) => r.split(""));
  const px = size / c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden role="presentation">
      <rect width={size} height={size} rx={10} fill="#F6F1E0" />
      {cells.map((row, y) =>
        row.map((v, x) =>
          v === "1" ? (
            <rect key={`${x}-${y}`} x={x * px + px * 0.12} y={y * px + px * 0.12} width={px * 0.76} height={px * 0.76} rx={1.5} fill="#1A1208" />
          ) : null
        )
      )}
      {/* puntos sueltos para textura QR */}
      {[[3,2],[5,3],[2,4],[4,5],[6,5],[3,6]].map(([x, y]) => (
        <rect key={`d-${x}-${y}`} x={x * px + px * 0.2} y={y * px + px * 0.2} width={px * 0.6} height={px * 0.6} rx={1.5} fill="#1A1208" />
      ))}
    </svg>
  );
}

// Teléfono con una predicción del bar.
function PhoneMockup() {
  return (
    <div
      className="relative w-[170px] rounded-[26px] p-2.5"
      style={{ background: "linear-gradient(160deg,#1b2a40,#0a1220)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 30px 60px -24px rgba(0,0,0,0.8)" }}
    >
      <div className="rounded-[20px] overflow-hidden" style={{ background: "#0b1622", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="px-3 pt-3 pb-2 flex items-center justify-between" style={{ background: "rgba(201,168,76,0.08)" }}>
          <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: GOLD }}>Peña · Bar Marcelo</span>
          <Beer size={12} color={GOLD} />
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
            <Trophy size={10} /> Suma puntos para la peña
          </div>
        </div>
      </div>
    </div>
  );
}

// TV con el ranking de la peña.
function TvMockup() {
  const rows = [
    { p: "1", n: "Carlos M.", pts: 184 },
    { p: "2", n: "Lucía R.", pts: 171 },
    { p: "3", n: "Dani G.", pts: 168 },
    { p: "4", n: "Marta S.", pts: 152 },
  ];
  return (
    <div className="w-full max-w-[300px]">
      <div
        className="rounded-2xl p-3.5"
        style={{ background: "linear-gradient(160deg,#0e1c2e,#091320)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 30px 60px -24px rgba(0,0,0,0.8)" }}
      >
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider" style={{ color: GOLD }}>
            <Tv size={12} /> Ranking en vivo
          </span>
          <span className="text-[9px] text-zm-text-muted">Bar Marcelo</span>
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
  { n: 1, icon: Palette, title: "Configura tu porra", text: "Crea la página de tu bar, añade tu logo, define premios y personaliza el mensaje de bienvenida." },
  { n: 2, icon: QrCode, title: "Comparte el QR", text: "Imprime el cartel o muéstralo en pantalla. Tus clientes escanean y entran a la porra del bar." },
  { n: 3, icon: Repeat, title: "Compiten en tu ranking", text: "Predicen partidos, suman puntos y siguen la clasificación de tu bar durante el Mundial." },
];

const WINS = [
  { icon: Beer, title: "Participación durante el torneo", text: "Cada partido puede convertirse en una excusa para participar, comentar y seguir el ranking." },
  { icon: Repeat, title: "Seguimiento jornada a jornada", text: "El ranking mantiene la competición activa durante todo el Mundial." },
  { icon: Sparkles, title: "Dinámica de Mundial", text: "Tu local tiene una competición propia conectada al torneo." },
];

// Nota: "Puerta a ZonaMundial" se retiró del listado a petición.
const FEATURES = [
  { icon: Smartphone, title: "Landing personalizada", text: "Tu bar con su propia página del Mundial.", big: false },
  { icon: QrCode, title: "QR dinámico", text: "Tus clientes entran sin descargar nada.", big: false },
  { icon: BarChart3, title: "Ranking en vivo", text: "Mantiene la competición de tu bar activa jornada a jornada.", big: true },
  { icon: Tv, title: "Pantalla TV", text: "Muestra el QR, el top 10 y el premio en el local.", big: false },
  { icon: Gift, title: "Premios", text: "Tú decides qué incentivo ofrecer a tus clientes.", big: false },
];

/* ─── Página ──────────────────────────────────────────────────────────────── */

export default function BaresLandingPage() {
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
              <Trophy size={13} /> Para bares y locales · Mundial 2026
            </div>
            <h1 className="mt-5 text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
              Tu bar, su porra, su{" "}
              <span
                style={{
                  backgroundImage: GOLD_GRAD,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}
              >
                ranking del Mundial
              </span>
            </h1>
            <p className="mt-5 max-w-xl mx-auto lg:mx-0 text-lg text-zm-text-muted leading-relaxed">
              Crea una competición digital para tus clientes con QR, predicciones, clasificación
              y premios definidos por tu local.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <Link
                href="/bar-dashboard"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-black transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
                style={{ background: GOLD_GRAD, color: "#1A1208", boxShadow: "0 12px 34px -10px rgba(201,168,76,0.7)" }}
              >
                Crear mi porra <ArrowRight size={18} />
              </Link>
              <Link
                href="/bares/precios"
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
              <span>Lista para compartir por QR</span>
            </p>
          </div>

          {/* Visual del hero: foto editorial enmarcada + mockups superpuestos */}
          <div className="relative flex items-center justify-center lg:justify-end">
            <div
              className="absolute inset-0 -z-10 blur-3xl opacity-50"
              style={{ background: "radial-gradient(circle at 60% 40%, rgba(201,168,76,0.20), transparent 60%)" }}
            />
            <div
              className="relative w-full max-w-[440px] aspect-[4/5] sm:aspect-[5/4] rounded-[28px] overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 40px 90px -40px rgba(0,0,0,0.85)" }}
            >
              <BarPhoto
                src="/images/bars/hero-porra-bar.webp"
                alt="Clientes de un bar participando en la porra digital del Mundial"
                priority
                objectPosition="center"
              >
                {/* Fallback elegante: degradado profundo + textura dorada */}
                <div
                  className="w-full h-full"
                  style={{
                    background:
                      "radial-gradient(120% 80% at 80% 10%, rgba(201,168,76,0.16), transparent 55%), linear-gradient(150deg, #16273E 0%, #0E1B2C 55%, #0A1422 100%)",
                  }}
                />
              </BarPhoto>

              {/* Overlay para legibilidad y unión con el fondo */}
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(180deg, rgba(10,17,30,0) 35%, rgba(10,17,30,0.55) 100%)" }}
              />

              {/* Teléfono con predicción, flotando */}
              <div className="absolute -left-3 bottom-4 hidden sm:block scale-90 origin-bottom-left drop-shadow-2xl">
                <PhoneMockup />
              </div>

              {/* Chip QR */}
              <div
                className="absolute right-4 top-4 rounded-2xl p-3 flex flex-col items-center backdrop-blur-sm"
                style={{ background: "rgba(12,22,38,0.72)", border: "1px solid rgba(201,168,76,0.3)", boxShadow: "0 18px 40px -18px rgba(0,0,0,0.8)" }}
              >
                <BarQr size={76} />
                <span className="mt-2 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider" style={{ color: GOLD }}>
                  <QrCode size={10} /> Escanea y juega
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
                {/* Línea de acento superior dorada */}
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

        {/* ── BLOQUE VISUAL: tu bar, tu ranking, tus premios ── */}
        <section
          className="mt-24 rounded-[32px] border overflow-hidden"
          style={{ borderColor: "rgba(201,168,76,0.22)", background: "linear-gradient(135deg, rgba(201,168,76,0.10), rgba(11,24,37,0.5) 55%)" }}
        >
          <div className="grid lg:grid-cols-2 gap-10 items-center p-8 sm:p-12">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase font-bold" style={{ color: GOLD }}>
                <Medal size={14} /> Tu bar en acción
              </div>
              <h2 className="mt-3 text-3xl font-black leading-tight" style={{ color: "#F4F1E9" }}>Tu bar, tu ranking, tus premios</h2>
              <p className="mt-4 max-w-md mx-auto lg:mx-0 text-zm-text-muted leading-relaxed">
                Cada local tiene su propia porra, su QR y su clasificación para activar una dinámica propia durante el Mundial.
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
                style={{ border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 40px 90px -42px rgba(0,0,0,0.85)" }}
              >
                <BarPhoto
                  src="/images/bars/bar-ranking-tv.webp"
                  alt="Pantalla del local mostrando el ranking de la porra durante el Mundial"
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
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,17,30,0) 30%, rgba(10,17,30,0.5) 100%)" }} />
                {/* Mockup de TV/ranking superpuesto */}
                <div className="absolute inset-0 flex items-center justify-center p-5">
                  <TvMockup />
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
        <section className="mt-24">
          <h2 className="text-3xl font-black text-center" style={{ color: "#F4F1E9" }}>Elige tu plan</h2>
          <p className="mt-3 text-center text-zm-text-muted">
            Pago único válido para todo el Mundial 2026. Sin suscripciones.
          </p>
          <div className="mt-12">
            <PlanCards />
          </div>
          <p className="mt-8 text-center text-[12px] text-zm-text-muted">
            ¿Dudas? Escríbenos a{" "}
            <a href="mailto:gol@zonamundial.app" style={{ color: GOLD }}>gol@zonamundial.app</a>
          </p>
        </section>

        {/* ── CTA FINAL ────────────────────────────────────── */}
        <section
          className="mt-24 relative text-center rounded-[32px] border overflow-hidden p-10 sm:p-16"
          style={{ borderColor: "rgba(201,168,76,0.3)", boxShadow: "0 40px 90px -50px rgba(0,0,0,0.85)" }}
        >
          {/* Foto de cierre de fondo (con fallback degradado) */}
          <div className="absolute inset-0 -z-20">
            <BarPhoto
              src="/images/bars/cta-final-bar.webp"
              alt=""
              objectPosition="center"
            >
              <div className="w-full h-full" style={{ background: "linear-gradient(180deg, #142536, #0B1622)" }} />
            </BarPhoto>
          </div>
          {/* Overlay para que el botón y el texto sigan legibles */}
          <div
            className="absolute inset-0 -z-10"
            style={{ background: "radial-gradient(ellipse 70% 90% at 50% 0%, rgba(201,168,76,0.20), transparent 60%), linear-gradient(180deg, rgba(10,17,30,0.82), rgba(11,22,37,0.92))" }}
          />
          <h2 className="text-3xl sm:text-4xl font-black leading-tight">
            Crea la porra de tu bar antes del primer partido
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-zm-text-muted leading-relaxed">
            Configura tu página, comparte el QR y empieza a recibir predicciones de tus clientes.
          </p>
          <Link
            href="/bar-dashboard"
            className="mt-8 inline-flex items-center gap-2 px-9 py-4 rounded-full font-black transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            style={{ background: GOLD_GRAD, color: "#1A1208", boxShadow: "0 14px 38px -10px rgba(201,168,76,0.75)" }}
          >
            Crear mi porra <ArrowRight size={18} />
          </Link>
          <p className="mt-5 text-[12px] text-zm-text-muted">
            Pago único · Sin suscripción · Listo para compartir por QR
          </p>
        </section>

        {/* ── NOTA LEGAL / CONFIANZA ───────────────────────── */}
        <p
          className="mt-12 mx-auto max-w-2xl text-center text-[12px] text-zm-text-muted leading-relaxed rounded-2xl px-5 py-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          ZonaMundial no es una casa de apuestas. Las porras son un juego de predicciones sin premios
          en metálico gestionados por la plataforma; los incentivos los define cada bar bajo su responsabilidad.
        </p>
      </div>
    </main>
  );
}
