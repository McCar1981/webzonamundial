"use client";

// Panel client de /pro: toggle mensual/anual, tabla comparativa Free vs Pro
// y botón hacia Stripe Checkout (suscripción). Mismo patrón de checkout que
// /cuenta/comprar (ComprarPanel).

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, X, Sparkles } from "lucide-react";
import { PRO_PRICES, type ProBillingInterval, type ProRegion } from "@/lib/stripe/pricing";
import { FREE_LIMITS } from "@/lib/pro/limits";

const GOLD = "#C9A84C";

interface Props {
  authenticated: boolean;
  isPro: boolean;
  source: "subscription" | "founder" | null;
  region: ProRegion;
}

// Filas de la comparativa. Los números de Free salen de FREE_LIMITS para que
// el copy nunca se desincronice del enforcement real.
const ROWS: { feature: string; free: string; pro: string }[] = [
  {
    feature: "Predicciones",
    free: `${FREE_LIMITS.predictions.maxMatchesPerJornada} partidos/jornada · 1 con los 8 tipos, el resto Marcador, Ganador y Goleador`,
    pro: "8 tipos en todos los partidos + multiplicadores de puntos",
  },
  {
    feature: "Fantasy",
    free: `1 equipo · cambios hasta ${FREE_LIMITS.fantasy.lockHoursBeforeGameweek} h antes de la jornada`,
    pro: "Sustituciones en vivo, +presupuesto y puntos en tiempo real",
  },
  {
    feature: "Modo Carrera",
    free: `${FREE_LIMITS.carrera.maxSeasonsPerDay} temporadas al día (continúas en ${FREE_LIMITS.carrera.cooldownHours} h)`,
    pro: "Temporadas ilimitadas, guardado en la nube e informes de rival IA",
  },
  {
    feature: "IA Coach",
    free: `${FREE_LIMITS.iaCoach.dailyQueries} consulta al día`,
    pro: "Ilimitada: Oracle, Live, Coach, Análisis y Debate",
  },
  {
    feature: "Trivia",
    free: `${FREE_LIMITS.trivia.dailyQuestions} preguntas diarias · 1 partida en los demás modos`,
    pro: "Sin límites + modo contrarreloj",
  },
  {
    feature: "Match Center",
    free: "Narración básica",
    pro: "Narración avanzada + alertas por jugador/equipo + coach IA en vivo",
  },
  {
    feature: "Bares",
    free: "Unirte a bares",
    pro: "Crea tu bar con cartel personalizado y QR",
  },
  {
    feature: "Rankings",
    free: "Participar en el global",
    pro: "Ligas privadas ilimitadas con amigos",
  },
  {
    feature: "Publicidad",
    free: "Con anuncios",
    pro: "Sin anuncios en toda la plataforma",
  },
  {
    feature: "Estadísticas",
    free: "Básicas (goles, tarjetas)",
    pro: "Avanzadas: mapas de calor y comparativas históricas",
  },
  {
    feature: "Cosmetics",
    free: "—",
    pro: "Avatares animados, skins y banners exclusivos",
  },
];

export default function ProPanel({ authenticated, isPro, source, region }: Props) {
  const searchParams = useSearchParams();
  const purchaseSuccess = searchParams.get("purchase") === "success";
  const canceled = searchParams.get("canceled") === "1";

  const [interval, setInterval] = useState<ProBillingInterval>("yearly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prices = PRO_PRICES[region];
  // Equivalente mensual del plan ANUAL (gancho "te sale a X/mes"), calculado.
  const eqPerMonth = prices.yearly.amount / 12 / 100;
  const monthlyEquivalent =
    prices.currency === "eur"
      ? `${eqPerMonth.toFixed(eqPerMonth % 1 === 0 ? 0 : 2).replace(".", ",")} €/mes`
      : `${eqPerMonth.toFixed(2).replace(".", ",")} USD/mes`;

  async function handleSubscribe() {
    if (!authenticated) {
      window.location.href = "/login?next=/pro";
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/pro/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const data = await r.json();
      if (r.ok && data.url) {
        window.location.href = data.url;
      } else if (r.status === 401) {
        window.location.href = "/login?next=/pro";
      } else if (data.code === "already_pro") {
        window.location.href = "/cuenta/pro";
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
      <div className="max-w-3xl mx-auto">
        <div className="text-[11px] tracking-[0.22em] uppercase font-mono font-bold text-[#C9A84C] mb-3 text-center">
          {"/* PLAN PRO */"}
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-3 text-center">
          Juega el Mundial <span style={{ color: GOLD }}>sin límites</span>
        </h1>
        <p className="text-gray-400 text-center max-w-xl mx-auto mb-8">
          Todos los tipos de predicción, IA Coach ilimitada, fantasy en vivo, Modo
          Carrera infinito, ligas privadas y cero anuncios.
        </p>

        {purchaseSuccess && (
          <div className="mb-8 rounded-2xl border border-[#C9A84C]/40 bg-[#C9A84C]/10 px-5 py-4 text-center">
            <div className="text-white font-bold mb-1">¡Ya eres Pro! 🎉</div>
            <div className="text-sm text-gray-300">
              Tu suscripción está activa. Puede tardar unos segundos en reflejarse en toda la app.{" "}
              <Link href="/cuenta/pro" className="text-[#C9A84C] underline">
                Ver mi suscripción
              </Link>
            </div>
          </div>
        )}
        {canceled && !purchaseSuccess && (
          <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm text-gray-300">
            Pago cancelado. Puedes intentarlo de nuevo cuando quieras.
          </div>
        )}

        {isPro ? (
          <div className="rounded-2xl border border-[#C9A84C]/40 bg-[#0F1D32] px-6 py-8 text-center">
            <Sparkles className="mx-auto mb-3" size={28} color={GOLD} />
            <div className="text-xl font-black text-white mb-2">
              {source === "founder" ? "Tu Founders Pass incluye todo el plan Pro" : "Ya tienes el plan Pro activo"}
            </div>
            <p className="text-sm text-gray-400 mb-5">
              Disfruta de todas las funciones sin límites. Gracias por apoyar ZonaMundial.
            </p>
            {source === "subscription" && (
              <Link
                href="/cuenta/pro"
                className="inline-block rounded-xl border border-[#C9A84C]/40 px-5 py-2.5 text-sm font-bold text-[#C9A84C]"
              >
                Gestionar mi suscripción
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Toggle mensual / anual */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <button
                onClick={() => setInterval("monthly")}
                className="rounded-xl px-5 py-2.5 text-sm font-bold transition-all"
                style={
                  interval === "monthly"
                    ? { background: `linear-gradient(135deg,${GOLD},#e8d48b)`, color: "#060B14" }
                    : { background: "rgba(255,255,255,0.05)", color: "#8a94b0", border: "1px solid rgba(255,255,255,0.1)" }
                }
              >
                Mensual · {prices.monthly.display}
              </button>
              <button
                onClick={() => setInterval("yearly")}
                className="relative rounded-xl px-5 py-2.5 text-sm font-bold transition-all"
                style={
                  interval === "yearly"
                    ? { background: `linear-gradient(135deg,${GOLD},#e8d48b)`, color: "#060B14" }
                    : { background: "rgba(255,255,255,0.05)", color: "#8a94b0", border: "1px solid rgba(255,255,255,0.1)" }
                }
              >
                Anual · {prices.yearly.display}
                <span
                  className="absolute -top-2.5 -right-2 rounded-full px-2 py-0.5 text-[10px] font-black"
                  style={{ background: "#22c55e", color: "#060B14" }}
                >
                  {monthlyEquivalent}
                </span>
              </button>
            </div>

            <div className="text-center mb-10">
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="rounded-2xl px-10 py-4 text-base font-black transition-all disabled:opacity-60"
                style={{
                  background: `linear-gradient(135deg,${GOLD},#e8d48b)`,
                  color: "#060B14",
                  boxShadow: "0 8px 30px rgba(201,168,76,0.25)",
                }}
              >
                {loading
                  ? "Abriendo pago seguro…"
                  : `Hazte Pro — ${interval === "yearly" ? prices.yearly.display : prices.monthly.display}`}
              </button>
              {error && <div className="mt-3 text-sm text-red-400">{error}</div>}
              <div className="mt-3 text-xs text-gray-500">
                Pago seguro con Stripe · Cancela cuando quieras desde tu cuenta
              </div>
            </div>
          </>
        )}

        {/* Comparativa Free vs Pro */}
        <div className="rounded-2xl overflow-hidden border border-white/10">
          <div
            className="grid grid-cols-[1.1fr_1fr_1.2fr] px-5 py-3 text-[11px] font-black uppercase tracking-wider"
            style={{ background: "#0F1D32" }}
          >
            <div className="text-gray-400">Funcionalidad</div>
            <div className="text-gray-400">Free</div>
            <div style={{ color: GOLD }}>Pro</div>
          </div>
          {ROWS.map((row, i) => (
            <div
              key={row.feature}
              className="grid grid-cols-[1.1fr_1fr_1.2fr] gap-2 px-5 py-3.5 text-[13px] leading-snug"
              style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", borderTop: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="font-bold text-white">{row.feature}</div>
              <div className="text-gray-400 flex items-start gap-1.5">
                <X size={13} className="mt-0.5 shrink-0 text-gray-600" />
                {row.free}
              </div>
              <div className="text-gray-200 flex items-start gap-1.5">
                <Check size={13} className="mt-0.5 shrink-0" color={GOLD} />
                {row.pro}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          ¿Tienes el Founders Pass? Todos los beneficios Pro están incluidos de por vida — no necesitas suscribirte.
        </p>
      </div>
    </div>
  );
}
