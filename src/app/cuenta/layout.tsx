import { requireUser } from "@/lib/auth-helpers";
import CuentaSidebar from "./CuentaSidebar";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mi cuenta · ZonaMundial",
  robots: { index: false, follow: false },
};

/*
  /cuenta — área protegida del usuario.

  Layout con sidebar de tabs a la izquierda en desktop, en stack
  vertical en móvil. Cada tab es una sub-ruta:
    /cuenta              → perfil
    /cuenta/avatar       → upload foto
    /cuenta/preferencias → notificaciones, push, idioma
    /cuenta/seguridad    → cambiar email, eliminar cuenta

  La auth se valida aquí (al primer render del layout). Si el usuario
  no está autenticado, redirect a /login?next=/cuenta...
*/
export default async function CuentaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth gate. Redirige si no hay sesión.
  await requireUser("/cuenta");

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-15"
          style={{
            background:
              "radial-gradient(circle, rgba(201,168,76,0.3) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-16">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            Mi{" "}
            <span className="bg-gradient-to-r from-[#C9A84C] via-[#FDE68A] to-[#C9A84C] bg-clip-text text-transparent">
              cuenta
            </span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Gestiona tu perfil, preferencias y notificaciones.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 lg:gap-8">
          <CuentaSidebar />
          <main
            className="rounded-2xl border border-[#1E293B]/50 p-6 sm:p-8"
            style={{
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.6), rgba(11,24,37,0.4))",
              backdropFilter: "blur(12px)",
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
