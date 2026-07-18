// /cuenta/pro — panel de la suscripción Pro del usuario.
// Server component: lee Supabase auth + pro_subscriptions + founder en KV.
// Suscriptor: estado, renovación y botón al Billing Portal de Stripe.
// Founder: aviso de que su pass ya incluye Pro. Resto: invita a /pro.

import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getEntitlements } from "@/lib/pro/entitlement";
import { getSubscription, subscriptionIsActive, type ProSubscriptionRow } from "@/lib/pro/subscriptions";
import ProPortalButton from "./ProPortalButton";

export const metadata: Metadata = {
  title: "Plan Pro | Mi cuenta · ZonaMundial",
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

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  active: { label: "Activa", color: "#22c55e" },
  trialing: { label: "Periodo de prueba", color: "#22c55e" },
  past_due: { label: "Pago pendiente", color: "#f59e0b" },
  canceled: { label: "Cancelada", color: "#ef4444" },
};

export default async function CuentaProPage() {
  await requireUser("/cuenta/pro");
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? "";
  const userId = user?.id ?? "";

  const ent = await getEntitlements(userId, email);
  const sub = userId ? await getSubscription(userId) : null;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">Plan Pro</h2>
        <p className="text-gray-400 text-sm">
          Tu suscripción Pro: predicciones sin límites, IA ilimitada y cero anuncios.
        </p>
      </div>

      {sub ? (
        <SubscriptionCard sub={sub} />
      ) : ent.isFounder ? (
        <FounderCard />
      ) : ent.isPro ? (
        <CompCard />
      ) : (
        <BuyCard />
      )}
    </div>
  );
}

function SubscriptionCard({ sub }: { sub: ProSubscriptionRow }) {
  const status = STATUS_LABEL[sub.status] ?? STATUS_LABEL.canceled;
  const activa = subscriptionIsActive(sub);

  return (
    <div className="rounded-2xl border border-[#C9A84C]/30 bg-[#14110a] p-6">
      <div className="flex items-center gap-2 mb-4">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ background: status.color }}
        />
        <span className="text-sm font-bold" style={{ color: status.color }}>
          {status.label}
        </span>
        {sub.cancel_at_period_end && activa && (
          <span className="text-xs text-gray-400">· no se renovará</span>
        )}
      </div>

      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-gray-400">Plan</dt>
          <dd className="text-white font-semibold">
            {sub.plan === "yearly" ? "Anual" : "Mensual"}
            {sub.amount != null && sub.currency ? ` · ${formatAmount(sub.amount, sub.currency)}` : ""}
          </dd>
        </div>
        {sub.current_period_end && (
          <div className="flex justify-between gap-4">
            <dt className="text-gray-400">
              {sub.cancel_at_period_end || !activa ? "Acceso hasta" : "Próxima renovación"}
            </dt>
            <dd className="text-white font-semibold">{formatDate(sub.current_period_end)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <dt className="text-gray-400">Email de facturación</dt>
          <dd className="text-white font-semibold">{sub.email}</dd>
        </div>
      </dl>

      {sub.status === "past_due" && (
        <p className="mt-4 text-xs text-amber-400">
          No pudimos cobrar tu última factura. Actualiza tu método de pago en el
          portal para no perder el acceso Pro.
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <ProPortalButton />
        {!activa && (
          <Link
            href="/pro"
            className="inline-block rounded-xl px-5 py-2.5 text-sm font-bold"
            style={{ background: "linear-gradient(135deg,#C9A84C,#e8d48b)", color: "#000000", textDecoration: "none" }}
          >
            Reactivar Pro
          </Link>
        )}
      </div>
    </div>
  );
}

function FounderCard() {
  return (
    <div className="rounded-2xl border border-[#C9A84C]/30 bg-[#14110a] p-6">
      <div className="text-white font-bold mb-2">Tu Founders Pass incluye el plan Pro</div>
      <p className="text-sm text-gray-400 mb-4">
        Como Founder tienes todos los beneficios Pro de por vida, sin suscripción ni
        renovaciones. Gracias por apoyar el proyecto desde el principio.
      </p>
      <Link href="/cuenta/founders-pass" className="text-sm font-bold text-[#C9A84C]">
        Ver mi Founders Pass →
      </Link>
    </div>
  );
}

function CompCard() {
  return (
    <div className="rounded-2xl border border-[#C9A84C]/30 bg-[#14110a] p-6">
      <div className="text-white font-bold mb-2">Acceso Pro de cortesía activo</div>
      <p className="text-sm text-gray-400">
        Tu cuenta tiene todas las ventajas Pro desbloqueadas de por vida, sin
        suscripción ni pagos: predicciones sin límites, IA ilimitada, fantasy en
        vivo, temporadas infinitas del Modo Carrera, ligas privadas y navegación
        sin anuncios.
      </p>
    </div>
  );
}

function BuyCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#14110a] p-6">
      <div className="text-white font-bold mb-2">Aún no tienes el plan Pro</div>
      <p className="text-sm text-gray-400 mb-5">
        Desbloquea los 8 tipos de predicción, IA Coach ilimitada, fantasy en vivo,
        temporadas infinitas del Modo Carrera, ligas privadas y navegación sin anuncios.
      </p>
      <Link
        href="/pro"
        className="inline-block rounded-xl px-6 py-3 text-sm font-black"
        style={{ background: "linear-gradient(135deg,#C9A84C,#e8d48b)", color: "#000000", textDecoration: "none" }}
      >
        Ver el plan Pro — desde 20 €/año
      </Link>
    </div>
  );
}
