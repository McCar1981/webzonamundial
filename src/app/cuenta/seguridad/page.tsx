import { getOwnProfile } from "@/lib/auth-helpers";
import SecurityPanel from "./SecurityPanel";

export const dynamic = "force-dynamic";

export default async function CuentaSeguridadPage() {
  const { user } = await getOwnProfile();

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">Seguridad</h2>
        <p className="text-gray-400 text-sm">
          Gestiona el email de tu cuenta y elimina tu cuenta.
        </p>
      </div>

      <SecurityPanel email={user.email ?? ""} />
    </div>
  );
}
