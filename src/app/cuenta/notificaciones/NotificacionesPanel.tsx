"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentSubscription,
} from "@/lib/push-client";

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

  // Estado del Web Push del browser actual.
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | "unsupported">(
    "unsupported",
  );
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushFeedback, setPushFeedback] = useState<string | null>(null);
  const [pushTesting, setPushTesting] = useState(false);

  useEffect(() => {
    setPushSupported(isPushSupported());
    setPushPermission(getNotificationPermission());
    void getCurrentSubscription().then((sub) => {
      setPushSubscribed(!!sub);
    });
  }, []);

  async function togglePush() {
    setPushLoading(true);
    setPushFeedback(null);
    try {
      if (pushSubscribed) {
        await unsubscribeFromPush();
        setPushSubscribed(false);
        setPushFeedback("Notificaciones push desactivadas en este navegador.");
      } else {
        const sub = await subscribeToPush({ kinds: ["news"] });
        if (sub) {
          setPushSubscribed(true);
          setPushPermission("granted");
          setPushFeedback(
            "Notificaciones push activadas. Te avisaremos cuando publiquemos algo importante.",
          );
        } else {
          setPushFeedback(
            "No se pudieron activar. Comprueba que has aceptado el permiso del navegador.",
          );
        }
      }
    } catch (err) {
      setPushFeedback("Error inesperado. Inténtalo de nuevo.");
      console.error(err);
    } finally {
      setPushLoading(false);
    }
  }

  async function sendTestPush() {
    setPushTesting(true);
    setPushFeedback(null);
    try {
      const r = await fetch("/api/notifications/push/test", { method: "POST" });
      const data = await r.json();
      if (r.ok && data.sent > 0) {
        setPushFeedback(
          `Push de prueba enviado a ${data.sent} dispositivo(s). Debería aparecer en unos segundos.`,
        );
      } else if (data.error === "no_subscriptions_found_for_user") {
        setPushFeedback("Activa primero las notificaciones en este navegador.");
      } else {
        setPushFeedback("No se pudo enviar la prueba. Inténtalo más tarde.");
      }
    } catch {
      setPushFeedback("Error de red al enviar prueba.");
    } finally {
      setPushTesting(false);
    }
  }

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

        {/* Web Push notifications */}
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
                Notificaciones push en el navegador
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Recibe avisos en tiempo real en este navegador cuando publiquemos
                noticias importantes. La activación se guarda{" "}
                <strong className="text-gray-300">solo en este dispositivo</strong>.
                Para activarlas también en otros, repite el proceso desde allí.
              </p>
              {!pushSupported && (
                <p className="text-xs text-amber-400 mt-2">
                  Tu navegador no soporta Web Push. En iOS necesitas{" "}
                  <strong>añadir esta web a la pantalla de inicio</strong> primero.
                </p>
              )}
              {pushSupported && pushPermission === "denied" && (
                <p className="text-xs text-amber-400 mt-2">
                  Has denegado el permiso. Reactívalo desde la configuración del
                  navegador (icono de candado junto a la URL) y vuelve a intentarlo.
                </p>
              )}
              {pushFeedback && (
                <p className="text-xs text-[#C9A84C] mt-2">{pushFeedback}</p>
              )}
              {pushSupported && pushSubscribed && (
                <button
                  type="button"
                  onClick={sendTestPush}
                  disabled={pushTesting}
                  className="mt-3 text-xs px-3 py-1.5 rounded-lg border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/10 disabled:opacity-50"
                >
                  {pushTesting ? "Enviando…" : "Enviar prueba"}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={togglePush}
              disabled={pushLoading || !pushSupported || pushPermission === "denied"}
              role="switch"
              aria-checked={pushSubscribed}
              className="flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                width: 52,
                height: 30,
                borderRadius: 15,
                background: pushSubscribed
                  ? "linear-gradient(135deg, #C9A84C, #E8C76B)"
                  : "rgba(255,255,255,0.1)",
                position: "relative",
                cursor:
                  pushLoading || !pushSupported || pushPermission === "denied"
                    ? "not-allowed"
                    : "pointer",
                transition: "background 0.2s",
                border: pushSubscribed
                  ? "1px solid rgba(255,255,255,0.2)"
                  : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: pushSubscribed ? 24 : 2,
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
