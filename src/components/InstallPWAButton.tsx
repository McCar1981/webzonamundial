"use client";

import { useEffect, useState } from "react";

/**
 * Evento beforeinstallprompt (Chromium). No está en lib.dom todavía con tipos
 * estables, así que lo declaramos localmente.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

type Mode = "installable" | "ios" | "installed" | "unsupported";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari expone navigator.standalone
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /iPhone|iPad|iPod/i.test(ua);
}

/**
 * Botón de instalación de la PWA.
 * - Android / desktop (Chromium): captura `beforeinstallprompt` y muestra el
 *   diálogo nativo de instalación al pulsar.
 * - iOS (Safari): no expone API de instalación → mostramos instrucciones
 *   "Compartir → Añadir a pantalla de inicio".
 * - Ya instalada (standalone): no renderiza nada.
 */
export default function InstallPWAButton() {
  const [mode, setMode] = useState<Mode>("unsupported");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setMode("installed");
      return;
    }
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
      setMode("installed");
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
    if (choice.outcome === "accepted") {
      setMode("installed");
    }
    setDeferred(null);
  }

  if (mode === "installed") return null;

  const goldBtn: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "16px 32px",
    borderRadius: 999,
    background: "linear-gradient(135deg, #C9A84C, #E8C76B 50%, #FDE68A)",
    color: "#1A1208",
    fontWeight: 700,
    fontSize: 15,
    textDecoration: "none",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 0 40px -8px rgba(201,168,76,0.7)",
  };

  const DownloadIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );

  // iOS: botón que despliega instrucciones (no hay API de instalación).
  if (mode === "ios") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <button type="button" onClick={() => setShowIosHelp((v) => !v)} style={goldBtn}>
          {DownloadIcon}
          Instalar en mi iPhone
        </button>
        {showIosHelp && (
          <div
            style={{
              maxWidth: 360,
              textAlign: "left",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(201,168,76,0.25)",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <p style={{ margin: "0 0 12px", color: "#FDE68A", fontWeight: 700, fontSize: 14 }}>
              En Safari, en 2 pasos:
            </p>
            <ol style={{ margin: 0, paddingLeft: 20, color: "#94A3B8", fontSize: 14, lineHeight: 1.7 }}>
              <li>
                Toca el botón <strong style={{ color: "#fff" }}>Compartir</strong>{" "}
                <span aria-hidden>(el cuadrado con la flecha hacia arriba)</span>.
              </li>
              <li>
                Elige <strong style={{ color: "#fff" }}>Añadir a pantalla de inicio</strong> y confirma.
              </li>
            </ol>
          </div>
        )}
      </div>
    );
  }

  // Android / desktop con prompt disponible.
  if (mode === "installable") {
    return (
      <button type="button" onClick={handleInstall} style={goldBtn}>
        {DownloadIcon}
        Instalar la app
      </button>
    );
  }

  // Navegador sin soporte de instalación (o aún no disparó el evento):
  // ofrecemos guía genérica de "Añadir a inicio" desde el menú del navegador.
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <button type="button" onClick={() => setShowIosHelp((v) => !v)} style={goldBtn}>
        {DownloadIcon}
        Instalar la app
      </button>
      {showIosHelp && (
        <div
          style={{
            maxWidth: 380,
            textAlign: "left",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(201,168,76,0.25)",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <p style={{ margin: "0 0 12px", color: "#FDE68A", fontWeight: 700, fontSize: 14 }}>
            Para instalarla:
          </p>
          <p style={{ margin: 0, color: "#94A3B8", fontSize: 14, lineHeight: 1.6 }}>
            Abre el menú de tu navegador y elige{" "}
            <strong style={{ color: "#fff" }}>Instalar app</strong> o{" "}
            <strong style={{ color: "#fff" }}>Añadir a pantalla de inicio</strong>.
            En el móvil suele estar en el menú de los tres puntos.
          </p>
        </div>
      )}
    </div>
  );
}
