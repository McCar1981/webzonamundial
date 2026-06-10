// Cabecera común del panel interno: breadcrumb de retorno + acceso rápido a
// todas las secciones + título/descripción. Se monta al principio de cada
// página /admin/* para que SIEMPRE haya forma de volver y de saltar a otra
// sección (antes cada página estaba aislada y no se podía regresar).

import Link from "next/link";
import { ADMIN_HOME, ADMIN_SECTIONS } from "./sections";

export default function AdminHeader({
  title,
  description,
  current,
}: {
  title: string;
  description?: string;
  /** href de la sección actual (para resaltarla en la nav). */
  current?: string;
}) {
  return (
    <div className="mb-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-4" aria-label="Miga de pan">
        <Link href={ADMIN_HOME} className="text-gray-400 hover:text-[#C9A84C] transition-colors">
          ← Panel interno
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-gray-200 font-medium">{title}</span>
      </nav>

      {/* Acceso rápido a todas las secciones */}
      <div className="flex gap-2 flex-wrap mb-6">
        {ADMIN_SECTIONS.map((s) => {
          const active = s.href === current;
          return (
            <Link
              key={s.href}
              href={s.href}
              className={
                active
                  ? "rounded-lg border border-[#C9A84C]/50 bg-[#C9A84C]/15 px-3 py-1.5 text-xs font-bold text-[#C9A84C]"
                  : "rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300 hover:border-[#C9A84C]/40 transition-all"
              }
            >
              <span className="mr-1">{s.emoji}</span>
              {s.label}
            </Link>
          );
        })}
      </div>

      <h1 className="text-3xl font-black tracking-tight">{title}</h1>
      {description && <p className="text-gray-400 text-sm mt-2">{description}</p>}
    </div>
  );
}
