// src/app/empresas/precios/page.tsx
//
// Página de precios de "Porra Corporativa para Empresas". Pública e indexable.
// Detalla los tres planes (Equipo, Empresa, Corporate) y enlaza al panel de
// alta para empezar. Espejo de src/app/bares/precios/page.tsx adaptado al B2B.

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EmpresaPlanCards from "../EmpresaPlanCards";

export const metadata: Metadata = {
  title: "Precios · Porra Corporativa para Empresas · ZonaMundial",
  description:
    "Planes de la porra corporativa para el Mundial 2026: Equipo, Empresa y Corporate. Pago único, con factura, sin suscripciones.",
  alternates: { canonical: "/empresas/precios" },
  robots: { index: true, follow: true },
};

const GOLD = "#c9a84c";

const FAQ = [
  { q: "¿Es un pago único?", a: "Sí. Pagas una vez y la liga de tu empresa queda activa para todo el Mundial 2026. Sin renovaciones automáticas." },
  { q: "¿Emitís factura?", a: "Sí. Emitimos factura a nombre de tu empresa para que puedas justificar el gasto como actividad interna de equipo." },
  { q: "¿La liga es solo para mi equipo?", a: "Sí. Es una liga privada y cerrada: tus empleados entran por invitación o código de empresa, nadie de fuera." },
  { q: "¿Qué pasa si somos más de 150 empleados?", a: "El plan Corporate cubre empresas grandes y multi-sede. Si necesitas algo a medida, escríbenos a gol@zonamundial.app y lo montamos contigo." },
];

export default function EmpresasPreciosPage() {
  return (
    <main
      className="min-h-screen text-zm-text"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,168,76,0.08), transparent 60%), linear-gradient(180deg, #060B14, #0B1825)",
      }}
    >
      <div className="max-w-5xl mx-auto px-5 py-16">
        <Link href="/empresas" className="inline-flex items-center gap-1.5 text-sm text-zm-text-muted hover:text-white">
          <ArrowLeft size={16} /> Volver
        </Link>

        <header className="mt-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Precios para empresas</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-zm-text-muted leading-relaxed">
            Un pago único válido para todo el Mundial 2026, con factura. Elige el plan que encaje con tu equipo.
          </p>
        </header>

        <section className="mt-12">
          <EmpresaPlanCards />
        </section>

        <p className="mt-6 text-center text-[11px] text-zm-text-muted">
          Emitimos factura. Actividad interna de empresa, sin premios en metálico gestionados por la plataforma.
        </p>

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
          ¿Empresa grande o varias oficinas?{" "}
          <a href="mailto:gol@zonamundial.app?subject=Plan%20Corporate%20-%20Porra%20Empresas" style={{ color: GOLD }}>Hablemos</a>.
        </p>
      </div>
    </main>
  );
}
