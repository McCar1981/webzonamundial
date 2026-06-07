// src/app/b/[barSlug]/kit/[material]/page.tsx
//
// Ruta de preview/descarga de un material del Kit de Activación. Sirve los 7
// formatos (a4, a3, mesa-a6, story, post, whatsapp, tv-slide) con una sola ruta
// dinámica, renderizando la plantilla "Premium Mundial" con los datos del bar.
//
// Pensado para imprimir o "Guardar como PDF" (vector, nítido) desde el navegador:
// el lienzo va a su tamaño exacto en px CSS y @page fija el tamaño de hoja.
//
// Validaciones (igual que /cartel): usuario autenticado y dueño del bar; el bar
// existe; el QR principal existe; y si el material es premium, el bar necesita un
// plan que incluya materiales premium. SIN AdSense, noindex.

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { getBarBySlug, listPrizes, getMainQr, getQrSourceByCode, listQrSources } from "@/lib/bars/store";
import { getPlan } from "@/lib/bars/plans";
import { getKitMaterial, buildKitData, siteOrigin } from "@/lib/bars/kit";
import { getKitImageTemplate } from "@/lib/bars/kit-image-templates";
import PremiumMundialMaterial from "@/components/bars/kit/PremiumMundialMaterial";
import BarKitPosterTemplate from "@/components/bars/kit/BarKitPosterTemplate";
import KitToolbar from "@/components/bars/kit/KitToolbar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Material del kit · ZonaMundial",
  robots: { index: false, follow: false },
};

// Ancho máximo de preview en pantalla; el lienzo real se escala para encajar.
const PREVIEW_MAX_W = 820;

export default async function KitMaterialPage({
  params, searchParams,
}: { params: { barSlug: string; material: string }; searchParams: { code?: string; debug?: string } }) {
  const material = getKitMaterial(params.material);
  if (!material) notFound();

  const user = await requireUser(`/b/${params.barSlug}/kit/${params.material}`);

  const bar = await getBarBySlug(params.barSlug);
  if (!bar) notFound();
  if (bar.owner_user_id !== user.id) redirect("/bar-dashboard");

  // Gating premium: solo materiales premium exigen plan con premiumMaterials.
  const plan = getPlan(bar.plan_id);
  if (material.premium && !plan.premiumMaterials) {
    redirect(`/bar-dashboard/kit?upsell=${material.id}`);
  }

  const origin = siteOrigin();
  const [prizes, mainQr] = await Promise.all([listPrizes(bar.id), getMainQr(bar.id)]);

  // QR de zona opcional (?code=); por defecto el principal. Debe existir un QR.
  let code = mainQr?.code ?? null;
  if (searchParams.code) {
    const sources = await listQrSources(bar.id);
    const chosen = sources.find((s) => s.code === searchParams.code)
      ?? (await getQrSourceByCode(bar.id, searchParams.code));
    if (chosen) code = chosen.code;
  }
  if (!code) notFound();

  const data = await buildKitData(bar, origin, code, prizes);

  // Si el material tiene imagen-plantilla diseñada, se usa esa composición
  // (la validada en el piloto); si no, se cae al fondo CSS "Premium Mundial".
  const imageTpl = getKitImageTemplate(material.id);
  const debug = searchParams.debug === "1";

  // Escala de preview: encajar el lienzo al ancho disponible (nunca ampliar).
  const scale = Math.min(1, PREVIEW_MAX_W / material.width);

  return (
    <>
      <style>{`
        @page { size: ${material.pageSize}; margin: 0; }
        html, body { background: #e5e7eb; }
        @media print {
          html, body { background: #fff !important; }
          .kit-toolbar { display: none !important; }
          .kit-stage { padding: 0 !important; background: #fff !important; min-height: 0 !important; }
          /* En impresión el lienzo va a tamaño real (sin escalado de preview). */
          .kit-scale { transform: none !important; }
          .kit-scale-wrap { width: auto !important; height: auto !important; }
        }
      `}</style>

      <KitToolbar label={material.label} />

      <main
        className="kit-stage"
        style={{
          background: "#e5e7eb", minHeight: "100vh",
          padding: "72px 12px 24px", display: "flex", justifyContent: "center", alignItems: "flex-start",
        }}
      >
        {/* El wrapper reserva el espacio visual del lienzo escalado. */}
        <div
          className="kit-scale-wrap"
          style={{ width: material.width * scale, height: material.height * scale }}
        >
          <div
            className="kit-scale"
            style={{
              transform: `scale(${scale})`, transformOrigin: "top left",
              boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
            }}
          >
            {imageTpl ? (
              <BarKitPosterTemplate
                barName={data.barName}
                barLogoUrl={data.logoUrl}
                qrImageUrl={data.qrDataUrl}
                prizeTitle={data.prizeTitle}
                shortUrl={data.shortUrl}
                templateUrl={imageTpl.templateUrl}
                size={{ width: material.width, height: material.height }}
                zones={imageTpl.zones}
                debug={debug}
              />
            ) : (
              <PremiumMundialMaterial material={material} data={data} />
            )}
          </div>
        </div>
      </main>
    </>
  );
}
