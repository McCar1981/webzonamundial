import type { Metadata } from "next";
import BarContextBanner from "@/components/bars/BarContextBanner";
import { BarContextProvider } from "@/components/bars/BarContextProvider";
import { getBarContext, barThemeCssVars } from "@/lib/bars/context";
import GranPremioOffer from "@/components/pro/GranPremioOffer";

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
  const ctx = await getBarContext();

  // Sin contexto de bar: experiencia ZM intacta para el resto de usuarios.
  if (!ctx) return <>{children}<GranPremioOffer /></>;

  // Con contexto de bar: banner de marca + paleta del bar inyectada como
  // variables CSS, que los módulos de /app adoptan (fondos, acentos y CTAs).
  // El provider expone slug+nombre a los módulos cliente para conservar el
  // lenguaje de la peña ("Predicciones de la peña", "...para [Nombre]").
  return (
    <BarContextProvider value={{ slug: ctx.bar.slug, name: ctx.bar.name }}>
      <div style={barThemeCssVars(ctx.theme)}>
        <BarContextBanner bar={ctx.bar} theme={ctx.theme} />
        {children}
        <GranPremioOffer />
      </div>
    </BarContextProvider>
  );
}
