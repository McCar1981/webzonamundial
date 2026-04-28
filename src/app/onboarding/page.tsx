import { getOwnProfile } from "@/lib/auth-helpers";
import { getCreadoresActivos } from "@/data/creadores";
import { SELECCIONES } from "@/data/selecciones";
import { COUNTRIES } from "@/lib/countries";
import OnboardingWizard from "./OnboardingWizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { user, profile } = await getOwnProfile();
  const creadores = getCreadoresActivos();

  return (
    <OnboardingWizard
      email={user.email ?? ""}
      initialUsername={profile?.username ?? ""}
      countries={COUNTRIES}
      selecciones={SELECCIONES.map((s) => ({
        slug: s.slug,
        nombre: s.nombre,
        flagCode: s.flagCode,
        grupo: s.grupo,
      }))}
      creadores={creadores.map((c) => ({
        slug: c.slug,
        nombre: c.nombre,
        imagen: c.imagen,
        plataformaPrincipal: c.plataformaPrincipal,
        seguidores: c.seguidores,
      }))}
    />
  );
}
