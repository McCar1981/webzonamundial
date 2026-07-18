"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { submitSponsorLead } from "./actions";

const INPUT_CLS =
  "w-full rounded-xl bg-[#0a0906] border border-[#241e12] text-white text-sm px-4 py-2.5 " +
  "focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/40 placeholder:text-gray-600";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl px-5 py-2.5 text-sm font-bold text-[#000000] disabled:opacity-60 transition-all"
      style={{ background: "linear-gradient(135deg, #C9A84C, #A8893D)" }}
    >
      {pending ? "Enviando…" : "Proponer marca"}
    </button>
  );
}

export default function SponsorLeadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handle(formData: FormData) {
    const res = await submitSponsorLead(formData);
    if (res.ok) {
      formRef.current?.reset();
      setMsg({ ok: true, text: "¡Recibida! La revisamos y te contamos en cuanto haya avance." });
    } else {
      setMsg({ ok: false, text: res.error ?? "No se pudo enviar." });
    }
  }

  return (
    <form ref={formRef} action={handle} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input name="empresa" required maxLength={120} placeholder="Marca / empresa *" className={INPUT_CLS} />
        <input name="contacto" maxLength={160} placeholder="Contacto (nombre, email, teléfono…)" className={INPUT_CLS} />
      </div>
      <textarea
        name="notas"
        maxLength={600}
        rows={2}
        placeholder="¿Qué relación tienes con la marca? ¿Qué encaje le ves?"
        className={INPUT_CLS}
      />
      <div className="flex items-center gap-3 flex-wrap">
        <SubmitButton />
        {msg && (
          <span className={`text-sm ${msg.ok ? "text-green-400" : "text-red-400"}`}>{msg.text}</span>
        )}
      </div>
    </form>
  );
}
