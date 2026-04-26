import { type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
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
