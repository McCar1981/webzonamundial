"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  email: string;
  initialSubscribed: boolean;
  unsubscribedFlag: boolean;
  errorFlag: string | null;
}

export default function NotificacionesPanel({
  email,
  initialSubscribed,
  unsubscribedFlag,
  errorFlag,
}: Props) {
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(
    unsubscribedFlag
      ? "Te has dado de baja del resumen diario. Puedes reactivarlo cuando quieras."
      : errorFlag
        ? "No pudimos procesar tu solicitud. Inténtalo de nuevo."
        : null,
  );

  async function toggleDigest() {
    setLoading(true);
    setFeedback(null);
    const url = subscribed
      ? "/api/notifications/digest/unsubscribe"
      : "/api/notifications/digest/subscribe";
    try {
      const r = await fetch(url, { method: "POST" });
      if (r.ok) {
        setSubscribed(!subscribed);
        setFeedback(
          subscribed
            ? "Suscripción dada de baja."
            : "Suscripción activada. Recibirás el resumen diario a las 09:00.",
        );
      } else if (r.status === 401) {
        window.location.href = "/login?next=/cuenta/notificaciones";
      } else {
        setFeedback("No pudimos procesar el cambio. Inténtalo de nuevo.");
      }
    } catch {
      setFeedback("Error de red. Comprueba tu conexión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen px-5 py-12 sm:py-16"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,168,76,0.08), transparent 60%), linear-gradient(180deg, #060B14, #0B1825)",
      }}
    >
      <div className="max-w-2xl mx-auto">
        <Link
          href="/cuenta"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#C9A84C] mb-6"
        >
          ← Volver a Mi Cuenta
        </Link>

        <div className="text-[11px] tracking-[0.22em] uppercase font-mono font-bold text-[#C9A84C] mb-3">
          // NOTIFICACIONES
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-3">
          Tus notificaciones
        </h1>
        <p className="text-gray-400 text-base mb-8 leading-relaxed">
          Gestiona qué emails y avisos recibes de ZonaMundial. Los cambios se
          aplican al instante.
        </p>

        {feedback && (
          <div
            className="px-4 py-3 rounded-xl mb-6 text-sm"
            style={{
              background: "rgba(201,168,76,0.08)",
              border: "1px solid rgba(201,168,76,0.4)",
              color: "#FDE68A",
            }}
          >
            {feedback}
          </div>
        )}

        <div
          className="rounded-2xl border p-6 sm:p-8 mb-5"
          style={{
            borderColor: "rgba(201,168,76,0.25)",
            background:
              "linear-gradient(180deg, rgba(15,31,48,0.7), rgba(11,24,37,0.4))",
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                Resumen diario de noticias
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Te enviamos cada mañana a las{" "}
                <strong className="text-[#C9A84C]">09:00 (España)</strong> los
                titulares más importantes del Mundial 2026 directamente a tu
                email: <span className="text-gray-300">{email}</span>.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleDigest}
              disabled={loading}
              role="switch"
              aria-checked={subscribed}
              className="flex-shrink-0 disabled:opacity-50"
              style={{
                width: 52,
                height: 30,
                borderRadius: 15,
                background: subscribed
                  ? "linear-gradient(135deg, #C9A84C, #E8C76B)"
                  : "rgba(255,255,255,0.1)",
                position: "relative",
                cursor: loading ? "wait" : "pointer",
                transition: "background 0.2s",
                border: subscribed
                  ? "1px solid rgba(255,255,255,0.2)"
                  : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: subscribed ? 24 : 2,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                }}
              />
            </button>
          </div>
        </div>

        {/* Placeholder para FASE 2 y FASE 3 */}
        <div
          className="rounded-2xl border p-6 sm:p-8 mb-5 opacity-50"
          style={{
            borderColor: "rgba(255,255,255,0.08)",
            background: "rgba(15,31,48,0.4)",
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-300 mb-1 flex items-center gap-2">
                Notificaciones push en el navegador
                <span className="text-[10px] tracking-widest uppercase font-mono text-[#C9A84C] bg-[#C9A84C]/10 px-2 py-0.5 rounded">
                  Próximamente
                </span>
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Recibe avisos en tu navegador cuando publiquemos noticias
                importantes. Compatible con Chrome, Edge, Firefox y Safari
                (con la web añadida a tu pantalla de inicio en iOS).
              </p>
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl border p-6 sm:p-8 mb-5 opacity-50"
          style={{
            borderColor: "rgba(255,255,255,0.08)",
            background: "rgba(15,31,48,0.4)",
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-300 mb-1 flex items-center gap-2">
                Alertas de tu selección favorita
                <span className="text-[10px] tracking-widest uppercase font-mono text-[#C9A84C] bg-[#C9A84C]/10 px-2 py-0.5 rounded">
                  Próximamente
                </span>
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Te avisamos cuando tu selección favorita juegue, anote, o
                publique convocatoria. Disponible al lanzar la app móvil.
              </p>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 text-center mt-8 leading-relaxed">
          Tus datos de notificaciones se gestionan según nuestra{" "}
          <Link
            href="/legal/privacidad"
            className="text-[#C9A84C] hover:underline"
          >
            política de privacidad
          </Link>
          . Puedes darte de baja en cualquier momento con un solo clic.
        </p>
      </div>
    </div>
  );
}
