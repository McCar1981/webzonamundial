// /pro — landing del plan Pro: comparativa Free vs Pro + checkout de
// suscripción (mensual/anual). La moneda la asigna el server según
// profiles.country, igual que en /cuenta/comprar (anti-arbitraje).

import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getEntitlements } from "@/lib/pro/entitlement";
import { proRegionForCountry } from "@/lib/founders/currency-by-country";
import type { ProRegion } from "@/lib/stripe/pricing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProPanel from "./ProPanel";

export const metadata: Metadata = {
  title: "Plan Pro: juega sin límites | ZonaMundial",
  description:
    "Predicciones sin límites, IA Coach ilimitada, fantasy en vivo, Modo Carrera infinito, ligas privadas, sin anuncios y estadísticas avanzadas. Desde 12 €/año.",
};

export const dynamic = "force-dynamic";

export default async function ProPage() {
  // La página es pública (visitantes ven la comparativa); el checkout exige
  // sesión y el panel redirige a /login si hace falta.
  const user = await getCurrentUser();

  let isProUser = false;
  let source: "subscription" | "founder" | null = null;
  let region: ProRegion = "eu";

  if (user) {
    const ent = await getEntitlements(user.id, user.email);
    isProUser = ent.isPro;
    source = ent.source;

    const supabase = createSupabaseServerClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("country")
      .eq("id", user.id)
      .maybeSingle();
    region = proRegionForCountry(profile?.country ?? null);
  }

  return (
    <ProPanel
      authenticated={!!user}
      isPro={isProUser}
      source={source}
      region={region}
    />
  );
}
