import { getOwnProfile } from "@/lib/auth-helpers";
import { getCreadoresActivos } from "@/data/creadores";
import { SELECCIONES } from "@/data/selecciones";
import { COUNTRIES } from "@/lib/countries";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function CuentaProfilePage() {
  const { user, profile } = await getOwnProfile();
  const creadores = getCreadoresActivos();

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">Perfil</h2>
        <p className="text-gray-400 text-sm">
          Esta info se muestra en rankings, ligas y tu perfil público.
        </p>
      </div>

      <ProfileForm
        email={user.email ?? ""}
        initial={{
          username: profile?.username ?? "",
          country: profile?.country ?? "",
          fav_team: profile?.fav_team ?? "",
          fav_creator: profile?.fav_creator ?? "",
          locale: profile?.locale ?? "es",
          birth_date: profile?.birth_date ?? "",
        }}
        countries={COUNTRIES}
        selecciones={SELECCIONES.map((s) => ({
          slug: s.slug,
          nombre: s.nombre,
          flagCode: s.flagCode,
        }))}
        creadores={creadores.map((c) => ({
          slug: c.slug,
          nombre: c.nombre,
          imagen: c.imagen,
          plataformaPrincipal: c.plataformaPrincipal,
        }))}
      />
    </div>
  );
}
