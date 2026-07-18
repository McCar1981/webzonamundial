// /admin/panel — índice del panel interno (hub). Es el "home" al que vuelve la
// miga de pan de cada sección. Protegido por el middleware (cookie zm_admin),
// igual que el resto de /admin/* salvo la raíz exacta /admin.

import type { Metadata } from "next";
import Link from "next/link";
import { ADMIN_SECTIONS } from "@/components/admin/sections";
import LogoutButton from "@/components/admin/LogoutButton";

export const metadata: Metadata = {
  title: "Panel interno · ZonaMundial",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminPanelPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <div className="px-6 py-10 max-w-5xl mx-auto">
        <header className="mb-8">
          <div className="text-3xl font-black tracking-tight">
            Panel <span className="text-[#C9A84C]">interno</span>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            Centro de control de ZonaMundial. Elige una sección.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ADMIN_SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:border-[#C9A84C]/50 hover:bg-white/[0.07]"
            >
              <div className="text-3xl mb-3">{s.emoji}</div>
              <div className="text-lg font-bold group-hover:text-[#C9A84C] transition-colors">
                {s.label}
              </div>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{s.desc}</p>
            </Link>
          ))}
        </div>

        <footer className="mt-10 flex items-center gap-4 text-sm">
          <Link href="/app" className="text-gray-400 hover:text-white underline">
            ← Volver a la app
          </Link>
          <LogoutButton />
        </footer>
      </div>
    </div>
  );
}
