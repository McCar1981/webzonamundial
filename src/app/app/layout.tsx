import type { Metadata } from "next";
import { redirect } from "next/navigation";
import BarContextBanner from "@/components/bars/BarContextBanner";
import { BarContextProvider } from "@/components/bars/BarContextProvider";
import { getBarContext, barThemeCssVars } from "@/lib/bars/context";
import HomeInstallBanner from "@/components/HomeInstallBanner";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getGateStatus } from "@/lib/ligas/football-prefs";
import { isPostMundial } from "@/lib/season-gate";

/**
 * Group layout for /app/* internal modules.
 *
 * SEO note: these pages are visual mockups for the unreleased product
 * (predicciones, fantasy, IA Coach, ligas, rankings, etc.). They have no
 * substantial textual content, so Google rightly flagged them as
 * "Descubierta: actualmente sin indexar" in Search Console. We mark them
 * noindex,follow to:
 *  - Stop wasting crawl budget on thin pages
 *  - Preserve internal-link equity (follow=true)
 *  - Auto re-index when each module ships real content (just remove this
 *    layout's robots metadata or override per-page).
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
    nocache: false,
    googleBot: {
      index: false,
      follow: true,
    },
  },
};

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  // GATE DE FÚTBOL: un usuario LOGUEADO debe haber elegido liga(s) y club antes
  // de ver el lobby. Si no, se le manda primero a /elige-tu-futbol. Los
  // invitados no se bloquean (no tienen perfil donde guardar; se les invita a
  // registrarse en el propio lobby). Fail-open ante migración ausente o error
  // (getGateStatus nunca devuelve needsGate=true en esos casos), así que esto
  // jamás deja el lobby inaccesible. La ruta del gate vive FUERA de /app, por
  // lo que este layout no la intercepta → sin bucle de redirección.
  //
  // SOLO desde el pivote del lunes (isPostMundial): durante el Mundial nadie es
  // forzado a elegir club/ligas — la app sigue siendo del Mundial. El gate se
  // enciende a la vez que la portada y la sección "Tu fútbol", el lunes 20-jul.
  if (isPostMundial()) {
    const user = await getCurrentUser();
    if (user) {
      const gate = await getGateStatus(user.id);
      if (gate.needsGate) redirect("/elige-tu-futbol");
    }
  }

  const ctx = await getBarContext();

  // Sin contexto de bar: experiencia ZM intacta para el resto de usuarios.
  if (!ctx) return <><HomeInstallBanner />{children}</>;

  // Con contexto de bar: banner de marca + paleta del bar inyectada como
  // variables CSS, que los módulos de /app adoptan (fondos, acentos y CTAs).
  // El provider expone slug+nombre a los módulos cliente para conservar el
  // lenguaje de la peña ("Predicciones de la peña", "...para [Nombre]").
  return (
    <BarContextProvider value={{ slug: ctx.bar.slug, name: ctx.bar.name }}>
      <div style={barThemeCssVars(ctx.theme)}>
        <BarContextBanner bar={ctx.bar} theme={ctx.theme} />
        <HomeInstallBanner />
        {children}
      </div>
    </BarContextProvider>
  );
}
