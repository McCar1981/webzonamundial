"use client";

// src/app/app/draft-mundial/page.tsx
// Landing page del minijuego Draft Mundial

import Link from "next/link";

const NAVY = "#0a1729", NAVY2 = "#0e1c33", GOLD = "#c9a84c", GOLD2 = "#e8d48b", TXT = "#eef2fb", TXT_MUT = "#93a1bd", CARD = "#111d32";

const FEATURES = [
  { icon: "🎲", title: "20 plantillas históricas", desc: "Desde Brasil 1970 hasta Argentina 2022. Cada tirada revela una selección legendaria." },
  { icon: "⚽", title: "9 formaciones tácticas", desc: "4-3-3, 3-5-2, 4-2-4... cada formación pide perfiles distintos." },
  { icon: "🧠", title: "3 modos de juego", desc: "Clásico (con stats), De Almanaque (sin stats) y Contrarreloj (15 segundos)." },
  { icon: "🏆", title: "Puntaje y calificación", desc: "Oro, Platino o Leyenda. Suma puntos para el ranking global." },
];

const HOW_IT_WORKS = [
  { num: "1", title: "Elegí formación y estilo", desc: "¿4-3-3 equilibrado o 3-4-3 ofensivo? Tu estrategia define el resultado." },
  { num: "2", title: "Tirá el dado", desc: "Sorteamos una selección histórica: Brasil 70, Alemania 74, Argentina 86..." },
  { num: "3", title: "Elegí un jugador", desc: "De la plantilla sorteada, elegí un solo futbolista para una posición concreta." },
  { num: "4", title: "Completá el 11", desc: "Repetí 11 veces. Al final calculamos fuerza, balance y coherencia de tu equipo." },
];

export default function DraftMundialPage() {
  return (
    <div className="min-h-screen" style={{ background: NAVY }}>
      {/* Hero */}
      <div className="relative overflow-hidden px-4 py-16 text-center">
        <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at 50% 30%, ${GOLD}33, transparent 70%)` }} />
        <div className="relative z-10 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border" style={{ background: `${GOLD}15`, borderColor: `${GOLD}44`, color: GOLD }}>
            <span>✨</span> NUEVO MINIJUEGO
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-4" style={{ color: TXT }}>
            Draft Mundial
          </h1>
          <p className="text-base sm:text-lg mb-8 leading-relaxed" style={{ color: TXT_MUT }}>
            Armá tu once ideal con leyendas de todas las Copas del Mundo.
            <br />
            Una tirada, una plantilla, una decisión.
          </p>
          <Link
            href="/app/draft-mundial/jugar"
            className="inline-block px-10 py-4 rounded-xl text-lg font-bold transition-all hover:scale-105 active:scale-95"
            style={{ background: GOLD, color: NAVY }}
          >
            🎲 Jugar ahora
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="px-4 py-12 max-w-xl mx-auto">
        <h2 className="text-xl font-bold text-center mb-8" style={{ color: TXT }}>
          ¿Cómo funciona?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="p-4 rounded-xl border" style={{ background: CARD, borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="text-sm font-bold mb-1" style={{ color: TXT }}>{f.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: TXT_MUT }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="px-4 py-12 max-w-xl mx-auto">
        <h2 className="text-xl font-bold text-center mb-8" style={{ color: TXT }}>
          En 4 pasos
        </h2>
        <div className="space-y-3">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.num} className="flex gap-4 p-4 rounded-xl border" style={{ background: CARD, borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-black" style={{ background: `${GOLD}22`, color: GOLD }}>
                {step.num}
              </div>
              <div>
                <h3 className="text-sm font-bold mb-1" style={{ color: TXT }}>{step.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: TXT_MUT }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 py-12 text-center">
        <Link
          href="/app/draft-mundial/jugar"
          className="inline-block px-10 py-4 rounded-xl text-lg font-bold transition-all hover:scale-105 active:scale-95"
          style={{ background: GOLD, color: NAVY }}
        >
          🎲 Empezar a jugar
        </Link>
        <Link
          href="/app"
          className="block mt-4 text-sm"
          style={{ color: TXT_MUT }}
        >
          ← Volver al lobby
        </Link>
      </div>
    </div>
  );
}
