// src/app/registro-codigo/page.tsx
// ZonaMundial.app — Registro con CÓDIGO de captación (estrategia paralela a
// los creadores). Página genérica: el usuario teclea el código que le dieron
// (radio, embajador, sponsor, bar…). El campo de código vive dentro de
// FormularioRegistro (pedirCodigo); el canje de Fútcoins ocurre en
// /auth/callback al confirmar la cuenta.
"use client";

import Link from "next/link";
import FormularioRegistro from "@/components/FormularioRegistro";
import { useLanguage } from "@/i18n/LanguageContext";

export default function RegistroCodigoPage() {
  const { t } = useLanguage();
  const isEN = t.nav.selecciones === "48 Teams";

  const c = isEN
    ? {
        badge: "Invite code",
        title: "Sign up with your code",
        sub: "Got a code from a radio show, an ambassador, a sponsor or a bar? Enter it below and claim your welcome Fútcoins to play the 2026 World Cup.",
        b1: "Predictions, Fantasy, Trivia and live Match Center",
        b2: "Welcome Fútcoins when your code is valid",
        b3: "Free to join — no card required",
        noCode: "Don't have a code?",
        normalReg: "Regular sign-up",
        formTitle: "Create your account",
        formSub: "Your code goes at the top of the form.",
      }
    : {
        badge: "Código de invitación",
        title: "Regístrate con tu código",
        sub: "¿Te dieron un código en una radio, un embajador, un patrocinador o un bar? Introdúcelo abajo y reclama tus Fútcoins de bienvenida para jugar el Mundial 2026.",
        b1: "Predicciones, Fantasy, Trivia y Match Center en vivo",
        b2: "Fútcoins de bienvenida si el código es válido",
        b3: "Gratis — no pedimos tarjeta",
        noCode: "¿No tienes código?",
        normalReg: "Registro normal",
        formTitle: "Crea tu cuenta",
        formSub: "El código va arriba del formulario.",
      };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Glows dorados */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/4 w-[800px] h-[600px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #C9A84C30 0%, transparent 70%)", filter: "blur(80px)" }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #C9A84C20 0%, transparent 70%)", filter: "blur(100px)" }}
        />
      </div>
      <div
        className="fixed top-0 left-0 right-0 h-[3px] z-50"
        style={{ background: "linear-gradient(90deg, transparent, #C9A84C, #A8893D, transparent)" }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-0 pb-10 sm:pb-16">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 mb-8 pt-6">
          <ol className="flex gap-2 items-center flex-wrap">
            <li><Link href="/" className="hover:text-[#C9A84C] transition-colors">{isEN ? "Home" : "Inicio"}</Link></li>
            <li className="text-gray-600">/</li>
            <li className="text-[#C9A84C] font-medium">{c.badge}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* IZQUIERDA — pitch */}
          <div className="space-y-6">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase"
              style={{ background: "#C9A84C15", color: "#C9A84C", border: "1px solid #C9A84C30" }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#C9A84C" }} />
              {c.badge}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">{c.title}</h1>
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-xl">{c.sub}</p>

            <ul className="space-y-3 max-w-xl">
              {[c.b1, c.b2, c.b3].map((b, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-200 text-sm">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "#C9A84C20" }}
                  >
                    <svg className="w-3.5 h-3.5 text-[#C9A84C]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  {b}
                </li>
              ))}
            </ul>

            <div className="pt-2 text-sm text-gray-400">
              {c.noCode}{" "}
              <Link href="/registro" className="text-[#C9A84C] hover:underline font-bold">{c.normalReg}</Link>
            </div>
          </div>

          {/* DERECHA — formulario con campo de código */}
          <div className="lg:sticky lg:top-24">
            <div
              className="p-6 sm:p-8 rounded-3xl border overflow-hidden relative"
              style={{
                borderColor: "#C9A84C25",
                background: "linear-gradient(135deg, rgba(15,23,42,0.8), rgba(11,24,37,0.6))",
                backdropFilter: "blur(20px)",
                boxShadow: "0 25px 50px -12px #C9A84C15, 0 0 0 1px #C9A84C10",
              }}
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">{c.formTitle}</h2>
                <p className="text-sm text-gray-400">{c.formSub}</p>
              </div>
              <FormularioRegistro pedirCodigo />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
