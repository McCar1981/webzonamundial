import type { Metadata } from "next";
import {
  getDashboardStats,
  getRecentRegistros,
  censorEmail,
  getSourceLabel,
  getSourceType,
} from "@/lib/registros-seed";
import RegistrosDashboard from "./RegistrosDashboard";

export const metadata: Metadata = {
  title: "Registros · Panel interno",
  robots: { index: false, follow: false, nocache: true },
};

// Re-render every 60s so freshly arrived real registros (from KV) reflect.
export const revalidate = 60;

export default async function RegistrosPage() {
  const stats = await getDashboardStats();
  const recent = await getRecentRegistros(50);

  // Pre-shape recent records for the client (censor emails server-side).
  const recentShaped = recent.map((r) => ({
    id: r.id,
    emailMasked: censorEmail(r.email),
    nombreCompleto: `${r.nombre} ${r.apellido}`,
    pais: r.pais,
    paisNombre: r.pais_nombre,
    fuente: r.fuente,
    fuenteLabel: getSourceLabel(r.fuente),
    fuenteType: getSourceType(r.fuente),
    createdAt: r.created_at,
  }));

  return <RegistrosDashboard stats={stats} recent={recentShaped} />;
}
