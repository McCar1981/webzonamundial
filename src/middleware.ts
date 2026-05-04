import { NextResponse, type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";
import { isValidAdminCookie } from "@/lib/admin-auth";

const ADMIN_COOKIE = "zm_admin";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // Protect /admin/* (except /admin/login itself).
  if (
    url.pathname.startsWith("/admin") &&
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

  return await updateSupabaseSession(request);
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
