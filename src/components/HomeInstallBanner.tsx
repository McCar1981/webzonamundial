"use client";

// Banner de instalación de la PWA para el HOME.
//
// Misma lógica probada de InstallPWAButton (captura beforeinstallprompt en
// Android/desktop Chromium e instala con el diálogo nativo; en iOS muestra
// las instrucciones de "Compartir → Añadir a inicio"), pero presentado como
// una barra discreta y descartable dentro de la home para que el usuario no
// tenga que ir a /descarga.
//
// Se oculta solo si:
//   - La app ya está instalada (display-mode standalone / navigator.standalone)
//   - El navegador no es instalable y no es iOS (no hay nada que ofrecer)
//   - El usuario la descartó hace menos de REASK_DAYS

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

type Mode = "hidden" | "installable" | "ios";

const DISMISS_KEY = "zm.pwa.homeBannerDismissedAt";
const REASK_DAYS = 7;

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
}

function dismissedRecently(): boolean {
  try {
    const at = parseInt(localStorage.getItem(DISMISS_KEY) || "0", 10);
    if (!at) return false;
    return (Date.now() - at) / (1000 * 60 * 60 * 24) < REASK_DAYS;
  } catch {
    return false;
  }
}

export default function HomeInstallBanner() {
  const [mode, setMode] = useState<Mode>("hidden");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (dismissedRecently()) return;

    if (isIos()) {
      setMode("ios");
      return;
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setMode("installable");
    };
    const onInstalled = () => {
      setMode("hidden");
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setMode("hidden");
    setDeferred(null);
  }

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setMode("hidden");
    setShowIosHelp(false);
  }

  if (mode === "hidden") return null;

  return (
    <div style={{ padding: "0 20px", margin: "8px auto 0", maxWidth: 1100 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          background: "linear-gradient(180deg, #0F1F30, #0B1825)",
          border: "1px solid rgba(201,168,76,0.35)",
          borderRadius: 16,
          padding: "14px 18px",
          boxShadow: "0 12px 40px -16px rgba(0,0,0,0.55)",
        }}
      >
        <span
          aria-hidden
          style={{
            flexShrink: 0,
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "linear-gradient(135deg,#C9A84C,#E8C76B)",
            color: "#1A1208",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PhoneIcon />
        </span>

        <div style={{ flex: 1, minWidth: 180 }}>
          <p
            style={{
              margin: "0 0 2px",
              fontFamily: "'Outfit',sans-serif",
              fontWeight: 800,
              fontSize: 16,
              color: "#fff",
              letterSpacing: "-0.01em",
            }}
          >
            Instala ZonaMundial en tu móvil
          </p>
          <p style={{ margin: 0, fontSize: 12.5, color: "#94A3B8", lineHeight: 1.4 }}>
            Acceso directo desde la pantalla de inicio, sin tienda de apps.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <button
            type="button"
            onClick={mode === "ios" ? () => setShowIosHelp((v) => !v) : handleInstall}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 20px",
              borderRadius: 999,
              background: "linear-gradient(135deg, #C9A84C, #E8C76B 50%, #FDE68A)",
              color: "#1A1208",
              fontWeight: 800,
              fontSize: 14,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 18px -4px rgba(201,168,76,0.6)",
            }}
          >
            <DownloadIcon />
            {mode === "ios" ? "Instalar en iPhone" : "Instalar la app"}
          </button>

          <button
            type="button"
            onClick={dismiss}
            aria-label="Cerrar"
            style={{
              flexShrink: 0,
              width: 34,
              height: 34,
              borderRadius: 999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#94A3B8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {mode === "ios" && showIosHelp && (
          <div
            style={{
              flexBasis: "100%",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(201,168,76,0.25)",
              borderRadius: 14,
              padding: 16,
            }}
          >
            <p style={{ margin: "0 0 10px", color: "#FDE68A", fontWeight: 700, fontSize: 14 }}>
              En Safari, en 2 pasos:
            </p>
            <ol style={{ margin: 0, paddingLeft: 20, color: "#94A3B8", fontSize: 14, lineHeight: 1.7 }}>
              <li>
                Toca el botón <strong style={{ color: "#fff" }}>Compartir</strong> (el cuadrado con la
                flecha hacia arriba).
              </li>
              <li>
                Elige <strong style={{ color: "#fff" }}>Añadir a pantalla de inicio</strong> y confirma.
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="M11 18.5h2" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
