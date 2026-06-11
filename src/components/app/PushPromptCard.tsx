"use client";

// Tarjeta de activación de notificaciones para el LOBBY (/app).
//
// Es donde está la gente logueada, así que es el mejor sitio para pedir el
// permiso de push (antes solo se ofrecía en /cuenta/notificaciones, el banner
// flotante de home/noticias y Amistosos). Reutiliza el flujo existente
// (subscribeToPush) — no duplica nada del registro del service worker.
//
// Reglas para no molestar:
//  - Solo aparece si el navegador SOPORTA push y el permiso está en "default"
//    (ni concedido ni bloqueado): si ya está activado o bloqueado, no pinta nada.
//  - Descartable; si se cierra, no reaparece en 10 días (localStorage).
//  - Al activar suscribe a "news" + "tournament-key-events" (noticias y los
//    momentos clave del Mundial), que es lo que la gente quiere del torneo.

import { useEffect, useState } from "react";
import {
  isPushSupported,
  getNotificationPermission,
  getCurrentSubscription,
  subscribeToPush,
  claimPushReward,
} from "@/lib/push-client";

const DISMISS_KEY = "zm.app.pushcard.dismissedAt";
const REASK_DAYS = 10;
const REWARD_COINS = 25; // gancho mostrado; el abono real (idempotente) lo decide el servidor

type Status = "hidden" | "idle" | "loading" | "done" | "denied";

function dismissedRecently(): boolean {
  try {
    const at = parseInt(localStorage.getItem(DISMISS_KEY) || "0", 10);
    if (!at) return false;
    return (Date.now() - at) / (1000 * 60 * 60 * 24) < REASK_DAYS;
  } catch {
    return false;
  }
}

export default function PushPromptCard({
  matchLabel,
  matchCountdown,
}: {
  /** "México vs Sudáfrica" si hay partido próximo; null si no. */
  matchLabel?: string | null;
  /** "⏱ Faltan 2h 15m" o similar; null si no aplica. */
  matchCountdown?: string | null;
}) {
  const [status, setStatus] = useState<Status>("hidden");
  const [earned, setEarned] = useState(0);

  useEffect(() => {
    let on = true;
    (async () => {
      if (!isPushSupported()) return;
      if (getNotificationPermission() !== "default") return; // granted o denied → nada que pedir
      if (dismissedRecently()) return;
      const sub = await getCurrentSubscription();
      if (on && !sub) setStatus("idle");
    })();
    return () => {
      on = false;
    };
  }, []);

  async function activate() {
    setStatus("loading");
    try {
      const sub = await subscribeToPush({ kinds: ["news", "tournament-key-events"] });
      if (sub) {
        // Recompensa Fútcoins (idempotente en el servidor: solo la primera vez).
        const reward = await claimPushReward();
        setEarned(reward && !reward.alreadyClaimed ? reward.coins : 0);
        setStatus("done");
        setTimeout(() => setStatus("hidden"), 4500);
      } else {
        // El usuario denegó en el pop-up del navegador.
        setStatus("denied");
      }
    } catch {
      setStatus("denied");
    }
  }

  const hasMatch = !!(matchLabel && matchCountdown);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setStatus("hidden");
  }

  if (status === "hidden") return null;

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-[#C9A84C]/35 bg-gradient-to-br from-[#C9A84C]/15 via-[#0F1D32] to-[#0B1825] p-4 sm:p-5 mb-4"
    >
      {/* halo sutil */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#C9A84C]/20 blur-3xl"
      />

      {status !== "done" && (
        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar"
          className="absolute right-3 top-3 text-white/40 hover:text-white/80 transition-colors text-sm"
        >
          ✕
        </button>
      )}

      <div className="relative flex items-center gap-4">
        <div className="shrink-0 grid place-items-center w-12 h-12 rounded-2xl bg-[#C9A84C]/20 text-2xl">
          🔔
        </div>

        <div className="min-w-0 flex-1">
          {status === "done" ? (
            <>
              <div className="font-black text-white">
                {earned > 0 ? `¡Listo! +${earned} Fútcoins 🎉` : "¡Listo! Te avisaremos 🎉"}
              </div>
              <p className="text-sm text-gray-300 mt-0.5">
                Ya no te perderás ningún gol ni la resolución de tus predicciones.
              </p>
            </>
          ) : status === "denied" ? (
            <>
              <div className="font-black text-white">Las notificaciones están bloqueadas</div>
              <p className="text-sm text-gray-300 mt-0.5">
                Tu navegador las tiene desactivadas para ZonaMundial. Ábrelas desde el candado de la barra
                de direcciones → Notificaciones → Permitir.
              </p>
            </>
          ) : (
            <>
              <div className="font-black text-white">
                {hasMatch ? `⚽ ${matchLabel} — ${matchCountdown}` : "No te pierdas ningún gol"}
              </div>
              <p className="text-sm text-gray-300 mt-0.5">
                {hasMatch
                  ? "Activa el aviso para que te avisemos de cada gol en directo"
                  : "Activa las alertas y entérate al instante de goles, alineaciones y resultados"}
                {" "}
                <span className="text-[#E8D48B] font-semibold">y llévate {REWARD_COINS} Fútcoins.</span>
              </p>
            </>
          )}
        </div>

        {(status === "idle" || status === "loading") && (
          <button
            type="button"
            onClick={activate}
            disabled={status === "loading"}
            className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-[#060B14] disabled:opacity-60 transition-all"
            style={{ background: "linear-gradient(135deg, #C9A84C, #A8893D)" }}
          >
            {status === "loading" ? "Activando…" : `Activar +${REWARD_COINS}`}
          </button>
        )}
      </div>
    </section>
  );
}
