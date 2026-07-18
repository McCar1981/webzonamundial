import { redirect } from "next/navigation";
import { COMPETITIONS } from "@/data/competitions";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getGateStatus } from "@/lib/ligas/football-prefs";
import EligeWizard from "./EligeWizard";

export const dynamic = "force-dynamic";

export default async function EligeTuFutbolPage({
  searchParams,
}: {
  searchParams: { preview?: string };
}) {
  // ?preview=1 → render view-only del wizard (diseño/demo), sin guardas de
  // acceso. Guardar sigue exigiendo sesión real (la action valida el usuario),
  // así que el gate no se debilita: solo se puede MIRAR, no saltar.
  const preview = searchParams?.preview === "1";

  if (!preview) {
    const user = await getCurrentUser();
    if (!user) redirect("/login?next=/elige-tu-futbol");
    const gate = await getGateStatus(user.id);
    // Ya eligió (o migración ausente → fail-open): no repetir el gate.
    if (!gate.needsGate) redirect("/app");
  }

  // Catálogo aligerado al cliente (solo lo que pinta el selector).
  const ligas = COMPETITIONS.map((c) => ({
    slug: c.slug,
    name: c.name,
    short: c.short,
    flag: c.flag,
    region: c.region,
  }));
  return <EligeWizard ligas={ligas} />;
}
