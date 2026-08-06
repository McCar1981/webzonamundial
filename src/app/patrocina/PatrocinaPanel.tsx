"use client";

// Panel client de /patrocina: hero + propuesta de valor + paquetes + formulario
// de solicitud. Estilo inline (mismo patrón que ProPanel), acento dorado
// #C9A84C sobre fondo oscuro. El formulario POST → /api/patrocina (KV + email).

import { useState } from "react";
import type { ReactNode, CSSProperties, ChangeEvent, FormEvent } from "react";
import {
  Megaphone,
  Trophy,
  Zap,
  Users,
  CalendarDays,
  Check,
  Send,
  Loader2,
  CheckCircle2,
} from "lucide-react";

const GOLD = "#C9A84C";
const INK = "#0B1825";
const NAVY = "#13233A";

interface Paquete {
  icon: ReactNode;
  nombre: string;
  desde: string;
  bullets: string[];
  destacado?: boolean;
}

const PAQUETES: Paquete[] = [
  {
    icon: <CalendarDays size={22} />,
    nombre: "Quiniela del Mundial",
    desde: "desde 1.500 MXN",
    bullets: [
      "Tu logo en la sección de quiniela durante todo el torneo",
      "Mención en la crónica diaria del Mundial",
      "Enlace a tu web o promoción",
    ],
  },
  {
    icon: <Zap size={22} />,
    nombre: "Patrocinador de Partido",
    desde: "desde 4.000 MXN",
    destacado: true,
    bullets: [
      "Tu marca en el push de cada partido grande",
      "Presencia en el tablero en vivo del partido",
      "Logo en quiniela + crónica",
    ],
  },
  {
    icon: <Trophy size={22} />,
    nombre: "Patrocinador de la Final",
    desde: "desde 8.000 MXN",
    bullets: [
      "Máxima visibilidad el día más grande del torneo",
      "Push y crónica de la final presentados por tu marca",
      "Presencia destacada toda la semana de la final",
    ],
  },
];

const VALORES = [
  {
    icon: <Users size={24} />,
    titulo: "Hinchas mexicanos enganchados",
    texto:
      "Miles de aficionados siguen cada partido del Mundial y juegan la quiniela en vivo. Tu marca, justo donde miran.",
  },
  {
    icon: <CalendarDays size={24} />,
    titulo: "El momento del año",
    texto:
      "El Mundial es la mayor ventana de atención del fútbol. Cinco semanas en las que tu marca acompaña cada emoción.",
  },
  {
    icon: <Megaphone size={24} />,
    titulo: "Visibilidad real",
    texto:
      "No un banner perdido: tu marca dentro de la quiniela, en el push de partido y en la crónica diaria que la gente lee.",
  },
];

const CATEGORIAS = [
  "Bar deportivo / cantina",
  "Cervecera / bebidas",
  "Casa de apuestas / iGaming",
  "Remesas / fintech",
  "Ropa / equipación deportiva",
  "Otra",
];

type Estado = "idle" | "loading" | "success" | "error";

export default function PatrocinaPanel() {
  const [form, setForm] = useState({
    empresa: "",
    nombre: "",
    email: "",
    telefono: "",
    categoria: "",
    paquete: "",
    mensaje: "",
  });
  const [estado, setEstado] = useState<Estado>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const set = (k: keyof typeof form) => (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (estado === "loading") return;
    setEstado("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/patrocina", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setEstado("success");
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setErrorMsg(
        res.status === 429
          ? "Demasiados intentos. Espera un minuto e inténtalo de nuevo."
          : data.error || "No se pudo enviar. Inténtalo de nuevo."
      );
      setEstado("error");
    } catch {
      setErrorMsg("Error de conexión. Inténtalo de nuevo.");
      setEstado("error");
    }
  }

  return (
    <main style={{ background: INK, color: "#fff", minHeight: "100vh" }}>
      {/* ── HERO ── */}
      <section
        style={{
          background: `linear-gradient(135deg, ${NAVY}, ${INK} 60%, #0E1A2B)`,
          padding: "72px 20px 56px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <p
            style={{
              color: GOLD,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              margin: "0 0 14px",
            }}
          >
            Patrocinio · Mundial 2026
          </p>
          <h1
            style={{
              fontSize: "clamp(28px, 5vw, 44px)",
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
              margin: "0 0 18px",
              fontWeight: 800,
            }}
          >
            Pon tu marca en el Mundial,
            <br />
            junto a la afición mexicana
          </h1>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.6,
              color: "#B9C7D8",
              margin: "0 auto 28px",
              maxWidth: 600,
            }}
          >
            ZonaMundial es la app de la quiniela y las predicciones del Mundial
            2026. Patrocina la quiniela, el push de partido o la crónica diaria y
            acompaña a los hinchas durante todo el torneo.
          </p>
          <a
            href="#solicitar"
            style={{
              display: "inline-block",
              padding: "14px 30px",
              background: `linear-gradient(135deg, ${GOLD}, #FDE68A)`,
              color: "#1A1208",
              textDecoration: "none",
              borderRadius: 99,
              fontWeight: 800,
              fontSize: 15,
            }}
          >
            Quiero patrocinar
          </a>
        </div>
      </section>

      {/* ── POR QUÉ ── */}
      <section style={{ padding: "56px 20px", maxWidth: 1040, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 18,
          }}
        >
          {VALORES.map((v) => (
            <div
              key={v.titulo}
              style={{
                background: "#0F1D32",
                border: "1px solid #1E3046",
                borderRadius: 16,
                padding: "24px 22px",
              }}
            >
              <div style={{ color: GOLD, marginBottom: 12 }}>{v.icon}</div>
              <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>
                {v.titulo}
              </h3>
              <p style={{ margin: 0, color: "#9FB1C6", fontSize: 14, lineHeight: 1.6 }}>
                {v.texto}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PAQUETES ── */}
      <section style={{ padding: "8px 20px 56px", maxWidth: 1040, margin: "0 auto" }}>
        <h2
          style={{
            textAlign: "center",
            fontSize: 26,
            fontWeight: 800,
            margin: "0 0 8px",
            letterSpacing: "-0.01em",
          }}
        >
          Paquetes de patrocinio
        </h2>
        <p style={{ textAlign: "center", color: "#9FB1C6", margin: "0 0 32px", fontSize: 14 }}>
          Por todo el torneo · cobro adelantado · también lo adaptamos a tu marca
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 18,
          }}
        >
          {PAQUETES.map((p) => (
            <div
              key={p.nombre}
              style={{
                background: "#fff",
                color: "#111827",
                borderRadius: 18,
                padding: "26px 24px",
                border: p.destacado ? `2px solid ${GOLD}` : "2px solid transparent",
                boxShadow: p.destacado ? "0 14px 40px rgba(201,168,76,0.25)" : "none",
                position: "relative",
              }}
            >
              {p.destacado && (
                <span
                  style={{
                    position: "absolute",
                    top: -12,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: `linear-gradient(135deg, ${GOLD}, #FDE68A)`,
                    color: "#1A1208",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "4px 14px",
                    borderRadius: 99,
                  }}
                >
                  Más popular
                </span>
              )}
              <div style={{ color: GOLD, marginBottom: 12 }}>{p.icon}</div>
              <h3 style={{ margin: "0 0 4px", fontSize: 19, fontWeight: 800 }}>{p.nombre}</h3>
              <p style={{ margin: "0 0 18px", color: "#8C7437", fontWeight: 700, fontSize: 15 }}>
                {p.desde}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {p.bullets.map((b) => (
                  <li
                    key={b}
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "flex-start",
                      marginBottom: 10,
                      fontSize: 14,
                      lineHeight: 1.5,
                      color: "#374151",
                    }}
                  >
                    <Check size={17} style={{ color: GOLD, flexShrink: 0, marginTop: 2 }} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", color: "#7E94AD", fontSize: 13, marginTop: 24 }}>
          ¿Buscas algo distinto? Cuéntanoslo en el formulario y armamos un paquete a medida.
        </p>
      </section>

      {/* ── FORMULARIO ── */}
      <section
        id="solicitar"
        style={{ padding: "8px 20px 80px", maxWidth: 620, margin: "0 auto" }}
      >
        <div
          style={{
            background: "#fff",
            color: "#111827",
            borderRadius: 20,
            padding: "32px 28px",
            border: "1px solid #1E3046",
          }}
        >
          {estado === "success" ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <CheckCircle2 size={48} style={{ color: "#16a34a" }} />
              <h2 style={{ margin: "16px 0 8px", fontSize: 22, fontWeight: 800 }}>
                ¡Solicitud recibida!
              </h2>
              <p style={{ margin: 0, color: "#6b7280", fontSize: 15, lineHeight: 1.6 }}>
                Gracias por tu interés. Te responderemos al email que nos dejaste con los
                detalles y la propuesta. ⚽
              </p>
            </div>
          ) : (
            <>
              <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, letterSpacing: "-0.01em" }}>
                Solicita tu patrocinio
              </h2>
              <p style={{ margin: "0 0 22px", color: "#6b7280", fontSize: 14, lineHeight: 1.5 }}>
                Déjanos tus datos y te enviamos los detalles. Sin compromiso.
              </p>
              <form onSubmit={onSubmit}>
                <Field label="Empresa o marca *">
                  <input
                    required
                    value={form.empresa}
                    onChange={set("empresa")}
                    placeholder="Nombre de tu empresa"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Tu nombre *">
                  <input
                    required
                    value={form.nombre}
                    onChange={set("nombre")}
                    placeholder="Nombre y apellido"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Email *">
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="tucorreo@empresa.com"
                    style={inputStyle}
                  />
                </Field>
                <Field label="WhatsApp / Teléfono">
                  <input
                    value={form.telefono}
                    onChange={set("telefono")}
                    placeholder="Opcional, para responderte más rápido"
                    style={inputStyle}
                  />
                </Field>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <Field label="Categoría" style={{ flex: "1 1 200px" }}>
                    <select value={form.categoria} onChange={set("categoria")} style={inputStyle}>
                      <option value="">Selecciona…</option>
                      {CATEGORIAS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Paquete de interés" style={{ flex: "1 1 200px" }}>
                    <select value={form.paquete} onChange={set("paquete")} style={inputStyle}>
                      <option value="">Selecciona…</option>
                      {PAQUETES.map((p) => (
                        <option key={p.nombre} value={p.nombre}>
                          {p.nombre}
                        </option>
                      ))}
                      <option value="A medida">A medida</option>
                    </select>
                  </Field>
                </div>
                <Field label="Mensaje">
                  <textarea
                    value={form.mensaje}
                    onChange={set("mensaje")}
                    placeholder="Cuéntanos qué te interesa (opcional)"
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </Field>

                {estado === "error" && (
                  <p style={{ color: "#dc2626", fontSize: 13, margin: "0 0 12px" }}>{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={estado === "loading"}
                  style={{
                    width: "100%",
                    padding: "14px 20px",
                    background:
                      estado === "loading"
                        ? "#cbb46a"
                        : `linear-gradient(135deg, ${GOLD}, #FDE68A)`,
                    color: "#1A1208",
                    border: "none",
                    borderRadius: 99,
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: estado === "loading" ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {estado === "loading" ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Enviando…
                    </>
                  ) : (
                    <>
                      <Send size={18} /> Enviar solicitud
                    </>
                  )}
                </button>
                <p style={{ margin: "14px 0 0", color: "#9ca3af", fontSize: 12, textAlign: "center" }}>
                  También puedes escribirnos a{" "}
                  <a href="mailto:gol@zonamundial.app" style={{ color: "#8C7437", fontWeight: 600 }}>
                    gol@zonamundial.app
                  </a>
                </p>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  border: "1px solid #d1d5db",
  borderRadius: 10,
  fontSize: 15,
  color: "#111827",
  background: "#fff",
  boxSizing: "border-box",
};

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div style={{ marginBottom: 16, ...style }}>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 600,
          color: "#374151",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
