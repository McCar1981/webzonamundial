// src/app/bar-dashboard/kit/page.tsx
//
// Kit de Activación del bar (FASE 2). Server Component: exige sesión y bar del
// dueño, reúne QR principal, premio activo, plan y enlace corto, y delega el
// render a <KitPanel>. Aquí NO se cobra ni se publica: solo se entregan los
// materiales del bar ya configurado. SIN AdSense, noindex.

import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { getBarByOwner, getMainQr, listPrizes, getBarPayment } from "@/lib/bars/store";
import { getPlan } from "@/lib/bars/plans";
import { kitMaterialList } from "@/lib/bars/kit";
import KitPanel from "./KitPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kit de activación · ZonaMundial",
  robots: { index: false, follow: false },
};

function siteOrigin(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "zonamundial.app";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export default async function BarKitPage() {
  const user = await requireUser("/bar-dashboard/kit");
  const bar = await getBarByOwner(user.id);
  if (!bar) redirect("/bar-dashboard");

  const [mainQr, prizes, payment] = await Promise.all([
    getMainQr(bar.id), listPrizes(bar.id), getBarPayment(bar.id),
  ]);

  const hasActivePlan = true; // Todo gratis: el kit está siempre desbloqueado.
  const plan = getPlan(bar.plan_id);
  const mainPrize = prizes.find((p) => p.prize_type === "principal") ?? prizes[0] ?? null;

  const origin = siteOrigin();
  const code = mainQr?.code ?? null;
  const qrTarget = code ? `${origin}/r/${code}` : `${origin}/b/${bar.slug}`;

  return (
    <KitPanel
      materials={kitMaterialList()}
      barSlug={bar.slug}
      barName={bar.name}
      hasActivePlan={hasActivePlan}
      premiumMaterials={plan.premiumMaterials}
      planName={plan.name}
      prizeTitle={mainPrize?.title ?? null}
      qrTarget={qrTarget}
    />
  );
}
