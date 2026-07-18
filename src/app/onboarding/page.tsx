import { getOwnProfile } from "@/lib/auth-helpers";
import { SELECCIONES } from "@/data/selecciones";
import { COUNTRIES } from "@/lib/countries";
import OnboardingWizard from "./OnboardingWizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { user, profile } = await getOwnProfile();

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
    />
  );
}
