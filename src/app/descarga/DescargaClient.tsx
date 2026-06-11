"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import InstallPWAButton from "@/components/InstallPWAButton";

type Platform = "ios" | "android" | "desktop" | "other";

/**
 * Iconos SVG monocromáticos estilo Lucide (https://lucide.dev).
 * Reemplazan a los emojis del primer draft — más profesionales, vectoriales,
 * y consistentes con el resto del sistema de marca dorado.
 */
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const FEATURES: Array<{ icon: ReactNode; title: string; desc: string }> = [
  {
    // Target — Predicciones
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </Icon>
    ),
    title: "Predicciones",
    desc: "Acierta resultados y escala en el ranking.",
  },
  {
    // Star — Fantasy
    icon: (
      <Icon>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </Icon>
    ),
    title: "Fantasy",
    desc: "Crea tu equipo ideal y lidéralo.",
  },
  {
    // Sparkles — IA Coach
    icon: (
      <Icon>
        <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
        <path d="M5 3v4" />
        <path d="M3 5h4" />
        <path d="M19 17v4" />
        <path d="M17 19h4" />
      </Icon>
    ),
    title: "IA Coach",
    desc: "Tu asistente personal de análisis.",
  },
  {
    // Bar chart — Estadísticas
    icon: (
      <Icon>
        <line x1="12" y1="20" x2="12" y2="10" />
        <line x1="18" y1="20" x2="18" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </Icon>
    ),
    title: "Estadísticas",
    desc: "Datos avanzados de cada partido.",
  },
  {
    // Play (TV) — Streaming
    icon: (
      <Icon>
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
        <polygon points="10 8 16 10 10 12 10 8" fill="currentColor" stroke="none" />
      </Icon>
    ),
    title: "Streaming",
    desc: "Sigue partidos con tus creators favoritos.",
  },
  {
    // Trophy — Ligas privadas
    icon: (
      <Icon>
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </Icon>
    ),
    title: "Ligas privadas",
    desc: "Compite con amigos y familia.",
  },
  {
    // Brain — Trivia
    icon: (
      <Icon>
        <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
        <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
        <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      </Icon>
    ),
    title: "Trivia",
    desc: "Demuestra tu conocimiento futbolero.",
  },
  {
    // Book — Álbum digital
    icon: (
      <Icon>
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      </Icon>
    ),
    title: "Álbum digital",
    desc: "Colecciona y comparte cromos.",
  },
];

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

interface Props {
  qrSvg: string;
  qrTarget: string;
}

export default function DescargaClient({ qrSvg, qrTarget }: Props) {
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [emailMsg, setEmailMsg] = useState<string | null>(null);

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  // Mensaje pre-rellenado para WhatsApp.
  const waMessage = useMemo(
    () =>
      encodeURIComponent(
        `¡Mira ZonaMundial! La app del Mundial 2026 con predicciones, fantasy y mucho más.\n\nDescarga: ${qrTarget}`,
      ),
    [qrTarget],
  );

  // Si el user introduce un número (opcional), abre WhatsApp directo
  // a ese número con el mensaje. Si no, abre el selector de chat.
  const waHref = useMemo(() => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length >= 6) {
      return `https://wa.me/${cleanPhone}?text=${waMessage}`;
    }
    return `https://wa.me/?text=${waMessage}`;
  }, [phone, waMessage]);

  async function sendEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailStatus("error");
      setEmailMsg("Introduce un email válido");
      return;
    }
    setEmailStatus("loading");
    setEmailMsg(null);
    try {
      const r = await fetch("/api/app-link/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await r.json();
      if (r.ok && data.ok) {
        setEmailStatus("sent");
        setEmailMsg("¡Listo! Revisa tu email (puede tardar 1-2 minutos).");
      } else if (r.status === 429) {
        setEmailStatus("error");
        setEmailMsg("Demasiados envíos. Espera 1 minuto e inténtalo de nuevo.");
      } else {
        setEmailStatus("error");
        setEmailMsg("No pudimos enviar el email. Inténtalo en un momento.");
      }
    } catch {
      setEmailStatus("error");
      setEmailMsg("Error de red. Comprueba tu conexión.");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,0.08), transparent 60%), linear-gradient(180deg, #060B14, #0B1825)",
        color: "#fff",
        padding: "40px 16px 80px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Badge inminencia */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 16px",
              borderRadius: 999,
              background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))",
              border: "1px solid rgba(201,168,76,0.4)",
              fontFamily: "var(--zm-font-mono, 'JetBrains Mono', monospace)",
              fontSize: 11,
              letterSpacing: "0.18em",
              color: "#FDE68A",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#FDE68A",
                boxShadow: "0 0 12px #FDE68A",
                animation: "zm-pulse 1.6s ease-in-out infinite",
              }}
            />
            Instálala en segundos
          </div>
        </div>

        <h1
          style={{
            fontSize: "clamp(32px, 6vw, 56px)",
            fontWeight: 900,
            textAlign: "center",
            margin: 0,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          Instala{" "}
          <span
            style={{
              backgroundImage: "linear-gradient(135deg, #C9A84C, #E8C76B 50%, #FDE68A)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            ZonaMundial
          </span>
          <br />
          en tu móvil.
        </h1>
        <p
          style={{
            textAlign: "center",
            color: "#94A3B8",
            fontSize: "clamp(15px, 2vw, 18px)",
            maxWidth: 640,
            margin: "16px auto 0",
            lineHeight: 1.5,
          }}
        >
          Sin tiendas ni descargas pesadas. Añade la webapp a tu pantalla de
          inicio y ábrela como una app más — funciona al instante en iPhone y
          Android.
        </p>

        {/* Botón de instalación PWA (Android/desktop: prompt nativo; iOS:
            instrucciones Compartir → Añadir a inicio). */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
          <InstallPWAButton />
        </div>

        {/* Hero card: QR + envío */}
        <div
          style={{
            marginTop: 48,
            display: "grid",
            gridTemplateColumns: "minmax(280px, 340px) 1fr",
            gap: 40,
            alignItems: "center",
            background: "linear-gradient(180deg, rgba(15,31,48,0.7), rgba(11,24,37,0.4))",
            border: "1px solid rgba(201,168,76,0.25)",
            borderRadius: 24,
            padding: "clamp(24px, 4vw, 40px)",
          }}
          className="hero-card"
        >
          {/* QR side */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                background: "#fff",
                padding: 18,
                borderRadius: 20,
                boxShadow: "0 8px 28px rgba(0,0,0,0.35), 0 0 0 1px rgba(201,168,76,0.25)",
                position: "relative",
                width: 260,
                height: 260,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              className="qr-frame"
            >
              {/* Marco dorado decorativo */}
              <div
                style={{
                  position: "absolute",
                  inset: -4,
                  borderRadius: 22,
                  background:
                    "linear-gradient(135deg, #C9A84C, #FDE68A 50%, #C9A84C)",
                  zIndex: -1,
                  filter: "blur(2px)",
                  opacity: 0.5,
                }}
              />
              {/* SVG inline (server-rendered) — el wrapper le da tamaño */}
              <div
                aria-label="QR de descarga de ZonaMundial"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
                style={{ width: 224, height: 224, display: "block" }}
                className="qr-svg-wrap"
              />
            </div>
            <p
              style={{
                fontSize: 13,
                color: "#94A3B8",
                letterSpacing: "0.02em",
                margin: 0,
                textAlign: "center",
                maxWidth: 240,
                lineHeight: 1.5,
              }}
            >
              Apunta tu cámara aquí
              <br />
              <strong style={{ color: "#C9A84C" }}>desde el móvil</strong>
            </p>
          </div>

          {/* Email + WhatsApp side */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
            {platform === "ios" || platform === "android" ? (
              <MobileCTA platform={platform} />
            ) : (
              <>
                {/* Email form */}
                <div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      fontFamily: "var(--zm-font-mono, monospace)",
                      fontSize: 10,
                      letterSpacing: "0.22em",
                      color: "#C9A84C",
                      fontWeight: 700,
                      marginBottom: 10,
                      textTransform: "uppercase",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-10 5L2 7" />
                    </svg>
                    Envíame el link al email
                  </div>
                  <form onSubmit={sendEmail} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailStatus !== "idle") {
                          setEmailStatus("idle");
                          setEmailMsg(null);
                        }
                      }}
                      placeholder="tu@email.com"
                      disabled={emailStatus === "loading" || emailStatus === "sent"}
                      style={{
                        flex: 1,
                        minWidth: 200,
                        padding: "13px 16px",
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#fff",
                        fontSize: 14,
                      }}
                    />
                    <button
                      type="submit"
                      disabled={emailStatus === "loading" || emailStatus === "sent"}
                      style={{
                        padding: "13px 22px",
                        borderRadius: 12,
                        background:
                          emailStatus === "sent"
                            ? "rgba(34, 197, 94, 0.2)"
                            : "linear-gradient(135deg, #C9A84C, #E8C76B)",
                        border: "none",
                        color: emailStatus === "sent" ? "#86efac" : "#1A1208",
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: emailStatus === "loading" ? "wait" : "pointer",
                        opacity: emailStatus === "loading" ? 0.6 : 1,
                      }}
                    >
                      {emailStatus === "loading"
                        ? "Enviando..."
                        : emailStatus === "sent"
                          ? "✓ Enviado"
                          : "Envíame"}
                    </button>
                  </form>
                  {emailMsg && (
                    <p
                      style={{
                        margin: "8px 0 0",
                        fontSize: 12,
                        color: emailStatus === "error" ? "#fca5a5" : "#86efac",
                      }}
                    >
                      {emailMsg}
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                  <span
                    style={{
                      fontSize: 10,
                      color: "rgba(255,255,255,0.4)",
                      fontFamily: "var(--zm-font-mono, monospace)",
                      letterSpacing: "0.2em",
                    }}
                  >
                    O
                  </span>
                  <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                </div>

                {/* WhatsApp */}
                <div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      fontFamily: "var(--zm-font-mono, monospace)",
                      fontSize: 10,
                      letterSpacing: "0.22em",
                      color: "#25D366",
                      fontWeight: 700,
                      marginBottom: 10,
                      textTransform: "uppercase",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M20.5 3.5A11.85 11.85 0 0 0 12.04 0C5.5 0 .19 5.31.18 11.85a11.8 11.8 0 0 0 1.6 5.94L0 24l6.36-1.66a11.84 11.84 0 0 0 5.67 1.44h.01c6.54 0 11.85-5.31 11.86-11.84a11.78 11.78 0 0 0-3.4-8.44Zm-8.46 18.27h-.01a9.84 9.84 0 0 1-5.02-1.37l-.36-.21-3.77.98 1-3.67-.23-.38a9.83 9.83 0 0 1-1.51-5.27c0-5.43 4.42-9.85 9.86-9.85a9.79 9.79 0 0 1 6.97 2.89 9.79 9.79 0 0 1 2.89 6.97c0 5.43-4.43 9.85-9.86 9.85Z" />
                    </svg>
                    Envíalo a tu WhatsApp
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+34 600 000 000 (opcional)"
                      style={{
                        flex: 1,
                        minWidth: 200,
                        padding: "13px 16px",
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#fff",
                        fontSize: 14,
                      }}
                    />
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "13px 22px",
                        borderRadius: 12,
                        background: "linear-gradient(135deg, #25D366, #128C7E)",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 14,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      Abrir WhatsApp →
                    </a>
                  </div>
                  <p style={{ margin: "8px 0 0", fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                    Si dejas vacío el número, abrirá WhatsApp y eliges a quién
                    enviar el link (a ti mismo o a un amigo).
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Features grid */}
        <section style={{ marginTop: 64 }}>
          <h2
            style={{
              fontSize: "clamp(24px, 4vw, 36px)",
              fontWeight: 800,
              textAlign: "center",
              letterSpacing: "-0.02em",
              margin: "0 0 8px",
            }}
          >
            Qué vas a tener en la app
          </h2>
          <p style={{ textAlign: "center", color: "#94A3B8", margin: "0 0 36px" }}>
            12 módulos integrados para vivir el Mundial 2026 al máximo.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {FEATURES.map((f) => (
              <div
                key={f.title}
                style={{
                  padding: 20,
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  transition: "border-color 0.25s, background 0.25s",
                }}
                className="feature-card"
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.04))",
                    border: "1px solid rgba(201,168,76,0.25)",
                    color: "#FDE68A",
                    marginBottom: 14,
                  }}
                >
                  {f.icon}
                </div>
                <h3
                  style={{
                    margin: "0 0 4px",
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                    color: "#fff",
                  }}
                >
                  {f.title}
                </h3>
                <p style={{ margin: 0, fontSize: 12.5, color: "#94A3B8", lineHeight: 1.5 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div style={{ marginTop: 64, textAlign: "center" }}>
          <p
            style={{
              color: "#FDE68A",
              fontSize: 12,
              fontFamily: "var(--zm-font-mono, monospace)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: 700,
              margin: "0 0 8px",
            }}
          >
            Cuenta atrás final
          </p>
          <p
            style={{
              color: "#fff",
              fontSize: "clamp(18px, 2.4vw, 22px)",
              fontWeight: 800,
              letterSpacing: "-0.01em",
              maxWidth: 540,
              margin: "0 auto 20px",
              lineHeight: 1.3,
            }}
          >
            Los pre-registrados entran <span style={{ color: "#FDE68A" }}>el primer día</span>.
            <br />
            El resto, cuando podamos asignar plazas.
          </p>
          <Link
            href="/registro"
            style={{
              display: "inline-block",
              padding: "16px 32px",
              borderRadius: 999,
              background: "linear-gradient(135deg, #C9A84C, #E8C76B 50%, #FDE68A)",
              color: "#1A1208",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
              boxShadow: "0 0 40px -8px rgba(201,168,76,0.7)",
            }}
          >
            Reservar mi acceso prioritario →
          </Link>
        </div>
      </div>

      {/* Asegura que el SVG del QR se ajusta al wrapper */}
      <style>{`
        .qr-svg-wrap svg {
          width: 100% !important;
          height: 100% !important;
          display: block;
        }
        .feature-card:hover {
          background: rgba(201, 168, 76, 0.04) !important;
          border-color: rgba(201, 168, 76, 0.2) !important;
        }
        @keyframes zm-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        @media (max-width: 720px) {
          .hero-card {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function MobileCTA({ platform }: { platform: "ios" | "android" }) {
  const isIos = platform === "ios";
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "var(--zm-font-mono, monospace)",
          fontSize: 10,
          letterSpacing: "0.22em",
          color: "#FDE68A",
          fontWeight: 700,
          marginBottom: 14,
          textTransform: "uppercase",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#FDE68A",
            boxShadow: "0 0 8px #FDE68A",
            animation: "zm-pulse 1.6s ease-in-out infinite",
          }}
        />
        Instálala en segundos
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.01em" }}>
        Añádela a tu pantalla de inicio
      </h2>
      <p style={{ color: "#94A3B8", fontSize: 14, margin: "0 0 24px", lineHeight: 1.5 }}>
        {isIos
          ? "En Safari, toca Compartir y elige «Añadir a pantalla de inicio». La abrirás como una app, a pantalla completa."
          : "Toca el botón y confirma la instalación. La tendrás en tu pantalla de inicio, lista para abrir como una app más."}
      </p>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <InstallPWAButton />
      </div>
      <Link
        href="/registro"
        style={{
          display: "inline-block",
          padding: "12px 24px",
          borderRadius: 12,
          background: "transparent",
          color: "#FDE68A",
          fontWeight: 700,
          fontSize: 13,
          textDecoration: "none",
          border: "1px solid rgba(201,168,76,0.4)",
        }}
      >
        Crear mi cuenta gratis →
      </Link>
    </div>
  );
}
