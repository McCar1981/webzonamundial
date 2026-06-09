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
import StoryViewer from "@/components/stories/StoryViewer";

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
  // ARTE del módulo (WebP en /assets/card-backgrounds/<x>.png). Es el protagonista
  // visual de la card. Si falta (p.ej. álbum/penaltis aún sin arte), la card degrada
  // con elegancia al fondo base premium sin romper el layout.
  art?: string;
  title: string; desc: string; href?: string; cta: string; estado: Estado;
};
type Cat = {
  key: string; label: string; sub: string;
  tint: string; tint2: string;
  // ── Ajuste fino de la imagen y el velo POR CATEGORÍA (no global) ──
  artOpacity: number;     // opacidad base del arte (0.78–0.92)
  artOpacityHov: number;  // opacidad del arte en hover/tap
  ovTop: number;          // velo blanco arriba (legibilidad icono/título) 0.80–0.94
  ovMid: number;          // velo blanco centro (descripción) 0.45–0.68
  ovBot: number;          // velo blanco abajo (deja respirar el arte) 0.15–0.38
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
    // Jugar = arte más protagonista (jugable, intenso). Imagen punchy.
    artOpacity: 0.92, artOpacityHov: 1, ovTop: 0.90, ovMid: 0.56, ovBot: 0.20,
    border: "rgba(218,190,95,0.55)", borderHov: "rgba(218,190,95,0.95)",
    glow: "rgba(80,200,120,0.5)", wash: "rgba(54,201,143,0.18)",
    ctaBg: "linear-gradient(135deg,#e8cf6a,#f3df8a)", ctaBgHov: "linear-gradient(135deg,#f0d978,#fbe79a)",
    ctaColor: "#08111f", ctaBorder: "rgba(201,168,76,0.55)", ctaShadow: "0 8px 18px rgba(201,168,76,0.45)",
    mods: [
      { icon: "predicciones", art: "/assets/card-backgrounds/predicciones.webp", title: "Predicciones", desc: "Acierta resultados y suma puntos.", href: "/app/predicciones/jugar", cta: "Predecir", estado: "Disponible" },
      { icon: "trivia", art: "/assets/card-backgrounds/trivia-diaria.webp", title: "Trivia diaria", desc: "Responde preguntas del Mundial.", href: "/trivia", cta: "Responder", estado: "Disponible" },
      { icon: "fantasy", art: "/assets/card-backgrounds/fantasy.webp", title: "Fantasy", desc: "Arma tu equipo y compite.", href: "/app/fantasy/jugar", cta: "Ver Fantasy", estado: "Disponible" },
      { icon: "carrera", art: "/assets/card-backgrounds/modo-carrera.webp", title: "Modo Carrera", desc: "Dirige una selección como DT.", href: "/app/modo-carrera/jugar", cta: "Entrar", estado: "Nuevo" },
      // Ocultos hasta tener su arte/módulo listos. Al reactivar, añadir `art` cuando exista
      // (sin arte la card degrada al fondo base premium sin romper el layout):
      // { icon: "album", title: "Álbum", desc: "Colecciona y completa tu álbum.", href: "/app/album", cta: "Abrir", estado: "Disponible" },
      // { icon: "penaltis", title: "Ronda de penaltis", desc: "Elige selección y gana la tanda.", cta: "Avisarme", estado: "Próximamente" },
    ],
  },
  {
    key: "envivo",
    label: "En vivo",
    sub: "Sigue partidos, stories y jugadas en directo.",
    tint: "#ff6b5a", tint2: "#ffa14a",   // coral + naranja (urgente / vivo)
    // En vivo = dinámico, con movimiento. Overlay algo más controlado en centro.
    artOpacity: 0.88, artOpacityHov: 0.98, ovTop: 0.92, ovMid: 0.62, ovBot: 0.24,
    border: "rgba(255,112,88,0.55)", borderHov: "rgba(255,112,88,0.95)",
    glow: "rgba(255,110,90,0.5)", wash: "rgba(255,120,90,0.18)",
    ctaBg: "linear-gradient(135deg, rgba(255,120,90,0.30), rgba(45,210,230,0.24))",
    ctaBgHov: "linear-gradient(135deg, rgba(255,120,90,0.52), rgba(45,210,230,0.42))",
    ctaColor: "#22120c", ctaBorder: "rgba(255,120,90,0.5)", ctaShadow: "0 8px 18px rgba(255,110,90,0.4)",
    mods: [
      { icon: "matchcenter", art: "/assets/card-backgrounds/match-center.webp", title: "Match Center", desc: "Cada partido en vivo con estadísticas.", href: "/app/matchcenter", cta: "Ver", estado: "Disponible" },
      { icon: "micro", art: "/assets/card-backgrounds/micro-predicciones.webp", title: "Micro-predicciones", desc: "Predice jugadas en directo.", href: "/app/micro", cta: "Jugar", estado: "Nuevo" },
      { icon: "stories", art: "/assets/card-backgrounds/stories.webp", title: "Stories", desc: "Minuto a minuto del Mundial.", href: "/app/stories/feed", cta: "Ver", estado: "Disponible" },
      { icon: "streaming", art: "/assets/card-backgrounds/zona-streaming.webp", title: "Zona Streaming", desc: "Directos con creadores.", href: "/app/streaming", cta: "Entrar", estado: "Disponible" },
    ],
  },
  {
    key: "comunidad",
    label: "Comunidad",
    sub: "Compite con otros usuarios y ligas.",
    tint: "#34b9c4", tint2: "#5b8def",   // turquesa + azul (social / conectada)
    // Comunidad = social, premium, limpia para el título.
    artOpacity: 0.85, artOpacityHov: 0.96, ovTop: 0.92, ovMid: 0.60, ovBot: 0.24,
    border: "rgba(64,210,220,0.50)", borderHov: "rgba(64,210,220,0.92)",
    glow: "rgba(45,210,210,0.5)", wash: "rgba(80,140,255,0.16)",
    ctaBg: "linear-gradient(135deg, rgba(45,210,210,0.30), rgba(120,110,255,0.22))",
    ctaBgHov: "linear-gradient(135deg, rgba(45,210,210,0.52), rgba(120,110,255,0.42))",
    ctaColor: "#0f1d2a", ctaBorder: "rgba(45,210,210,0.5)", ctaShadow: "0 8px 18px rgba(45,210,210,0.4)",
    mods: [
      { icon: "rankings", art: "/assets/card-backgrounds/ranking-global.webp", title: "Ranking global", desc: "Compite por país y por creador.", href: "/app/rankings", cta: "Ver ranking", estado: "Disponible" },
      { icon: "ligas", art: "/assets/card-backgrounds/ligas-privadas.webp", title: "Ligas privadas", desc: "Compite con amigos en tu liga.", href: "/app/ligas", cta: "Crear", estado: "Disponible" },
      { icon: "chat", art: "/assets/card-backgrounds/chat-por-ligas.webp", title: "Chat por liga", desc: "Habla en vivo durante el partido.", href: "/app/chat", cta: "Entrar", estado: "Disponible" },
      { icon: "iaCoach", art: "/assets/card-backgrounds/ia-coach.webp", title: "IA Coach", desc: "Tu analista personal con IA.", href: "/app/ia-coach", cta: "Abrir", estado: "Nuevo" },
    ],
  },
  {
    key: "explora",
    label: "Explora",
    sub: "Calendario, grupos, reglas y guías.",
    tint: "#8b7bd8", tint2: "#6e83c4",   // lavanda + azul grisáceo (informativa)
    // Explora = informativa, ordenada. Imagen visible pero más limpia (no aburrida).
    artOpacity: 0.82, artOpacityHov: 0.94, ovTop: 0.94, ovMid: 0.66, ovBot: 0.30,
    border: "rgba(150,130,230,0.50)", borderHov: "rgba(150,130,230,0.92)",
    glow: "rgba(150,130,255,0.5)", wash: "rgba(150,130,255,0.16)",
    ctaBg: "linear-gradient(135deg, rgba(150,130,255,0.28), rgba(210,220,255,0.26))",
    ctaBgHov: "linear-gradient(135deg, rgba(150,130,255,0.5), rgba(180,195,255,0.46))",
    ctaColor: "#16203a", ctaBorder: "rgba(150,130,255,0.5)", ctaShadow: "0 8px 18px rgba(150,130,255,0.4)",
    mods: [
      { icon: "calendario", art: "/assets/card-backgrounds/calendario.webp", title: "Calendario", desc: "Todos los partidos del Mundial 2026.", href: "/calendario", cta: "Ver", estado: "Disponible" },
      { icon: "grupos", art: "/assets/card-backgrounds/grupos.webp", title: "Grupos", desc: "Las 48 selecciones por grupo.", href: "/grupos", cta: "Ver", estado: "Disponible" },
      { icon: "reglas", art: "/assets/card-backgrounds/reglas-de-puntos.webp", title: "Reglas de puntos", desc: "Cómo se puntúa cada acierto.", href: "/formato", cta: "Ver", estado: "Disponible" },
      { icon: "guias", art: "/assets/card-backgrounds/guia-del-mundial.webp", title: "Guías del Mundial", desc: "Historia, datos y curiosidades.", href: "/historia", cta: "Leer", estado: "Disponible" },
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

// Resumen de gamificación (subconjunto de /api/predictions/me) — billetera única.
type GamSummary = {
  level: { level: number; xp: number };
  coins: number;
  coin_name: string;
  streak: { current: number };
};

// Fila del top global por Fútcoins (subconjunto de /api/ranking).
type TopEntry = {
  rank: number;
  userId: string;
  name: string | null;
  avatarUrl: string | null;
  country: string | null;
  coins: number;
};

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
  const { tint, tint2, artOpacity, artOpacityHov, ovTop, ovMid, ovBot, border, borderHov, glow, wash, ctaBg, ctaBgHov, ctaColor, ctaBorder, ctaShadow } = cat;
  const [hov, setHov] = useState(false);
  const disabled = !mod.href;
  const active = hov && !disabled;
  const art = mod.art;

  const inner = (
    <>
      {/* ── Capa 1 · ARTE del módulo (protagonista, imagen completa) ──
          <img> nativo → lazy-load real + decode async. Cover con foco ligeramente
          alto para que la escena del módulo se reconozca; escala 1.02→1.06 al tocar. */}
      {art ? (
        <img
          src={art} alt="" aria-hidden loading="lazy" decoding="async"
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0,
            objectFit: "cover", objectPosition: "center 40%", pointerEvents: "none",
            opacity: active ? artOpacityHov : artOpacity,
            transform: active ? "scale(1.06)" : "scale(1.02)",
            transition: "transform .42s cubic-bezier(.2,.7,.2,1), opacity .3s ease",
          }}
        />
      ) : (
        // Sin arte aún (álbum/penaltis): textura premium de categoría, no rompe layout.
        <span aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: `radial-gradient(135px 110px at 100% 0%, ${tint}33, transparent 72%), radial-gradient(140px 140px at 0% 100%, ${tint2}26, transparent 70%)` }} />
      )}

      {/* ── Capa 1.5 · AURA viva: blob de color de categoría que deriva despacio
          por detrás del velo. Da sensación de "energía" sin distraer (animado por
          CSS, transform-only → barato). */}
      <span aria-hidden className="zm-card-aura" style={{ position: "absolute", inset: "-30%", zIndex: 0, pointerEvents: "none", background: `radial-gradient(closest-side, ${glow}, transparent 70%)`, opacity: 0.55, willChange: "transform" }} />

      {/* ── Capa 2 · velo de legibilidad (blanco: fuerte arriba → suave abajo) +
          tinte de categoría al pie. Mantiene la card "clara premium" y el texto
          legible sin matar la imagen. Valores afinados POR CATEGORÍA. */}
      <span aria-hidden style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", background: `linear-gradient(180deg, rgba(255,255,255,${ovTop}) 0%, rgba(255,255,255,${ovMid}) 46%, rgba(255,255,255,${ovBot}) 100%), radial-gradient(120% 78% at 50% 118%, ${wash}, transparent 60%)` }} />

      {/* ── Capa 3 · efectos animados ──
          Sheen: barrido diagonal de luz que cruza la card en bucle (premium). */}
      <span aria-hidden className="zm-card-sheen" style={{ position: "absolute", top: 0, bottom: 0, width: "55%", left: "-70%", zIndex: 1, pointerEvents: "none", background: "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)", willChange: "transform" }} />
      {/* Glow radial de esquina por categoría que RESPIRA (escala suave en bucle) + sube en hover. */}
      <span aria-hidden className="zm-card-glow" style={{ position: "absolute", inset: -1, zIndex: 1, pointerEvents: "none", background: `radial-gradient(circle at 82% 102%, ${glow}, transparent 48%)`, opacity: active ? 0.85 : 0.55, transition: "opacity .25s", willChange: "transform" }} />
      {/* Halo + franja de acento superior (premium). */}
      <span aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 54, zIndex: 1, pointerEvents: "none", background: `radial-gradient(75% 130% at 50% -12%, ${glow}, transparent 72%)`, opacity: active ? 1 : 0.8, transition: "opacity .25s" }} />
      {/* Franja de acento superior con degradado que FLUYE de lado a lado. */}
      <span aria-hidden className="zm-card-accent" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, zIndex: 2, background: `linear-gradient(90deg, ${tint}, ${tint2}, ${tint}, ${tint2})`, backgroundSize: "300% 100%", opacity: active ? 1 : 0.9 }} />

      {/* ── ZONA DE LECTURA · velo frosted localizado SOLO bajo título+descripción.
          Banda blanca fuerte en el centro que se difumina arriba y abajo → el copy
          se lee al instante, pero el arte sigue visible en bordes, esquinas, pie y
          tras el CTA. Blur sutil (2px) sobre el detalle del arte = panel premium. */}
      <span
        aria-hidden
        style={{
          position: "absolute", left: 0, right: 0, top: "22%", height: "46%", zIndex: 1, pointerEvents: "none",
          background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.92) 26%, rgba(255,255,255,0.9) 64%, rgba(255,255,255,0) 100%)",
          backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)",
          WebkitMaskImage: "linear-gradient(180deg, transparent 0%, #000 22%, #000 78%, transparent 100%)",
          maskImage: "linear-gradient(180deg, transparent 0%, #000 22%, #000 78%, transparent 100%)",
        }}
      />

      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 13 }}>
        <span style={{ position: "relative", width: 56, height: 56, borderRadius: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(140deg, ${tint}44, ${tint2}26)`, border: `1.5px solid ${tint}99`, boxShadow: active ? `0 8px 20px ${tint}55, inset 0 1px 0 rgba(255,255,255,0.7)` : `0 4px 12px ${tint}33, inset 0 1px 0 rgba(255,255,255,0.55)`, transition: "box-shadow .25s, transform .25s", transform: active ? "scale(1.05)" : undefined }}>
          {/* brillo superior del contenedor del icono */}
          <span style={{ position: "absolute", inset: 0, borderRadius: 16, background: "linear-gradient(180deg, rgba(255,255,255,0.55), transparent 55%)", pointerEvents: "none" }} />
          {mod.iconSrc ? (
            // Icono propio teñido con CSS mask (color del tema, no el del SVG).
            <span
              aria-hidden
              style={{
                width: 30, height: 30, display: "inline-block", backgroundColor: INK,
                WebkitMaskImage: `url(${mod.iconSrc})`, maskImage: `url(${mod.iconSrc})`,
                WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
                WebkitMaskPosition: "center", maskPosition: "center",
                WebkitMaskSize: "contain", maskSize: "contain",
              }}
            />
          ) : (
            <I d={PATHS[mod.icon] || ""} c={INK} s={30} />
          )}
        </span>
        <span style={badgeStyle(mod.estado)}>{mod.estado === "En vivo" ? "● En vivo" : mod.estado}</span>
      </div>
      <h3 style={{ position: "relative", zIndex: 2, fontWeight: 800, fontSize: 16.5, letterSpacing: "-0.02em", color: "#071426", marginBottom: 5, textShadow: "0 1px 1px rgba(255,255,255,0.7)" }}>{mod.title}</h3>
      <p style={{ position: "relative", zIndex: 2, fontSize: 12.5, fontWeight: 500, color: "#344154", lineHeight: 1.35, marginBottom: 14, minHeight: 34, textShadow: "0 1px 1px rgba(255,255,255,0.55)" }}>{mod.desc}</p>
      {/* CTA con identidad de categoría (premium, no gris genérico). Anclado abajo. */}
      <span
        style={{
          position: "relative", zIndex: 2, marginTop: "auto",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          width: "100%",
          fontSize: 13, fontWeight: 800,
          color: disabled ? "#4f6394" : ctaColor,
          // Placa blanca translúcida bajo el degradado de categoría → el CTA se lee
          // nítido aunque el arte sea fuerte justo debajo (el oro de "Jugar" es opaco
          // y la tapa no se nota). Frosted sutil para acabado premium.
          background: disabled
            ? "#e3e9f5"
            : active
              ? `${ctaBgHov}, linear-gradient(rgba(255,255,255,0.62),rgba(255,255,255,0.62))`
              : `${ctaBg}, linear-gradient(rgba(255,255,255,0.68),rgba(255,255,255,0.68))`,
          backdropFilter: "saturate(150%) blur(3px)", WebkitBackdropFilter: "saturate(150%) blur(3px)",
          padding: "10px 0", borderRadius: 11,
          border: `1px solid ${disabled ? "#ccd8ec" : ctaBorder}`,
          boxShadow: active && !disabled ? `${ctaShadow}, inset 0 1px 0 rgba(255,255,255,0.5)` : "inset 0 1px 0 rgba(255,255,255,0.4)",
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
    // Más alto ahora que el arte es protagonista (entrada a un "modo"). El arte ocupa
    // toda la card al ser absoluto; min-height garantiza presencia sin cortar texto.
    minHeight: 236,
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
  const [gam, setGam] = useState<GamSummary | null>(null);
  const [match, setMatch] = useState<Featured>(null);
  // Top-5 del ranking global por Fútcoins (preview en vivo dentro del hub).
  const [topGlobal, setTopGlobal] = useState<TopEntry[] | null>(null);
  // ¿El usuario ya jugó la trivia diaria HOY? null = sin saber todavía.
  const [triviaPlayedToday, setTriviaPlayedToday] = useState<boolean | null>(null);
  // Preview manual del hero: /app?hero=live|match|reto|base (solo para diseño).
  const [heroOverride, setHeroOverride] = useState<"live" | "match" | "reto" | "base" | null>(null);
  // Carrusel del hero: índice de la pantalla visible (rota sola entre estados).
  const [heroIdx, setHeroIdx] = useState(0);
  const { canInstall, install } = useInstallPrompt();

  useEffect(() => {
    const h = new URLSearchParams(window.location.search).get("hero");
    if (h === "live" || h === "match" || h === "reto" || h === "base") setHeroOverride(h);
  }, []);

  // Sesión + perfil (degradación limpia si faltan envs).
  // IMPORTANTE: nos suscribimos a onAuthStateChange además del getUser()
  // inicial. Si al volver a la app el access token está caducado, el primer
  // getUser() puede resolver a null ANTES de que termine el refresh en
  // segundo plano; sin el listener la página se quedaba en "Modo invitado"
  // aunque la sesión fuera válida. El evento TOKEN_REFRESHED/SIGNED_IN nos
  // devuelve el usuario en cuanto el refresh completa.
  useEffect(() => {
    let on = true;

    const sb = (() => {
      try { return createSupabaseBrowserClient(); } catch { return null; }
    })();
    if (!sb) { setAuthed(false); return; }

    const applyUser = (user: import("@supabase/supabase-js").User | null) => {
      if (!on) return;
      if (!user) { setAuthed(false); setUsername(null); setAvatar(null); setGam(null); return; }
      setAuthed(true);
      sb.from("profiles").select("username,avatar_url").eq("id", user.id).single()
        .then(({ data: p }) => {
          if (!on) return;
          setUsername(p?.username || user.email?.split("@")[0] || null);
          setAvatar(p?.avatar_url || null);
        });
      // Billetera única: saldo de Fútcoins, nivel y racha reales (cross-módulo).
      fetch("/api/predictions/me")
        .then((r) => (r.ok ? r.json() : null))
        .then((g: GamSummary | null) => { if (on && g) setGam(g); })
        .catch(() => {});
    };

    sb.auth.getUser()
      .then(({ data }) => applyUser(data.user))
      .catch(() => { if (on) setAuthed(false); });

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user ?? null);
    });

    return () => { on = false; sub.subscription.unsubscribe(); };
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

  // Top-5 del ranking global por Fútcoins (público, sin sesión necesaria).
  useEffect(() => {
    let on = true;
    fetch("/api/ranking?limit=5")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { entries?: TopEntry[] } | null) => {
        if (on && d) setTopGlobal(d.entries ?? []);
      })
      .catch(() => { if (on) setTopGlobal([]); });
    return () => { on = false; };
  }, []);

  // ¿Trivia diaria pendiente? Alimenta el estado "reto" del hero. La sesión la
  // resuelve la cookie (logueado) o el anonId de localStorage (invitado).
  useEffect(() => {
    let on = true;
    const anon = (typeof window !== "undefined" && localStorage.getItem("zm_trivia_anon")) || "";
    const url = anon ? `/api/trivia/stats?anonId=${encodeURIComponent(anon)}` : "/api/trivia/stats";
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!on) return;
        // Sin registro de stats (invitado nuevo / sin partidas) = desconocido →
        // dejamos el hero en BASE (null), NO forzamos el reto.
        const stats = d?.stats;
        if (!stats) { setTriviaPlayedToday(null); return; }
        const last: string | null = stats.lastPlayed ?? null;
        const today = new Date().toISOString().slice(0, 10);
        setTriviaPlayedToday(!!last && last.slice(0, 10) === today);
      })
      .catch(() => { if (on) setTriviaPlayedToday(null); });
    return () => { on = false; };
  }, []);

  const live = match ? IN_PLAY.has(match.status) : false;
  const finished = match ? FINISHED.has(match.status) : false;
  const matchHref = match ? `/app/matchcenter/${match.slug}` : "/app/matchcenter";

  // Acentos "en vivo" (no están en la paleta base): coral + cian de retransmisión.
  const CORAL = "#ff6b5a";

  // ── HERO dinámico (Live Hub) ── slider CONTEXTUAL (no promo de módulos).
  //   El hero responde a "¿qué pasa ahora en ZonaMundial?". Prioridad:
  //   1) live    → partido en marcha (obligatorio primero)
  //   2) partido → partido del día / próximo (protagonista del contexto)
  //   3) base    → estado general de la app
  //   4) reto    → trivia pendiente (secundario, NUNCA primera impresión)
  const GREEN = "#36c98f";
  const retoAvailable = !live && triviaPlayedToday === false;
  // Icono de "play" por defecto del CTA primario (se tiñe del color de texto).
  const playIcon = (c: string) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 4l13 8-13 8V4z" fill={c} /></svg>;
  // `art` = imagen de fondo de la pantalla (reutiliza el arte de las cards).
  // accent/accent2 tiñen badge, glow, dots y el CTA primario. ctaInk = texto del CTA.
  // opening = pieza visual premium ya diseñada (imagen del juego inaugural):
  //   la imagen lo dice todo; solo se superpone una capa inferior con hora + CTA.
  type HeroCfg = { id: string; kind: "live" | "reto" | "base"; accent: string; accent2: string; ctaInk: string; icon?: React.ReactNode; eyebrow: string; title: React.ReactNode; desc: string; art: string; cta1: { label: string; href: string }; cta2?: { label: string; href: string }; opening?: { wide: string; mobile: string; time: string } };

  // ¿El partido del día es el JUEGO INAUGURAL (México vs Sudáfrica)? Solo entonces
  // usamos la pieza visual ya diseñada; otros partidos caen al hero de texto.
  const normName = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const isOpening = !!match && (() => {
    const t = normName(`${match.meta.home.name} ${match.meta.away.name}`);
    return t.includes("mexico") && (t.includes("sudafrica") || t.includes("south africa"));
  })();
  // Horario dinámico en la zona del usuario (la fuente está en -04:00; toLocale*
  // lo reescribe a la TZ local del navegador → "Hoy · 21:00" / "11 jun · 21:00").
  const openingTime = (() => {
    if (!match) return "";
    if (live) return `EN VIVO · ${match.elapsed}'`;
    if (finished) return "Finalizado";
    try {
      const d = new Date(`${match.meta.date}T${match.meta.time || "00:00"}:00-04:00`);
      const hm = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
      const sameDay = d.toDateString() === new Date().toDateString();
      return sameDay ? `Hoy · ${hm}` : `${d.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} · ${hm}`;
    } catch {
      return `${match.meta.date} · ${match.meta.time}`;
    }
  })();
  // CTA según estado del partido (spec): próximo / en vivo / finalizado.
  const openingCtaLabel = live ? "Seguir en directo" : finished ? "Ver resumen" : "Ver Match Center";
  // Slide inaugural: una sola pieza de imagen que cubre estados live/próximo/final.
  const heroOpening: HeroCfg | null = isOpening && match ? {
    id: "opening", kind: live ? "live" : "base",
    accent: live ? CORAL : GOLD2, accent2: live ? "#ff9a4a" : GOLD, ctaInk: "#08111f",
    eyebrow: "", title: null, desc: "", art: "",
    cta1: { label: openingCtaLabel, href: matchHref },
    opening: { wide: "/images/hero/juego-inaugural-wide.webp", mobile: "/images/hero/juego-inaugural-mobile.webp", time: openingTime },
  } : null;

  const heroLive: HeroCfg = {
    id: "live", kind: "live", accent: CORAL, accent2: "#ff9a4a", ctaInk: "#1a0d08",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#1a0d08" strokeWidth="1.8" /><circle cx="12" cy="12" r="3" fill="#1a0d08" /></svg>,
    eyebrow: "En vivo ahora",
    title: "El partido está en marcha",
    desc: "Sigue estadísticas, eventos y micro-predicciones en directo.",
    art: "/assets/card-backgrounds/match-center.webp",
    cta1: { label: "Entrar al Match Center", href: matchHref },
    cta2: { label: "Micro-predicciones", href: "/app/micro" },
  };
  // Partido del día / próximo: contextualiza el hero con el partido real SIN
  // duplicar el Match Center (aquí es narrativa + acceso; abajo es la "tele").
  const heroMatch: HeroCfg | null = match && !live && !finished ? {
    id: "match", kind: "base", accent: GOLD2, accent2: GOLD, ctaInk: NAVY, eyebrow: "Partido del día",
    title: <><span style={{ color: GOLD2 }}>{match.meta.home.name}</span> vs <span style={{ color: GOLD2 }}>{match.meta.away.name}</span> abre tu jornada</>,
    desc: "Consulta el directo, revisa datos y prepara tu predicción.",
    art: "/assets/card-backgrounds/match-center.webp",
    cta1: { label: "Ver Match Center", href: matchHref },
    cta2: { label: "Hacer predicción", href: "/app/predicciones" },
  } : null;
  const heroBase: HeroCfg = {
    id: "base", kind: "base", accent: GOLD2, accent2: GOLD, ctaInk: NAVY, eyebrow: "Mundial 2026",
    title: <>Tu centro vivo del <span style={{ background: `linear-gradient(135deg,${GOLD},${GOLD2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Mundial</span></>,
    desc: "Sigue el partido del día, entra al Match Center y compite con tus predicciones.",
    art: "/assets/card-backgrounds/predicciones.webp",
    cta1: { label: "Ver partido del día", href: matchHref },
    cta2: { label: "Explorar modos", href: "#modulos" },
  };
  const heroReto: HeroCfg = {
    id: "reto", kind: "reto", accent: GREEN, accent2: "#7ce0b3", ctaInk: "#072019",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V7l8-4ZM9 12l2 2 4-4" stroke="#072019" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    eyebrow: "Reto diario",
    title: <>Trivia <span style={{ background: `linear-gradient(135deg,${GREEN},#7ce0b3)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>disponible</span></>,
    desc: "Responde y suma puntos extra para el ranking.",
    art: "/assets/card-backgrounds/trivia-diaria.webp",
    cta1: { label: "Responder trivia", href: "/app/trivia" },
    cta2: { label: "Ver ranking", href: "/app/rankings" },
  };
  // Orden de slides por prioridad de contexto (NO promos):
  //   live (si hay) → partido del día (si hay) → base → reto (si pendiente).
  // Con ?hero= se bloquea a una sola pantalla (preview de diseño).
  const heroSlides: HeroCfg[] = heroOverride
    ? [heroOverride === "live" ? (heroOpening ?? heroLive) : heroOverride === "match" ? (heroOpening ?? heroMatch ?? heroBase) : heroOverride === "reto" ? heroReto : heroBase]
    : [
        // El juego inaugural (si es el partido del día) es la pieza protagonista y
        // cubre live/próximo/final; sustituye a los slides de texto live + partido.
        ...(heroOpening ? [heroOpening] : [
          ...(live ? [heroLive] : []),
          ...(heroMatch ? [heroMatch] : []),
        ]),
        heroBase,
        ...(retoAvailable ? [heroReto] : []),
      ];
  const hero = heroSlides[heroIdx % heroSlides.length];
  // Auto-rotación del carrusel (pausa si solo hay una pantalla o hay preview).
  const heroCount = heroSlides.length;
  useEffect(() => {
    if (heroCount <= 1) return;
    const id = setInterval(() => setHeroIdx((i) => (i + 1) % heroCount), 9000);
    return () => clearInterval(id);
  }, [heroCount]);
  // Estilo del CTA primario, derivado del acento de la pantalla activa.
  const heroCta1 = {
    bg: `linear-gradient(135deg,${hero.accent},${hero.accent2})`,
    color: hero.ctaInk,
    shadow: `0 6px 20px ${hero.accent}40`,
    icon: hero.icon ?? playIcon(hero.ctaInk),
  };

  // Acento del Match Center según estado del partido.
  const mcAccent = live ? CORAL : finished ? "#8a93a3" : GOLD;

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(1200px 600px at 50% -10%, #12284a 0%, ${NAVY} 55%)`, color: TXT, fontFamily: "'Outfit',sans-serif", overflowX: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`*{box-sizing:border-box}::selection{background:rgba(201,168,76,.3)}@keyframes zmpulse{0%,100%{opacity:1}50%{opacity:.4}}@keyframes zmHeroIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}@keyframes zmHeroArtIn{from{opacity:0}to{opacity:.62}}.zm-hero{display:flex;flex-direction:column;justify-content:center;align-items:flex-start;height:264px}@media(max-width:560px){.zm-hero{height:320px}.zm-open-cta{padding:9px 16px!important;font-size:13.5px!important}}@media(min-width:561px){.zm-hero-art--text{object-position:center 62%!important;opacity:.72!important;-webkit-mask-image:linear-gradient(90deg,transparent 4%,rgba(0,0,0,.6) 34%,#000 64%)!important;mask-image:linear-gradient(90deg,transparent 4%,rgba(0,0,0,.6) 34%,#000 64%)!important}}.zm-hero-slide{animation:zmHeroIn .5s ease both}.zm-hero-art{animation:zmHeroArtIn .6s ease both}@media (prefers-reduced-motion: reduce){.zm-hero-slide,.zm-hero-art{animation:none}}`}</style>

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
              <span style={{ fontSize: 13, fontWeight: 800, color: GOLD2 }}>{authed ? (gam ? gam.coins.toLocaleString() : "·") : "—"}</span>
            </div>
            {/* Nivel + XP */}
            {authed && gam && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: GOLD }}>Nivel {gam.level.level}</span>
                <div style={{ width: 50, height: 5, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, ((gam.level.xp % 1000) / 1000) * 100)}%`, height: "100%", borderRadius: 99, background: `linear-gradient(90deg,${GOLD},${GOLD2})` }} />
                </div>
              </div>
            )}
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

        {/* ═══ 2. HERO DINÁMICO · LIVE HUB ═══
            No repite "Hacer predicción": en base invita a explorar/ver partido; en
            vivo lleva al Match Center. Fondo navy premium + textura de cancha + glow
            animado + chispas muy discretas. Estado por el partido (live/base). */}
        <div className="zm-hero" style={{ position: "relative", borderRadius: 22, padding: hero.opening ? 0 : "0 18px", marginBottom: 16, overflow: "hidden", background: "linear-gradient(135deg,#102a4d 0%,#0a1b33 100%)", border: `1px solid ${hero.accent}44`, boxShadow: "0 20px 50px rgba(0,0,0,0.35)" }}>
          {hero.opening ? (
            /* ── Slide del JUEGO INAUGURAL: la imagen ya trae todo el texto
                ("11 JUNIO · JUEGO INAUGURAL", MEXICO, VS, SUDAFRICA). Solo
                integramos la imagen correcta por viewport + una capa inferior
                ligera con horario dinámico y un único CTA. ── */
            <>
              <picture>
                <source media="(max-width:640px)" srcSet={hero.opening.mobile} />
                <img
                  src={hero.opening.wide}
                  alt="Juego inaugural · México vs Sudáfrica · 11 de junio"
                  loading="eager" decoding="async" className="zm-hero-art"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0, objectFit: "cover", objectPosition: "center", pointerEvents: "none" }}
                />
              </picture>
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 16, padding: "0 18px 12px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, letterSpacing: 0.4, color: "#fff", textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}>
                  {hero.kind === "live" && <span className="zm-live-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: hero.accent }} />}
                  {hero.opening.time}
                </span>
                <Link href={hero.cta1.href} className="zm-open-cta" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "12px 22px", borderRadius: 12, background: heroCta1.bg, color: heroCta1.color, fontWeight: 800, fontSize: 15, textDecoration: "none", boxShadow: heroCta1.shadow }}>
                  {heroCta1.icon}
                  {hero.cta1.label}
                </Link>
              </div>
            </>
          ) : (
          <>
          {/* ── Arte del estado (imagen de card reutilizada): vive a la derecha,
              se funde con el navy hacia la izquierda para no tapar el texto. ── */}
          <img
            key={hero.art} src={hero.art} alt="" aria-hidden loading="lazy" decoding="async" className="zm-hero-art zm-hero-art--text"
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0,
              objectFit: "cover", objectPosition: "center 38%", pointerEvents: "none", opacity: 0.62,
              WebkitMaskImage: "linear-gradient(90deg, transparent 30%, rgba(0,0,0,0.5) 62%, #000 100%)",
              maskImage: "linear-gradient(90deg, transparent 30%, rgba(0,0,0,0.5) 62%, #000 100%)",
            }}
          />
          {/* velo navy sobre el arte para asegurar contraste del título */}
          <span aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", background: "linear-gradient(100deg, #0c2143 0%, rgba(12,33,67,0.78) 38%, rgba(10,27,51,0.30) 70%, rgba(10,27,51,0.1) 100%)" }} />
          {/* glow radial animado */}
          <span aria-hidden className="zm-hero-glow" style={{ position: "absolute", top: -70, right: -50, width: 290, height: 290, borderRadius: "50%", background: `radial-gradient(circle, ${hero.accent}30, transparent 70%)`, pointerEvents: "none" }} />
          {/* textura deportiva (rayado de cancha en diagonal, sutil) */}
          <span aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.5, background: "repeating-linear-gradient(115deg, transparent 0 26px, rgba(255,255,255,0.022) 26px 27px)" }} />
          {/* foco inferior tipo estadio */}
          <span aria-hidden style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 130, pointerEvents: "none", background: "radial-gradient(120% 80% at 50% 150%, rgba(255,255,255,0.06), transparent 60%)" }} />
          {/* chispas / luces muy discretas */}
          <span aria-hidden className="zm-spark zm-spark--1" style={{ position: "absolute", left: "16%", bottom: 24, width: 3, height: 3, borderRadius: "50%", background: hero.accent, pointerEvents: "none" }} />
          <span aria-hidden className="zm-spark zm-spark--2" style={{ position: "absolute", left: "42%", bottom: 18, width: 2, height: 2, borderRadius: "50%", background: GOLD2, pointerEvents: "none" }} />
          <span aria-hidden className="zm-spark zm-spark--3" style={{ position: "absolute", left: "68%", bottom: 30, width: 3, height: 3, borderRadius: "50%", background: hero.accent, pointerEvents: "none" }} />

          <div key={hero.id} className="zm-hero-slide" style={{ position: "relative", zIndex: 2, maxWidth: 580 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: hero.accent }}>
              {hero.kind === "live" && <span className="zm-live-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: hero.accent }} />}
              {hero.eyebrow}
            </span>
            <h1 style={{ fontSize: "clamp(25px,5.4vw,38px)", fontWeight: 900, lineHeight: 1.06, margin: "8px 0 10px" }}>
              {hero.title}
            </h1>
            <p style={{ color: TXT_MUT, fontSize: 14.5, lineHeight: 1.55, marginBottom: 20, maxWidth: 460 }}>
              {hero.desc}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Link href={hero.cta1.href} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "12px 22px", borderRadius: 12, background: heroCta1.bg, color: heroCta1.color, fontWeight: 800, fontSize: 15, textDecoration: "none", boxShadow: heroCta1.shadow }}>
                {heroCta1.icon}
                {hero.cta1.label}
              </Link>
              {hero.cta2 && (
                <Link href={hero.cta2.href} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "12px 20px", borderRadius: 12, background: "rgba(255,255,255,0.06)", color: TXT, fontWeight: 700, fontSize: 14.5, textDecoration: "none", border: `1px solid ${LINE}` }}>
                  {hero.cta2.label}
                </Link>
              )}
            </div>
          </div>
          </>
          )}

          {/* Puntitos del carrusel: indican cuántas pantallas hay y permiten saltar. */}
          {heroSlides.length > 1 && (
            <div style={{ position: "absolute", left: 0, right: 0, bottom: hero.opening ? 70 : 16, zIndex: 3, display: "flex", justifyContent: "center", gap: 7 }}>
              {heroSlides.map((s, i) => {
                const activo = i === heroIdx % heroSlides.length;
                return (
                  <button
                    key={s.id}
                    aria-label={`Ver ${s.eyebrow}`}
                    onClick={() => setHeroIdx(i)}
                    style={{
                      width: activo ? 22 : 8, height: 8, borderRadius: 99, padding: 0, cursor: "pointer",
                      border: "none", transition: "width .25s ease, background .25s ease",
                      background: activo ? hero.accent : "rgba(255,255,255,0.32)",
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* ═══ 3. MATCH CENTER DESTACADO (estilo retransmisión) ═══
            El bloque más fuerte de la pantalla: navy + textura de estadio, banderas
            grandes, VS potente, borde/glow por estado (dorado=próximo, coral=en vivo,
            gris=finalizado) y pulso en vivo. Es la "tele" del partido del día. */}
        {match && (
          <Link href={matchHref} className={`zm-mc${live ? " zm-mc--live" : ""}`} style={{ position: "relative", display: "block", textDecoration: "none", color: TXT, borderRadius: 22, padding: "20px 18px 18px", marginBottom: 12, overflow: "hidden", background: "linear-gradient(160deg,#103060 0%,#0a1a31 58%,#0b1c36 100%)", border: `2px solid ${mcAccent}77`, boxShadow: live ? `0 24px 56px rgba(0,0,0,0.5), 0 0 0 1px ${mcAccent}66, 0 0 36px ${mcAccent}30` : `0 22px 50px rgba(0,0,0,0.42), 0 0 26px ${mcAccent}1f` }}>
            {/* focos superiores */}
            <span aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(85% 55% at 50% -12%, ${mcAccent}26, transparent 60%)` }} />
            {/* césped/líneas inferiores del estadio */}
            <span aria-hidden style={{ position: "absolute", left: 0, right: 0, bottom: -1, height: 92, pointerEvents: "none", background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.32)), repeating-linear-gradient(90deg, transparent 0 38px, rgba(255,255,255,0.04) 38px 39px)" }} />
            {/* glow lateral (pulsa en vivo) */}
            <span aria-hidden className={live ? "zm-mc-glow" : ""} style={{ position: "absolute", top: "52%", left: -34, width: 130, height: 130, transform: "translateY(-50%)", borderRadius: "50%", background: `radial-gradient(circle, ${mcAccent}33, transparent 70%)`, pointerEvents: "none", opacity: live ? undefined : 0.55 }} />

            {/* fila superior: fase + estado + predicciones */}
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, gap: 8 }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: mcAccent }}>
                Partido del día{match.meta.phase ? ` · ${match.meta.phase}` : ""}{match.meta.group ? ` · Grupo ${match.meta.group}` : ""}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {!finished && (
                  <Link href="/app/predicciones" onClick={(e) => e.stopPropagation()} style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase", borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap", color: "#8a6a13", backgroundImage: "linear-gradient(180deg,#fdf3cf,#f7e6ac)", border: "1px solid #f0dca0", textDecoration: "none", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55), 0 1px 2px rgba(8,16,30,0.12)", flexShrink: 0 }}>
                    Predicciones
                  </Link>
                )}
                <span style={{ ...badgeStyle(live ? "En vivo" : finished ? "Disponible" : "Próximamente"), animation: live ? "zmpulse 1.6s infinite" : undefined }}>
                  {live ? `● En vivo ${match.elapsed}'` : finished ? "Finalizado" : "Próximo"}
                </span>
              </div>
            </div>

            {/* equipos + VS potente */}
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, margin: "14px 2px 12px" }}>
              <McTeam name={match.meta.home.name} flag={match.meta.home.flag} />
              <div style={{ textAlign: "center", minWidth: 84, flexShrink: 0 }}>
                {live || finished ? (
                  <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: 1, lineHeight: 1, textShadow: "0 2px 14px rgba(0,0,0,0.55)" }}>
                    {match.score[0]}<span style={{ color: TXT_MUT, margin: "0 6px" }}>-</span>{match.score[1]}
                  </div>
                ) : (
                  <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: 2, lineHeight: 1, background: `linear-gradient(135deg,${GOLD},${GOLD2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", textShadow: "0 2px 16px rgba(201,168,76,0.25)", filter: "drop-shadow(0 2px 10px rgba(201,168,76,0.3))" }}>VS</div>
                )}
                <div style={{ fontSize: 12.5, fontWeight: 800, color: GOLD2, marginTop: 6 }}>
                  {live ? `${match.elapsed}'` : finished ? "Final" : (match.meta.time || "")}
                </div>
                {!live && !finished && (
                  <div style={{ fontSize: 10, color: TXT_MUT, marginTop: 1 }}>{fmtDate(match.meta.date, match.meta.time)}</div>
                )}
              </div>
              <McTeam name={match.meta.away.name} flag={match.meta.away.flag} />
            </div>

            {/* estadio + ciudad */}
            {(match.meta.venue || match.meta.city) && (
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 13, color: TXT_MUT, fontSize: 11.5, fontWeight: 600 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" stroke="currentColor" strokeWidth="1.6" /><circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.6" /></svg>
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {[match.meta.venue, match.meta.city].filter(Boolean).join(" · ")}
                </span>
              </div>
            )}

            {/* CTA único (no compite con la predicción rápida) */}
            <span style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: "100%", padding: "11px 0", borderRadius: 12, fontWeight: 800, fontSize: 14, color: live ? "#1a0d08" : NAVY, background: live ? `linear-gradient(135deg,${CORAL},#ff9a4a)` : `linear-gradient(135deg,${GOLD},${GOLD2})`, boxShadow: live ? "0 6px 18px rgba(255,107,90,0.35)" : "0 6px 18px rgba(201,168,76,0.28)" }}>
              {live ? "Seguir en directo" : "Ver Match Center"}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          </Link>
        )}

        {/* ═══ 3b. PREDICCIÓN RÁPIDA (compacta, acción directa) ═══
            Card delgada que NO compite con el Match Center: solo invita a predecir
            el partido del día. Aquí vive el único "Hacer predicción" de la home. */}
        {match && !finished && (
          <Link href="/app/predicciones" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", marginBottom: 24, borderRadius: 14, textDecoration: "none", color: TXT, background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))", border: `1px solid ${LINE}` }}>
            <span style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(201,168,76,0.14)", border: `1px solid ${GOLD}55` }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M14.5 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" stroke={GOLD2} strokeWidth="1.7" strokeLinecap="round" /></svg>
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: GOLD }}>Predicción rápida</div>
              <div style={{ fontSize: 14, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {match.meta.home.name} <span style={{ color: TXT_MUT, fontWeight: 600 }}>vs</span> {match.meta.away.name}
              </div>
            </div>
            <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 15px", borderRadius: 999, fontWeight: 800, fontSize: 13, color: NAVY, background: `linear-gradient(135deg,${GOLD},${GOLD2})`, boxShadow: "0 5px 14px rgba(201,168,76,0.28)" }}>
              Predecir
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke={NAVY} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
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
              <Stat k="Nivel" v={gam ? String(gam.level.level) : "·"} />
              <Stat k="Fútcoins" v={gam ? gam.coins.toLocaleString() : "·"} />
              <Stat k="XP" v={gam ? gam.level.xp.toLocaleString() : "·"} />
              <Stat k="Racha" v={gam ? `${gam.streak.current} días` : "·"} />
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

        {/* ═══ Stories (burbujas estilo IG) — se ocultan si no hay ninguna ═══ */}
        <div style={{ marginBottom: 26 }}>
          <StoryViewer hideWhenEmpty />
        </div>

        {/* ═══ 5 + 6. CATEGORÍAS con subtítulo ═══ */}
        {CATS.map((cat, i) => (
          <section key={cat.key} id={i === 0 ? "modulos" : undefined} style={{ marginBottom: 32, scrollMarginTop: 14 }}>
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
            {/* Con datos reales: top-5 por Fútcoins. Si aún no hay nadie, se
                rellena con "plazas libres" para no dejar la card vacía. */}
            {(topGlobal && topGlobal.length > 0
              ? topGlobal
              : [1, 2, 3, 4, 5].map((pos) => ({ rank: pos, userId: `slot-${pos}`, name: null, avatarUrl: null, country: null, coins: 0 } as TopEntry))
            ).map((e) => {
              const filled = e.coins > 0 || !!e.name;
              const nm = e.name || "Plaza libre";
              return (
                <div key={e.userId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", borderRadius: 10, background: "#fff", border: "1px solid rgba(14,28,51,0.05)" }}>
                  <span style={{ width: 22, textAlign: "center", fontWeight: 900, color: e.rank <= 3 ? "#b8902f" : "#9aa6bd", fontSize: 14 }}>{e.rank}</span>
                  <span style={{
                    width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                    background: e.avatarUrl ? `url(${e.avatarUrl}) center/cover no-repeat` : "#e2e8f3",
                    color: "#0e1c33", fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
                  }} aria-hidden>{filled && !e.avatarUrl ? nm.charAt(0).toUpperCase() : ""}</span>
                  {filled && e.country && /^[a-z]{2}$/i.test(e.country) && (
                    <img src={`https://flagcdn.com/w40/${e.country.toLowerCase()}.png`} alt="" width={20} height={13} style={{ borderRadius: 2, objectFit: "cover", flexShrink: 0 }} />
                  )}
                  <span style={{ flex: 1, color: filled ? INK : "#9aa6bd", fontSize: 13.5, fontWeight: filled ? 700 : 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nm}</span>
                  <span style={{ color: filled ? "#b8902f" : "#9aa6bd", fontSize: 12.5, fontWeight: 800 }}>{filled ? `${e.coins.toLocaleString()} 🪙` : "— pts"}</span>
                </div>
              );
            })}
          </div>
          {(!topGlobal || topGlobal.length === 0) && (
            <p style={{ fontSize: 12, color: "#6a7791", marginTop: 12, textAlign: "center" }}>
              El ranking arranca con el Mundial el 11 de junio. {authed ? "Tu posición aparecerá aquí." : "Crea tu cuenta para competir."}
            </p>
          )}
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

        /* ── Vida detrás de cada card (animado, premium, barato: transform/opacity) ── */
        @keyframes zm-aura {
          0%   { transform: translate3d(-8%, -6%, 0) scale(1);    opacity:.45; }
          50%  { transform: translate3d(10%, 8%, 0)  scale(1.18); opacity:.7;  }
          100% { transform: translate3d(-8%, -6%, 0) scale(1);    opacity:.45; }
        }
        @keyframes zm-sheen {
          0%   { transform: translateX(0); }
          /* el barrido cruza y luego espera (gran parte del ciclo en reposo) */
          18%  { transform: translateX(320%); }
          100% { transform: translateX(320%); }
        }
        @keyframes zm-glow {
          0%,100% { transform: scale(1);    opacity:.55; }
          50%     { transform: scale(1.12); opacity:.85; }
        }
        @keyframes zm-accent { 0%{ background-position:0% 50%; } 100%{ background-position:300% 50%; } }

        .zm-card-aura   { animation: zm-aura 9s ease-in-out infinite; }
        .zm-card-sheen  { animation: zm-sheen 6.5s cubic-bezier(.6,0,.2,1) infinite; }
        .zm-card-glow   { animation: zm-glow 5s ease-in-out infinite; }
        .zm-card-accent { animation: zm-accent 7s linear infinite; }
        /* Hover: el glow brilla y el sheen acelera → la card "despierta". */
        .zm-mod-card:hover .zm-card-glow  { animation-duration: 2.4s; }
        .zm-mod-card:hover .zm-card-sheen { animation-duration: 2.8s; }

        /* Escalonado por posición → las cards no laten al unísono (más vivo). */
        .zm-mod-card:nth-child(4n+1) .zm-card-aura,
        .zm-mod-card:nth-child(4n+1) .zm-card-glow  { animation-delay: 0s;    }
        .zm-mod-card:nth-child(4n+2) .zm-card-aura,
        .zm-mod-card:nth-child(4n+2) .zm-card-glow  { animation-delay: -1.6s; }
        .zm-mod-card:nth-child(4n+3) .zm-card-aura,
        .zm-mod-card:nth-child(4n+3) .zm-card-glow  { animation-delay: -3.1s; }
        .zm-mod-card:nth-child(4n)   .zm-card-aura,
        .zm-mod-card:nth-child(4n)   .zm-card-glow  { animation-delay: -4.4s; }
        .zm-mod-card:nth-child(3n+1) .zm-card-sheen { animation-delay: 0s;    }
        .zm-mod-card:nth-child(3n+2) .zm-card-sheen { animation-delay: -2.2s; }
        .zm-mod-card:nth-child(3n)   .zm-card-sheen { animation-delay: -4.3s; }

        /* ── Hero (Live Hub) + Match Center: vida premium ── */
        @keyframes zm-hero-glow {
          0%,100% { transform: translate(0,0) scale(1);        opacity:.8; }
          50%     { transform: translate(-14px,12px) scale(1.14); opacity:1; }
        }
        @keyframes zm-livedot {
          0%   { box-shadow: 0 0 0 0 rgba(255,107,90,.65); }
          70%  { box-shadow: 0 0 0 9px rgba(255,107,90,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,107,90,0); }
        }
        @keyframes zm-mcglow {
          0%,100% { opacity:.5; transform: translateY(-50%) scale(1); }
          50%     { opacity:.9; transform: translateY(-50%) scale(1.22); }
        }
        @keyframes zm-spark {
          0%   { transform: translateY(0);     opacity:0; }
          25%  { opacity:.85; }
          100% { transform: translateY(-46px); opacity:0; }
        }
        .zm-hero-glow  { animation: zm-hero-glow 7s ease-in-out infinite; will-change: transform; }
        .zm-live-dot   { animation: zm-livedot 1.4s infinite; }
        .zm-mc-glow    { animation: zm-mcglow 2.4s ease-in-out infinite; will-change: transform; }
        .zm-spark      { animation: zm-spark 4.5s ease-out infinite; will-change: transform; }
        .zm-spark--2   { animation-duration: 5.6s; animation-delay: -1.8s; }
        .zm-spark--3   { animation-duration: 5.1s; animation-delay: -3.2s; }

        /* Accesibilidad + batería: sin movimiento si el usuario lo pide. */
        @media (prefers-reduced-motion: reduce) {
          .zm-card-aura, .zm-card-sheen, .zm-card-glow, .zm-card-accent,
          .zm-hero-glow, .zm-live-dot, .zm-mc-glow, .zm-spark { animation: none; }
          .zm-card-sheen, .zm-spark { display: none; }
        }
      `}</style>
    </div>
  );
}

/* ─────────── Subcomponentes ─────────── */
// Equipo del Match Center destacado: bandera grande (retransmisión) + nombre.
function McTeam({ name, flag }: { name: string; flag: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      {flag
        ? <img src={`https://flagcdn.com/w160/${flag}.png`} alt="" width={58} height={40} style={{ borderRadius: 7, objectFit: "cover", boxShadow: "0 4px 14px rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.2)" }} />
        : <span style={{ width: 58, height: 40, borderRadius: 7, background: "rgba(255,255,255,0.1)" }} />}
      <span style={{ fontWeight: 800, fontSize: 13.5, textAlign: "center", lineHeight: 1.15, maxWidth: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>{name}</span>
    </div>
  );
}
function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ textAlign: "center", padding: "12px 8px", borderRadius: 12, background: "#fff", border: "1px solid rgba(14,28,51,0.05)" }}>
      <div style={{ fontSize: 20, fontWeight: 900, color: INK }}>{v}</div>
      <div style={{ fontSize: 11, color: "#6a7791", fontWeight: 600, marginTop: 2 }}>{k}</div>
    </div>
  );
}
