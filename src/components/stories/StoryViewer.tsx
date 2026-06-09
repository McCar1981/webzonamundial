"use client";

// src/components/stories/StoryViewer.tsx
//
// Visor funcional de Stories (rebanada vertical inicial del módulo).
// - Carga el feed real desde /api/stories/feed (reels agrupados).
// - Carrusel de burbujas arriba (anillo dorado = sin ver, gris = visto).
// - Visor vertical fullscreen: progress dots, tap izq/der, auto-avance,
//   mantener para pausar, swipe-up no implementado (placeholder).
// - Widgets interactivos: encuesta (poll), micro-reto (SÍ/NO), CTA.
// - Registra vista (POST /view al abrir, completed al terminar) e interacción.
//
// Diseño: fullscreen oscuro (natural para un visor de stories) con dorado de
// acento (paleta de la app). El carrusel respeta el navy del hub.

import { useCallback, useEffect, useRef, useState } from "react";
import type { StoryReelDTO, StoryDTO, StoryWidget, StorySticker } from "@/lib/stories/types";

const GOLD = "#c9a84c";
const NAVY = "#0a1729";
const STORY_MS = 7000; // duración por Story sin video

interface OpenState {
  reelIndex: number;
  storyIndex: number;
}

interface StoryViewerProps {
  /** En el home: si no hay Stories o aún carga, no renderiza nada (no ocupa espacio). */
  hideWhenEmpty?: boolean;
}

export default function StoryViewer({ hideWhenEmpty = false }: StoryViewerProps) {
  const [reels, setReels] = useState<StoryReelDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<OpenState | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/stories/feed", { cache: "no-store" });
        const json = await res.json();
        if (alive) setReels(json.reels ?? []);
      } catch {
        if (alive) setReels([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const markSeen = useCallback((reelIndex: number, storyIndex: number) => {
    setReels((prev) => {
      const next = [...prev];
      const reel = next[reelIndex];
      if (!reel) return prev;
      const stories = reel.stories.map((s, i) =>
        i === storyIndex ? { ...s, seen: true } : s
      );
      const allSeen = stories.every((s) => s.seen);
      next[reelIndex] = { ...reel, stories, allSeen };
      return next;
    });
  }, []);

  if (loading) {
    if (hideWhenEmpty) return null;
    return <p style={{ color: "#8a94b0", padding: "1rem" }}>Cargando Stories…</p>;
  }
  if (!reels.length) {
    if (hideWhenEmpty) return null;
    return (
      <p style={{ color: "#8a94b0", padding: "1rem" }}>
        No hay Stories activas ahora mismo.
      </p>
    );
  }

  return (
    <>
      <CarouselBar reels={reels} onOpen={(r, s) => setOpen({ reelIndex: r, storyIndex: s })} />
      {open && (
        <Overlay
          reels={reels}
          open={open}
          onClose={() => setOpen(null)}
          onAdvance={setOpen}
          onSeen={markSeen}
        />
      )}
    </>
  );
}

// ─── Carrusel de burbujas ──────────────────────────────────────────────────
function CarouselBar({
  reels,
  onOpen,
}: {
  reels: StoryReelDTO[];
  onOpen: (reelIndex: number, storyIndex: number) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        overflowX: "auto",
        padding: "12px 4px",
        scrollbarWidth: "none",
      }}
    >
      {/* Primera burbuja: AÑADIR (estilo IG "Tu historia"). Abre el creador. */}
      <a
        href="/app/stories/crear"
        aria-label="Añadir Story"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          textDecoration: "none",
          minWidth: 72,
        }}
      >
        <span
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            border: "2px dashed rgba(201,168,76,0.7)",
            background: NAVY,
            display: "grid",
            placeItems: "center",
            color: GOLD,
            fontSize: 30,
            fontWeight: 300,
            lineHeight: 1,
          }}
        >
          +
        </span>
        <span style={{ color: "#c9d2e3", fontSize: 12, maxWidth: 72, textAlign: "center" }}>
          Tu historia
        </span>
      </a>

      {reels.map((reel, i) => {
        // primera Story no vista del reel (o la primera si todas vistas)
        const firstUnseen = reel.stories.findIndex((s) => !s.seen);
        const startIdx = firstUnseen >= 0 ? firstUnseen : 0;
        return (
          <button
            key={reel.key}
            onClick={() => onOpen(i, startIdx)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              minWidth: 72,
            }}
          >
            <span
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                padding: 3,
                background: reel.allSeen
                  ? "#39435a"
                  : `linear-gradient(135deg, ${GOLD}, #e8d48b)`,
                display: "grid",
                placeItems: "center",
              }}
            >
              <span
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  background: NAVY,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 22,
                }}
              >
                {reelEmoji(reel.type)}
              </span>
            </span>
            <span style={{ color: "#c9d2e3", fontSize: 12, maxWidth: 72, textAlign: "center" }}>
              {reel.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function reelEmoji(type: StoryReelDTO["type"]): string {
  switch (type) {
    case "creator":
      return "🎬";
    case "system":
      return "🤖";
    case "narrative":
      return "📖";
    case "league":
      return "👥";
    case "user":
    default:
      return "📱";
  }
}

// ─── Overlay fullscreen ─────────────────────────────────────────────────────
function Overlay({
  reels,
  open,
  onClose,
  onAdvance,
  onSeen,
}: {
  reels: StoryReelDTO[];
  open: OpenState;
  onClose: () => void;
  onAdvance: (s: OpenState) => void;
  onSeen: (reelIndex: number, storyIndex: number) => void;
}) {
  const reel = reels[open.reelIndex];
  const story = reel?.stories[open.storyIndex];
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  // Pausa leída por ref dentro del bucle de animación: así pausar/reanudar NO
  // re-monta el temporizador (antes reiniciaba la Story a 0 al soltar).
  const pausedRef = useRef(false);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // Avanzar a la siguiente Story / reel / cerrar.
  const next = useCallback(() => {
    if (!reel) return onClose();
    if (open.storyIndex < reel.stories.length - 1) {
      onAdvance({ reelIndex: open.reelIndex, storyIndex: open.storyIndex + 1 });
    } else if (open.reelIndex < reels.length - 1) {
      onAdvance({ reelIndex: open.reelIndex + 1, storyIndex: 0 });
    } else {
      onClose();
    }
  }, [reel, open, reels.length, onAdvance, onClose]);

  const prev = useCallback(() => {
    if (open.storyIndex > 0) {
      onAdvance({ reelIndex: open.reelIndex, storyIndex: open.storyIndex - 1 });
    } else if (open.reelIndex > 0) {
      const prevReel = reels[open.reelIndex - 1];
      onAdvance({ reelIndex: open.reelIndex - 1, storyIndex: prevReel.stories.length - 1 });
    }
  }, [open, reels, onAdvance]);

  // Registrar vista al montar cada Story + marcar seen local.
  useEffect(() => {
    if (!story) return;
    onSeen(open.reelIndex, open.storyIndex);
    fetch(`/api/stories/${story.id}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: false }),
    }).catch(() => {});
  }, [story?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer de auto-avance (pausable).
  useEffect(() => {
    setProgress(0);
    elapsedRef.current = 0;
    startRef.current = performance.now();

    const tick = (t: number) => {
      if (pausedRef.current) {
        // Mientras está pausada, desplazamos el inicio para que el tiempo
        // transcurrido quede congelado y se reanude donde estaba.
        startRef.current = t - elapsedRef.current;
      } else {
        elapsedRef.current = t - startRef.current;
        const p = Math.min(elapsedRef.current / STORY_MS, 1);
        setProgress(p);
        if (p >= 1) {
          // completada
          if (story) {
            fetch(`/api/stories/${story.id}/view`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ completed: true }),
            }).catch(() => {});
          }
          next();
          return;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [story?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Teclado: ← → Esc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, onClose]);

  if (!reel || !story) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.92)",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "min(420px, 100vw)",
          height: "min(92vh, 820px)",
          borderRadius: 16,
          overflow: "hidden",
          background: storyBg(story),
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* progress dots */}
        <div style={{ display: "flex", gap: 4, padding: 10 }}>
          {reel.stories.map((_, i) => (
            <span
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 3,
                background: "rgba(255,255,255,0.3)",
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  display: "block",
                  height: "100%",
                  width:
                    i < open.storyIndex
                      ? "100%"
                      : i === open.storyIndex
                      ? `${progress * 100}%`
                      : "0%",
                  background: "#fff",
                }}
              />
            </span>
          ))}
        </div>

        {/* cabecera */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 12px 8px" }}>
          <span style={{ fontSize: 20 }}>{reelEmoji(reel.type)}</span>
          <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{reel.label}</span>
          <button
            onClick={onClose}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: 22,
              cursor: "pointer",
              lineHeight: 1,
            }}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* contenido + zonas de tap */}
        <div
          style={{ position: "relative", flex: 1, display: "grid", placeItems: "center", padding: 20 }}
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
          onPointerLeave={() => setPaused(false)}
        >
          {/* tap izquierda / derecha */}
          <button
            onClick={prev}
            aria-label="Anterior"
            style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "33%", background: "none", border: "none", cursor: "pointer" }}
          />
          <button
            onClick={next}
            aria-label="Siguiente"
            style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "33%", background: "none", border: "none", cursor: "pointer" }}
          />

          <StoryContent story={story} />
          <StickerLayer story={story} />
        </div>

        {/* widgets */}
        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          {story.widgets.map((w) => (
            <WidgetView key={w.id} storyId={story.id} widget={w} onBusy={setPaused} />
          ))}
        </div>
      </div>
    </div>
  );
}

function storyBg(story: StoryDTO): string {
  if (story.mediaType === "image" && story.mediaUrl) {
    return `center/cover no-repeat url(${story.mediaUrl})`;
  }
  return "linear-gradient(160deg,#0F1D32,#091522)";
}

function StoryContent({ story }: { story: StoryDTO }) {
  if (story.mediaType === "video" && story.mediaUrl) {
    return (
      <video
        src={story.mediaUrl}
        autoPlay
        muted
        playsInline
        style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8 }}
      />
    );
  }

  // Foto: el texto va como caption abajo (igual que en el editor), no centrado.
  if (story.mediaType === "image") {
    if (!story.overlayText?.trim()) return null;
    return (
      <p
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 28,
          margin: 0,
          padding: "0 16px",
          color: "#fff",
          fontSize: 18,
          fontWeight: 800,
          textAlign: "center",
          lineHeight: 1.3,
          textShadow: "0 2px 10px rgba(0,0,0,0.7)",
        }}
      >
        {story.overlayText}
      </p>
    );
  }

  // Cromo / texto: centrado grande.
  return (
    <p
      style={{
        color: "#fff",
        fontSize: 24,
        fontWeight: 700,
        textAlign: "center",
        lineHeight: 1.3,
        textShadow: "0 2px 12px rgba(0,0,0,0.5)",
      }}
    >
      {story.overlayText ?? ""}
    </p>
  );
}

// Stickers pegados sobre la foto, en posición relativa 0..1.
// Pueden ser emoji o imagen (Giphy): si `url` está, se renderiza <img>.
function StickerLayer({ story }: { story: StoryDTO }) {
  const raw = (story.templateData as { stickers?: unknown })?.stickers;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const stickers = raw as StorySticker[];
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {stickers.map((st) => (
        <span
          key={st.id}
          style={{
            position: "absolute",
            left: `${st.x * 100}%`,
            top: `${st.y * 100}%`,
            transform: `translate(-50%,-50%) scale(${st.scale ?? 1})`,
            width: st.url ? `${(st.w ?? 0.3) * 100}%` : undefined,
            fontSize: st.url ? undefined : 44,
            filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.5))",
            userSelect: "none",
            lineHeight: 0,
          }}
        >
          {st.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={st.url}
              alt=""
              // Si el GIF/sticker ya no existe, lo ocultamos (sin icono roto).
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          ) : (
            st.emoji
          )}
        </span>
      ))}
    </div>
  );
}

// ─── Widgets interactivos ───────────────────────────────────────────────────
function WidgetView({
  storyId,
  widget,
  onBusy,
}: {
  storyId: string;
  widget: StoryWidget;
  onBusy: (b: boolean) => void;
}) {
  const [answered, setAnswered] = useState<string | null>(null);

  const send = useCallback(
    async (answer: unknown, key: string) => {
      setAnswered(key);
      onBusy(true);
      try {
        await fetch(`/api/stories/${storyId}/interact`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ widget_id: widget.id, answer }),
        });
      } catch {
        /* noop */
      } finally {
        onBusy(false);
      }
    },
    [storyId, widget.id, onBusy]
  );

  if (widget.kind === "poll") {
    return (
      <div>
        <p style={{ color: "#fff", fontSize: 14, marginBottom: 6 }}>{widget.question}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {widget.options.map((o) => (
            <button
              key={o.key}
              disabled={answered !== null}
              onClick={() => send(o.key, o.key)}
              style={pillStyle(answered === o.key)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (widget.kind === "micro_challenge") {
    return (
      <div>
        <p style={{ color: "#fff", fontSize: 14, marginBottom: 6 }}>{widget.question}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button disabled={answered !== null} onClick={() => send("yes", "yes")} style={pillStyle(answered === "yes")}>
            SÍ
          </button>
          <button disabled={answered !== null} onClick={() => send("no", "no")} style={pillStyle(answered === "no")}>
            NO
          </button>
        </div>
      </div>
    );
  }

  if (widget.kind === "quick_prediction") {
    return (
      <a href={`/app/predicciones?match=${widget.matchId}`} style={ctaStyle} onClick={() => send("tap", "tap")}>
        🎯 {widget.label}
      </a>
    );
  }

  // cta
  return (
    <a href={widget.href} style={ctaStyle} onClick={() => send("tap", "tap")}>
      {widget.label}
    </a>
  );
}

function pillStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    minWidth: 90,
    padding: "10px 12px",
    borderRadius: 999,
    border: `1px solid ${active ? GOLD : "rgba(255,255,255,0.35)"}`,
    background: active ? GOLD : "rgba(255,255,255,0.1)",
    color: active ? NAVY : "#fff",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  };
}

const ctaStyle: React.CSSProperties = {
  display: "block",
  textAlign: "center",
  padding: "12px",
  borderRadius: 12,
  background: GOLD,
  color: NAVY,
  fontWeight: 700,
  fontSize: 15,
  textDecoration: "none",
};
