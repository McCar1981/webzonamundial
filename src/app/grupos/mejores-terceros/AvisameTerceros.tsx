"use client";

// src/app/grupos/mejores-terceros/AvisameTerceros.tsx
//
// Captura de email de MÍNIMA fricción (1 campo, SIN cuenta) en el punto de
// máxima atención: justo bajo la tabla en vivo, donde el visitante acaba de
// mirar si su selección entra. Es la única palanca que monetiza al ~98,7% de
// la ola que NO se registra (intención informacional): le pedimos lo que le
// importa ahora (estar al tanto de la carrera de terceros) con una barrera
// mínima, y construimos una lista propia reimpactable en eliminatorias.
//
// POST /api/terceros/avisame → subscribe({kind:'daily-digest'}). Honesto: es el
// resumen diario del Mundial (con baja en un clic), no una cuenta.
// Reduce-motion safe (sin animaciones; feedback estático).

import { useState } from "react";
import { Check } from "lucide-react";

const GOLD = "#c9a84c", GOLD2 = "#e8d48b", DIM = "#6e6552", GREEN = "#22c55e", RED = "#ef6a6a";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AvisameTerceros() {
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState(""); // honeypot anti-bot (los humanos no lo ven)
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim();
    if (!EMAIL_RE.test(clean)) {
      setStatus("error");
      setMsg("Escribe un email válido.");
      return;
    }
    setStatus("sending");
    setMsg("");
    try {
      const res = await fetch("/api/terceros/avisame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean, website: hp }),
      });
      if (res.ok) {
        setStatus("done");
      } else {
        const j = await res.json().catch(() => ({}));
        setStatus("error");
        setMsg(
          j?.error === "rate_limited"
            ? "Demasiados intentos. Inténtalo en unos minutos."
            : "No pudimos guardarlo. Inténtalo de nuevo.",
        );
      }
    } catch {
      setStatus("error");
      setMsg("Sin conexión. Inténtalo de nuevo.");
    }
  };

  return (
    <aside
      style={{
        margin: "16px 0 8px",
        padding: "18px 18px",
        borderRadius: 16,
        border: "1px solid rgba(201,168,76,0.28)",
        background: "linear-gradient(135deg, rgba(201,168,76,0.10), rgba(201,168,76,0.02))",
      }}
    >
      {status === "done" ? (
        <p role="status" style={{ margin: 0, color: GREEN, fontWeight: 800, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Check size={18} strokeWidth={3} aria-hidden /> ¡Hecho! Te llegará el resumen diario del Mundial.
        </p>
      ) : (
        <>
          <p style={{ color: "#fff", fontSize: 18, fontWeight: 800, margin: "0 0 6px", lineHeight: 1.25 }}>
            ¿Pasará tu selección? No te lo pierdas.
          </p>
          <p style={{ fontSize: 14.5, lineHeight: 1.55, margin: "0 0 14px" }}>
            Déjanos tu email y recibe el <b style={{ color: "#fff" }}>resumen diario del Mundial</b>: lo importante del día
            —incluida la carrera por los mejores terceros— hasta que se cierren los grupos el 27 de junio.
          </p>
          <form onSubmit={submit} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {/* honeypot anti-bot: oculto; humanos no lo ven ni lo tabulan */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
            />
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
              aria-label="Tu email"
              style={{
                flex: "1 1 220px", minWidth: 0, padding: "12px 14px", borderRadius: 12, fontSize: 15,
                border: `1px solid ${status === "error" ? RED : "rgba(255,255,255,0.18)"}`,
                background: "rgba(255,255,255,0.04)", color: "#fff", outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={status === "sending"}
              style={{
                whiteSpace: "nowrap", border: "none", cursor: status === "sending" ? "default" : "pointer",
                background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`, color: "#0a0906",
                fontWeight: 800, fontSize: 15, padding: "12px 24px", borderRadius: 12,
                opacity: status === "sending" ? 0.7 : 1,
              }}
            >
              {status === "sending" ? "Guardando…" : "Avísame"}
            </button>
          </form>
          <p style={{ margin: "10px 2px 0", fontSize: 12, color: status === "error" ? RED : DIM }}>
            {status === "error" ? msg : "Sin cuenta, sin spam. Baja en un clic cuando quieras."}
          </p>
        </>
      )}
    </aside>
  );
}
