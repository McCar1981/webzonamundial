// src/app/empresas/EmpresaPlanCards.tsx
//
// Tarjetas de planes para la superficie comercial de "Porra Corporativa para
// Empresas". Estáticas (server component): el catálogo de planes vive aquí en
// código (precio EUR de referencia + USD para LATAM/USA). Espejo visual de
// src/app/bares/PlanCards.tsx, con planes y CTAs propios del comprador B2B.
//
// TODO (fase 2): si se integra el cobro real con Stripe (como el Founders Pass /
// los planes de bares), mover este catálogo a src/lib/ con los importes que el
// backend valida y diferenciar el tipo "empresa" en el alta.

import Link from "next/link";
import { Check, ArrowRight, Sparkles } from "lucide-react";

const GOLD = "#c9a84c";

interface EmpresaPlan {
  id: string;
  name: string;
  tagline: string;
  idealFor: string;
  priceEur: number;
  features: string[];
  highlight?: boolean;
  cta: { label: string; href: string };
}

// Catálogo de planes corporativos (ver BRIEF /empresas §3 Pricing).
const EMPRESA_PLANS: EmpresaPlan[] = [
  {
    id: "equipo",
    name: "Equipo",
    tagline: "Lo esencial para lanzar la liga de tu equipo",
    idealFor: "Equipos y pymes de hasta 30 personas",
    priceEur: 149,
    features: [
      "Liga privada cerrada",
      "Ranking individual",
      "Landing personalizada",
      "Kit de comunicación básico",
      "Premio principal",
      "Estadísticas básicas",
    ],
    cta: { label: "Empezar", href: "/bar-dashboard" },
  },
  {
    id: "empresa",
    name: "Empresa",
    tagline: "La liga completa para que compitan los departamentos",
    idealFor: "Empresas de hasta 150 empleados",
    priceEur: 299,
    highlight: true,
    features: [
      "Todo lo de Equipo",
      "Ranking por departamentos (hasta 8 equipos)",
      "Logo y personalización ampliada",
      "Kit de comunicación completo",
      "Exportar clasificación (CSV)",
      "Informe final en PDF",
      "Soporte prioritario",
    ],
    cta: { label: "Empezar", href: "/bar-dashboard" },
  },
  {
    id: "corporate",
    name: "Corporate",
    tagline: "Para empresas grandes y varias oficinas",
    idealFor: "Empresas grandes y multi-sede",
    priceEur: 499,
    features: [
      "Todo lo de Empresa",
      "Departamentos ilimitados",
      "Multi-sede (varias ligas bajo una cuenta)",
      "Pantalla de oficina a pantalla completa",
      "Onboarding asistido",
      "Soporte dedicado",
    ],
    cta: {
      label: "Hablar con nosotros",
      href: "mailto:gol@zonamundial.app?subject=Plan%20Corporate%20-%20Porra%20Empresas",
    },
  },
];

export default function EmpresaPlanCards() {
  return (
    <div className="grid gap-5 sm:grid-cols-3 sm:items-stretch">
      {EMPRESA_PLANS.map((plan) => {
        const featured = !!plan.highlight;
        const isMailto = plan.cta.href.startsWith("mailto:");
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
              Pago único · Precio para España
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

            {isMailto ? (
              <a
                href={plan.cta.href}
                className="mt-6 inline-flex items-center justify-center gap-2 w-full px-5 py-3.5 rounded-full font-black transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
                style={{ background: "rgba(255,255,255,0.06)", color: "#E2E8F0", border: "1px solid rgba(255,255,255,0.14)" }}
              >
                {plan.cta.label} <ArrowRight size={16} />
              </a>
            ) : (
              <Link
                href={plan.cta.href}
                className="mt-6 inline-flex items-center justify-center gap-2 w-full px-5 py-3.5 rounded-full font-black transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
                style={
                  featured
                    ? { background: "linear-gradient(135deg, #C9A84C, #E8C76B 50%, #FDE68A)", color: "#1A1208", boxShadow: "0 10px 30px -10px rgba(201,168,76,0.7)" }
                    : { background: "rgba(255,255,255,0.06)", color: "#E2E8F0", border: "1px solid rgba(255,255,255,0.14)" }
                }
              >
                {plan.cta.label} <ArrowRight size={16} />
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
