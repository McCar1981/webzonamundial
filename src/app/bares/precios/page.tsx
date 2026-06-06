// src/app/bares/precios/page.tsx
//
// Página de precios de "Porras Digitales para Bares" (FASE 2). Pública e
// indexable. Detalla los tres planes y enlaza al panel del bar para empezar.

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PlanCards from "../PlanCards";

export const metadata: Metadata = {
  title: "Precios · Porras Digitales para Bares · ZonaMundial",
  description:
    "Planes de la porra digital para bares en el Mundial 2026: Arranque, Mundial Completo y Bar Pro. Pago único, sin suscripciones.",
  alternates: { canonical: "/bares/precios" },
};

const GOLD = "#c9a84c";

const FAQ = [
  { q: "¿Es un pago único?", a: "Sí. Pagas una vez y la porra de tu bar queda activa para todo el Mundial 2026. Sin renovaciones automáticas." },
  { q: "¿Cómo cobran a mis clientes?", a: "No se cobra a tus clientes. Ellos juegan gratis escaneando tu QR. Tú solo pagas el plan del bar." },
  { q: "¿Puedo cambiar de plan?", a: "Sí, puedes empezar con Arranque y subir más adelante. Escríbenos y te ayudamos con el cambio." },
  { q: "¿Necesito conocimientos técnicos?", a: "No. Configuras tu bar desde el panel en minutos, descargas el QR y lo pones en tus mesas y barra." },
];

export default function BaresPreciosPage() {
  return (
    <main
      className="min-h-screen text-zm-text"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,168,76,0.08), transparent 60%), linear-gradient(180deg, #060B14, #0B1825)",
      }}
    >
      <div className="max-w-5xl mx-auto px-5 py-16">
        <Link href="/bares" className="inline-flex items-center gap-1.5 text-sm text-zm-text-muted hover:text-white">
          <ArrowLeft size={16} /> Volver
        </Link>

        <header className="mt-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Precios para bares</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-zm-text-muted leading-relaxed">
            Un pago único válido para todo el Mundial 2026. Elige el plan que encaje con tu local.
          </p>
        </header>

        <section className="mt-12">
          <PlanCards />
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-black text-center">Preguntas frecuentes</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {FAQ.map((item) => (
              <div key={item.q} className="rounded-2xl border p-5" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(15,29,50,0.4)" }}>
                <h3 className="font-bold">{item.q}</h3>
                <p className="mt-1.5 text-sm text-zm-text-muted leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-12 text-center text-sm text-zm-text-muted">
          ¿Tienes una cadena de bares o necesitas algo a medida?{" "}
          <a href="mailto:gol@zonamundial.app" style={{ color: GOLD }}>Hablemos</a>.
        </p>
      </div>
    </main>
  );
}
