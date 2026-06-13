"use client";

// Panel granular de preferencias de notificaciones \u2014 FASE 3.
//
// Por cada categor\u00eda, mostramos toggles independientes para canal email y
// canal push. La columna push solo es interactiva si el browser actual
// soporta + el user ha activado el permiso. El email funciona siempre.
//
// Las prefs persisten en notification_preferences (tabla unificada). El
// SW push de este browser sigue gestion\u00e1ndose en push_subscriptions
// (FASE 2) \u2014 el toggle de "Push" en una categor\u00eda asume que ya hay
// suscripci\u00f3n; si no, le ofrecemos activarla.

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
  /** Si el user est\u00e1 en email_subscriptions activo (legacy FASE 1). */
  initialSubscribed: boolean;
  unsubscribedFlag: boolean;
  errorFlag: string | null;
  /** Preferencias granulares (FASE 3). Vac\u00edo si nunca configur\u00f3. */
  initialPrefs: Array<{
    category: string;
    channel: string;
    enabled: boolean;
  }>;
}

type Channel = "email" | "push";

interface CategoryDef {
  id: string;
  label: string;
  description: string;
  icon: string;
  /** Activa en web ya o "Pr\u00f3ximamente" (app m\u00f3vil/admin). */
  status: "active" | "soon";
  /** Por defecto activa al user nuevo si no tiene fila. */
  defaultEmail: boolean;
  defaultPush: boolean;
  /** Canales soportados. */
  emailSupported: boolean;
  pushSupported: boolean;
}

const CATEGORIES: CategoryDef[] = [
  {
    id: "news",
    label: "Noticias del Mundial",
    description: "Cada art\u00edculo nuevo publicado en /noticias",
    icon: "\ud83d\udcf0",
    status: "active",
    defaultEmail: true,
    defaultPush: true,
    emailSupported: true,
    pushSupported: true,
  },
  {
    id: "fav-team",
    label: "Tu selecci\u00f3n favorita",
    description: "Cuando juega, marca o publica convocatoria",
    icon: "\u2b50",
    status: "active",
    defaultEmail: false,
    defaultPush: true,
    emailSupported: false,
    pushSupported: true,
  },
  {
    id: "tournament-key-events",
    label: "Eventos clave del torneo",
    description: "Sorteo, inicio, octavos, cuartos, semis, final",
    icon: "\ud83c\udfc6",
    status: "active",
    defaultEmail: true,
    defaultPush: true,
    emailSupported: true,
    pushSupported: true,
  },
  {
    id: "predictions-reminder",
    label: "Recordatorios de predicciones",
    description: "Antes del cierre de cada partido",
    icon: "\ud83c\udfaf",
    status: "active",
    defaultEmail: false,
    defaultPush: true,
    emailSupported: false,
    pushSupported: true,
  },
  {
    id: "fantasy",
    label: "Fantasy",
    description: "Movimientos de tu equipo y recordatorios de mercado",
    icon: "\ud83d\udcca",
    status: "soon",
    defaultEmail: false,
    defaultPush: false,
    emailSupported: false,
    pushSupported: true,
  },
  {
    id: "blog-posts",
    label: "Nuevos posts del blog",
    description: "An\u00e1lisis y reportajes del equipo editorial",
    icon: "\ud83d\udcdd",
    status: "soon",
    defaultEmail: true,
    defaultPush: false,
    emailSupported: true,
    pushSupported: true,
  },
  {
    id: "creators",
    label: "Creadores en directo",
    description: "Cuando un creador de ZonaMundial empieza a transmitir en Twitch",
    icon: "\ud83d\udd34", // 🔴
    status: "active",
    defaultEmail: false,
    defaultPush: false,
    emailSupported: false,
    pushSupported: true,
  },
  {
    id: "amistosos",
    label: "Amistosos de selecciones",
    description: "Goles, alineaciones, inicio, descanso y final en vivo",
    icon: "",
    status: "active",
    defaultEmail: false,
    defaultPush: true,
    emailSupported: false,
    pushSupported: true,
  },
];

function prefValue(
  prefs: Props["initialPrefs"],
  category: string,
  channel: Channel,
  fallback: boolean,
): boolean {
  const row = prefs.find(
    (p) => p.category === category && p.channel === channel,
  );
  return row ? row.enabled : fallback;
}

export default function NotificacionesPanel({
  email,
  initialSubscribed,
  unsubscribedFlag,
  errorFlag,
  initialPrefs,
}: Props) {
  // Mapa de prefs actuales (category|channel \u2192 enabled).
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    for (const cat of CATEGORIES) {
      m[`${cat.id}|email`] = prefValue(
        initialPrefs,
        cat.id,
        "email",
        cat.defaultEmail && cat.emailSupported,
      );
      m[`${cat.id}|push`] = prefValue(
        initialPrefs,
        cat.id,
        "push",
        cat.defaultPush && cat.pushSupported && initialSubscribed,
      );
    }
    return m;
  });

  // Loading por toggle individual.
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [topFeedback, setTopFeedback] = useState<string | null>(
    unsubscribedFlag
      ? "Te has dado de baja del resumen diario. Puedes reactivarlo cuando quieras."
      : errorFlag
        ? "No pudimos procesar tu solicitud. Inténtalo de nuevo."
        : null,
  );

  // Estado push del navegador actual.
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | "unsupported">(
    "unsupported",
  );
  const [browserSubscribed, setBrowserSubscribed] = useState(false);
  const [pushBootLoading, setPushBootLoading] = useState(false);
  const [pushTesting, setPushTesting] = useState(false);

  useEffect(() => {
    setPushSupported(isPushSupported());
    setPushPermission(getNotificationPermission());
    void getCurrentSubscription().then((sub) => {
      setBrowserSubscribed(!!sub);
    });
  }, []);

  async function setPref(
    category: string,
    channel: Channel,
    enabled: boolean,
  ): Promise<boolean> {
    const key = `${category}|${channel}`;
    setSavingKey(key);
    try {
      const r = await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, channel, enabled }),
      });
      if (r.ok) {
        setPrefs((p) => ({ ...p, [key]: enabled }));
        return true;
      }
      if (r.status === 401) {
        window.location.href = "/login?next=/cuenta/notificaciones";
      }
      return false;
    } catch {
      return false;
    } finally {
      setSavingKey(null);
    }
  }

  async function activateBrowserPush() {
    setPushBootLoading(true);
    try {
      const sub = await subscribeToPush({ kinds: ["news"] });
      if (sub) {
        setBrowserSubscribed(true);
        setPushPermission("granted");
        setTopFeedback(
          "Notificaciones push activadas en este navegador. Te avisaremos cuando publiquemos algo importante.",
        );
      } else {
        setTopFeedback(
          "No se pudieron activar. Comprueba que has aceptado el permiso del navegador.",
        );
      }
    } catch (err) {
      console.error(err);
      setTopFeedback("Error inesperado al activar push. Inténtalo de nuevo.");
    } finally {
      setPushBootLoading(false);
    }
  }

  async function deactivateBrowserPush() {
    setPushBootLoading(true);
    try {
      await unsubscribeFromPush();
      setBrowserSubscribed(false);
      setTopFeedback("Notificaciones push desactivadas en este navegador.");
    } finally {
      setPushBootLoading(false);
    }
  }

  async function sendTestPush() {
    setPushTesting(true);
    setTopFeedback(null);
    try {
      const r = await fetch("/api/notifications/push/test", { method: "POST" });
      const data = await r.json();
      if (r.ok && data.sent > 0) {
        setTopFeedback(
          `Push de prueba enviado a ${data.sent} dispositivo(s). Debería aparecer en unos segundos.`,
        );
      } else if (data.error === "no_subscriptions_found_for_user") {
        setTopFeedback("Activa primero las notificaciones en este navegador.");
      } else {
        setTopFeedback("No se pudo enviar la prueba. Inténtalo más tarde.");
      }
    } catch {
      setTopFeedback("Error de red al enviar prueba.");
    } finally {
      setPushTesting(false);
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
      <div className="max-w-3xl mx-auto">
        <Link
          href="/cuenta"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#C9A84C] mb-6"
        >
          ← Volver a Mi Cuenta
        </Link>

        <div className="text-[11px] tracking-[0.22em] uppercase font-mono font-bold text-[#C9A84C] mb-3">
          {"/* NOTIFICACIONES */"}
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-3">
          Tus notificaciones
        </h1>
        <p className="text-gray-400 text-base mb-8 leading-relaxed">
          Elige qué quieres recibir y por dónde. Te enviamos los emails a{" "}
          <span className="text-[#C9A84C]">{email}</span>.
        </p>

        {topFeedback && (
          <div
            className="px-4 py-3 rounded-xl mb-6 text-sm"
            style={{
              background: "rgba(201,168,76,0.08)",
              border: "1px solid rgba(201,168,76,0.4)",
              color: "#FDE68A",
            }}
          >
            {topFeedback}
          </div>
        )}

        {/* Estado del Web Push de este navegador */}
        <div
          className="rounded-2xl border p-5 sm:p-6 mb-6"
          style={{
            borderColor: "rgba(201,168,76,0.25)",
            background:
              "linear-gradient(180deg, rgba(15,31,48,0.7), rgba(11,24,37,0.4))",
          }}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                🔔 Notificaciones push en este navegador
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                {browserSubscribed
                  ? "Este navegador está activo para recibir push. Para activar otros dispositivos, repite el proceso desde allí."
                  : "Para recibir push en este navegador, primero activa el permiso aquí. Luego elige por categoría más abajo."}
              </p>
              {!pushSupported && (
                <p className="text-[11px] text-amber-400 mt-2">
                  Tu navegador no soporta Web Push. En iOS necesitas <strong>añadir esta web a la pantalla de inicio</strong> primero.
                </p>
              )}
              {pushSupported && pushPermission === "denied" && (
                <p className="text-[11px] text-amber-400 mt-2">
                  Has denegado el permiso. Reactívalo desde el navegador (icono de candado junto a la URL).
                </p>
              )}
              {browserSubscribed && (
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
              onClick={browserSubscribed ? deactivateBrowserPush : activateBrowserPush}
              disabled={
                pushBootLoading || !pushSupported || pushPermission === "denied"
              }
              role="switch"
              aria-checked={browserSubscribed}
              className="flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                width: 52,
                height: 30,
                borderRadius: 15,
                background: browserSubscribed
                  ? "linear-gradient(135deg, #C9A84C, #E8C76B)"
                  : "rgba(255,255,255,0.1)",
                position: "relative",
                cursor:
                  pushBootLoading || !pushSupported || pushPermission === "denied"
                    ? "not-allowed"
                    : "pointer",
                transition: "background 0.2s",
                border: browserSubscribed
                  ? "1px solid rgba(255,255,255,0.2)"
                  : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: browserSubscribed ? 24 : 2,
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

        {/* Tabla de categor\u00edas */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            borderColor: "rgba(255,255,255,0.08)",
            background: "linear-gradient(180deg, rgba(15,31,48,0.7), rgba(11,24,37,0.4))",
          }}
        >
          {/* Header de columnas */}
          <div
            className="grid grid-cols-[1fr_70px_70px] gap-2 px-4 sm:px-6 py-3 border-b text-[10px] tracking-widest uppercase font-mono text-gray-500"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            <div>Qué quieres recibir</div>
            <div className="text-center">📧 Email</div>
            <div className="text-center">🔔 Push</div>
          </div>

          {CATEGORIES.map((cat, idx) => {
            const emailKey = `${cat.id}|email`;
            const pushKey = `${cat.id}|push`;
            const emailOn = prefs[emailKey];
            const pushOn = prefs[pushKey];
            const isLast = idx === CATEGORIES.length - 1;
            return (
              <div
                key={cat.id}
                className="grid grid-cols-[1fr_70px_70px] gap-2 px-4 sm:px-6 py-4 items-center"
                style={{
                  borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.05)",
                  opacity: cat.status === "soon" ? 0.55 : 1,
                }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span aria-hidden="true">{cat.icon}</span>
                    <h4 className="font-bold text-sm text-white truncate">
                      {cat.label}
                    </h4>
                    {cat.status === "soon" && (
                      <span className="text-[9px] tracking-widest uppercase font-mono text-[#C9A84C] bg-[#C9A84C]/10 px-1.5 py-0.5 rounded">
                        Próximamente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{cat.description}</p>
                </div>

                {/* Toggle email */}
                <div className="flex justify-center">
                  {cat.emailSupported ? (
                    <CategoryToggle
                      checked={emailOn}
                      disabled={savingKey === emailKey || cat.status === "soon"}
                      onChange={(v) => setPref(cat.id, "email", v)}
                    />
                  ) : (
                    <span className="text-[10px] text-gray-600">—</span>
                  )}
                </div>

                {/* Toggle push */}
                <div className="flex justify-center">
                  {cat.pushSupported ? (
                    <CategoryToggle
                      checked={pushOn && browserSubscribed}
                      disabled={
                        savingKey === pushKey ||
                        cat.status === "soon" ||
                        !browserSubscribed
                      }
                      onChange={(v) => setPref(cat.id, "push", v)}
                    />
                  ) : (
                    <span className="text-[10px] text-gray-600">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-gray-500 text-center mt-8 leading-relaxed">
          Tus datos de notificaciones se gestionan según nuestra{" "}
          <Link
            href="/legal/privacidad"
            className="text-[#C9A84C] hover:underline"
          >
            política de privacidad
          </Link>
          . Puedes darte de baja por categoría o por completo en cualquier momento.
        </p>
      </div>
    </div>
  );
}

/* ---------- Toggle compacto reutilizable ---------- */

function CategoryToggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        background: checked
          ? "linear-gradient(135deg, #C9A84C, #E8C76B)"
          : "rgba(255,255,255,0.1)",
        position: "relative",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "background 0.2s",
        border: checked
          ? "1px solid rgba(255,255,255,0.2)"
          : "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 1,
          left: checked ? 19 : 1,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
      />
    </button>
  );
}
