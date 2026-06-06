// /admin/bars — panel interno de Porras Digitales para Bares.
// Protegido por middleware /admin/* (cookie ADMIN_COOKIE_NAME).
//
// Muestra: nº de bares, publicados, de pago, participantes totales y la lista
// de bares con su plan, estado, participantes y pago.

import type { Metadata } from "next";
import Link from "next/link";
import { listAllBars } from "@/lib/bars/store";
import { getPlan } from "@/lib/bars/plans";

export const metadata: Metadata = {
  title: "Bares · Panel interno",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

function fmtAmount(cents: number | null, currency: string | null): string {
  if (cents == null || !currency) return "—";
  return `${(cents / 100).toFixed(currency === "eur" ? 2 : 0)} ${currency.toUpperCase()}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

export default async function BarsAdminPage() {
  const bars = await listAllBars(300);
  const published = bars.filter((b) => b.status === "published").length;
  const paid = bars.filter((b) => b.paid).length;
  const totalParticipants = bars.reduce((acc, b) => acc + b.participants, 0);

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto text-white">
      <h1 className="text-3xl font-black mb-2 tracking-tight">Porras de Bares</h1>
      <p className="text-gray-400 text-sm mb-8">
        Estado de las porras digitales para bares del Mundial 2026.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <Stat label="Bares totales" value={bars.length.toString()} />
        <Stat label="Publicados" value={published.toString()} />
        <Stat label="Con plan de pago" value={paid.toString()} />
        <Stat label="Participantes totales" value={totalParticipants.toLocaleString("es-ES")} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/5 mb-10">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5 text-left text-xs uppercase tracking-wider text-gray-400">
              <th className="px-3 py-2.5">Bar</th>
              <th className="px-3 py-2.5">Plan</th>
              <th className="px-3 py-2.5">Estado</th>
              <th className="px-3 py-2.5">Pago</th>
              <th className="px-3 py-2.5">Importe</th>
              <th className="px-3 py-2.5">Participantes</th>
              <th className="px-3 py-2.5">Creado</th>
              <th className="px-3 py-2.5">Página</th>
            </tr>
          </thead>
          <tbody>
            {bars.map((b) => (
              <tr key={b.id} className="border-t border-white/5">
                <td className="px-3 py-2.5">
                  <div className="font-medium">{b.name}</div>
                  {b.city && <div className="text-gray-500 text-xs">{b.city}</div>}
                </td>
                <td className="px-3 py-2.5 text-gray-300">{getPlan(b.plan_id).name}</td>
                <td className="px-3 py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${b.status === "published" ? "bg-emerald-900/40 text-emerald-300" : "bg-white/10 text-gray-400"}`}>
                    {b.status}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  {b.paid ? (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-900/40 text-emerald-300">pagado</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-gray-400">gratis</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-gray-400">{fmtAmount(b.payment_amount, b.payment_currency)}</td>
                <td className="px-3 py-2.5 font-medium">{b.participants}</td>
                <td className="px-3 py-2.5 text-gray-400">{fmtDate(b.created_at)}</td>
                <td className="px-3 py-2.5">
                  <Link href={`/b/${b.slug}`} target="_blank" className="text-[#C9A84C] hover:underline text-xs">Ver</Link>
                </td>
              </tr>
            ))}
            {bars.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-gray-500">
                  Aún no hay bares registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 p-4 bg-white/3">
      <div className="text-[10px] tracking-widest uppercase font-mono text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-black tracking-tight bg-gradient-to-br from-[#C9A84C] to-[#FDE68A] bg-clip-text text-transparent">
        {value}
      </div>
    </div>
  );
}
