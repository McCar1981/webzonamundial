// src/app/eliminar-cuenta/page.tsx
//
// Página de solicitud de eliminación de cuenta (RGPD art. 17 / "derecho al
// olvido"). Conserva el sistema visual del resto del sitio (fondo #000000,
// dorado #c9a84c, fuente Outfit). Cliente-side porque maneja un formulario
// con estado de envío.

"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";

const BG = "#000000";
const BG2 = "#0a0906";
const BG3 = "#14110a";
const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const GOLD3 = "#FDE68A";
const TEXT = "#e6decb";
const MUTED = "#a69a82";
const DIM = "#8b8168";
const BORDER = "rgba(201,168,76,0.18)";
const BORDER_STRONG = "rgba(201,168,76,0.5)";
const DANGER = "#fca5a5";

type Status = "idle" | "submitting" | "success" | "error";

export default function EliminarCuentaPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [motivo, setMotivo] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/eliminar-cuenta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, motivo }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo procesar la solicitud.");
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Error de red. Inténtalo de nuevo.",
      );
    }
  }

  return (
    <main
      style={{
        background: BG,
        minHeight: "100vh",
        color: TEXT,
        padding: "60px 20px 80px",
        fontFamily: "'Outfit', system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            color: GOLD,
            fontSize: 13,
            textDecoration: "none",
            opacity: 0.75,
          }}
        >
          ← Volver al inicio
        </Link>

        <p
          style={{
            color: GOLD,
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            fontWeight: 700,
            marginTop: 28,
            marginBottom: 10,
          }}
        >
          Tus datos · Derecho al olvido
        </p>

        <h1
          style={{
            color: GOLD2,
            fontSize: "clamp(28px, 5vw, 40px)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            margin: "0 0 16px",
          }}
        >
          Eliminar tu cuenta de ZonaMundial
        </h1>

        <p
          style={{
            color: MUTED,
            fontSize: 16,
            lineHeight: 1.65,
            marginBottom: 28,
          }}
        >
          Puedes solicitar en cualquier momento la eliminación de tu cuenta y
          de los datos personales asociados a ella. Procesamos cada solicitud
          de forma manual y completamos el borrado en un plazo máximo de{" "}
          <strong style={{ color: TEXT }}>30 días naturales</strong>, conforme
          al artículo 17 del Reglamento General de Protección de Datos (RGPD)
          de la Unión Europea.
        </p>

        {/* ── Bloque informativo: qué se elimina ── */}
        <section
          aria-label="Qué datos se eliminan"
          style={{
            marginBottom: 16,
            padding: "20px 22px",
            background: BG2,
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
          }}
        >
          <h2
            style={{
              color: GOLD3,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              margin: "0 0 12px",
            }}
          >
            Qué se elimina
          </h2>
          <ul
            style={{
              margin: 0,
              padding: "0 0 0 4px",
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {[
              "Tu cuenta de usuario y credenciales de acceso",
              "Todas tus predicciones, picks de bracket y fantasy",
              "Tu historial de actividad, rankings y logros",
              "Datos personales: email, nombre, avatar, preferencias",
              "Suscripciones a newsletter y notificaciones push",
            ].map((item) => (
              <li
                key={item}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  fontSize: 14.5,
                  color: TEXT,
                  lineHeight: 1.55,
                }}
              >
                <span aria-hidden style={{ color: GOLD2, flexShrink: 0 }}>
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Bloque informativo: qué puede conservarse ── */}
        <section
          aria-label="Datos que pueden conservarse"
          style={{
            marginBottom: 32,
            padding: "20px 22px",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14,
          }}
        >
          <h2
            style={{
              color: MUTED,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              margin: "0 0 12px",
            }}
          >
            Qué puede conservarse hasta 90 días
          </h2>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: MUTED }}>
            Algunos datos <strong style={{ color: TEXT }}>agregados y
            anónimos</strong> pueden conservarse hasta 90 días adicionales con
            fines estadísticos: rankings globales históricos, conteos de
            participación por país, estadísticas de uso de la plataforma. En
            todos los casos sin posibilidad de identificarte personalmente.
          </p>
          <p
            style={{
              margin: "12px 0 0",
              fontSize: 13,
              lineHeight: 1.5,
              color: DIM,
            }}
          >
            También retenemos lo mínimo legalmente exigible (facturas si
            adquiriste un producto de pago, logs de seguridad) durante los
            plazos que marca la ley española.
          </p>
        </section>

        {/* ── Formulario o resultado ── */}
        {status === "success" ? (
          <SuccessBox />
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{
              background: BG2,
              border: `1px solid ${BORDER_STRONG}`,
              borderRadius: 16,
              padding: "26px 24px",
              boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
            }}
            noValidate
          >
            <h2
              style={{
                color: "#fff",
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: "-0.01em",
                margin: "0 0 6px",
              }}
            >
              Formulario de solicitud
            </h2>
            <p
              style={{
                margin: "0 0 22px",
                fontSize: 13,
                color: MUTED,
                lineHeight: 1.5,
              }}
            >
              Recibirás un email de confirmación a la dirección que indiques.
              Si nunca registraste cuenta con ese email, no procesaremos la
              solicitud.
            </p>

            <Field
              id="email"
              label="Email asociado a la cuenta *"
              hint="El mismo con el que te registraste."
            >
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                style={inputStyle}
                disabled={status === "submitting"}
              />
            </Field>

            <Field
              id="username"
              label="Nombre de usuario *"
              hint="El nombre público que usas en la app."
            >
              <input
                id="username"
                type="text"
                required
                minLength={2}
                maxLength={80}
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej. messi10"
                style={inputStyle}
                disabled={status === "submitting"}
              />
            </Field>

            <Field
              id="motivo"
              label="Motivo (opcional)"
              hint="Nos ayuda a mejorar el producto. No es obligatorio."
            >
              <textarea
                id="motivo"
                maxLength={1000}
                rows={4}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Si quieres contarnos por qué te vas, lo leeremos atentamente."
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  minHeight: 96,
                  fontFamily: "inherit",
                }}
                disabled={status === "submitting"}
              />
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 11,
                  color: DIM,
                  textAlign: "right",
                }}
              >
                {motivo.length}/1000
              </p>
            </Field>

            {status === "error" && errorMsg && (
              <div
                role="alert"
                style={{
                  margin: "0 0 16px",
                  padding: "12px 14px",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 10,
                  color: DANGER,
                  fontSize: 13.5,
                  lineHeight: 1.5,
                }}
              >
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              style={{
                width: "100%",
                background:
                  status === "submitting"
                    ? "rgba(201,168,76,0.4)"
                    : "linear-gradient(135deg,#C9A84C,#E8C76B)",
                color: "#1A1208",
                border: "none",
                borderRadius: 12,
                padding: "14px 22px",
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: "0.02em",
                cursor: status === "submitting" ? "wait" : "pointer",
                boxShadow: "0 6px 18px rgba(201,168,76,0.32)",
                fontFamily: "inherit",
              }}
            >
              {status === "submitting"
                ? "Enviando solicitud…"
                : "Enviar solicitud de eliminación"}
            </button>

            <p
              style={{
                margin: "14px 0 0",
                fontSize: 11.5,
                color: DIM,
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              Al enviar este formulario confirmas que eres titular de la cuenta
              y aceptas la{" "}
              <Link
                href="/legal/privacidad"
                style={{ color: GOLD2, textDecoration: "underline" }}
              >
                política de privacidad
              </Link>
              .
            </p>
          </form>
        )}

        {/* ── Contacto alternativo ── */}
        <p
          style={{
            marginTop: 32,
            fontSize: 13,
            color: MUTED,
            lineHeight: 1.6,
            textAlign: "center",
          }}
        >
          ¿Prefieres escribirnos directamente? Envía tu solicitud a{" "}
          <a
            href="mailto:soporte@zonamundial.app"
            style={{ color: GOLD2, textDecoration: "underline" }}
          >
            soporte@zonamundial.app
          </a>{" "}
          desde el email de tu cuenta.
        </p>
      </div>
    </main>
  );
}

/* ─── Sub-componentes ─── */

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label
        htmlFor={id}
        style={{
          display: "block",
          fontSize: 12.5,
          fontWeight: 700,
          color: TEXT,
          marginBottom: 6,
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <p
          style={{
            margin: "4px 0 0",
            fontSize: 11.5,
            color: DIM,
            lineHeight: 1.4,
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function SuccessBox() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background: "linear-gradient(180deg, rgba(34,197,94,0.08), " + BG2 + ")",
        border: "1px solid rgba(34,197,94,0.35)",
        borderRadius: 16,
        padding: "30px 28px",
        textAlign: "center",
      }}
    >
      <div
        aria-hidden
        style={{
          width: 56,
          height: 56,
          margin: "0 auto 16px",
          borderRadius: 16,
          background: "linear-gradient(135deg,#22c55e,#4ade80)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          color: "#062a14",
        }}
      >
        ✓
      </div>
      <h2
        style={{
          color: "#fff",
          fontSize: 22,
          fontWeight: 800,
          margin: "0 0 10px",
        }}
      >
        Solicitud recibida
      </h2>
      <p
        style={{
          margin: "0 0 14px",
          fontSize: 15,
          color: TEXT,
          lineHeight: 1.6,
        }}
      >
        Tu solicitud ha sido recibida. Procesaremos la eliminación en{" "}
        <strong style={{ color: GOLD2 }}>30 días</strong>.
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          color: MUTED,
          lineHeight: 1.55,
        }}
      >
        Te hemos enviado un email de confirmación. Si en 5 minutos no aparece
        en tu bandeja, revisa la carpeta de spam o escribe a{" "}
        <a
          href="mailto:soporte@zonamundial.app"
          style={{ color: GOLD2, textDecoration: "underline" }}
        >
          soporte@zonamundial.app
        </a>
        .
      </p>
      <Link
        href="/"
        style={{
          display: "inline-block",
          marginTop: 22,
          padding: "10px 22px",
          background: "transparent",
          border: `1px solid ${BORDER_STRONG}`,
          borderRadius: 10,
          color: GOLD2,
          textDecoration: "none",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.02em",
        }}
      >
        Volver al inicio
      </Link>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: BG3,
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 10,
  padding: "11px 14px",
  fontSize: 14,
  color: "#fff",
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.18s",
  boxSizing: "border-box",
};
