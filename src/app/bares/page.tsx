// src/app/bares/page.tsx
//
// Landing comercial de "Porras Digitales para Bares" (FASE 2). Página pública e
// indexable dirigida a dueños de bares: explica el producto, cómo funciona y los
// planes, con CTA al panel del bar. Estética ZonaMundial (azul marino + dorado).

import type { Metadata } from "next";
import Link from "next/link";
import { QrCode, Trophy, Tv, Gift, BarChart3, Palette, ArrowRight, Users, Smartphone } from "lucide-react";
import PlanCards from "./PlanCards";

export const metadata: Metadata = {
  title: "Porras Digitales para Bares · ZonaMundial",
  description:
    "Llena tu bar en días de partido del Mundial 2026 con una porra digital personalizada: QR, ranking en vivo, pantalla TV y premios. Pago único.",
  alternates: { canonical: "/bares" },
};

const GOLD = "#c9a84c";

const STEPS = [
  { icon: Palette, title: "Configura tu porra", text: "Crea tu bar, elige un tema y pon tu logo, premios y mensaje de bienvenida." },
  { icon: QrCode, title: "Comparte el QR", text: "Imprime el cartel con tu QR. Tus clientes escanean y entran en la porra del bar." },
  { icon: Trophy, title: "Compiten y vuelven", text: "Predicen los partidos, suben en el ranking del bar y vuelven a por el premio." },
];

const FEATURES = [
  { icon: Smartphone, title: "Landing personalizada", text: "Tu página de bar con tu identidad, dentro del ecosistema ZonaMundial." },
  { icon: QrCode, title: "QR dinámico", text: "Un QR (o varios por zona en planes superiores) con seguimiento de escaneos." },
  { icon: BarChart3, title: "Ranking en vivo", text: "Clasificación del bar que reúne a tus clientes jornada a jornada." },
  { icon: Tv, title: "Pantalla TV", text: "Modo televisión a pantalla completa con QR, top 10 y premio del día." },
  { icon: Gift, title: "Premios", text: "Configura el premio principal de tu porra para premiar a tus clientes." },
  { icon: Users, title: "Puerta a ZonaMundial", text: "Tus clientes acceden al ranking global, trivia y más predicciones." },
];

export default function BaresLandingPage() {
  return (
    <main
      className="min-h-screen text-zm-text"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,168,76,0.08), transparent 60%), linear-gradient(180deg, #060B14, #0B1825)",
      }}
    >
      <div className="max-w-5xl mx-auto px-5 py-16 sm:py-20">
        {/* Hero */}
        <section className="text-center">
          <div className="inline-flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase font-bold" style={{ color: GOLD }}>
            <Trophy size={14} /> Para bares y locales · Mundial 2026
          </div>
          <h1 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight leading-tight">
            Llena tu bar en cada{" "}
            <span
              style={{
                backgroundImage: "linear-gradient(135deg, #C9A84C, #E8C76B 50%, #FDE68A)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}
            >
              día de partido
            </span>
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-lg text-zm-text-muted leading-relaxed">
            Crea la porra digital de tu bar: tus clientes escanean un QR, predicen los partidos del
            Mundial y compiten por tu premio. Más ambiente, más consumiciones, más gente que vuelve.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/bar-dashboard"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold transition-transform hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #C9A84C, #E8C76B 50%, #FDE68A)", color: "#1A1208" }}
            >
              Crear mi porra <ArrowRight size={18} />
            </Link>
            <Link
              href="/bares/precios"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#E2E8F0" }}
            >
              Ver precios
            </Link>
          </div>
          <p className="mt-4 text-[12px] text-zm-text-muted">Pago único para todo el Mundial. Sin suscripciones.</p>
        </section>

        {/* Cómo funciona */}
        <section className="mt-20">
          <h2 className="text-2xl font-black text-center">Cómo funciona</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-2xl border p-6" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(15,29,50,0.5)" }}>
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: "rgba(201,168,76,0.12)", color: GOLD }}>
                    <s.icon size={20} />
                  </span>
                  <span className="text-sm font-bold" style={{ color: GOLD }}>Paso {i + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-zm-text-muted leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mt-20">
          <h2 className="text-2xl font-black text-center">Todo lo que incluye</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border p-5" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(15,29,50,0.4)" }}>
                <f.icon size={22} color={GOLD} />
                <h3 className="mt-3 font-bold">{f.title}</h3>
                <p className="mt-1 text-sm text-zm-text-muted leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Planes */}
        <section className="mt-20">
          <h2 className="text-2xl font-black text-center">Elige tu plan</h2>
          <p className="mt-2 text-center text-zm-text-muted">Pago único válido para todo el Mundial 2026.</p>
          <div className="mt-8">
            <PlanCards />
          </div>
          <p className="mt-6 text-center text-[12px] text-zm-text-muted">
            ¿Dudas? Escríbenos a{" "}
            <a href="mailto:gol@zonamundial.app" style={{ color: GOLD }}>gol@zonamundial.app</a>
          </p>
        </section>

        {/* CTA final */}
        <section className="mt-20 text-center rounded-3xl border p-10" style={{ borderColor: "rgba(201,168,76,0.25)", background: "linear-gradient(180deg, rgba(201,168,76,0.08), rgba(11,24,37,0.3))" }}>
          <h2 className="text-2xl sm:text-3xl font-black">Prepara tu bar para el Mundial</h2>
          <p className="mt-3 max-w-xl mx-auto text-zm-text-muted">
            Monta tu porra en minutos y empieza a compartir tu QR. El ambiente lo pones tú; la tecnología, nosotros.
          </p>
          <Link
            href="/bar-dashboard"
            className="mt-7 inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold transition-transform hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #C9A84C, #E8C76B 50%, #FDE68A)", color: "#1A1208" }}
          >
            Crear mi porra <ArrowRight size={18} />
          </Link>
        </section>

        <p className="mt-10 text-center text-[11px] text-zm-text-muted">
          ZonaMundial no es una casa de apuestas. Las porras son un juego de predicciones sin premios en metálico
          gestionados por la plataforma; los incentivos los define cada bar bajo su responsabilidad.
        </p>
      </div>
    </main>
  );
}
