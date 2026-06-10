"use client";

// Envoltorio mínimo para formularios admin con server actions: muestra el
// resultado (ok/error), confirma acciones destructivas y resetea los "alta".

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionResult } from "../actions";

function SubmitBtn({ label, danger }: { label: string; danger?: boolean }) {
  const { pending } = useFormStatus();
  if (danger) {
    return (
      <button
        type="submit"
        disabled={pending}
        className="text-red-400 hover:text-red-300 text-xs font-bold disabled:opacity-50"
        title={label}
      >
        {pending ? "…" : label}
      </button>
    );
  }
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl px-4 py-2 text-sm font-bold text-[#060B14] disabled:opacity-60 transition-all"
      style={{ background: "linear-gradient(135deg, #C9A84C, #A8893D)" }}
    >
      {pending ? "Guardando…" : label}
    </button>
  );
}

export default function AdminForm({
  action,
  submitLabel,
  children,
  className,
  confirmText,
  resetOnSuccess,
  danger,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  submitLabel: string;
  children: React.ReactNode;
  className?: string;
  confirmText?: string;
  resetOnSuccess?: boolean;
  danger?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handle(formData: FormData) {
    if (confirmText && !window.confirm(confirmText)) return;
    const res = await action(formData);
    if (res.ok) {
      if (resetOnSuccess) formRef.current?.reset();
      setMsg({ ok: true, text: "Guardado ✓" });
      setTimeout(() => setMsg(null), 2500);
    } else {
      setMsg({ ok: false, text: res.error ?? "Error" });
    }
  }

  return (
    <form ref={formRef} action={handle} className={className}>
      {children}
      <span className="inline-flex items-center gap-3">
        <SubmitBtn label={submitLabel} danger={danger} />
        {msg && (
          <span className={`text-xs ${msg.ok ? "text-green-400" : "text-red-400"}`}>{msg.text}</span>
        )}
      </span>
    </form>
  );
}
