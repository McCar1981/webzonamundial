"use client";

import { useState } from "react";

const KINDS: { value: string; label: string }[] = [
  { value: "news", label: "Noticias (general)" },
  { value: "tournament-key-events", label: "Eventos clave del torneo" },
  { value: "fav-team", label: "Selección favorita" },
  { value: "predictions-reminder", label: "Recordatorio de predicciones" },
  { value: "fantasy", label: "Fantasy" },
  { value: "blog-posts", label: "Blog" },
  { value: "creators", label: "Creadores" },
  { value: "amistosos", label: "Amistosos" },
];

const INPUT =
  "w-full rounded-xl bg-[#0B1825] border border-[#1E293B] text-white text-sm px-4 py-2.5 " +
  "focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/40 placeholder:text-gray-600";
const LABEL = "block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5";

export default function PushComposer() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/app");
  const [image, setImage] = useState("");
  const [kind, setKind] = useState("news");
  const [busy, setBusy] = useState(false);
  const [recipients, setRecipients] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function post(dryRun: boolean) {
    const res = await fetch("/api/admin/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, url, image, kind, dryRun }),
    });
    return res.json();
  }

  async function checkRecipients() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await post(true);
      if (r.ok) setRecipients(r.recipients);
      else setMsg({ ok: false, text: r.error ?? "Error" });
    } catch {
      setMsg({ ok: false, text: "Error de red." });
    }
    setBusy(false);
  }

  async function send() {
    if (title.trim().length < 2 || body.trim().length < 2) {
      setMsg({ ok: false, text: "Pon al menos título y mensaje." });
      return;
    }
    // Confirmación con conteo real antes de disparar a dispositivos reales.
    let count = recipients;
    setBusy(true);
    setMsg(null);
    if (count === null) {
      try {
        const r = await post(true);
        count = r.ok ? r.recipients : null;
        if (r.ok) setRecipients(r.recipients);
      } catch {
        /* seguimos: confirmamos sin número */
      }
    }
    const aviso =
      count === null
        ? "Vas a enviar este push a TODOS los suscriptores de la categoría. ¿Continuar?"
        : `Vas a enviar este push a ${count} dispositivo(s) suscritos a esta categoría. Esto es real e inmediato. ¿Enviar?`;
    if (!window.confirm(aviso)) {
      setBusy(false);
      return;
    }
    try {
      const r = await post(false);
      if (r.ok) {
        setMsg({
          ok: true,
          text: `Enviado: ${r.sent} ✓ · sin entregar ${r.failed} · caducados ${r.gone} · total ${r.total}.`,
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Formulario */}
      <div className="space-y-4">
        <div>
          <label className={LABEL}>Título *</label>
          <input
            className={INPUT}
            value={title}
            maxLength={80}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="🏆 ¡Empieza el Mundial!"
          />
          <div className="text-[11px] text-gray-500 mt-1">{title.length}/80</div>
        </div>
        <div>
          <label className={LABEL}>Mensaje *</label>
          <textarea
            className={INPUT}
            value={body}
            maxLength={200}
            rows={3}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Entra ahora y haz tu predicción del primer partido."
          />
          <div className="text-[11px] text-gray-500 mt-1">{body.length}/200</div>
        </div>
        <div>
          <label className={LABEL}>Al tocar, abre</label>
          <input
            className={INPUT}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/app  o  https://www.zonamundial.app/..."
          />
        </div>
        <div>
          <label className={LABEL}>Imagen grande (opcional)</label>
          <input
            className={INPUT}
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://...  (Android la muestra bajo el texto)"
          />
        </div>
        <div>
          <label className={LABEL}>Categoría (define quién lo recibe)</label>
          <select className={INPUT} value={kind} onChange={(e) => { setKind(e.target.value); setRecipients(null); }}>
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>{k.label}</option>
            ))}
          </select>
          <p className="text-[11px] text-gray-500 mt-1.5">
            Solo lo reciben quienes han activado esa categoría en sus notificaciones. «Noticias» es la más amplia.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap pt-2">
          <button
            type="button"
            onClick={checkRecipients}
            disabled={busy}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-200 hover:border-[#C9A84C]/40 disabled:opacity-50 transition-all"
          >
            {busy ? "…" : "Comprobar destinatarios"}
          </button>
          <button
            type="button"
            onClick={send}
            disabled={busy || !title.trim() || !body.trim()}
            className="rounded-xl px-5 py-2.5 text-sm font-bold text-[#060B14] disabled:opacity-50 transition-all"
            style={{ background: "linear-gradient(135deg, #C9A84C, #A8893D)" }}
          >
            {busy ? "Enviando…" : "Enviar push"}
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

      {/* Previsualización */}
      <div>
        <div className={LABEL}>Vista previa</div>
        <div className="rounded-2xl border border-white/10 bg-[#0F1D32] p-4 shadow-xl">
          <div className="flex gap-3">
            <img
              src="/img/email/logo-zonamundial.png"
              alt=""
              className="w-10 h-10 rounded-lg object-contain bg-white/5 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-sm text-white truncate">
                {title || "Título de la notificación"}
              </div>
              <div className="text-xs text-gray-300 mt-0.5 line-clamp-3">
                {body || "Aquí va el mensaje que verá el usuario en su móvil."}
              </div>
              <div className="text-[10px] text-gray-500 mt-1">zonamundial.app</div>
            </div>
          </div>
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="mt-3 w-full rounded-lg object-cover max-h-40" />
          )}
        </div>
        <p className="text-xs text-gray-500 mt-3 leading-relaxed">
          El envío es <strong className="text-gray-300">real e inmediato</strong> a los dispositivos que
          tengan las notificaciones activadas. Pulsa «Comprobar destinatarios» antes para ver a cuántos llega.
        </p>
      </div>
    </div>
  );
}
