// /admin/module-interest — panel interno de interés por módulo.
// Protegido por middleware /admin/* (cookie zm_admin).
//
// Muestra para cada módulo: emails interesados, ranking, total de usuarios
// únicos. Permite priorizar el desarrollo según demanda real.

import type { Metadata } from "next";
import {
  MODULE_SLUGS,
  getAllModuleCounts,
  getTotalUsers,
  type ModuleSlug,
} from "@/lib/module-interest/store";
import { MODULE_CONTENT } from "@/data/app-modules-content";
import AdminHeader from "@/components/admin/AdminHeader";

export const metadata: Metadata = {
  title: "Interés por módulo · Panel interno",
  robots: { index: false, follow: false, nocache: true },
};

// Páginas admin deben ser dinámicas (no prerenderizables): leen datos
// en vivo de KV. H-000-01
export const dynamic = "force-dynamic";

export default async function ModuleInterestAdminPage() {
  const [counts, totalUsers] = await Promise.all([
    getAllModuleCounts(),
    getTotalUsers(),
  ]);

  // Ordenar de más a menos popular
  const ranked = [...MODULE_SLUGS].sort((a, b) => counts[b] - counts[a]);
  const maxCount = Math.max(...Object.values(counts), 1);
  const totalSubscriptions = Object.values(counts).reduce((s, n) => s + n, 0);

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto text-white">
      <AdminHeader
        title="Interés por módulo"
        current="/admin/module-interest"
        description="Cuántas personas han pedido aviso para cada módulo de la app. Los datos se actualizan en tiempo real (refresh cada 60s)."
      />

      {/* Stats globales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <Stat label="Usuarios únicos en lista" value={totalUsers.toString()} />
        <Stat
          label="Suscripciones totales"
          value={totalSubscriptions.toString()}
          sub={`Media ${
            totalUsers > 0 ? (totalSubscriptions / totalUsers).toFixed(1) : "0"
          } módulos por usuario`}
        />
        <Stat
          label="Módulo más demandado"
          value={ranked[0] ? counts[ranked[0]].toString() : "0"}
          sub={ranked[0] ? MODULE_CONTENT[ranked[0]]?.label || ranked[0] : "—"}
        />
      </div>

      {/* Ranking de módulos con bar chart */}
      <h2 className="text-xl font-bold mb-3">Ranking de demanda</h2>
      <ul className="space-y-2 mb-10">
        {ranked.map((slug, i) => {
          const count = counts[slug];
          const pct = Math.round((count / maxCount) * 100);
          const label = MODULE_CONTENT[slug]?.label || slug;
          return (
            <li
              key={slug}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/5"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <span
                className="font-mono text-xs text-gray-400"
                style={{ minWidth: 24 }}
              >
                #{i + 1}
              </span>
              <span className="font-bold text-white" style={{ minWidth: 160 }}>
                {label}
              </span>
              <div
                className="flex-1 h-2 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #C9A84C, #FDE68A)",
                    borderRadius: 99,
                    transition: "width 600ms",
                  }}
                />
              </div>
              <span
                className="font-mono text-sm"
                style={{ minWidth: 60, textAlign: "right", color: "#FDE68A" }}
              >
                {count.toLocaleString("es-ES")}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Acciones rápidas */}
      <div
        className="rounded-xl border border-white/5 p-5"
        style={{ background: "rgba(201,168,76,0.06)" }}
      >
        <h3 className="font-bold mb-2">📨 ¿Listo para lanzar un módulo?</h3>
        <p className="text-sm text-gray-300 mb-3">
          Cuando actives un módulo en la app, ve a{" "}
          <a href="/admin/newsletter" className="text-[#FDE68A] underline">
            /admin/newsletter
          </a>{" "}
          y envía un email a la lista de interesados de ese módulo. Tienes la
          lista exacta de emails que esperan cada uno.
        </p>
        <p className="text-xs text-gray-500">
          (Próxima iteración: filtro de newsletter por slug de módulo. Por ahora
          puedes exportar la lista vía API o KV directamente.)
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/5 p-4 bg-white/3">
      <div className="text-[10px] tracking-widest uppercase font-mono text-gray-400 mb-1">
        {label}
      </div>
      <div className="text-2xl font-black tracking-tight bg-gradient-to-br from-[#C9A84C] to-[#FDE68A] bg-clip-text text-transparent">
        {value}
      </div>
      {sub && <div className="text-xs text-gray-400 mt-2">{sub}</div>}
    </div>
  );
}
