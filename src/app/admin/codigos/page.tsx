// /admin/codigos — panel interno de códigos de captación.
// Protegido por middleware /admin/* (cookie zm_admin).
//
// Estrategia de propagación paralela a los creadores: códigos que repartes
// (radio, embajador, sponsor, bar…). Recompensa en Fútcoins al nuevo usuario
// y al dueño del código por cada registro atribuido.

import type { Metadata } from "next";
import AdminHeader from "@/components/admin/AdminHeader";
import { listCodes } from "@/lib/signup-codes/store";
import CodigosManager from "./CodigosManager";

export const metadata: Metadata = {
  title: "Códigos de captación · Panel interno",
  robots: { index: false, follow: false, nocache: true },
};

// Lee datos en vivo de Supabase: nunca prerenderizar.
export const dynamic = "force-dynamic";

export default async function CodigosAdminPage() {
  const codes = await listCodes();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://zonamundial.app";

  const totalUsos = codes.reduce((s, c) => s + (c.uses_count || 0), 0);
  const activos = codes.filter((c) => c.active).length;

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto text-white">
      <AdminHeader
        title="Códigos de captación"
        current="/admin/codigos"
        description="Crea y reparte códigos (radio, embajador, sponsor, bar…). El nuevo usuario y el dueño del código reciben Fútcoins por cada registro atribuido. Enlace para compartir: /registro-codigo/CÓDIGO."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Stat label="Códigos" value={codes.length.toString()} />
        <Stat label="Activos" value={activos.toString()} />
        <Stat label="Registros atribuidos" value={totalUsos.toString()} />
      </div>

      <CodigosManager codes={codes} siteUrl={siteUrl} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-4 rounded-xl border border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
      <div className="text-2xl font-black text-[#C9A84C]">{value}</div>
      <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}
