import { getOwnProfile } from "@/lib/auth-helpers";
import AvatarUploader from "./AvatarUploader";

export const dynamic = "force-dynamic";

export default async function CuentaAvatarPage() {
  const { user, profile } = await getOwnProfile();

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">Avatar</h2>
        <p className="text-gray-400 text-sm">
          Sube una foto. JPG/PNG/WEBP, hasta 2 MB.
        </p>
      </div>

      <AvatarUploader
        userId={user.id}
        initialUrl={profile?.avatar_url ?? null}
        username={profile?.username ?? user.email?.split("@")[0] ?? ""}
      />
    </div>
  );
}
