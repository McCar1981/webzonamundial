"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Platform = "ios" | "android" | "desktop" | "other";

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
        {/* Eyebrow */}
        <div
          style={{
            fontFamily: "var(--zm-font-mono, 'JetBrains Mono', monospace)",
            fontSize: 11,
            letterSpacing: "0.22em",
            color: "#C9A84C",
            fontWeight: 700,
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          // ZONAMUNDIAL APP
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
          Llévatela{" "}
          <span
            style={{
              backgroundImage: "linear-gradient(135deg, #C9A84C, #E8C76B 50%, #FDE68A)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            al móvil
          </span>
          <br />
          en 3 segundos.
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
          Escanea el QR con la cámara de tu móvil o autoenvíate el enlace al
          email o WhatsApp. Así no pierdes tiempo buscando &quot;ZonaMundial&quot; en
          la tienda.
        </p>

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
                      fontFamily: "var(--zm-font-mono, monospace)",
                      fontSize: 10,
                      letterSpacing: "0.22em",
                      color: "#C9A84C",
                      fontWeight: 700,
                      marginBottom: 10,
                      textTransform: "uppercase",
                    }}
                  >
                    📧 Envíame el link al email
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
                      fontFamily: "var(--zm-font-mono, monospace)",
                      fontSize: 10,
                      letterSpacing: "0.22em",
                      color: "#25D366",
                      fontWeight: 700,
                      marginBottom: 10,
                      textTransform: "uppercase",
                    }}
                  >
                    💬 Envíalo a tu WhatsApp
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
            {[
              { icon: "🎯", title: "Predicciones", desc: "Acierta resultados y compite por premios." },
              { icon: "⭐", title: "Fantasy", desc: "Crea tu equipo ideal y lidéralo." },
              { icon: "🤖", title: "IA Coach", desc: "Tu asistente personal de análisis." },
              { icon: "📊", title: "Estadísticas", desc: "Datos avanzados de cada partido." },
              { icon: "📺", title: "Streaming", desc: "Sigue partidos con tus creators favoritos." },
              { icon: "🏆", title: "Ligas privadas", desc: "Compite con amigos y familia." },
              { icon: "🎲", title: "Trivia", desc: "Demuestra tu conocimiento futbolero." },
              { icon: "📖", title: "Álbum digital", desc: "Colecciona y comparte cromos." },
            ].map((f) => (
              <div
                key={f.title}
                style={{
                  padding: 20,
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
                <h3
                  style={{
                    margin: "0 0 4px",
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
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
          <p style={{ color: "#94A3B8", fontSize: 13, marginBottom: 12 }}>
            ¿Quieres ser de los primeros en probarla?
          </p>
          <Link
            href="/registro"
            style={{
              display: "inline-block",
              padding: "14px 28px",
              borderRadius: 999,
              background: "linear-gradient(135deg, #C9A84C, #E8C76B 50%, #FDE68A)",
              color: "#1A1208",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
              boxShadow: "0 0 30px -8px rgba(201,168,76,0.55)",
            }}
          >
            Pre-regístrate →
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
  const storeName = isIos ? "App Store" : "Google Play";
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontFamily: "var(--zm-font-mono, monospace)",
          fontSize: 10,
          letterSpacing: "0.22em",
          color: "#C9A84C",
          fontWeight: 700,
          marginBottom: 14,
          textTransform: "uppercase",
        }}
      >
        Estamos en tu dispositivo {isIos ? "iOS" : "Android"} ✨
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.01em" }}>
        Pronto en {storeName}
      </h2>
      <p style={{ color: "#94A3B8", fontSize: 14, margin: "0 0 24px", lineHeight: 1.5 }}>
        Estamos terminando los últimos detalles. Pre-regístrate y te avisamos
        cuando esté disponible para descarga.
      </p>
      <Link
        href="/registro"
        style={{
          display: "inline-block",
          padding: "14px 28px",
          borderRadius: 12,
          background: "linear-gradient(135deg, #C9A84C, #E8C76B 50%, #FDE68A)",
          color: "#1A1208",
          fontWeight: 700,
          fontSize: 14,
          textDecoration: "none",
          boxShadow: "0 0 30px -8px rgba(201,168,76,0.55)",
        }}
      >
        Avisarme cuando esté lista →
      </Link>
    </div>
  );
}
