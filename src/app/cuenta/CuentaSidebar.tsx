"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const TABS = [
  {
    href: "/cuenta",
    label: "Perfil",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    href: "/cuenta/avatar",
    label: "Avatar",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    href: "/cuenta/preferencias",
    label: "Preferencias",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: "/cuenta/notificaciones",
    label: "Notificaciones",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    href: "/cuenta/seguridad",
    label: "Seguridad",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    href: "/cuenta/pro",
    label: "Plan Pro",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.4 4.86L19.8 7.6l-3.9 3.8.92 5.37L12 14.24l-4.82 2.53.92-5.37-3.9-3.8 5.4-.74L12 2z" />
      </svg>
    ),
  },
  {
    href: "/cuenta/founders-pass",
    label: "Founders Pass",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
        <path d="M5 4H3v3a3 3 0 0 0 3 3M19 4h2v3a3 3 0 0 1-3 3" />
      </svg>
    ),
  },
];

export default function CuentaSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  // Cierre de sesión: POST a /auth/signout (limpia cookies en servidor) y
  // vuelta a la portada. Vive abajo del menú de la cuenta, que es donde el
  // usuario lo busca de forma natural.
  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch("/auth/signout", { method: "POST" });
    } catch {
      /* aunque falle la red, intentamos llevar al usuario fuera */
    }
    router.push("/");
    router.refresh();
  }

  return (
    <aside>
      <nav
        className="rounded-2xl border border-[#241e12]/50 p-2 sticky top-20"
        style={{
          background:
            "linear-gradient(135deg, rgba(20,17,10,0.6), rgba(10,9,6,0.4))",
          backdropFilter: "blur(12px)",
        }}
      >
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: active
                  ? "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))"
                  : "transparent",
                color: active ? "#C9A84C" : "#e6decb",
                border: active ? "1px solid rgba(201,168,76,0.25)" : "1px solid transparent",
                textDecoration: "none",
              }}
            >
              <span style={{ opacity: active ? 1 : 0.7 }}>{t.icon}</span>
              {t.label}
            </Link>
          );
        })}

        {/* Separador + cierre de sesión, al fondo del menú */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 12px" }} />
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all w-full text-left"
          style={{
            background: "transparent",
            border: "1px solid transparent",
            color: "#ef4444",
            cursor: signingOut ? "wait" : "pointer",
            fontFamily: "inherit",
          }}
        >
          <span style={{ opacity: 0.85 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </span>
          {signingOut ? "Cerrando sesión…" : "Cerrar sesión"}
        </button>
      </nav>
    </aside>
  );
}
