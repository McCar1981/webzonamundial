import { getOwnProfile } from "@/lib/auth-helpers";
import PreferencesForm from "./PreferencesForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface PrefsRow {
  email_digest: boolean;
  push_news: boolean;
  push_matches: boolean;
  push_leagues: boolean;
  push_creators: boolean;
}

const DEFAULT_PREFS: PrefsRow = {
  email_digest: true,
  push_news: true,
  push_matches: true,
  push_leagues: true,
  push_creators: false,
};

export default async function CuentaPreferenciasPage() {
  const { user } = await getOwnProfile();
  const supabase = createSupabaseServerClient();

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const initial: PrefsRow = prefs ?? DEFAULT_PREFS;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">Preferencias</h2>
        <p className="text-gray-400 text-sm">
          Decide qué notificaciones quieres recibir y por qué canal.
        </p>
      </div>

      <PreferencesForm initial={initial} />
    </div>
  );
}
