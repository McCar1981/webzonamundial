"use client";

// src/components/AppBottomNav.tsx
// Barra inferior fija tipo app nativa. Acompaña al usuario por toda la
// experiencia de la webapp para que navegue entre módulos como en una app
// instalada. Aparece en /app/*, en las páginas-módulo que viven fuera de /app
// (trivia, calendario, grupos, etc.) y en cualquier página cuando ya hay
// sesión iniciada. En el sitio editorial para visitantes anónimos
// (/, /noticias, blog...) NO aparece: allí manda la navegación de sitio web
// (header + footer).
//
// Estilo: indicador dorado superior en tab activo (barra fina), icono+label
// dorados cuando está activo, gris azulado en reposo. Fondo navy oscuro.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const GOLD = "#c9a84c";
// Contraste WCAG AA sobre #060B14: los grises anteriores (#5a6a8a / #6a7a9a)
// daban ~3.2:1 y fallaban AA para texto pequeño; estos llegan a ≥4.5:1.
const DIM = "#8294b0";
const BG = "#060B14";

const ACTIVE_BAR = "#c9a84c";
const INACTIVE_TEXT = "#8294b0";

function stroke(d: string, fill?: string) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d={d} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Item = { href: string; label: string; match: (p: string) => boolean; icon: React.ReactNode };

const ITEMS: Item[] = [
  {
    href: "/app",
    label: "Inicio",
    match: (p) => p === "/app",
    icon: stroke("M3 11.5L12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9"),
  },
  {
    href: "/app/predicciones/jugar",
    label: "Predice",
    match: (p) => p.startsWith("/app/predicciones") || p.startsWith("/app/micro"),
    icon: stroke("M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1M14.5 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"),
  },
  {
    href: "/app/matchcenter",
    label: "En vivo",
    match: (p) => p.startsWith("/app/matchcenter") || p.startsWith("/app/streaming"),
    icon: stroke("M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 3v3l3 2M12 3l-3 4M9 7l-4 3.5M12 21v-3l-3-2M12 21l3-4M15 17l4-3.5"),
  },
  {
    href: "/trivia",
    label: "Trivia",
    match: (p) => p.startsWith("/app/trivia") || p === "/trivia" || p.startsWith("/trivia/"),
    icon: stroke("M12 3l8 4v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V7l8-4ZM12 8v.5M12 11v3"),
  },
  {
    href: "/cuenta",
    label: "Perfil",
    match: (p) => p.startsWith("/cuenta"),
    icon: stroke("M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0"),
  },
];

// Páginas-módulo que viven FUERA de /app pero forman parte de la webapp:
// son destino directo de las cards del hub y de la propia barra inferior.
// Aquí la barra debe seguir presente para no romper la sensación de app.
const WEBAPP_ROUTES = ["/trivia", "/calendario", "/grupos", "/formato", "/historia"];

export default function AppBottomNav() {
  const pathname = usePathname() || "";

  // ¿Hay sesión? Si el usuario ya entró a la app, la barra lo acompaña por
  // cualquier página (es una webapp). Patrón robusto: getUser() inicial +
  // onAuthStateChange para no quedarnos desfasados si el token se refresca.
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    let on = true;
    const sb = (() => {
      try { return createSupabaseBrowserClient(); } catch { return null; }
    })();
    if (!sb) return;
    sb.auth.getUser()
      .then(({ data }) => { if (on) setAuthed(!!data.user); })
      .catch(() => {});
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      if (on) setAuthed(!!session?.user);
    });
    return () => { on = false; sub.subscription.unsubscribe(); };
  }, []);

  // Mostramos la barra en toda la superficie de la webapp: dentro de /app
  // (incluidos los juegos a pantalla completa), en las páginas-módulo de fuera
  // de /app, y en cualquier página si hay sesión. Solo se oculta en el sitio
  // editorial para visitantes anónimos. Los juegos que tienen su propio pie de
  // acción fijo (predicciones) lo recolocan por encima de la barra vía CSS.
  const inApp = pathname.startsWith("/app");
  const inWebappRoute = WEBAPP_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/"),
  );
  if (!inApp && !inWebappRoute && !authed) return null;

  return (
    <nav
      className="app-bottom-nav"
      aria-label="Navegación de la app"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 950,
        display: "none",
        background: "rgba(6,11,20,0.92)",
        backdropFilter: "blur(18px) saturate(160%)",
        WebkitBackdropFilter: "blur(18px) saturate(160%)",
        borderTop: "1px solid rgba(201,168,76,0.12)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div style={{ display: "flex", maxWidth: 560, margin: "0 auto" }}>
        {ITEMS.map((it) => {
          const active = it.match(pathname);
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={active ? "page" : undefined}
              className="app-bottom-nav-tab"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                minHeight: 48,
                padding: "10px 0 9px",
                textDecoration: "none",
                color: active ? GOLD : DIM,
                position: "relative",
                transition: "color .2s, transform .12s ease, opacity .12s ease",
              }}
            >
              {/* Indicador dorado superior — barra fina del tab activo */}
              <span
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: active ? 32 : 0,
                  height: 2.5,
                  borderRadius: "0 0 2px 2px",
                  background: ACTIVE_BAR,
                  opacity: active ? 1 : 0,
                  transition: "width .25s ease, opacity .2s ease",
                }}
              />
              {it.icon}
              <span style={{ fontSize: 11.5, fontWeight: active ? 800 : 600, letterSpacing: 0.2 }}>
                {it.label}
              </span>
            </Link>
          );
        })}
      </div>
      <style>{`
        /* Estado de pulsación del tab: solo transform/opacity, sin reflujo. */
        .app-bottom-nav-tab:active{ transform: scale(0.96); opacity: 0.85; }
        @media (prefers-reduced-motion: reduce){
          .app-bottom-nav-tab:active{ transform: none; }
        }
        @media(max-width:768px){
          .app-bottom-nav{ display:block !important; }
          /* El juego de predicciones tiene su propio pie de acción fijo en
             bottom:0; lo subimos por encima de la barra para que no quede
             tapado, y damos holgura extra al contenido para que el último
             bloque no se esconda detrás de ambos. */
          .pj-sticky-footer{
            bottom: calc(54px + env(safe-area-inset-bottom)) !important;
            padding-bottom: 10px !important;
          }
          .pj-detail{ padding-bottom: calc(150px + env(safe-area-inset-bottom)) !important; }
        }
      `}</style>
    </nav>
  );
}
