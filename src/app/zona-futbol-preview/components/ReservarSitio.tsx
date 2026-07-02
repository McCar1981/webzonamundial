"use client";

// Captura de email de la landing puente a Zona Futbol. Fricción mínima (1 campo,
// sin cuenta), copy HONESTO: es una reserva/lista de aviso de lanzamiento, no un
// alta a un producto que aún no existe. POST /api/zona-futbol/reservar →
// subscribe({kind:'daily-digest', source:'zona-futbol-waitlist'}). Sin emojis.

import { useState } from "react";
import { Check } from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ReservarSitio() {
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState(""); // honeypot anti-bot
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
      const res = await fetch("/api/zona-futbol/reservar", {
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
    <section
      id="reservar"
      className="py-16 sm:py-20 px-3 sm:px-4"
      role="region"
      aria-label="Reserva tu sitio en Zona Futbol"
    >
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-black text-2xl sm:text-3xl text-white mb-3">
          Reserva tu sitio en Zona Futbol
        </h2>
        <p className="text-sm sm:text-base text-[#cbd5e1] leading-relaxed mb-8 max-w-xl mx-auto">
          Estamos construyendo la temporada de ligas de clubes. Déjanos tu email y
          serás de los primeros en entrar al abrir, con ventajas de fundador.
          Mientras tanto te llega el resumen del fútbol. Sin cuenta, baja en un clic.
        </p>

        {status === "done" ? (
          <p
            role="status"
            className="inline-flex items-center gap-2 text-[#22c55e] font-black text-base sm:text-lg"
          >
            <Check size={20} strokeWidth={3} aria-hidden /> Hecho. Te avisaremos en cuanto abra Zona Futbol.
          </p>
        ) : (
          <>
            <form
              onSubmit={submit}
              className="flex flex-wrap gap-3 justify-center max-w-lg mx-auto"
            >
              {/* honeypot anti-bot: oculto */}
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
                className="flex-1 min-w-0 basis-[220px] px-4 py-3 rounded-xl text-[15px] text-white outline-none bg-white/[0.04]"
                style={{ border: `1px solid ${status === "error" ? "#ef6a6a" : "rgba(212,175,55,0.35)"}` }}
              />
              <button
                type="submit"
                disabled={status === "sending"}
                className="whitespace-nowrap rounded-xl font-black text-[15px] px-7 py-3 text-[#0A1422] disabled:opacity-70"
                style={{ background: "linear-gradient(135deg, #D4AF37, #ffd699)", cursor: status === "sending" ? "default" : "pointer" }}
              >
                {status === "sending" ? "Guardando…" : "Reservar mi sitio"}
              </button>
            </form>
            <p
              className="mt-3 text-xs"
              style={{ color: status === "error" ? "#ef6a6a" : "#6a7a9a" }}
            >
              {status === "error" ? msg : "Sin cuenta, sin spam. Baja en un clic cuando quieras."}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
