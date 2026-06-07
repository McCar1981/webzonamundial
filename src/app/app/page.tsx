"use client";

// src/app/app/page.tsx
// HUB de la webapp ZonaMundial — el "lobby" del producto.
//
// Diseño: app deportiva premium / dashboard de juego del Mundial. Base navy
// oscura como estructura, pero las CARDS son claras (blanco roto / gris frío)
// para que respire y no pese. El dorado es solo acento (badges, CTAs, highlights).
//
// SEO/AdSense: vive bajo el grupo /app (noindex,follow por layout.tsx), así que
// NO interfiere con el home editorial `/`. La bifurcación / ↔ /app es por
// SESIÓN (middleware), nunca por user-agent → sin cloaking.

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/* ─────────── Paleta: navy base + cards claras + dorado de acento ─────────── */
const NAVY = "#0a1729";
const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const TXT = "#eef2fb";
const TXT_MUT = "#93a1bd";
const LIGHT = "#f3f5fb";      // blanco roto — fondo card
const LIGHT2 = "#e7ecf6";     // gris frío — variante
const INK = "#0e1c33";        // texto sobre card clara
const INK_MUT = "#5a6885";    // texto secundario sobre card clara
const LINE = "rgba(255,255,255,0.08)";

/* ─────────── Iconos inline (trazo) ─────────── */
function I({ d, c = INK, s = 22 }: { d: string; c?: string; s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      {d.split("|").map((p, i) => (
        <path key={i} d={p} stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}
const PATHS: Record<string, string> = {
  predicciones: "M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8|M14.5 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z",
  trivia: "M12 3l8 4v5c0 5-3.4 8.4-8 9.8C7.4 20.4 4 16.8 4 12V7l8-4Z|M9.5 9.2a2.6 2.6 0 1 1 3.2 3.5c-.5.3-.7.7-.7 1.3M12 17h.01",
  fantasy: "M6 3h12v4a6 6 0 0 1-12 0V3Z|M6 5H4a2 2 0 0 0 0 4h1M18 5h2a2 2 0 0 1 0 4h-1M9 21h6M10 13.5V17M14 13.5V17",
  carrera: "M6 3 2 7l2.5 2.5L6 8v13h12V8l1.5 1.5L20 7l-4-4h-2.5L12 5l-1.5-2H8Z",
  album: "M4 4h16v16H4zM4 9h16M9 9v11",
  penaltis: "M12 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z|M3 21c1.5-3 4.5-5 9-5s7.5 2 9 5",
  matchcenter: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z|M12 3v3l3 2M12 3 9 7l-4 3.5M12 21v-3l-3-2M12 21l3-4 4-3.5",
  micro: "M12 20a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z|M10 3h4M12 6v7l3 2",
  stories: "M5 5h11v14H5zM8 9h5M8 13h3|M18 8a3.5 3.5 0 0 1 0 8",
  streaming: "M3 5h18v11H3zM9 19h6|M10 9v4l4-2z",
  rankings: "M4 14h4v6H4zM10 8h4v12h-4zM16 11h4v9h-4z|M12 3l1 2 2 .3-1.4 1.4.3 2-1.9-1-1.9 1 .3-2L9 5l2-.3z",
  ligas: "M12 3l8 4v5c0 5-3.4 8.4-8 9.8C7.4 20.4 4 16.8 4 12V7l8-4Z|M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8.5 16a3.5 3.5 0 0 1 7 0",
  chat: "M21 14a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v8Z|M8 10h.01M12 10h.01M16 10h.01",
  iaCoach: "M6 6h12v12H6zM9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4|M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  calendario: "M4 6h16v15H4zM4 10h16M8 3v4M16 3v4|M8 14h2M8 17h2",
  grupos: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  reglas: "M6 3h9l3 3v15H6zM14 3v4h4|M9 12h6M9 16h4",
  guias: "M4 5a2 2 0 0 1 2-2h6v18H6a2 2 0 0 0-2 2zM20 5a2 2 0 0 0-2-2h-6v18h6a2 2 0 0 1 2 2z",
};

/* ─────────── Módulos por categoría ───────────
   Sistema visual gamificado: cada categoría tiene su FAMILIA de acento (tint
   principal + glow) que tiñe el contenedor del icono, el glow de esquina y el
   borde en hover. Las cards comparten estructura (padding, icon size, badge y
   CTA) pero cada categoría aporta su matiz cromático → app de fútbol, no panel. */
type Estado = "Disponible" | "Nuevo" | "En vivo" | "Próximamente";
type Mod = {
  icon: string;
  // Icono propio opcional. Si existe el SVG en /assets/app-icons/<x>.svg, se pinta
  // con CSS mask (se tiñe al color del tema). Si no, cae al icono inline `I`.
  iconSrc?: string;
  title: string; desc: string; href?: string; cta: string; estado: Estado;
};
type Cat = {
  key: string; label: string; sub: string;
  tint: string; tint2: string;
  // Fondo decorativo de categoría (capa visual interna, NO imagen cerrada).
  // Si el .webp no existe aún, la card degrada con elegancia (base+textura+glow).
  bg: string; bgOpacity: number;
  // ── Tokens de tema (identidad visual fuerte por categoría) ──
  border: string;       // borde de card en reposo
  borderHov: string;    // borde de card en hover
  glow: string;         // halo/acento superior (rgba)
  wash: string;         // tinte de categoría que se inyecta sobre el fondo
  ctaBg: string;        // CTA en reposo
  ctaBgHov: string;     // CTA en hover
  ctaColor: string;     // color de texto del CTA
  ctaBorder: string;    // borde del CTA
  ctaShadow: string;    // sombra del CTA en hover
  mods: Mod[];
};

const CATS: Cat[] = [
  {
    key: "jugar",
    label: "Jugar",
    sub: "Predice, responde trivias y suma puntos.",
    tint: "#c9a84c", tint2: "#36c98f",   // dorado + verde (reto / progreso)
    bg: "/assets/card-backgrounds/card-bg-jugar.webp", bgOpacity: 0.6,
    border: "rgba(80,200,120,0.34)", borderHov: "rgba(80,200,120,0.7)",
    glow: "rgba(80,200,120,0.5)", wash: "rgba(54,201,143,0.18)",
    ctaBg: "linear-gradient(135deg,#e8cf6a,#f3df8a)", ctaBgHov: "linear-gradient(135deg,#f0d978,#fbe79a)",
    ctaColor: "#08111f", ctaBorder: "rgba(201,168,76,0.55)", ctaShadow: "0 8px 18px rgba(201,168,76,0.45)",
    mods: [
      { icon: "predicciones", title: "Predicciones", desc: "Acierta resultados y suma puntos.", href: "/app/predicciones", cta: "Predecir", estado: "Disponible" },
      { icon: "trivia", title: "Trivia diaria", desc: "Responde preguntas del Mundial.", href: "/app/trivia", cta: "Responder", estado: "Disponible" },
      { icon: "fantasy", title: "Fantasy", desc: "Arma tu equipo y compite.", href: "/app/fantasy", cta: "Ver Fantasy", estado: "Disponible" },
      { icon: "carrera", title: "Modo Carrera", desc: "Dirige una selección como DT.", href: "/app/modo-carrera", cta: "Entrar", estado: "Nuevo" },
      { icon: "album", title: "Álbum", desc: "Colecciona y completa tu álbum.", href: "/app/album", cta: "Abrir", estado: "Disponible" },
      { icon: "penaltis", title: "Ronda de penaltis", desc: "Elige selección y gana la tanda.", cta: "Avisarme", estado: "Próximamente" },
    ],
  },
  {
    key: "envivo",
    label: "En vivo",
    sub: "Sigue partidos, stories y jugadas en directo.",
    tint: "#ff6b5a", tint2: "#ffa14a",   // coral + naranja (urgente / vivo)
    bg: "/assets/card-backgrounds/card-bg-en-vivo.webp", bgOpacity: 0.6,
    border: "rgba(255,110,90,0.34)", borderHov: "rgba(255,110,90,0.7)",
    glow: "rgba(255,110,90,0.5)", wash: "rgba(255,120,90,0.18)",
    ctaBg: "linear-gradient(135deg, rgba(255,120,90,0.30), rgba(45,210,230,0.24))",
    ctaBgHov: "linear-gradient(135deg, rgba(255,120,90,0.52), rgba(45,210,230,0.42))",
    ctaColor: "#22120c", ctaBorder: "rgba(255,120,90,0.5)", ctaShadow: "0 8px 18px rgba(255,110,90,0.4)",
    mods: [
      { icon: "matchcenter", title: "Match Center", desc: "Cada partido en vivo con estadísticas.", href: "/app/matchcenter", cta: "Ver", estado: "Disponible" },
      { icon: "micro", title: "Micro-predicciones", desc: "Predice jugadas en directo.", href: "/app/micro", cta: "Jugar", estado: "Nuevo" },
      { icon: "stories", title: "Stories", desc: "Minuto a minuto del Mundial.", href: "/app/stories", cta: "Ver", estado: "Disponible" },
      { icon: "streaming", title: "Zona Streaming", desc: "Directos con creadores.", href: "/app/streaming", cta: "Entrar", estado: "Disponible" },
    ],
  },
  {
    key: "comunidad",
    label: "Comunidad",
    sub: "Compite con otros usuarios y ligas.",
    tint: "#34b9c4", tint2: "#5b8def",   // turquesa + azul (social / conectada)
    bg: "/assets/card-backgrounds/card-bg-comunidad.webp", bgOpacity: 0.6,
    border: "rgba(45,210,210,0.34)", borderHov: "rgba(45,210,210,0.7)",
    glow: "rgba(45,210,210,0.5)", wash: "rgba(80,140,255,0.16)",
    ctaBg: "linear-gradient(135deg, rgba(45,210,210,0.30), rgba(120,110,255,0.22))",
    ctaBgHov: "linear-gradient(135deg, rgba(45,210,210,0.52), rgba(120,110,255,0.42))",
    ctaColor: "#0f1d2a", ctaBorder: "rgba(45,210,210,0.5)", ctaShadow: "0 8px 18px rgba(45,210,210,0.4)",
    mods: [
      { icon: "rankings", title: "Ranking global", desc: "Compite por país y por creador.", href: "/app/rankings", cta: "Ver ranking", estado: "Disponible" },
      { icon: "ligas", title: "Ligas privadas", desc: "Compite con amigos en tu liga.", href: "/app/ligas", cta: "Crear", estado: "Disponible" },
      { icon: "chat", title: "Chat por liga", desc: "Habla en vivo durante el partido.", href: "/app/chat", cta: "Entrar", estado: "Disponible" },
      { icon: "iaCoach", title: "IA Coach", desc: "Tu analista personal con IA.", href: "/app/ia-coach", cta: "Abrir", estado: "Nuevo" },
    ],
  },
  {
    key: "explora",
    label: "Explora",
    sub: "Calendario, grupos, reglas y guías.",
    tint: "#8b7bd8", tint2: "#6e83c4",   // lavanda + azul grisáceo (informativa)
    bg: "/assets/card-backgrounds/card-bg-explora.webp", bgOpacity: 0.6,
    border: "rgba(150,130,255,0.34)", borderHov: "rgba(150,130,255,0.7)",
    glow: "rgba(150,130,255,0.5)", wash: "rgba(150,130,255,0.16)",
    ctaBg: "linear-gradient(135deg, rgba(150,130,255,0.28), rgba(210,220,255,0.26))",
    ctaBgHov: "linear-gradient(135deg, rgba(150,130,255,0.5), rgba(180,195,255,0.46))",
    ctaColor: "#16203a", ctaBorder: "rgba(150,130,255,0.5)", ctaShadow: "0 8px 18px rgba(150,130,255,0.4)",
    mods: [
      { icon: "calendario", title: "Calendario", desc: "Todos los partidos del Mundial 2026.", href: "/calendario", cta: "Ver", estado: "Disponible" },
      { icon: "grupos", title: "Grupos", desc: "Las 48 selecciones por grupo.", href: "/grupos", cta: "Ver", estado: "Disponible" },
      { icon: "reglas", title: "Reglas de puntos", desc: "Cómo se puntúa cada acierto.", href: "/formato", cta: "Ver", estado: "Disponible" },
      { icon: "guias", title: "Guías del Mundial", desc: "Historia, datos y curiosidades.", href: "/historia", cta: "Leer", estado: "Disponible" },
    ],
  },
];

/* ─────────── Tipos de datos remotos ─────────── */
type Featured = {
  matchId: number;
  slug: string;
  status: string;
  score: [number, number];
  elapsed: number;
  meta: {
    home: { name: string; flag: string };
    away: { name: string; flag: string };
    date: string;
    time: string;
    phase: string;
    group: string;
    venue: string;
    city: string;
  };
} | null;

const IN_PLAY = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"]);
const FINISHED = new Set(["FT", "AET", "PEN"]);

function fmtDate(date: string, time: string) {
  try {
    const d = new Date(`${date}T${time || "00:00"}:00-04:00`);
    return d.toLocaleString("es-ES", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return `${date} · ${time}`;
  }
}

/* ─────────── Estado visual (badge) ───────────
   Disponible = verde suave · Nuevo = dorado/mostaza · En vivo = rojo ·
   Próximamente = gris-azulado (en espera, NO muerto). */
function badgeStyle(e: Estado): React.CSSProperties {
  const base: React.CSSProperties = {
    fontSize: 10, fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase",
    borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap",
    // Brillo interior + sombra fina → relieve "pastilla", no etiqueta plana.
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55), 0 1px 2px rgba(8,16,30,0.12)",
    backdropFilter: "saturate(140%)",
  };
  if (e === "Disponible") return { ...base, color: "#0a7d52", backgroundImage: "linear-gradient(180deg,#e4faee,#cdf1df)", border: "1px solid #aee9cd" };
  if (e === "Nuevo") return { ...base, color: "#8a6a13", backgroundImage: "linear-gradient(180deg,#fdf3cf,#f7e6ac)", border: "1px solid #f0dca0" };
  if (e === "En vivo") return { ...base, color: "#fff", backgroundImage: "linear-gradient(180deg,#f25a50,#dc3f36)", border: "1px solid #e4483f", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 6px rgba(228,72,63,0.4)" };
  return { ...base, color: "#4f6394", backgroundImage: "linear-gradient(180deg,#eef2fa,#dde6f3)", border: "1px solid #ccd8ec" };
}

/* ─────────── Fondo decorativo reutilizable (token visual por categoría) ───────────
   Construye el "fondo de videojuego" de cada card: base clara + microtextura de
   puntos + glow de esquina en el acento de la categoría. Reutilizable y barato
   (puro CSS, sin imágenes). `lift` sube la intensidad en hover. */
function cardBackground(tint: string, tint2: string, lift: boolean): React.CSSProperties {
  return {
    backgroundColor: lift ? "#ffffff" : LIGHT,
    backgroundImage: `
      radial-gradient(135px 100px at 100% 0%, ${tint}${lift ? "33" : "22"}, transparent 72%),
      radial-gradient(120px 120px at 0% 100%, ${tint2}${lift ? "26" : "16"}, transparent 70%),
      radial-gradient(circle at 1px 1px, rgba(14,28,51,0.05) 1px, transparent 1.4px)
    `,
    backgroundSize: "100% 100%, 100% 100%, 16px 16px",
  };
}

/* ─────────── Card de módulo (HTML/CSS, gamificada, premium) ───────────
   Capas (de atrás hacia delante):
     1. base clara + microtextura + glow de esquina (cardBackground)
     2. foto de categoría (decorativa, máscara suave)
     3. WASH de color de categoría → da identidad aunque la foto sea pálida
     4. velo de legibilidad inteligente (transparente arriba, protege el texto abajo)
     5. halo/acento superior + contenido
   La imagen NUNCA es la card cerrada; la identidad la dan los tokens del tema. */
function ModuleCard({ mod, cat }: { mod: Mod; cat: Cat }) {
  const { tint, tint2, bg, bgOpacity, border, borderHov, glow, wash, ctaBg, ctaBgHov, ctaColor, ctaBorder, ctaShadow } = cat;
  const [hov, setHov] = useState(false);
  const disabled = !mod.href;
  const active = hov && !disabled;

  const inner = (
    <>
      {/* Capa 2 — foto decorativa de categoría (cover, máscara suave hacia el texto). */}
      {bg && (
        <span
          aria-hidden
          style={{
            position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
            backgroundImage: `url(${bg})`,
            backgroundSize: "cover", backgroundPosition: "center",
            opacity: active ? Math.min(bgOpacity + 0.12, 1) : bgOpacity,
            WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 55%, rgba(0,0,0,0.72) 100%)",
            maskImage: "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 55%, rgba(0,0,0,0.72) 100%)",
            transition: "opacity .28s",
          }}
        />
      )}
      {/* Capa 3 — WASH de color de categoría (identidad cromática fuerte). */}
      <span aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: `radial-gradient(130% 95% at 50% -8%, ${wash}, transparent 58%), linear-gradient(155deg, ${tint}24 0%, transparent 48%)` }} />
      {/* Capa 4 — velo de legibilidad inteligente: deja ver la foto arriba y protege
          el texto abajo (título, descripción y CTA siempre legibles). */}
      <span aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.10) 22%, rgba(255,255,255,0.5) 46%, rgba(255,255,255,0.74) 100%)" }} />

      {/* Halo + franja de acento superior (premium, no borde infantil). */}
      <span aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 54, zIndex: 1, pointerEvents: "none", background: `radial-gradient(75% 130% at 50% -12%, ${glow}, transparent 72%)`, opacity: active ? 1 : 0.8, transition: "opacity .25s" }} />
      <span aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, zIndex: 1, background: `linear-gradient(90deg, ${tint}, ${tint2})`, opacity: active ? 1 : 0.8, transition: "opacity .25s" }} />

      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 13 }}>
        <span style={{ position: "relative", width: 54, height: 54, borderRadius: 15, display: "inline-flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(140deg, ${tint}44, ${tint2}26)`, border: `1.5px solid ${tint}99`, boxShadow: active ? `0 8px 20px ${tint}55, inset 0 1px 0 rgba(255,255,255,0.7)` : `0 4px 12px ${tint}33, inset 0 1px 0 rgba(255,255,255,0.55)`, transition: "box-shadow .25s, transform .25s", transform: active ? "scale(1.05)" : undefined }}>
          {/* brillo superior del contenedor del icono */}
          <span style={{ position: "absolute", inset: 0, borderRadius: 15, background: "linear-gradient(180deg, rgba(255,255,255,0.55), transparent 55%)", pointerEvents: "none" }} />
          {mod.iconSrc ? (
            // Icono propio teñido con CSS mask (color del tema, no el del SVG).
            <span
              aria-hidden
              style={{
                width: 29, height: 29, display: "inline-block", backgroundColor: INK,
                WebkitMaskImage: `url(${mod.iconSrc})`, maskImage: `url(${mod.iconSrc})`,
                WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
                WebkitMaskPosition: "center", maskPosition: "center",
                WebkitMaskSize: "contain", maskSize: "contain",
              }}
            />
          ) : (
            <I d={PATHS[mod.icon] || ""} c={INK} s={29} />
          )}
        </span>
        <span style={badgeStyle(mod.estado)}>{mod.estado === "En vivo" ? "● En vivo" : mod.estado}</span>
      </div>
      <h3 style={{ position: "relative", zIndex: 1, fontWeight: 800, fontSize: 16.5, color: INK, marginBottom: 5, textShadow: "0 1px 0 rgba(255,255,255,0.6)" }}>{mod.title}</h3>
      <p style={{ position: "relative", zIndex: 1, fontSize: 12.5, color: INK_MUT, lineHeight: 1.45, marginBottom: 14, minHeight: 36, textShadow: "0 1px 0 rgba(255,255,255,0.45)" }}>{mod.desc}</p>
      {/* CTA con identidad de categoría (premium, no gris genérico). */}
      <span
        style={{
          position: "relative", zIndex: 1,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          width: "100%",
          fontSize: 13, fontWeight: 800,
          color: disabled ? "#4f6394" : ctaColor,
          background: disabled ? "#e3e9f5" : active ? ctaBgHov : ctaBg,
          padding: "10px 0", borderRadius: 11,
          border: `1px solid ${disabled ? "#ccd8ec" : ctaBorder}`,
          boxShadow: active && !disabled ? `${ctaShadow}, inset 0 1px 0 rgba(255,255,255,0.4)` : "inset 0 1px 0 rgba(255,255,255,0.35)",
          transition: "background .25s, color .25s, box-shadow .25s",
        }}
      >
        {mod.cta}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          {disabled
            ? <path d="M12 8v4l2 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            : <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />}
        </svg>
      </span>
    </>
  );

  const style: React.CSSProperties = {
    position: "relative", overflow: "hidden",
    display: "flex", flexDirection: "column",
    textDecoration: "none", borderRadius: 20, padding: "16px 16px 18px",
    ...cardBackground(tint, tint2, active),
    border: `1.5px solid ${active ? borderHov : border}`,
    // Card "flota" sobre el navy: sombra profunda + brillo interior superior.
    boxShadow: active
      ? `0 22px 46px rgba(0,0,0,0.36), 0 0 0 1px ${borderHov}, inset 0 1px 0 rgba(255,255,255,0.7)`
      : "0 18px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.65)",
    // Hover eleva; el tap (móvil) lo gestiona `.zm-mod-card:active` en CSS para no
    // pisar la animación con un inline transform.
    transform: active ? "translateY(-5px)" : undefined,
    transition: "transform .18s ease, box-shadow .28s, background-color .28s, border-color .28s",
    cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.96 : 1,
  };
  if (disabled) return <div className="zm-mod-card zm-mod-card--locked" style={style}>{inner}</div>;
  return (
    <Link className="zm-mod-card" href={mod.href!} style={style} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {inner}
    </Link>
  );
}

/* ─────────── PWA install ─────────── */
function useInstallPrompt() {
  const [evt, setEvt] = useState<any>(null);
  useEffect(() => {
    const h = (e: any) => { e.preventDefault(); setEvt(e); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);
  const install = useCallback(async () => {
    if (!evt) return;
    evt.prompt();
    await evt.userChoice;
    setEvt(null);
  }, [evt]);
  return { canInstall: !!evt, install };
}

/* ════════════════════════════ PÁGINA ════════════════════════════ */
export default function AppHubPage() {
  const [username, setUsername] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [match, setMatch] = useState<Featured>(null);
  const { canInstall, install } = useInstallPrompt();

  // Sesión + perfil (degradación limpia si faltan envs)
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const sb = createSupabaseBrowserClient();
        const { data: { user } } = await sb.auth.getUser();
        if (!on) return;
        if (!user) { setAuthed(false); return; }
        setAuthed(true);
        const { data: p } = await sb.from("profiles").select("username,avatar_url").eq("id", user.id).single();
        if (!on) return;
        setUsername(p?.username || user.email?.split("@")[0] || null);
        setAvatar(p?.avatar_url || null);
      } catch {
        if (on) setAuthed(false);
      }
    })();
    return () => { on = false; };
  }, []);

  // Partido destacado
  useEffect(() => {
    let on = true;
    fetch("/api/match-center/featured")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (on && d && d.meta) setMatch(d); })
      .catch(() => {});
    return () => { on = false; };
  }, []);

  const live = match ? IN_PLAY.has(match.status) : false;
  const finished = match ? FINISHED.has(match.status) : false;
  const matchHref = match ? `/app/matchcenter/${match.slug}` : "/app/matchcenter";

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(1200px 600px at 50% -10%, #12284a 0%, ${NAVY} 55%)`, color: TXT, fontFamily: "'Outfit',sans-serif", overflowX: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`*{box-sizing:border-box}::selection{background:rgba(201,168,76,.3)}@keyframes zmpulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "14px 14px 110px" }}>

        {/* ═══ 1. HEADER COMPACTO ═══ */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: `1px solid ${LINE}`, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg,${GOLD},${GOLD2})`, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={NAVY} strokeWidth="1.6" /><path d="M12 3v4l3 2M12 3 9 7" stroke={NAVY} strokeWidth="1.4" strokeLinecap="round" /></svg>
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: TXT_MUT, fontWeight: 600 }}>
                {authed === null ? "Cargando…" : authed ? "Hola de nuevo" : "Modo invitado"}
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {authed ? (username || "Jugador") : "¡Bienvenido!"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* Puntos */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 999, background: "rgba(201,168,76,0.12)", border: `1px solid ${GOLD}55` }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 16.5 7.1 18.2l.9-5.5-4-3.9 5.5-.8z" fill={GOLD} /></svg>
              <span style={{ fontSize: 13, fontWeight: 800, color: GOLD2 }}>{authed ? "0" : "—"}</span>
            </div>
            {/* Instalar PWA */}
            {canInstall && (
              <button onClick={install} title="Instalar app" style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 999, background: "rgba(255,255,255,0.06)", border: `1px solid ${LINE}`, color: TXT, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" stroke={GOLD2} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span className="zm-hide-sm">Instalar</span>
              </button>
            )}
            {/* Perfil */}
            <Link href={authed ? "/cuenta" : "/login"} title="Perfil" style={{ width: 34, height: 34, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: avatar ? "transparent" : "rgba(255,255,255,0.08)", border: `1px solid ${GOLD}55`, color: GOLD2, fontWeight: 800, fontSize: 14, textDecoration: "none", flexShrink: 0 }}>
              {avatar ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (username?.[0]?.toUpperCase() || (authed ? "U" : "?"))}
            </Link>
          </div>
        </div>

        {/* ═══ 2. HERO FUNCIONAL ═══ */}
        <div style={{ position: "relative", borderRadius: 20, padding: "28px 22px", marginBottom: 16, overflow: "hidden", background: "linear-gradient(135deg,#102a4d 0%,#0c1f3a 100%)", border: `1px solid ${LINE}` }}>
          <div style={{ position: "absolute", top: -40, right: -30, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.16), transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "relative", maxWidth: 560 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: GOLD }}>Mundial 2026</span>
            <h1 style={{ fontSize: "clamp(25px,5.4vw,38px)", fontWeight: 900, lineHeight: 1.06, margin: "8px 0 10px" }}>
              Tu zona de juego del <span style={{ background: `linear-gradient(135deg,${GOLD},${GOLD2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Mundial</span>
            </h1>
            <p style={{ color: TXT_MUT, fontSize: 14.5, lineHeight: 1.55, marginBottom: 20, maxWidth: 440 }}>
              Predice, compite y sube en el ranking de ZonaMundial.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Link href="/app/predicciones" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "12px 22px", borderRadius: 12, background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: NAVY, fontWeight: 800, fontSize: 15, textDecoration: "none", boxShadow: "0 6px 20px rgba(201,168,76,0.25)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 4l13 8-13 8V4z" fill={NAVY} /></svg>
                Hacer predicción
              </Link>
              <Link href={matchHref} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "12px 20px", borderRadius: 12, background: "rgba(255,255,255,0.06)", color: TXT, fontWeight: 700, fontSize: 14.5, textDecoration: "none", border: `1px solid ${LINE}` }}>
                Ver partido del día
              </Link>
            </div>
          </div>
        </div>

        {/* ═══ 3. PARTIDO DESTACADO ═══ */}
        {match && (
          <Link href={matchHref} style={{ display: "block", textDecoration: "none", color: TXT, borderRadius: 18, padding: "16px 18px", marginBottom: 16, background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))", border: `1px solid ${live ? "#e4483f55" : LINE}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: TXT_MUT, letterSpacing: 0.5 }}>
                {match.meta.phase}{match.meta.group ? ` · Grupo ${match.meta.group}` : ""}
              </span>
              <span style={{ ...badgeStyle(live ? "En vivo" : finished ? "Disponible" : "Próximamente"), animation: live ? "zmpulse 1.6s infinite" : undefined }}>
                {live ? `● En vivo ${match.elapsed}'` : finished ? "Finalizado" : "Próximo"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
              <Team name={match.meta.home.name} flag={match.meta.home.flag} align="right" />
              <div style={{ textAlign: "center", minWidth: 78 }}>
                {live || finished ? (
                  <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: 1 }}>{match.score[0]}<span style={{ color: TXT_MUT, margin: "0 4px" }}>-</span>{match.score[1]}</div>
                ) : (
                  <div style={{ fontSize: 17, fontWeight: 800, color: GOLD2 }}>{match.meta.time || "vs"}</div>
                )}
                <div style={{ fontSize: 10.5, color: TXT_MUT, marginTop: 2 }}>{!live && !finished ? fmtDate(match.meta.date, match.meta.time) : match.meta.city}</div>
              </div>
              <Team name={match.meta.away.name} flag={match.meta.away.flag} align="left" />
            </div>
            <div style={{ display: "flex", gap: 9, marginTop: 14 }}>
              <span style={{ flex: 1, textAlign: "center", padding: "11px 0", borderRadius: 11, background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: NAVY, fontWeight: 800, fontSize: 13.5 }}>Hacer predicción</span>
              <span style={{ flex: 1, textAlign: "center", padding: "11px 0", borderRadius: 11, background: "rgba(255,255,255,0.06)", color: TXT, fontWeight: 700, fontSize: 13.5, border: `1px solid ${LINE}` }}>Ver Match Center</span>
            </div>
          </Link>
        )}

        {/* ═══ 4. RANKING / PROGRESO — subido tras el partido destacado ═══ */}
        {authed ? (
          <section style={{ marginBottom: 26, borderRadius: 18, padding: "18px 18px", background: LIGHT, border: "1px solid rgba(14,28,51,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: INK }}>Tu progreso</h2>
              <Link href="/app/rankings" style={{ fontSize: 12.5, fontWeight: 800, color: "#8a6a13", textDecoration: "none" }}>Ver ranking →</Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 10 }}>
              <Stat k="Nivel" v="1" />
              <Stat k="Puntos" v="0" />
              <Stat k="Racha" v="0 días" />
              <Stat k="Predicciones" v="0" />
            </div>
          </section>
        ) : (
          <section style={{ position: "relative", overflow: "hidden", marginBottom: 26, borderRadius: 18, padding: "22px 20px", background: "linear-gradient(135deg, #fff 0%, #eef2fb 100%)", border: `1px solid ${GOLD}55`, boxShadow: "0 6px 22px rgba(8,16,30,0.22)" }}>
            <div style={{ position: "absolute", top: -30, right: -20, width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.22), transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <span style={{ width: 52, height: 52, borderRadius: 15, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg,${GOLD},${GOLD2})` }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M4 14h4v6H4zM10 8h4v12h-4zM16 11h4v9h-4z" stroke={NAVY} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 2l1 2 2 .3-1.4 1.4.3 2-1.9-1-1.9 1 .3-2L9 4.3l2-.3z" fill={NAVY} /></svg>
              </span>
              <div style={{ flex: 1, minWidth: 200 }}>
                <h2 style={{ fontSize: 17, fontWeight: 900, color: INK, marginBottom: 4 }}>Guarda tu progreso</h2>
                <p style={{ fontSize: 13.5, color: INK_MUT, lineHeight: 1.5, maxWidth: 420 }}>
                  Crea tu cuenta gratis para guardar puntos, rachas y entrar al ranking.
                </p>
              </div>
              <Link href="/registro" style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 7, padding: "12px 22px", borderRadius: 12, background: NAVY, color: GOLD2, fontWeight: 800, fontSize: 14.5, textDecoration: "none", boxShadow: "0 6px 18px rgba(10,23,41,0.3)" }}>
                Crear cuenta gratis
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </div>
          </section>
        )}

        {/* ═══ 5 + 6. CATEGORÍAS con subtítulo ═══ */}
        {CATS.map((cat) => (
          <section key={cat.key} style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 14 }}>
              <span style={{ width: 5, height: 34, borderRadius: 3, background: `linear-gradient(180deg, ${cat.tint}, ${cat.tint2})`, flexShrink: 0 }} />
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.1 }}>{cat.label}</h2>
                <p style={{ fontSize: 12.5, color: TXT_MUT, marginTop: 2 }}>{cat.sub}</p>
              </div>
            </div>
            <div className="zm-mod-grid">
              {cat.mods.map((m) => <ModuleCard key={m.title} mod={m} cat={cat} />)}
            </div>
          </section>
        ))}

        {/* ═══ 7. RANKING GLOBAL (card clara, top 5) ═══ */}
        <section style={{ marginBottom: 26, borderRadius: 18, padding: "20px 20px", background: LIGHT2, border: "1px solid rgba(14,28,51,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: INK }}>Ranking global</h2>
            <Link href="/app/rankings" style={{ fontSize: 12.5, fontWeight: 800, color: "#8a6a13", textDecoration: "none" }}>Ver completo →</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {[1, 2, 3, 4, 5].map((pos) => (
              <div key={pos} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", borderRadius: 10, background: "#fff", border: "1px solid rgba(14,28,51,0.05)" }}>
                <span style={{ width: 22, textAlign: "center", fontWeight: 900, color: pos <= 3 ? "#b8902f" : "#9aa6bd", fontSize: 14 }}>{pos}</span>
                <span style={{ width: 26, height: 26, borderRadius: "50%", background: "#e2e8f3", flexShrink: 0 }} />
                <span style={{ flex: 1, color: "#9aa6bd", fontSize: 13.5, fontWeight: 600 }}>Plaza libre</span>
                <span style={{ color: "#9aa6bd", fontSize: 12.5, fontWeight: 700 }}>— pts</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "#6a7791", marginTop: 12, textAlign: "center" }}>
            El ranking arranca con el Mundial el 11 de junio. {authed ? "Tu posición aparecerá aquí." : "Crea tu cuenta para competir."}
          </p>
        </section>

        {/* Volver a la portada editorial (escape del redirect por sesión) */}
        <div style={{ textAlign: "center" }}>
          <Link href="/?portada=1" style={{ color: TXT_MUT, fontSize: 13, textDecoration: "none" }}>← Volver a la portada de ZonaMundial</Link>
        </div>
      </div>

      <style>{`
        @media(max-width:420px){ .zm-hide-sm{ display:none } }
        /* Rejilla de módulos: 2 columnas en móvil (sensación app), auto en ≥560px. */
        .zm-mod-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:11px; }
        @media(min-width:560px){
          .zm-mod-grid{ grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:13px; }
        }
        /* Feedback táctil: el tap "hunde" levemente la card. */
        .zm-mod-card:active{ transform:scale(0.97) !important; }
        .zm-mod-card--locked:active{ transform:none !important; }
      `}</style>
    </div>
  );
}

/* ─────────── Subcomponentes ─────────── */
function Team({ name, flag, align }: { name: string; flag: string; align: "left" | "right" }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 9, justifyContent: align === "right" ? "flex-end" : "flex-start", minWidth: 0 }}>
      {align === "left" && <Flag flag={flag} />}
      <span style={{ fontWeight: 800, fontSize: 14.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: align }}>{name}</span>
      {align === "right" && <Flag flag={flag} />}
    </div>
  );
}
function Flag({ flag }: { flag: string }) {
  if (!flag) return <span style={{ width: 30, height: 22, borderRadius: 4, background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />;
  return <img src={`https://flagcdn.com/w80/${flag}.png`} alt="" width={30} height={22} style={{ borderRadius: 4, objectFit: "cover", flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />;
}
function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ textAlign: "center", padding: "12px 8px", borderRadius: 12, background: "#fff", border: "1px solid rgba(14,28,51,0.05)" }}>
      <div style={{ fontSize: 20, fontWeight: 900, color: INK }}>{v}</div>
      <div style={{ fontSize: 11, color: "#6a7791", fontWeight: 600, marginTop: 2 }}>{k}</div>
    </div>
  );
}
