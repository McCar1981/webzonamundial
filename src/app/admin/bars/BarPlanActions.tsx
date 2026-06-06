"use client";

// Acciones por bar en el panel admin: simular el pago de un plan (sin Stripe) o
// revertirlo, llamando a /api/admin/bars/plan. Sirve para probar todo el flujo
// (activación, kit premium, publicación) sin pasar por la pasarela de pago.
// Protegido por la cookie zm_admin igual que el resto de /admin.

import { useState } from "react";
import { useRouter } from "next/navigation";

const PLAN_OPTIONS = [
  { id: "arranque", label: "Arranque" },
  { id: "completo", label: "Completo" },
  { id: "pro", label: "Pro" },
] as const;

export default function BarPlanActions({ barId, paid }: { barId: string; paid: boolean }) {
  const router = useRouter();
  const [plan, setPlan] = useState<string>("arranque");
  const [busy, setBusy] = useState<null | "activate" | "revert">(null);
  const [err, setErr] = useState<string | null>(null);

  async function activate() {
    setBusy("activate");
    setErr(null);
    try {
      const res = await fetch("/api/admin/bars/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bar_id: barId, plan_id: plan }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function revert() {
    setBusy("revert");
    setErr(null);
    try {
      const res = await fetch(`/api/admin/bars/plan?bar_id=${encodeURIComponent(barId)}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          disabled={busy !== null}
          className="bg-white/5 border border-white/10 rounded px-1.5 py-1 text-xs text-white"
        >
          {PLAN_OPTIONS.map((p) => (
            <option key={p.id} value={p.id} className="bg-[#0F1D32]">{p.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={activate}
          disabled={busy !== null}
          className="px-2 py-1 rounded text-xs font-bold bg-emerald-600/80 hover:bg-emerald-600 disabled:opacity-50"
        >
          {busy === "activate" ? "…" : "Activar"}
        </button>
        {paid && (
          <button
            type="button"
            onClick={revert}
            disabled={busy !== null}
            className="px-2 py-1 rounded text-xs font-bold bg-red-700/70 hover:bg-red-700 disabled:opacity-50"
          >
            {busy === "revert" ? "…" : "Quitar"}
          </button>
        )}
      </div>
      {err && <div className="text-red-400 text-[10px]">{err}</div>}
    </div>
  );
}
