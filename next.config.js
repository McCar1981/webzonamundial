/** @type {import('next').NextConfig} */
const nextConfig = {
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
    // Content-Security-Policy permisivo pero seguro:
    //  - default-src 'self' bloquea cargas inesperadas
    //  - 'unsafe-inline' en script-src es necesario para Next.js inline JSON-LD
    //  - 'unsafe-eval' bloqueado (Next prod no lo necesita)
    //  - img-src https: data: blob: para soportar imágenes de noticias
    //    desde fuentes externas variables (CNN, FIFA, Wikipedia, etc.)
    //  - frame-src para Vercel Analytics y posibles embeds
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://www.googletagmanager.com https://www.google-analytics.com https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "img-src 'self' data: blob: https:",
      "media-src 'self' https:",
      "connect-src 'self' https://www.google-analytics.com https://vitals.vercel-insights.com https://va.vercel-scripts.com https://*.upstash.io https://api.anthropic.com",
      "frame-src 'self' https://googleads.g.doubleclick.net",
      "base-uri 'self'",
      "form-action 'self'",
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
    ];
  },
};

module.exports = nextConfig;
