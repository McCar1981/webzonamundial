// /cuenta/founders-pass — panel del Founders Pass del usuario.
// Server component: lee Supabase auth + estado founder en KV.
// Si tiene pass: muestra detalles + acción de reembolso.
// Si no: invita a comprar.

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getFounderRecord,
  getFounderRecordByUserId,
  getFoundersCount,
  isFounder,
  isFounderByUserId,
} from "@/lib/founders/store";
import FoundersActions from "./FoundersActions";
import PurchaseSuccessBanner from "./PurchaseSuccessBanner";

export const metadata: Metadata = {
  title: "Founders Pass | Mi cuenta · ZonaMundial",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatAmount(cents: number, currency: string): string {
  const amount = (cents / 100).toLocaleString("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${amount} ${currency.toUpperCase()}`;
}

export default async function FoundersPassPage() {
  await requireUser("/cuenta/founders-pass");
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? "";
  const userId = user?.id ?? "";
  // Lookup robusto: primero por email, luego por user_id (sobrevive cambio de email).
  const founderByEmail = email ? await isFounder(email) : false;
  const founderByUserId = !founderByEmail && userId ? await isFounderByUserId(userId) : false;
  const founder = founderByEmail || founderByUserId;
  const record = founder
    ? (founderByEmail ? await getFounderRecord(email) : userId ? await getFounderRecordByUserId(userId) : null)
    : null;
  const totalFounders = founder ? await getFoundersCount() : 0;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">Founders Pass</h2>
        <p className="text-gray-400 text-sm">
          Apoya el proyecto y desbloquea ventajas durante todo el Mundial 2026.
        </p>
      </div>

      <Suspense fallback={null}>
        <PurchaseSuccessBanner />
      </Suspense>

      {founder && record ? (
        <ActiveFounderCard
          email={email}
          record={record}
          totalFounders={totalFounders}
          formatDate={formatDate}
          formatAmount={formatAmount}
        />
      ) : (
        <BuyCard />
      )}
    </div>
  );
}

function ActiveFounderCard({
  email,
  record,
  totalFounders,
  formatDate,
  formatAmount,
}: {
  email: string;
  record: import("@/lib/founders/store").FounderRecord;
  totalFounders: number;
  formatDate: (iso: string) => string;
  formatAmount: (cents: number, currency: string) => string;
}) {
  // El nombre que mostramos en la insignia: parte local del email (antes de @).
  const displayName = email.split("@")[0];
  return (
    <div
      className="rounded-2xl border p-6 sm:p-8"
      style={{
        borderColor: "rgba(201,168,76,0.45)",
        background:
          "radial-gradient(ellipse 60% 80% at 100% 0%, rgba(201,168,76,0.10), transparent 70%), linear-gradient(180deg, rgba(15,31,48,0.7), rgba(11,24,37,0.4))",
      }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <h3 className="text-xl font-extrabold text-white">🏆 Founders Pass activo</h3>
        <span
          className="inline-flex items-center gap-2 px-4 py-1 rounded-full text-xs font-bold tracking-wider"
          style={{
            background: "linear-gradient(135deg, #C9A84C, #FDE68A)",
            color: "#1A1208",
            boxShadow: "0 0 30px -10px rgba(253, 230, 138, 0.6)",
          }}
        >
          FOUNDER
        </span>
      </div>

      <p className="text-sm text-gray-400 mb-4">
        Tu Founders Pass está activo. Tienes acceso a todas las ventajas durante todo el Mundial 2026.
      </p>

      <div className="space-y-1 text-sm">
        <Row label="Email" value={email} />
        <Row label="Importe" value={formatAmount(record.amount, record.currency)} />
        <Row label="Fecha de compra" value={formatDate(record.purchasedAt)} />
        {record.receiptUrl && (
          <Row
            label="Recibo"
            value={
              <a
                href={record.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C9A84C] hover:underline"
              >
                Descargar PDF
              </a>
            }
          />
        )}
        <Row
          label="ID transacción"
          value={
            <span className="font-mono text-[11px] text-gray-300">
              {record.checkoutSessionId?.slice(-12) || "—"}
            </span>
          }
        />
      </div>

      <FoundersActions hasFounderPass={true} founderNumber={totalFounders} founderName={displayName} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-white/5">
      <span className="text-[11px] tracking-widest uppercase font-mono text-gray-400">
        {label}
      </span>
      <span className="font-medium text-white text-right break-all max-w-[60%]">{value}</span>
    </div>
  );
}

function BuyCard() {
  return (
    <div
      className="rounded-2xl border p-6 sm:p-8"
      style={{
        borderColor: "rgba(201,168,76,0.25)",
        background: "linear-gradient(180deg, rgba(15,31,48,0.7), rgba(11,24,37,0.4))",
      }}
    >
      <h3 className="text-xl font-extrabold text-white mb-2">
        Conviértete en Founder
      </h3>
      <p className="text-sm text-gray-400 mb-5">
        Apoya el proyecto y desbloquea ventajas durante todo el Mundial 2026.
      </p>

      <ul className="space-y-2 text-sm text-gray-200 mb-6">
        <li>✅ <b>Navegación sin publicidad</b> en toda la plataforma</li>
        <li>📊 <b>Estadísticas avanzadas</b> (xG, mapas de calor, comparativas)</li>
        <li>🚀 <b>Beta access</b> a nuevas funcionalidades</li>
        <li>💎 <b>Sticker pack exclusivo</b> para WhatsApp e Instagram</li>
        <li>🏅 <b>Insignia &quot;Founders&quot;</b> permanente en tu perfil</li>
      </ul>

      <Link
        href="/cuenta/comprar"
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-3 rounded-full font-bold text-[#1A1208] transition-transform hover:-translate-y-0.5"
        style={{
          background: "linear-gradient(135deg, #C9A84C, #E8C76B 50%, #FDE68A)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.15) inset, 0 0 30px -8px rgba(201,168,76,0.55)",
        }}
      >
        Conseguir mi Founders Pass
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M5 12h14" />
          <path d="M13 6l6 6-6 6" />
        </svg>
      </Link>
    </div>
  );
}
