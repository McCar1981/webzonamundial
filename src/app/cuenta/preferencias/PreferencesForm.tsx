"use client";

import { useState, useTransition, useEffect } from "react";
import { updatePreferencesAction } from "./actions";

interface Prefs {
  email_digest: boolean;
  push_news: boolean;
  push_matches: boolean;
  push_leagues: boolean;
  push_creators: boolean;
}

export default function PreferencesForm({ initial }: { initial: Prefs }) {
  const [values, setValues] = useState<Prefs>(initial);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; msg: string } | null>(null);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPushPermission("unsupported");
      return;
    }
    setPushPermission(Notification.permission);
  }, []);

  function toggle<K extends keyof Prefs>(key: K) {
    setValues((v) => ({ ...v, [key]: !v[key] }));
    setFeedback(null);
  }

  async function requestPushPermission() {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setPushPermission(perm);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.set(k, v ? "1" : "0"));

    startTransition(async () => {
      const res = await updatePreferencesAction(fd);
      if (res.ok) {
        setFeedback({ type: "ok", msg: "Preferencias guardadas" });
      } else {
        setFeedback({ type: "error", msg: res.error ?? "Error" });
      }
    });
  }

  const pushDisabled = pushPermission === "denied" || pushPermission === "unsupported";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Email digest */}
      <Section
        title="Email"
        description="Resúmenes y novedades por correo."
      >
        <Toggle
          label="Boletín semanal"
          description="Lo más importante de la semana del Mundial cada lunes."
          checked={values.email_digest}
          onChange={() => toggle("email_digest")}
        />
      </Section>

      {/* Push */}
      <Section
        title="Notificaciones push"
        description="Recibe avisos en el navegador cuando pasen cosas."
      >
        {/* Permission gate */}
        {pushPermission === "default" && (
          <div className="mb-5 p-4 rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/5 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <div className="text-white font-semibold">
                Activa los avisos del navegador
              </div>
              <div className="text-gray-400 text-xs mt-0.5">
                Sin esto los toggles no funcionan.
              </div>
            </div>
            <button
              type="button"
              onClick={requestPushPermission}
              className="px-4 py-2 rounded-lg text-[#030712] text-xs font-bold"
              style={{ background: "linear-gradient(135deg, #C9A84C, #A8893D)" }}
            >
              Activar
            </button>
          </div>
        )}
        {pushPermission === "denied" && (
          <div className="mb-5 p-4 rounded-xl border border-red-500/30 bg-red-500/5 text-sm">
            <div className="text-red-300 font-semibold">
              Has bloqueado los avisos
            </div>
            <div className="text-gray-400 text-xs mt-0.5">
              Reactívalos desde la configuración de tu navegador para esta web.
            </div>
          </div>
        )}
        {pushPermission === "unsupported" && (
          <div className="mb-5 p-4 rounded-xl border border-[#1E293B] bg-[#0B1825]/50 text-sm">
            <div className="text-gray-300 font-semibold">
              Tu navegador no soporta avisos push
            </div>
            <div className="text-gray-500 text-xs mt-0.5">
              Prueba desde Chrome, Edge o Firefox. iOS solo desde Safari 16.4+ con la web instalada como PWA.
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Toggle
            label="Noticias"
            description="Fichajes, lesiones, alineaciones."
            checked={values.push_news}
            onChange={() => toggle("push_news")}
            disabled={pushDisabled}
          />
          <Toggle
            label="Partidos"
            description="Inicio de partido, goles de tu selección, finales."
            checked={values.push_matches}
            onChange={() => toggle("push_matches")}
            disabled={pushDisabled}
          />
          <Toggle
            label="Ligas privadas"
            description="Resultados, invitaciones y rankings de tus ligas."
            checked={values.push_leagues}
            onChange={() => toggle("push_leagues")}
            disabled={pushDisabled}
          />
          <Toggle
            label="Creadores"
            description="Cuando un creador favorito hace un directo o publica."
            checked={values.push_creators}
            onChange={() => toggle("push_creators")}
            disabled={pushDisabled}
          />
        </div>
      </Section>

      {/* Feedback + submit */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1E293B]/40">
        <div className="text-sm">
          {feedback?.type === "ok" && (
            <span className="text-green-400">✓ {feedback.msg}</span>
          )}
          {feedback?.type === "error" && (
            <span className="text-red-400">✗ {feedback.msg}</span>
          )}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-3 rounded-xl text-[#030712] font-bold text-sm disabled:opacity-50 transition-all"
          style={{ background: "linear-gradient(135deg, #C9A84C, #A8893D)" }}
        >
          {pending ? "Guardando…" : "Guardar preferencias"}
        </button>
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-gray-500 text-xs mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <label
      className="flex items-center justify-between gap-4 p-4 rounded-xl border border-[#1E293B]/60 cursor-pointer transition-all hover:border-[#C9A84C]/30"
      style={{
        background: "rgba(11,24,37,0.4)",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="text-xs text-gray-500 mt-0.5">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={onChange}
        className="relative w-12 h-6 rounded-full transition-all flex-shrink-0"
        style={{
          background: checked
            ? "linear-gradient(135deg, #C9A84C, #A8893D)"
            : "#1E293B",
        }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
          style={{ left: checked ? "calc(100% - 22px)" : "2px" }}
        />
      </button>
    </label>
  );
}
