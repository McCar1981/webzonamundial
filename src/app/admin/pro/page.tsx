// /admin/pro — panel interno del funnel Pro.
// Protegido por middleware /admin/* (cookie ADMIN_COOKIE_NAME).
//
// Muestra: choques con cada límite Free (limit_hit) por día y el funnel de
// pago (checkouts iniciados/completados, bajas). Con esto se decide si un
// límite es demasiado agresivo o demasiado generoso (ajustar lib/pro/limits.ts).

import type { Metadata } from "next";
import { readProMetrics } from "@/lib/pro/metrics";
import AdminHeader from "@/components/admin/AdminHeader";

export const metadata: Metadata = {
  title: "Plan Pro · Panel interno",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

const FEATURE_LABEL: Record<string, string> = {
  predictions_type: "Predicciones · tipo Pro",
  predictions_jornada: "Predicciones · 3/jornada",
  fantasy_live: "Fantasy · puntos en vivo",
  fantasy_lock: "Fantasy · plantilla cerrada",
  carrera_seasons: "Carrera · temporadas/día",
  carrera_cloud_save: "Carrera · save nube",
  carrera_rival_report: "Carrera · informe rival",
  ia_coach_daily: "IA Coach · 1/día",
  trivia_daily: "Trivia · 5 preguntas",
  trivia_runs: "Trivia · 1 partida/modo",
  match_center_narration: "Match Center · narración IA",
  match_center_alerts: "Match Center · alertas",
  bars_create: "Bares · crear",
  leagues_create: "Ligas privadas · crear",
  stats_advanced: "Stats avanzadas",
};

function shortDay(d: string): string {
  return d.slice(5); // MM-DD
}

export default async function ProAdminPage() {
  const m = await readProMetrics(14);
  const days = m.days; // más reciente primero

  const sum = (rec: Record<string, number>) => days.reduce((acc, d) => acc + (rec[d] ?? 0), 0);
  const started = sum(m.funnel.checkout_started);
  const completed = sum(m.funnel.checkout_completed);
  const canceled = sum(m.funnel.sub_canceled);
  const totalHits = Object.values(m.limitHits).reduce((acc, rec) => acc + sum(rec), 0);
  const conversion = totalHits > 0 ? ((completed / totalHits) * 100).toFixed(1) : null;

  // Features ordenadas por hits totales (las que más fricción generan arriba).
  const features = Object.entries(m.limitHits)
    .map(([f, rec]) => ({ feature: f, total: sum(rec), rec }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto text-white">
      <AdminHeader
        title="Plan Pro"
        current="/admin/pro"
        description="Funnel de conversión y choques con límites Free de los últimos 14 días. Datos en vivo desde Vercel KV."
      />

      {/* Stats del funnel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Choques con límites", value: totalHits },
          { label: "Checkouts iniciados", value: started },
          { label: "Suscripciones completadas", value: completed },
          { label: "Bajas", value: canceled },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-2xl font-black text-[#C9A84C]">{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
      {conversion && (
        <p className="text-sm text-gray-400 mb-10 -mt-6">
          Conversión choque → suscripción: <strong className="text-white">{conversion}%</strong>
        </p>
      )}

      {/* Tabla de hits por feature y día */}
      <h2 className="text-xl font-bold mb-3">Choques con límites por día</h2>
      <div className="overflow-x-auto rounded-2xl border border-white/10 mb-10">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-white/5 text-gray-400">
              <th className="text-left px-3 py-2 font-semibold">Límite</th>
              <th className="text-right px-3 py-2 font-semibold">Total</th>
              {days.map((d) => (
                <th key={d} className="text-right px-2 py-2 font-mono font-normal">{shortDay(d)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map(({ feature, total, rec }) => (
              <tr key={feature} className="border-t border-white/5">
                <td className="px-3 py-2 text-gray-200">{FEATURE_LABEL[feature] ?? feature}</td>
                <td className="px-3 py-2 text-right font-bold text-[#C9A84C]">{total}</td>
                {days.map((d) => (
                  <td key={d} className="px-2 py-2 text-right font-mono text-gray-400">
                    {rec[d] || "·"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Funnel por día */}
      <h2 className="text-xl font-bold mb-3">Funnel por día</h2>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-white/5 text-gray-400">
              <th className="text-left px-3 py-2 font-semibold">Evento</th>
              {days.map((d) => (
                <th key={d} className="text-right px-2 py-2 font-mono font-normal">{shortDay(d)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(
              [
                ["checkout_started", "Checkout iniciado"],
                ["checkout_completed", "Suscripción completada"],
                ["sub_canceled", "Baja"],
              ] as const
            ).map(([key, label]) => (
              <tr key={key} className="border-t border-white/5">
                <td className="px-3 py-2 text-gray-200">{label}</td>
                {days.map((d) => (
                  <td key={d} className="px-2 py-2 text-right font-mono text-gray-400">
                    {m.funnel[key][d] || "·"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
