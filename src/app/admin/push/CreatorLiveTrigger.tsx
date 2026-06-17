"use client";

// Disparador MANUAL del push "creador en directo" para CUALQUIER creador.
// El cron de Twitch solo detecta SVGiago; los que emiten en YouTube (José Cobo),
// TikTok (Niku, Salvador) o Instagram (Nereita) hay que avisarlos a
// mano desde aquí. Reutiliza /api/admin/creators-live (dry-run por defecto,
// envío real solo con confirm:true tras confirmación explícita).

import { useState } from "react";

export interface CreatorOption {
  slug: string;
  nombre: string;
  plataforma: string;
}

const INPUT =
  "w-full rounded-xl bg-[#0B1825] border border-[#1E293B] text-white text-sm px-4 py-2.5 " +
  "focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/40 placeholder:text-gray-600";
const LABEL = "block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5";

export default function CreatorLiveTrigger({ creators }: { creators: CreatorOption[] }) {
  const [slug, setSlug] = useState(creators[0]?.slug ?? "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [recipients, setRecipients] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const selected = creators.find((c) => c.slug === slug);

  async function call(confirm: boolean) {
    const res = await fetch("/api/admin/creators-live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, confirm, message: message.trim() || undefined }),
    });
    return res.json();
  }

  async function checkRecipients() {
    if (!slug) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await call(false);
      if (r.ok) {
        setRecipients(r.recipients);
        setMsg({
          ok: true,
          text: `Llegaría a ${r.recipients} dispositivo(s) suscritos a "Creadores". Aún NO se ha enviado nada.`,
        });
      } else {
        setMsg({ ok: false, text: r.error ?? "Error" });
      }
    } catch {
      setMsg({ ok: false, text: "Error de red." });
    }
    setBusy(false);
  }

  async function send() {
    if (!slug) return;
    setBusy(true);
    setMsg(null);
    // Confirma con el conteo real antes de disparar a dispositivos reales.
    let count = recipients;
    if (count === null) {
      try {
        const r = await call(false);
        count = r.ok ? r.recipients : null;
        if (r.ok) setRecipients(r.recipients);
      } catch {
        /* seguimos: confirmamos sin número */
      }
    }
    const nombre = selected?.nombre ?? slug;
    const aviso =
      count === null
        ? `Vas a avisar a TODOS los suscriptores de "Creadores" de que ${nombre} está en directo. ¿Continuar?`
        : `Vas a avisar a ${count} dispositivo(s) de que ${nombre} está en directo. Esto es real e inmediato. ¿Enviar?`;
    if (!window.confirm(aviso)) {
      setBusy(false);
      return;
    }
    try {
      const r = await call(true);
      if (r.ok) {
        setMsg({
          ok: true,
          text: `Enviado: ${r.sent} OK · sin entregar ${r.failed} · caducados ${r.gone} · total ${r.total}.`,
        });
      } else {
        setMsg({ ok: false, text: r.error ?? "Error al enviar." });
      }
    } catch {
      setMsg({ ok: false, text: "Error de red." });
    }
    setBusy(false);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B1320] p-5 space-y-4">
      <div>
        <h2 className="text-lg font-black tracking-tight">Avisar: creador en directo</h2>
        <p className="text-gray-400 text-sm mt-1">
          El aviso automático solo detecta directos de Twitch. Para YouTube, TikTok o Instagram
          (José Cobo, Niku, Nereita…), lánzalo tú a mano aquí cuando veas que están emitiendo. Llega a quien
          tenga activada la categoría <strong className="text-gray-200">Creadores</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Creador</label>
          <select
            className={INPUT}
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setRecipients(null);
              setMsg(null);
            }}
          >
            {creators.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.nombre}
                {c.plataforma ? ` — ${c.plataforma}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL}>Mensaje (opcional)</label>
          <input
            className={INPUT}
            value={message}
            maxLength={140}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Si lo dejas vacío, se genera con su plataforma."
          />
          <div className="text-[11px] text-gray-500 mt-1">{message.length}/140</div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={checkRecipients}
          disabled={busy || !slug}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-200 hover:border-[#C9A84C]/40 disabled:opacity-50 transition-all"
        >
          {busy ? "…" : "Comprobar destinatarios"}
        </button>
        <button
          type="button"
          onClick={send}
          disabled={busy || !slug}
          className="rounded-xl px-5 py-2.5 text-sm font-bold text-[#060B14] disabled:opacity-50 transition-all"
          style={{ background: "linear-gradient(135deg, #C9A84C, #A8893D)" }}
        >
          {busy ? "Enviando…" : "Avisar que está en directo"}
        </button>
        {recipients !== null && (
          <span className="text-sm text-gray-300">
            Llegaría a <strong className="text-[#C9A84C]">{recipients}</strong> dispositivo(s)
          </span>
        )}
      </div>

      {msg && (
        <div className={`text-sm font-medium ${msg.ok ? "text-green-400" : "text-red-400"}`}>{msg.text}</div>
      )}
    </div>
  );
}
