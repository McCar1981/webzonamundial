import Link from "next/link";
import { getOwnProfile } from "@/lib/auth-helpers";
import { SELECCIONES } from "@/data/selecciones";
import { COUNTRIES } from "@/lib/countries";
import { isFounder } from "@/lib/founders/store";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function CuentaProfilePage() {
  const { user, profile } = await getOwnProfile();
  const founder = user.email ? await isFounder(user.email) : false;

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Perfil</h2>
          <p className="text-gray-400 text-sm">
            Esta info se muestra en rankings, ligas y tu perfil público.
          </p>
        </div>
        {founder ? (
          <Link
            href="/cuenta/founders-pass"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wider no-underline transition-transform hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #C9A84C, #FDE68A)",
              color: "#1A1208",
              boxShadow: "0 0 30px -10px rgba(253, 230, 138, 0.6)",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              letterSpacing: "0.12em",
            }}
            title="Eres Founder de ZonaMundial"
          >
            🏆 FOUNDER
          </Link>
        ) : null}
      </div>

      <ProfileForm
        email={user.email ?? ""}
        initial={{
          username: profile?.username ?? "",
          country: profile?.country ?? "",
          fav_team: profile?.fav_team ?? "",
          locale: profile?.locale ?? "es",
          birth_date: profile?.birth_date ?? "",
        }}
        countries={COUNTRIES}
        selecciones={SELECCIONES.map((s) => ({
          slug: s.slug,
          nombre: s.nombre,
          flagCode: s.flagCode,
        }))}
      />
    </div>
  );
}
