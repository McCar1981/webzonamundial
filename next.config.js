/** @type {import('next').NextConfig} */
const nextConfig = {
  // Excluir del file-tracing de las FUNCIONES serverless los directorios de
  // /public que NINGUNA función lee por fs en runtime (se sirven por CDN igual).
  // Sin esto, el `existsSync` de src/lib/match-center/heroImage.ts sobre una ruta
  // DINÁMICA de /public hacía que el tracer de Next empaquetara casi todo /public
  // (~247 MB) en cada función, rozando el límite de 250 MB ("function_size_exceeded")
  // y rompiendo el deploy al añadir cualquier imagen. Se mantiene public/img/heroes
  // (lo único que heroImage necesita en runtime). Verificado: el resto de /public
  // solo se referencia por URL, nunca por fs (auditoría 2026-06-17).
  experimental: {
    outputFileTracingExcludes: {
      "*": [
        "public/cromos/**",
        "public/img/kits/**",
        "public/img/modo-carrera/**",
        "public/img/zonamundial-images/**",
        "public/img/imagenessilviu/**",
        "public/img/blog/**",
        "public/images/**",
        "public/sobres/**",
        "public/assets/**",
      ],
    },
  },

  // Ignorar errores de TypeScript y ESLint durante el build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Permitir imágenes externas (banderas, estadios, etc.)
  // Nota: imágenes de Pexels migradas a /public/img/heroes/ en PR de performance (2026-04-23)
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "flagcdn.com" },
      { protocol: "https", hostname: "zonamundial.app" },
      { protocol: "https", hostname: "www.zonamundial.app" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "images.unsplash.com" },
      // Sanity CDN
      { protocol: "https", hostname: "cdn.sanity.io" },
    ],
  },

  // Redirecciones SEO
  async redirects() {
    return [
      // Redirigir rutas antiguas si las hay
    ];
  },

  // Rewrites — alias para que Apple/Google reconozcan extensión .ics
  async rewrites() {
    return [
      {
        // /api/calendar.ics → /api/calendar (preserva query string)
        source: "/api/calendar.ics",
        destination: "/api/calendar",
      },
      {
        // /calendario.ics → /api/calendar (URL más bonita para compartir)
        source: "/calendario.ics",
        destination: "/api/calendar",
      },
    ];
  },

  // Headers de seguridad
  async headers() {
    // Content-Security-Policy:
    //  - default-src 'self' bloquea cargas inesperadas.
    //  - 'unsafe-inline' se mantiene por compatibilidad con Next.js/JSON-LD.
    //  - 'unsafe-eval' se mantiene porque ya estaba en el archivo original.
    //  - img-src https: data: blob: soporta imágenes externas variables.
    //  - connect-src incluye Supabase, Apple, Google, Analytics, Vercel, Upstash y Anthropic.
    //  - frame-src permite Google Ads/DoubleClick y proveedores OAuth.
    //  - Adsterra RETIRADO de producción (2026-06-10): se eliminaron los
    //    comodines https://*.com / https://*.net y los dominios muertos de su
    //    invoke.js (effectivecpmnetwork.com, fizzyacerbitymellow.com,
    //    protrafficinspector.com, cdn.cloudvideosa.com) de script/connect/frame.
    //    Ahora sólo quedan orígenes EXPLÍCITOS legítimos.
    // AdSense/CMP en EXPLÍCITO (pagead2/tpc/googlesyndication, doubleclick,
    // adtrafficquality, fundingchoices y gtm con subdominio www). OJO:
    // "googlesyndication.com" pelado NO cubre pagead2.googlesyndication.com,
    // por eso se listan los subdominios uno a uno.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://googlesyndication.com https://pagead2.googlesyndication.com https://tpc.googlesyndication.com https://fundingchoicesmessages.google.com https://ep2.adtrafficquality.google https://googletagmanager.com https://www.googletagmanager.com https://google-analytics.com https://vercel-scripts.com https://google.com https://cdn-apple.com",
      "style-src 'self' 'unsafe-inline' https://cdn-apple.com",
      "font-src 'self' data: https://cdn-apple.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self' https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://appleid.apple.com https://accounts.google.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://ep1.adtrafficquality.google https://vitals.vercel-insights.com https://va.vercel-scripts.com https://*.upstash.io https://api.anthropic.com",
      "frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://fundingchoicesmessages.google.com https://ep2.adtrafficquality.google https://appleid.apple.com https://accounts.google.com",
      "base-uri 'self'",
      "form-action 'self' https://appleid.apple.com https://accounts.google.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          // Forzar HTTPS por 2 años con preload
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Reducir superficie de APIs del navegador
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), payment=(), usb=()",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          // Cross-Origin policies para mitigar Spectre + leaks entre orígenes
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-site" },
          // Content Security Policy
          { key: "Content-Security-Policy", value: csp },
        ],
      },

      // Cache agresivo en assets estáticos
      {
        source: "/img/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },

      // robots.txt y sitemap servidos sin cache largo (para que Google vea cambios)
      {
        source: "/robots.txt",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600" }],
      },
      {
        source: "/sitemap.xml",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600" }],
      },
      {
        source: "/news-sitemap.xml",
        headers: [
          // News sitemap should be very fresh (Google News checks frequently)
          { key: "Cache-Control", value: "public, max-age=300, s-maxage=300" },
        ],
      },

      // /embed/* — permitir embedido en dominios externos.
      // Nota: esta ruta define su propio CSP frame-ancestors.
      {
        source: "/embed/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *",
          },
          // Cache 5 min para que un blog que embebe vea cambios pronto.
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=600",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
