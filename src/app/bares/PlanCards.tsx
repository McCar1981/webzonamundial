// src/app/bares/PlanCards.tsx
//
// Tarjetas de planes para la superficie comercial de "Porras Digitales para
// Bares". Estáticas (server component): leen el catálogo de planes en código.
// El precio mostrado es la tarifa EUR de referencia; el cobro real ajusta la
// moneda por país en el checkout. CTA → panel del bar (crea bar + paga).

import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { planList } from "@/lib/bars/plans";

const GOLD = "#c9a84c";

export default function PlanCards({ ctaHref = "/bar-dashboard" }: { ctaHref?: string }) {
  const plans = planList();
  return (
    <div className="grid gap-5 sm:grid-cols-3">
      {plans.map((plan) => {
        const featured = !!plan.highlight;
        return (
          <div
            key={plan.id}
            className="relative flex flex-col rounded-2xl border p-6"
            style={{
              borderColor: featured ? "rgba(201,168,76,0.45)" : "rgba(255,255,255,0.08)",
              background: featured
                ? "linear-gradient(180deg, rgba(201,168,76,0.10), rgba(11,24,37,0.4))"
                : "linear-gradient(180deg, rgba(15,29,50,0.6), rgba(11,24,37,0.3))",
              boxShadow: featured ? "0 0 40px -16px rgba(201,168,76,0.5)" : "none",
            }}
          >
            {featured && (
              <span
                className="absolute -top-3 left-6 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                style={{ background: GOLD, color: "#1A1208" }}
              >
                Recomendado
              </span>
            )}
            <h3 className="text-lg font-black text-white">{plan.name}</h3>
            <p className="mt-1 text-sm text-zm-text-muted leading-snug min-h-[40px]">{plan.tagline}</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-black text-white">{plan.priceEur} €</span>
              <span className="text-sm text-zm-text-muted">/ Mundial</span>
            </div>
            <p className="mt-1 text-[11px] text-zm-text-muted">
              Pago único · {plan.priceUsd} USD en LATAM y USA
            </p>

            <ul className="mt-5 space-y-2 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-zm-text">
                  <Check size={16} className="mt-0.5 shrink-0" color={GOLD} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href={ctaHref}
              className="mt-6 inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-full font-bold transition-transform hover:-translate-y-0.5"
              style={
                featured
                  ? { background: "linear-gradient(135deg, #C9A84C, #E8C76B 50%, #FDE68A)", color: "#1A1208" }
                  : { background: "rgba(255,255,255,0.06)", color: "#E2E8F0", border: "1px solid rgba(255,255,255,0.12)" }
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
