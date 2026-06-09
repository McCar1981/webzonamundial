// /admin/founders — panel interno de Founders Pass.
// Protegido por middleware /admin/* (cookie ADMIN_COOKIE_NAME).
//
// Muestra: contador, ingresos acumulados, lista paginada y eventos recientes.

import type { Metadata } from "next";
import {
  getFoundersCount,
  getRevenueCents,
  listFounders,
  listEvents,
} from "@/lib/founders/store";

export const metadata: Metadata = {
  title: "Founders · Panel interno",
  robots: { index: false, follow: false, nocache: true },
};

// Refresca cada 60s para que el panel refleje los pagos recientes.
// Páginas admin deben ser dinámicas (no prerenderizables): leen datos
// en vivo de KV y pueden contener PII. H-000-01
export const dynamic = "force-dynamic";

function censorEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${"*".repeat(Math.min(local.length - 2, 6))}${local[local.length - 1]}@${domain}`;
}

function fmtAmount(cents: number, currency: string): string {
  return `${(cents / 100).toFixed(currency === "eur" ? 2 : 0)} ${currency.toUpperCase()}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function FoundersAdminPage() {
  const [count, revenueCents, founders, events] = await Promise.all([
    getFoundersCount(),
    getRevenueCents(),
    listFounders({ limit: 100 }),
    listEvents(20),
  ]);

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto text-white">
      <h1 className="text-3xl font-black mb-2 tracking-tight">Founders Pass</h1>
      <p className="text-gray-400 text-sm mb-8">
        Estado del Founders Pass del Mundial 2026. Datos en vivo desde Vercel KV.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <Stat label="Founders activos" value={count.toString()} />
        <Stat
          label="Ingresos brutos (mezcla EUR+USD)"
          value={`${(revenueCents / 100).toLocaleString("es-ES")} (céntimos mezclados)`}
        />
        <Stat
          label="Ingreso medio por Founder"
          value={count > 0 ? `${(revenueCents / 100 / count).toFixed(2)}` : "—"}
        />
      </div>

      {/* Lista de founders */}
      <h2 className="text-xl font-bold mb-3">Últimos {founders.length} Founders</h2>
      <div className="overflow-x-auto rounded-xl border border-white/5 mb-10">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5 text-left text-xs uppercase tracking-wider text-gray-400">
              <th className="px-3 py-2.5">Email (censurado)</th>
              <th className="px-3 py-2.5">Importe</th>
              <th className="px-3 py-2.5">Fecha</th>
              <th className="px-3 py-2.5">Estado</th>
              <th className="px-3 py-2.5">Recibo</th>
            </tr>
          </thead>
          <tbody>
            {founders.map((f) => (
              <tr key={f.checkoutSessionId || f.email} className="border-t border-white/5">
                <td className="px-3 py-2.5 font-mono text-xs">{censorEmail(f.email)}</td>
                <td className="px-3 py-2.5 font-medium">{fmtAmount(f.amount, f.currency)}</td>
                <td className="px-3 py-2.5 text-gray-400">{fmtDate(f.purchasedAt)}</td>
                <td className="px-3 py-2.5">
                  {f.refundedAt ? (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-red-900/40 text-red-300">
                      reembolsado
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-900/40 text-emerald-300">
                      activo
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  {f.receiptUrl ? (
                    <a href={f.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-[#C9A84C] hover:underline text-xs">
                      Ver
                    </a>
                  ) : (
                    <span className="text-gray-500 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
            {founders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                  Aún no hay Founders. Cuando alguien compre, aparecerá aquí.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Eventos recientes */}
      <h2 className="text-xl font-bold mb-3">Eventos recientes</h2>
      <ul className="space-y-2 text-sm">
        {events.map((e, i) => (
          <li key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/3 border border-white/5">
            <span
              className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider"
              style={{
                background: e.type === "purchase" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
                color: e.type === "purchase" ? "#6ee7b7" : "#fca5a5",
              }}
            >
              {e.type}
            </span>
            <span className="font-mono text-xs">{censorEmail(e.email)}</span>
            <span className="text-gray-400 text-xs">{fmtAmount(e.amount, e.currency)}</span>
            <span className="text-gray-500 text-xs ml-auto">{fmtDate(e.ts)}</span>
          </li>
        ))}
        {events.length === 0 && <li className="text-gray-500">Aún no hay eventos.</li>}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 p-4 bg-white/3">
      <div className="text-[10px] tracking-widest uppercase font-mono text-gray-400 mb-1">
        {label}
      </div>
      <div className="text-2xl font-black tracking-tight bg-gradient-to-br from-[#C9A84C] to-[#FDE68A] bg-clip-text text-transparent">
        {value}
      </div>
    </div>
  );
}
