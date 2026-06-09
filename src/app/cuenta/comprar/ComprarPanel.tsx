"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { FoundersCurrency } from "@/lib/stripe/client";

interface Props {
  email: string;
  /** ISO-3166 alpha-2 lowercase del perfil, o null si no está guardado. */
  country: string | null;
  /** Moneda asignada por server según country (no editable por el user). */
  currency: FoundersCurrency;
}

// Display values por moneda — fuente única de verdad para la UI.
// El backend valida los importes reales en céntimos, esto es solo presentación.
const DISPLAY = {
  eur: { value: "8 €", region: "Europa y resto del mundo", helper: "Pago único en euros" },
  usd: { value: "6 USD", region: "LATAM y USA", helper: "Pago único en dólares" },
} as const;

export default function ComprarPanel({ email, country, currency }: Props) {
  const searchParams = useSearchParams();
  const canceled = searchParams.get("canceled") === "1";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const price = DISPLAY[currency];

  async function handleBuy() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency }),
      });
      const data = await r.json();
      if (r.ok && data.url) {
        // Redirección al Checkout hospedado por Stripe
        window.location.href = data.url;
      } else if (r.status === 401) {
        // Si la sesión expiró
        window.location.href = "/login?next=/cuenta/comprar";
      } else if (data.code === "already_founder") {
        window.location.href = "/cuenta/founders-pass";
      } else {
        setError(data.error || "No pudimos iniciar el pago. Inténtalo en unos segundos.");
        setLoading(false);
      }
    } catch {
      setError("Error de red. Comprueba tu conexión.");
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen px-5 py-12 sm:py-16"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,168,76,0.08), transparent 60%), linear-gradient(180deg, #060B14, #0B1825)",
      }}
    >
      <div className="max-w-xl mx-auto">
        <Link
          href="/cuenta/founders-pass"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#C9A84C] mb-6"
        >
          ← Volver
        </Link>

        <div className="text-[11px] tracking-[0.22em] uppercase font-mono font-bold text-[#C9A84C] mb-3">
          {"/* FOUNDERS PASS */"}
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-3">
          Apoya el proyecto y desbloquea{" "}
          <span
            style={{
              backgroundImage: "linear-gradient(135deg, #C9A84C, #E8C76B 50%, #FDE68A)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            todas las ventajas
          </span>
        </h1>
        <p className="text-gray-400 text-base mb-6 leading-relaxed">
          Pago único válido para todo el Mundial 2026. Sin suscripciones, sin renovaciones automáticas.
        </p>

        {canceled && (
          <div
            className="px-4 py-3 rounded-xl mb-5 text-sm"
            style={{
              background: "rgba(251, 146, 60, 0.10)",
              border: "1px solid rgba(251, 146, 60, 0.4)",
              color: "#fdba74",
            }}
          >
            Has cancelado el pago. Cuando quieras, vuelve a intentarlo aquí.
          </div>
        )}

        {error && (
          <div
            className="px-4 py-3 rounded-xl mb-5 text-sm"
            style={{
              background: "rgba(239, 68, 68, 0.10)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#fca5a5",
            }}
          >
            {error}
          </div>
        )}

        <div
          className="rounded-2xl border p-6 sm:p-8 mb-5"
          style={{
            borderColor: "rgba(201,168,76,0.25)",
            background: "linear-gradient(180deg, rgba(15,31,48,0.7), rgba(11,24,37,0.4))",
          }}
        >
          {/* Precio único asignado por país */}
          <div className="text-[11px] tracking-widest uppercase font-mono text-gray-400 mb-3 text-center">
            Tu precio
          </div>
          <div
            className="rounded-xl p-6 text-center mb-2"
            style={{
              border: "1.5px solid #E8C76B",
              background: "linear-gradient(180deg, rgba(201,168,76,0.10), rgba(201,168,76,0.02))",
            }}
          >
            <div
              className="text-5xl font-black tracking-tight leading-none"
              style={{
                backgroundImage: "linear-gradient(135deg, #C9A84C, #FDE68A)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {price.value}
            </div>
            <div className="text-[10px] tracking-widest uppercase font-mono text-gray-400 mt-2.5">
              {price.region}
            </div>
            <div className="text-[11px] text-gray-500 mt-1">
              {price.helper}
            </div>
          </div>

          {/* Aviso de cómo se determina la moneda */}
          <p className="text-[11px] text-gray-500 text-center mb-6">
            {country
              ? <>El precio se ajusta según tu país (<span className="text-gray-300 uppercase">{country}</span>) registrado en tu perfil.</>
              : <>El precio se ajusta según tu región. <Link href="/cuenta" className="text-[#C9A84C] hover:underline">Configura tu país</Link> para asegurar la tarifa correcta.</>}
          </p>

          <ul className="space-y-2 text-sm text-gray-200 mb-6">
            <li>✅ Navegación sin publicidad en toda la plataforma</li>
            <li>📊 Estadísticas avanzadas (xG, mapas de calor, comparativas)</li>
            <li>🚀 Beta access a nuevas funcionalidades</li>
            <li>💎 Sticker pack exclusivo para WhatsApp e Instagram</li>
            <li>🏅 Insignia &quot;Founders&quot; permanente en tu perfil</li>
          </ul>

          <button
            type="button"
            onClick={handleBuy}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 w-full px-7 py-3.5 rounded-full font-bold text-[#1A1208] transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #C9A84C, #E8C76B 50%, #FDE68A)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.15) inset, 0 0 30px -8px rgba(201,168,76,0.55)",
            }}
          >
            {loading ? "Conectando con Stripe…" : `Pagar ${price.value} con Stripe`}
            {!loading && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            )}
          </button>

          <p className="text-[11px] text-gray-500 text-center mt-3">
            Pago seguro procesado por Stripe. Recibirás recibo por email a <b>{email}</b>.
          </p>
        </div>

        <p className="text-[11px] text-gray-500 text-center">
          Reembolso completo disponible si cambias de opinión. Al pagar aceptas nuestros{" "}
          <Link href="/legal/terminos" className="text-[#C9A84C]">términos</Link>{" "}y la{" "}
          <Link href="/legal/privacidad" className="text-[#C9A84C]">política de privacidad</Link>.
        </p>
      </div>
    </div>
  );
}
