import { NextResponse, type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";
import { isValidAdminCookie } from "@/lib/admin-auth";

const ADMIN_COOKIE = "zm_admin";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // Protect /admin/* and /api/admin/* (except /admin/login itself).
  // H-001-05: las rutas API empiezan por /api/admin, no /admin.
  // La RAÍZ exacta /admin queda fuera del guard: es el panel de creadores y
  // resuelve su propio acceso (cookie admin → gestión; sesión Supabase cuyo
  // email está en creator_program → su panel; nada → selector de acceso).
  //
  // El ENDPOINT de login `/api/admin/login` también queda fuera: es quien
  // ENTREGA la cookie de admin, así que no puede exigirla (sería un círculo
  // imposible — el formulario de /admin/login posteaba aquí y el guard lo
  // redirigía a sí mismo). El handler ya es fail-closed: valida ADMIN_PASSWORD
  // con timingSafeEqual y responde 401/503. Lo mismo para logout.
  const isPublicAdminApi =
    url.pathname === "/api/admin/login" || url.pathname === "/api/admin/logout";
  const isAdminRoute =
    url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/admin");
  const isAdminRoot = url.pathname === "/admin" || url.pathname === "/admin/";
  if (
    isAdminRoute &&
    !isAdminRoot &&
    !isPublicAdminApi &&
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

  // updateSupabaseSession reenvía el pathname al layout raíz como cabecera de
  // PETICIÓN ("x-pathname") vía NextResponse.next({ request: { headers } }), para
  // que el layout (headers().get("x-pathname")) NO emita el cargador de AdSense
  // en /app/** (donde vive el iframe de apuestas 1xBet).
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
     *  - api/match-center/{live,comments,presence}: endpoints de datos PÚBLICOS
     *    que el navegador sondea en bucle durante los partidos (snapshot, chat,
     *    presencia). El middleware hace supabase.auth.getUser() en CADA request,
     *    que en estos polls de alta frecuencia es coste puro (auth de Supabase +
     *    invocación edge) sin aportar nada: estas rutas no usan la sesión y
     *    resuelven su propia identidad cuando hace falta (getCurrentUser en el
     *    POST de comentarios). La sesión de un usuario logueado SIGUE viva porque
     *    MicroLive sondea /api/micro/match/[id]/active cada 2-4s (esa ruta NO se
     *    excluye), refrescando la cookie de forma continua en el Match Center.
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|og-image.jpg|api/match-center/(?:live|comments|presence)|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js)$).*)",
  ],
};
