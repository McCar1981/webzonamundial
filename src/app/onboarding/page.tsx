import { getOwnProfile } from "@/lib/auth-helpers";
import { getCreadoresActivos } from "@/data/creadores";
import { SELECCIONES } from "@/data/selecciones";
import { COUNTRIES } from "@/lib/countries";
import OnboardingWizard from "./OnboardingWizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { user, profile } = await getOwnProfile();
  const creadores = getCreadoresActivos();

  // El pre-registro web ya guardó país/selección/creador en profiles (vía
  // el trigger handle_new_user). Se los pasamos al wizard para que el
  // usuario CONFIRME en vez de volver a teclear lo que ya nos dio — la
  // queja real de usuarios: "me pide otra vez el país y el creador".
  return (
    <OnboardingWizard
      email={user.email ?? ""}
      initialUsername={profile?.username ?? ""}
      initialCountry={profile?.country ?? ""}
      initialLocale={profile?.locale === "en" ? "en" : "es"}
      initialBirthDate={profile?.birth_date ?? ""}
      initialFavTeam={profile?.fav_team ?? ""}
      initialFavCreator={profile?.fav_creator ?? ""}
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
