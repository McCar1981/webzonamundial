"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
    href: "/cuenta/seguridad",
    label: "Seguridad",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

export default function CuentaSidebar() {
  const pathname = usePathname();

  return (
    <aside>
      <nav
        className="rounded-2xl border border-[#1E293B]/50 p-2 sticky top-20"
        style={{
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.6), rgba(11,24,37,0.4))",
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
                color: active ? "#C9A84C" : "#cbd5e1",
                border: active ? "1px solid rgba(201,168,76,0.25)" : "1px solid transparent",
                textDecoration: "none",
              }}
            >
              <span style={{ opacity: active ? 1 : 0.7 }}>{t.icon}</span>
              {t.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
