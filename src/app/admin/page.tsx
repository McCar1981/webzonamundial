// /admin — puerta única del panel de creadores.
//
// Resuelve el acceso en servidor, sin exponer datos a nadie sin sesión:
//   1. Cookie admin firmada (zm_admin) → dashboard de gestión /admin/creadores.
//   2. Sesión Supabase cuyo email está vinculado en creator_program → SU panel.
//   3. Sesión sin vincular → aviso con contacto.
//   4. Sin sesión → selector de acceso (creador / administración).
//
// Esta ruta está exenta del guard de middleware (solo la raíz exacta /admin);
// el resto de /admin/* sigue protegido por cookie admin.

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ADMIN_COOKIE_NAME, isValidAdminCookie } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCreatorByEmail } from "@/lib/creators/program";
import CreatorPanel from "./CreatorPanel";

export const metadata: Metadata = {
  title: "Panel de creadores · ZonaMundial",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default async function AdminRootPage() {
  // 1) Administración (Carlos): cookie firmada → dashboard de gestión.
  const adminCookie = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (adminCookie && (await isValidAdminCookie(adminCookie))) {
    redirect("/admin/creadores");
  }

  // 2) Creador con su cuenta normal de la web.
  let email: string | null = null;
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email ?? null;
  } catch {
    email = null; // sin envs de Supabase en local no rompemos la página
  }

  if (email) {
    let creator = null;
    try {
      creator = await getCreatorByEmail(email);
    } catch {
      creator = null; // tabla aún sin migrar o service key ausente → trato como no vinculado
    }
    if (creator && creator.active) {
      return <CreatorPanel creator={creator} />;
    }
    return <NotLinked email={email} />;
  }

  // 4) Sin sesión → selector.
  return <LoginChooser />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#060B14] text-white flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-3xl font-black tracking-tight">
            Zona
            <span className="bg-gradient-to-r from-[#C9A84C] via-[#FDE68A] to-[#C9A84C] bg-clip-text text-transparent">
              Mundial
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">Panel de creadores</p>
        </div>
        {children}
      </div>
    </div>
  );
}

function LoginChooser() {
  return (
    <Shell>
      <div className="space-y-4">
        <Link
          href="/login?next=/admin"
          className="block rounded-2xl border border-[#C9A84C]/30 bg-gradient-to-br from-[#C9A84C]/15 to-[#C9A84C]/5 p-6 transition-all hover:border-[#C9A84C]/60"
        >
          <div className="text-lg font-bold text-[#C9A84C]">Soy creador</div>
          <p className="text-sm text-gray-300 mt-1">
            Entra con tu cuenta de ZonaMundial y consulta tus registros, tus bonos y tus ingresos
            en tiempo real.
          </p>
        </Link>
        <Link
          href="/admin/login?next=/admin/creadores"
          className="block rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:border-white/25"
        >
          <div className="text-lg font-bold">Administración</div>
          <p className="text-sm text-gray-400 mt-1">Acceso con contraseña de administrador.</p>
        </Link>
      </div>
    </Shell>
  );
}

function NotLinked({ email }: { email: string }) {
  return (
    <Shell>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <h1 className="text-lg font-bold mb-2">Tu cuenta no está vinculada al programa</h1>
        <p className="text-sm text-gray-400">
          Has iniciado sesión como <strong className="text-gray-200">{email}</strong>, pero ese
          email no figura en el programa de creadores. Si eres creador de ZonaMundial, escríbenos a{" "}
          <a href="mailto:business.dev@sprintmarkt.com" className="text-[#C9A84C] underline">
            business.dev@sprintmarkt.com
          </a>{" "}
          y lo activamos.
        </p>
        <Link href="/app" className="inline-block mt-5 text-sm text-gray-300 underline">
          Volver a la app
        </Link>
      </div>
    </Shell>
  );
}
