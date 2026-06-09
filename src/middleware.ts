import { NextResponse, type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";
import { isValidAdminCookie } from "@/lib/admin-auth";

const ADMIN_COOKIE = "zm_admin";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // Protect /admin/* and /api/admin/* (except /admin/login itself).
  // H-001-05: las rutas API empiezan por /api/admin, no /admin.
  const isAdminRoute =
    url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/admin");
  if (
    isAdminRoute &&
    !url.pathname.startsWith("/admin/login")
  ) {
    const cookie = request.cookies.get(ADMIN_COOKIE)?.value;
    const ok = cookie ? await isValidAdminCookie(cookie) : false;
    if (!ok) {
      const loginUrl = url.clone();
      loginUrl.pathname = "/admin/login";
      loginUrl.searchParams.set("next", url.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const { response, user } = await updateSupabaseSession(request);

  // Bifurcación por ESTADO DE SESIÓN (no por user-agent → sin cloaking).
  // El usuario con sesión activa que aterriza en la portada `/` va directo al
  // lobby de la app `/app`. Googlebot nunca tiene sesión, así que siempre ve
  // el home editorial → no hay contenido distinto para el crawler.
  // Escape: `/?portada=1` deja ver la portada editorial aunque estés logueado.
  if (
    user &&
    url.pathname === "/" &&
    !url.searchParams.has("portada")
  ) {
    const appUrl = url.clone();
    appUrl.pathname = "/app";
    appUrl.search = "";
    const redirect = NextResponse.redirect(appUrl);
    // Conservar las cookies de refresco de sesión escritas por Supabase.
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on all paths except:
     *  - _next/static, _next/image (Next.js internals)
     *  - favicon, robots, sitemap, manifest, og-image (static assets)
     *  - .png, .jpg, .jpeg, .gif, .svg, .webp, .ico, .css, .js (other static)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|og-image.jpg|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js)$).*)",
  ],
};
