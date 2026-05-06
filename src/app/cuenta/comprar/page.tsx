// /cuenta/comprar — pasarela: selector EUR/USD + botón hacia Stripe Checkout.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isFounder } from "@/lib/founders/store";
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

  return <ComprarPanel email={email} />;
}
