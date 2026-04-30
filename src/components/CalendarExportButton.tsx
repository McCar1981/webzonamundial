"use client";

// CalendarExportButton — punto de entrada al sistema de calendario.
// Botón visible que abre un modal con 3 opciones (Apple, Google, .ics).
//
// Variantes:
//   - "hero"   — pequeño y compacto (para banner del home)
//   - "panel"  — grande con descripción (para /calendario)
//
// Por defecto descarga el calendario completo (104 partidos). Si en el
// futuro queremos personalizado, este componente acepta `preset` con la
// query string ya construida.

import { useEffect, useState } from "react";

interface Props {
  /** Visual: 'panel' (grande) o 'hero' (compacto inline) */
  variant?: "panel" | "hero";
  /**
   * Query string sin "?" para personalizar el feed.
   * Ej. "teams=ar&phase=ko" → calendario Argentina solo eliminatorias.
   * Por defecto vacío = los 104 partidos.
   */
  preset?: string;
  /** Etiqueta del botón principal. Default: "Añadir a tu calendario". */
  label?: string;
}

export default function CalendarExportButton({
  variant = "panel",
  preset = "",
  label = "Añadir a tu calendario",
}: Props) {
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState("https://www.zonamundial.app");

  // Captura el origin real en cliente para construir las URLs
  // webcal:// y https:// con el dominio del usuario (útil en preview
  // deploys donde el dominio cambia).
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const qs = preset ? `?${preset}` : "";
  // URLs:
  //   - https://...    → descarga directa (.ics)
  //   - webcal://...   → suscripción viva (Apple Calendar nativo)
  //   - https://www.google.com/calendar/render?cid=https://...  → import Google
  const httpsUrl = `${origin}/api/calendar.ics${qs}`;
  const webcalUrl = httpsUrl.replace(/^https?:/, "webcal:");
  // Google Calendar quiere URL HTTPS pública en cid=
  const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(httpsUrl)}`;

  if (variant === "hero") {
    return (
      <>
        <CompactButton onClick={() => setOpen(true)} label={label} />
        {open ? (
          <ExportModal
            onClose={() => setOpen(false)}
            httpsUrl={httpsUrl}
            webcalUrl={webcalUrl}
            googleUrl={googleUrl}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <PanelButton onClick={() => setOpen(true)} label={label} />
      {open ? (
        <ExportModal
          onClose={() => setOpen(false)}
          httpsUrl={httpsUrl}
          webcalUrl={webcalUrl}
          googleUrl={googleUrl}
        />
      ) : null}
    </>
  );
}

/* ────────── Variants ────────── */

function CompactButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-4 py-2.5 text-xs font-bold text-[#c9a84c] transition-all hover:bg-[#c9a84c]/15 hover:border-[#c9a84c]/50"
    >
      <CalIcon />
      {label}
    </button>
  );
}

function PanelButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative inline-flex items-center gap-3 rounded-2xl px-7 py-4 font-bold text-[#030712] transition-all hover:scale-[1.02]"
      style={{
        background: "linear-gradient(135deg, #C9A84C, #E8D48B)",
        boxShadow:
          "0 0 0 1px rgba(232,212,139,0.55), 0 12px 30px -8px rgba(201,168,76,0.5)",
      }}
    >
      <CalIcon />
      <span className="text-sm">{label}</span>
      <svg
        className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.4}
          d="M13 7l5 5m0 0l-5 5m5-5H6"
        />
      </svg>
    </button>
  );
}

/* ────────── Modal ────────── */

function ExportModal({
  onClose,
  httpsUrl,
  webcalUrl,
  googleUrl,
}: {
  onClose: () => void;
  httpsUrl: string;
  webcalUrl: string;
  googleUrl: string;
}) {
  // Cerrar con Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Detectar Apple/iOS para sugerir webcal por defecto
  const isAppleDevice =
    typeof navigator !== "undefined" &&
    /iPhone|iPad|iPod|Mac/i.test(navigator.userAgent);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cal-export-title"
      onClick={onClose}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      style={{
        background: "rgba(6,11,20,0.85)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl border p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
        style={{
          borderColor: "rgba(201,168,76,0.25)",
          background: "linear-gradient(135deg, #0F1D32, #0B1825)",
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.85)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 w-9 h-9 rounded-lg flex items-center justify-center text-[#94a3b8] hover:text-white hover:bg-white/5 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-[0.25em] mb-2">
            Calendario Mundial 2026
          </div>
          <h2 id="cal-export-title" className="text-2xl font-black text-white mb-2">
            Llévate{" "}
            <span className="bg-gradient-to-r from-[#C9A84C] via-[#FDE68A] to-[#C9A84C] bg-clip-text text-transparent">
              el Mundial
            </span>{" "}
            a tu calendario
          </h2>
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            Cada partido con recordatorios escalonados (24h / 2h / 15min antes),
            link al estadio, ficha de cada selección y hasta el himno en Spotify.
          </p>
        </div>

        {/* Opciones */}
        <div className="space-y-3 mb-5">
          <Option
            iconBg="#4285F4"
            icon={<GoogleIcon />}
            title="Google Calendar"
            desc="Suscripción que se actualiza automáticamente"
            href={googleUrl}
            external
            primary={!isAppleDevice}
          />
          <Option
            iconBg="#000000"
            icon={<AppleIcon />}
            title="Apple Calendar"
            desc="iPhone, iPad, Mac · Suscripción nativa"
            href={webcalUrl}
            primary={isAppleDevice}
          />
          <Option
            iconBg="#6B7280"
            icon={<DownloadIcon />}
            title="Descargar archivo .ics"
            desc="Outlook, Yahoo, Thunderbird · Sin actualizaciones"
            href={`${httpsUrl}${httpsUrl.includes("?") ? "&" : "?"}download=1`}
          />
        </div>

        {/* Detalles */}
        <details className="mt-4 group">
          <summary className="text-xs text-[#94a3b8] hover:text-[#C9A84C] cursor-pointer list-none transition-colors">
            <span className="inline-flex items-center gap-1.5">
              <svg className="w-3 h-3 transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              ¿Qué incluye este calendario?
            </span>
          </summary>
          <ul className="mt-3 text-xs text-[#cbd5e1] space-y-1.5 pl-4">
            <li>· Los 104 partidos del Mundial 2026</li>
            <li>· 3 recordatorios escalonados por partido</li>
            <li>· Link al estadio (abre Google Maps)</li>
            <li>· Link a la ficha de cada selección</li>
            <li>· Himno nacional del local en Spotify 🎵</li>
            <li>· Color por confederación (Apple Calendar)</li>
            <li>· Se actualiza automáticamente si cambian fechas</li>
          </ul>
        </details>
      </div>
    </div>
  );
}

function Option({
  icon,
  iconBg,
  title,
  desc,
  href,
  external,
  primary,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  desc: string;
  href: string;
  external?: boolean;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="flex items-center gap-3 rounded-xl border p-4 transition-all hover:scale-[1.02]"
      style={{
        borderColor: primary ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.08)",
        background: primary
          ? "rgba(201,168,76,0.08)"
          : "rgba(11,24,37,0.5)",
      }}
    >
      <span
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg }}
        aria-hidden
      >
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-bold text-white">{title}</span>
        <span className="block text-[11px] text-[#94a3b8] mt-0.5">{desc}</span>
      </span>
      {primary ? (
        <span
          className="text-[9px] font-bold uppercase tracking-widest text-[#C9A84C] px-2 py-1 rounded border border-[#C9A84C]/30 bg-[#C9A84C]/10"
        >
          Tu equipo
        </span>
      ) : null}
      <svg className="w-4 h-4 text-[#94a3b8] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}

/* ────────── Iconos ────────── */

function CalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path fill="#fff" d="M44 24c0 11-9 20-20 20S4 35 4 24 13 4 24 4s20 9 20 20Z" />
      <path fill="#4285F4" d="M24 8v32" stroke="#4285F4" />
      <path d="M14 14h20v20H14z" fill="#fff" />
      <path d="M14 14h20l-10 10z" fill="#EA4335" />
      <path d="M14 14v20l10-10z" fill="#FBBC04" />
      <path d="M14 34h20l-10-10z" fill="#34A853" />
      <path d="M34 14v20l-10-10z" fill="#4285F4" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
