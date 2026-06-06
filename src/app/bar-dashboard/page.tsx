// src/app/bar-dashboard/page.tsx
//
// Panel del dueño del bar (FASE 1). Server Component: exige sesión, carga el
// bar del usuario (o ninguno → flujo de creación) con sus métricas, QR y
// premios, y delega el render al cliente <BarDashboard>. SIN AdSense.

import type { Metadata } from "next";
import { headers } from "next/headers";
import { requireUser } from "@/lib/auth-helpers";
import { getBarByOwner, barStats, getMainQr, listPrizes, getBarPayment, listQrSources } from "@/lib/bars/store";
import BarDashboard from "./BarDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel del bar · ZonaMundial",
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

export default async function BarDashboardPage() {
  const user = await requireUser("/bar-dashboard");
  const origin = siteOrigin();

  const bar = await getBarByOwner(user.id);
  if (!bar) {
    return (
      <BarDashboard
        initialBar={null}
        initialStats={null}
        initialQr={null}
        initialSources={[]}
        initialPrizes={[]}
        initialPayment={null}
        origin={origin}
      />
    );
  }

  const [stats, qr, sources, prizes, payment] = await Promise.all([
    barStats(bar.id),
    getMainQr(bar.id),
    listQrSources(bar.id),
    listPrizes(bar.id),
    getBarPayment(bar.id),
  ]);

  return (
    <BarDashboard
      initialBar={bar}
      initialStats={stats}
      initialQr={qr}
      initialSources={sources}
      initialPrizes={prizes}
      initialPayment={payment}
      origin={origin}
    />
  );
}
