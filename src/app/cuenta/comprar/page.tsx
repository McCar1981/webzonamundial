// /cuenta/comprar — pasarela: precio único según país + botón hacia Stripe Checkout.
//
// Decisión de producto (mayo 2026): NO permitimos que el usuario elija
// moneda. El país del perfil determina el precio:
//   - LATAM + USA → 6 USD
//   - Resto del mundo → 8 EUR
//
// Esto evita arbitraje (usuarios de España eligiendo "6 USD" porque es
// más barato). La lógica de mapeo vive en lib/founders/currency-by-country.ts.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isFounder } from "@/lib/founders/store";
import { currencyForCountry } from "@/lib/founders/currency-by-country";
import ComprarPanel from "./ComprarPanel";

export const metadata: Metadata = {
  title: "Conseguir Founders Pass | ZonaMundial",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ComprarPage() {
  await requireUser("/cuenta/comprar");
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? "";
  if (email && (await isFounder(email))) {
    // Si ya es founder, lo mandamos al panel de Founders Pass con su detalle.
    redirect("/cuenta/founders-pass");
  }

  // Leemos country del profile para asignar moneda automáticamente.
  // Si no hay country guardado (registros pre-mayo 2026 sin wizard),
  // el helper devuelve "eur" por defecto.
  let country: string | null = null;
  if (user?.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("country")
      .eq("id", user.id)
      .maybeSingle();
    country = profile?.country ?? null;
  }

  const currency = currencyForCountry(country);

  return <ComprarPanel email={email} country={country} currency={currency} />;
}
