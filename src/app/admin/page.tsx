// /admin — puerta del panel interno.
//
//   1. Cookie admin firmada (zm_admin) → dashboard de gestión /admin/panel.
//   2. Sin cookie → selector de acceso (administración con contraseña).
//
// Esta ruta está exenta del guard de middleware (solo la raíz exacta /admin);
// el resto de /admin/* sigue protegido por cookie admin.

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ADMIN_COOKIE_NAME, isValidAdminCookie } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Panel interno · ZonaMundial",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default async function AdminRootPage() {
  const adminCookie = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (adminCookie && (await isValidAdminCookie(adminCookie))) {
    redirect("/admin/panel");
  }
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
          <p className="text-sm text-gray-400 mt-1">Panel interno</p>
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
          href="/admin/login?next=/admin/panel"
          className="block rounded-2xl border border-[#C9A84C]/30 bg-gradient-to-br from-[#C9A84C]/15 to-[#C9A84C]/5 p-6 transition-all hover:border-[#C9A84C]/60"
        >
          <div className="text-lg font-bold text-[#C9A84C]">Administración</div>
          <p className="text-sm text-gray-300 mt-1">Acceso con contraseña de administrador.</p>
        </Link>
      </div>
    </Shell>
  );
}
