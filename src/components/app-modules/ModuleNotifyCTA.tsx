// src/components/app-modules/ModuleNotifyCTA.tsx
// CTA universal para las landings de cada módulo /app/[slug].
//
// Modos:
//   "notify"   → Captura email "Avísame cuando lance" (cuando la app aún no existe).
//   "download" → Botones App Store + Google Play (cuando la app esté publicada).
//
// El modo se decide globalmente con la env var NEXT_PUBLIC_APP_AVAILABILITY:
//   - undefined o "waitlist" → "notify"
//   - "live"                 → "download"
//
// Esto permite cambiar el comportamiento de las 13 landings cambiando 1 env var.

"use client";

import { useEffect, useState } from "react";

type Mode = "notify" | "download";

interface Props {
  /** Slug del módulo (predicciones, fantasy, ia-coach, etc.) */
  slug: string;
  /** Etiqueta legible del módulo (ej: "Fantasy Mundial") */
  label: string;
  /** Forzar un modo manualmente (override de la env var) */
  modeOverride?: Mode;
  /** URLs de las apps. Solo se usan en modo "download". */
  appStoreUrl?: string;
  playStoreUrl?: string;
}

const APP_AVAILABILITY = process.env.NEXT_PUBLIC_APP_AVAILABILITY || "waitlist";
const APP_STORE_DEFAULT = process.env.NEXT_PUBLIC_APP_STORE_URL || "";
const PLAY_STORE_DEFAULT = process.env.NEXT_PUBLIC_PLAY_STORE_URL || "";

export default function ModuleNotifyCTA({
  slug,
  label,
  modeOverride,
  appStoreUrl,
  playStoreUrl,
}: Props) {
  const mode: Mode = modeOverride ?? (APP_AVAILABILITY === "live" ? "download" : "notify");

  const [count, setCount] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cargar count actual al montar
  useEffect(() => {
    if (mode !== "notify") return;
    fetch(`/api/notify-module/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.total === "number") setCount(d.total);
      })
      .catch(() => {});
  }, [slug, mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Email no válido");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMsg(null);
    try {
      const r = await fetch(`/api/notify-module/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "module-landing" }),
      });
      const data = await r.json();
      if (r.ok) {
        setStatus("ok");
        if (typeof data.total === "number") setCount(data.total);
      } else {
        setErrorMsg(data.error || "Error desconocido");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Error de red. Inténtalo en un momento.");
      setStatus("error");
    }
  }

  // ===== Modo DOWNLOAD =====
  if (mode === "download") {
    const appUrl = appStoreUrl || APP_STORE_DEFAULT;
    const playUrl = playStoreUrl || PLAY_STORE_DEFAULT;
    return (
      <div
        style={{
          padding: "26px 24px",
          borderRadius: 18,
          border: "1px solid rgba(201,168,76,0.30)",
          background:
            "radial-gradient(ellipse 80% 100% at 0% 0%, rgba(201,168,76,0.10), transparent 70%), linear-gradient(180deg, rgba(15,31,48,0.7), rgba(11,24,37,0.4))",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "JetBrains Mono, ui-monospace, monospace",
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#C9A84C",
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          // DESCARGA LA APP
        </div>
        <h3 style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 18, letterSpacing: "-0.02em" }}>
          {label} ya está disponible
        </h3>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {appUrl && (
            <a
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "13px 22px",
                borderRadius: 12,
                background: "linear-gradient(135deg, #C9A84C, #FDE68A)",
                color: "#1A1208",
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
                boxShadow: "0 0 30px -8px rgba(201,168,76,0.55)",
              }}
            >
               App Store
            </a>
          )}
          {playUrl && (
            <a
              href={playUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "13px 22px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.05)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              ▶ Google Play
            </a>
          )}
        </div>
      </div>
    );
  }

  // ===== Modo NOTIFY (lead capture) =====
  return (
    <div
      style={{
        padding: "26px 24px",
        borderRadius: 18,
        border: "1px solid rgba(201,168,76,0.30)",
        background:
          "radial-gradient(ellipse 80% 100% at 0% 0%, rgba(201,168,76,0.10), transparent 70%), linear-gradient(180deg, rgba(15,31,48,0.7), rgba(11,24,37,0.4))",
      }}
    >
      <div
        style={{
          fontFamily: "JetBrains Mono, ui-monospace, monospace",
          fontSize: 11,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#C9A84C",
          fontWeight: 700,
          marginBottom: 10,
        }}
      >
        // PRE-LANZAMIENTO
      </div>
      <h3
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "#fff",
          margin: "0 0 6px",
          letterSpacing: "-0.02em",
        }}
      >
        Avísame cuando se active {label}
      </h3>
      <p style={{ fontSize: 13.5, color: "#94a3b8", margin: "0 0 18px", lineHeight: 1.55 }}>
        Sin compromiso. Te enviaremos un email cuando este módulo esté disponible en la app — y solo
        para esto, no spam.
      </p>

      {status === "ok" ? (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: 12,
            background: "linear-gradient(90deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))",
            border: "1px solid rgba(16,185,129,0.4)",
            color: "#6ee7b7",
            fontSize: 14,
          }}
        >
          🔔 Estás en la lista. Te avisaremos por email cuando lance {label}.
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
            required
            disabled={status === "loading"}
            style={{
              flex: "1 1 220px",
              minWidth: 0,
              padding: "12px 16px",
              borderRadius: 99,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "#fff",
              fontSize: 14,
              fontFamily: "inherit",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            style={{
              padding: "12px 22px",
              borderRadius: 99,
              border: "none",
              background: "linear-gradient(135deg, #C9A84C, #FDE68A)",
              color: "#1A1208",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 0 24px -8px rgba(201,168,76,0.5)",
              opacity: status === "loading" ? 0.6 : 1,
            }}
          >
            {status === "loading" ? "Enviando…" : "🔔 Avísame"}
          </button>
        </form>
      )}

      {status === "error" && errorMsg && (
        <p style={{ fontSize: 12, color: "#fca5a5", marginTop: 10 }}>{errorMsg}</p>
      )}

      {count !== null && count > 0 && (
        <p
          style={{
            fontSize: 12,
            color: "#94a3b8",
            marginTop: 14,
            fontFamily: "JetBrains Mono, ui-monospace, monospace",
            letterSpacing: "0.04em",
          }}
        >
          ● {count.toLocaleString("es-ES")} {count === 1 ? "persona ya está" : "personas ya están"} en la lista
        </p>
      )}
    </div>
  );
}
