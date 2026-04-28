import { requireUser, getOwnProfile } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bienvenido · ZonaMundial",
  robots: { index: false, follow: false },
};

/*
  /onboarding — wizard de 3 pantallas que se le pide al usuario UNA vez
  tras su primer login. Se considera completado cuando profile.onboarded_at
  != NULL.

  Si el usuario ya está onboarded y entra a /onboarding manualmente, le
  redirigimos a /cuenta. No tiene sentido repetirlo.
*/
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser("/onboarding");
  const { profile } = await getOwnProfile();

  if (profile?.onboarded_at) {
    redirect("/cuenta");
  }

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-15"
          style={{
            background:
              "radial-gradient(circle, rgba(201,168,76,0.3) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pt-12 pb-16">
        {children}
      </div>
    </div>
  );
}
