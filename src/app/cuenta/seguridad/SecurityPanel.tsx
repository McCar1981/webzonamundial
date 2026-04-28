"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { deleteAccountAction } from "../actions";

export default function SecurityPanel({ email }: { email: string }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [newEmail, setNewEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{ type: "ok" | "error"; msg: string } | null>(null);

  const [confirmText, setConfirmText] = useState("");
  const [deleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState("");

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();
    setEmailFeedback(null);
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setEmailFeedback({ type: "error", msg: "Email inválido" });
      return;
    }
    if (newEmail.trim().toLowerCase() === email.toLowerCase()) {
      setEmailFeedback({ type: "error", msg: "Es el mismo email actual" });
      return;
    }

    setEmailSending(true);
    const { error } = await supabase.auth.updateUser({
      email: newEmail.trim().toLowerCase(),
    });
    setEmailSending(false);

    if (error) {
      setEmailFeedback({ type: "error", msg: error.message });
      return;
    }
    setEmailFeedback({
      type: "ok",
      msg: "Te enviamos un email a la nueva dirección. Confírmalo para activar el cambio.",
    });
    setNewEmail("");
  }

  function handleDelete() {
    setDeleteError("");
    if (confirmText !== "ELIMINAR") {
      setDeleteError('Escribe exactamente "ELIMINAR" para confirmar.');
      return;
    }
    startDelete(async () => {
      try {
        await deleteAccountAction();
        router.push("/");
      } catch {
        setDeleteError("Error eliminando la cuenta. Contacta con soporte.");
      }
    });
  }

  return (
    <div className="space-y-10">
      {/* Cambio de email */}
      <section>
        <h3 className="text-lg font-bold text-white mb-2">Cambiar email</h3>
        <p className="text-gray-500 text-xs mb-5">
          Actual: <span className="text-[#C9A84C]">{email}</span>. Te enviaremos
          un enlace de confirmación a la nueva dirección.
        </p>
        <form onSubmit={handleEmailChange} className="space-y-4">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => {
              setNewEmail(e.target.value);
              setEmailFeedback(null);
            }}
            placeholder="nuevo@email.com"
            className="w-full px-4 py-3 rounded-xl bg-[#0B1825] border border-[#1E293B] text-white text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/40"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              {emailFeedback?.type === "ok" && (
                <span className="text-green-400">✓ {emailFeedback.msg}</span>
              )}
              {emailFeedback?.type === "error" && (
                <span className="text-red-400">✗ {emailFeedback.msg}</span>
              )}
            </div>
            <button
              type="submit"
              disabled={emailSending || !newEmail}
              className="px-5 py-2.5 rounded-xl text-[#030712] font-bold text-sm disabled:opacity-50 transition-all"
              style={{ background: "linear-gradient(135deg, #C9A84C, #A8893D)" }}
            >
              {emailSending ? "Enviando…" : "Solicitar cambio"}
            </button>
          </div>
        </form>
      </section>

      {/* Eliminar cuenta */}
      <section className="pt-8 border-t border-[#1E293B]/40">
        <h3 className="text-lg font-bold text-red-400 mb-2">Eliminar cuenta</h3>
        <p className="text-gray-500 text-xs mb-5">
          Esto borra <strong className="text-gray-300">de forma permanente</strong> tu cuenta, perfil, preferencias y predicciones. Acción irreversible.
        </p>

        <div
          className="rounded-xl border border-red-500/20 p-5"
          style={{ background: "rgba(239,68,68,0.04)" }}
        >
          <p className="text-sm text-gray-300 mb-4">
            Para confirmar, escribe la palabra{" "}
            <code className="text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
              ELIMINAR
            </code>{" "}
            abajo:
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => {
              setConfirmText(e.target.value);
              setDeleteError("");
            }}
            placeholder="ELIMINAR"
            className="w-full px-4 py-3 rounded-xl bg-[#0B1825] border border-[#1E293B] text-white text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/40 mb-3"
          />
          {deleteError && (
            <div className="text-red-400 text-sm mb-3">✗ {deleteError}</div>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || confirmText !== "ELIMINAR"}
            className="w-full px-5 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            style={{ background: "linear-gradient(135deg, #ef4444, #b91c1c)" }}
          >
            {deleting ? "Eliminando…" : "Eliminar mi cuenta para siempre"}
          </button>
        </div>
      </section>
    </div>
  );
}
