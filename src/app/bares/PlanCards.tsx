// src/app/bares/PlanCards.tsx
//
// Tarjetas de planes para la superficie comercial de "Porras Digitales para
// Bares". Estáticas (server component): leen el catálogo de planes en código.
// El precio mostrado es la tarifa EUR de referencia; el cobro real ajusta la
// moneda por país en el checkout. CTA → panel del bar (crea bar + paga).

import Link from "next/link";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { planList } from "@/lib/bars/plans";

const GOLD = "#c9a84c";

export default function PlanCards({ ctaHref = "/bar-dashboard" }: { ctaHref?: string }) {
  const plans = planList();
  return (
    <div className="grid gap-5 sm:grid-cols-3 sm:items-stretch">
      {plans.map((plan) => {
        const featured = !!plan.highlight;
        return (
          <div
            key={plan.id}
            className="relative flex flex-col rounded-3xl border p-6"
            style={{
              borderColor: featured ? "rgba(201,168,76,0.55)" : "rgba(255,255,255,0.08)",
              borderWidth: featured ? 2 : 1,
              background: featured
                ? "linear-gradient(180deg, rgba(201,168,76,0.14), rgba(11,24,37,0.55))"
                : "linear-gradient(180deg, rgba(15,29,50,0.6), rgba(11,24,37,0.3))",
              boxShadow: featured ? "0 0 60px -18px rgba(201,168,76,0.65)" : "none",
              transform: featured ? "translateY(-6px)" : "none",
            }}
          >
            {featured && (
              <span
                className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.18em] whitespace-nowrap"
                style={{ background: "linear-gradient(135deg, #C9A84C, #FDE68A)", color: "#1A1208", boxShadow: "0 6px 20px -6px rgba(201,168,76,0.8)" }}
              >
                <Sparkles size={12} /> Recomendado
              </span>
            )}

            <h3 className="text-lg font-black text-white">{plan.name}</h3>
            <p className="mt-1 text-sm text-zm-text-muted leading-snug min-h-[40px]">{plan.tagline}</p>

            <div className="mt-4 flex items-end gap-1.5">
              <span className="text-5xl font-black tracking-tight" style={{ color: featured ? GOLD : "#fff" }}>
                {plan.priceEur}
              </span>
              <span className="text-2xl font-black mb-0.5" style={{ color: featured ? GOLD : "#fff" }}>€</span>
              <span className="text-sm text-zm-text-muted mb-1.5">/ Mundial</span>
            </div>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-bold" style={{ color: GOLD }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
              Pago único · {plan.priceUsd} USD en LATAM y USA
            </p>

            <div
              className="mt-4 rounded-xl px-3 py-2.5 text-[12px] leading-snug"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#cbd5e1" }}
            >
              <span className="font-bold text-white">Ideal para: </span>
              {plan.idealFor}
            </div>

            <ul className="mt-5 space-y-2.5 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-zm-text">
                  <span
                    className="mt-0.5 flex items-center justify-center w-5 h-5 rounded-full shrink-0"
                    style={{ background: featured ? "rgba(201,168,76,0.18)" : "rgba(255,255,255,0.06)" }}
                  >
                    <Check size={13} color={GOLD} strokeWidth={3} />
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href={ctaHref}
              className="mt-6 inline-flex items-center justify-center gap-2 w-full px-5 py-3.5 rounded-full font-black transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
              style={
                featured
                  ? { background: "linear-gradient(135deg, #C9A84C, #E8C76B 50%, #FDE68A)", color: "#1A1208", boxShadow: "0 10px 30px -10px rgba(201,168,76,0.7)" }
                  : { background: "rgba(255,255,255,0.06)", color: "#E2E8F0", border: "1px solid rgba(255,255,255,0.14)" }
              }
            >
              Empezar <ArrowRight size={16} />
            </Link>
          </div>
        );
      })}
    </div>
  );
}
