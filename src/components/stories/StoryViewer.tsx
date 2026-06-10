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

  // Eliminar una Story propia: la quita del feed y cierra el visor. Si el reel
  // se queda sin Stories, también desaparece su burbuja.
  const removeStory = useCallback((storyId: string) => {
    setReels((prev) =>
      prev
        .map((r) => {
          const stories = r.stories.filter((s) => s.id !== storyId);
          return { ...r, stories, allSeen: stories.every((s) => s.seen) };
        })
        .filter((r) => r.stories.length > 0)
    );
    setOpen(null);
  }, []);

  if (loading) {
    if (hideWhenEmpty) return null;
    return <p style={{ color: "#8a94b0", padding: "1rem" }}>Cargando Stories…</p>;
  }

  // Ya cargado: la barra se muestra SIEMPRE (estilo IG). Aunque no haya Stories
  // activas, el carrusel pinta la burbuja "+ Tu historia" para crear. Así la
  // barra nunca desaparece del lobby cuando el feed queda vacío.
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
          onDelete={removeStory}
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
                  overflow: "hidden",
                }}
              >
                {reel.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={reel.avatarUrl}
                    alt={reel.label}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  reelFallback(reel)
                )}
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

// Contenido de la burbuja cuando NO hay foto: para stories de usuario, la
// inicial de su nombre sobre fondo dorado; para el resto, el emoji del tipo.
function reelFallback(reel: StoryReelDTO): JSX.Element | string {
  if (reel.type === "user" && reel.avatarInitial) {
    return (
      <span style={{ color: GOLD, fontWeight: 800, fontSize: 24, lineHeight: 1 }}>
        {reel.avatarInitial}
      </span>
    );
  }
  return reelEmoji(reel.type);
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
  onDelete,
}: {
  reels: StoryReelDTO[];
  open: OpenState;
  onClose: () => void;
  onAdvance: (s: OpenState) => void;
  onSeen: (reelIndex: number, storyIndex: number) => void;
  onDelete: (storyId: string) => void;
}) {
  const reel = reels[open.reelIndex];
  const story = reel?.stories[open.storyIndex];
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deleting, setDeleting] = useState(false);
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

  // Eliminar la Story propia que se está viendo.
  const handleDelete = useCallback(async () => {
    if (!story || deleting) return;
    setPaused(true);
    if (!window.confirm("¿Eliminar esta Story? No se puede deshacer.")) {
      setPaused(false);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/stories/${story.id}`, { method: "DELETE" });
      if (res.ok) {
        onDelete(story.id);
      } else {
        setDeleting(false);
        setPaused(false);
        window.alert("No se pudo eliminar la Story. Inténtalo de nuevo.");
      }
    } catch {
      setDeleting(false);
      setPaused(false);
      window.alert("Sin conexión. Inténtalo de nuevo.");
    }
  }, [story, deleting, onDelete]);

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
          {reel.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={reel.avatarUrl}
              alt={reel.label}
              style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover" }}
            />
          ) : reel.type === "user" && reel.avatarInitial ? (
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${GOLD}, #e8d48b)`,
                color: NAVY,
                fontWeight: 800,
                fontSize: 13,
                display: "grid",
                placeItems: "center",
              }}
            >
              {reel.avatarInitial}
            </span>
          ) : (
            <span style={{ fontSize: 20 }}>{reelEmoji(reel.type)}</span>
          )}
          <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{reel.label}</span>
          {reel.isMine && (
            <span
              style={{ color: "#c9d2e3", fontSize: 12, fontWeight: 600, marginLeft: 4 }}
              title="Personas que han visto tu Story"
            >
              👁 {story.viewCount}
            </span>
          )}
          {reel.isMine && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: 18,
                cursor: deleting ? "default" : "pointer",
                opacity: deleting ? 0.5 : 1,
                lineHeight: 1,
              }}
              aria-label="Eliminar Story"
              title="Eliminar Story"
            >
              🗑️
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              marginLeft: reel.isMine ? 8 : "auto",
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

        {/* widgets + reacciones */}
        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          {story.widgets.map((w) => (
            <WidgetView
              key={`${story.id}:${w.id}`}
              storyId={story.id}
              widget={w}
              myAnswer={story.myAnswers?.[w.id]}
              onBusy={setPaused}
            />
          ))}
          <ReactionsBar
            key={`rx:${story.id}`}
            storyId={story.id}
            initial={story.myAnswers?.["reaction"]}
          />
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
  myAnswer,
  onBusy,
}: {
  storyId: string;
  widget: StoryWidget;
  /** Respuesta previa del usuario a ESTE widget (viene del feed con sesión). */
  myAnswer?: unknown;
  onBusy: (b: boolean) => void;
}) {
  const prior = typeof myAnswer === "string" ? myAnswer : null;
  const [answered, setAnswered] = useState<string | null>(prior);
  const [results, setResults] = useState<Record<string, number> | null>(null);

  const isVotable = widget.kind === "poll" || widget.kind === "micro_challenge";
  const resolvedChallenge =
    widget.kind === "micro_challenge" &&
    (widget.correctOption === "yes" || widget.correctOption === "no");

  // Traemos los resultados al montar si ya votó antes (myAnswer del feed) o si
  // el micro-reto ya está resuelto (se muestran las barras aunque no votara).
  useEffect(() => {
    if (!isVotable || (!prior && !resolvedChallenge)) return;
    let alive = true;
    fetch(`/api/stories/${storyId}/results?widget_id=${encodeURIComponent(widget.id)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (alive && j?.results) setResults(j.results);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [isVotable, prior, resolvedChallenge, storyId, widget.id]);

  const send = useCallback(
    async (answer: unknown, key: string) => {
      setAnswered(key);
      onBusy(true);
      try {
        const res = await fetch(`/api/stories/${storyId}/interact`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ widget_id: widget.id, answer }),
        });
        const json = await res.json().catch(() => ({}));
        if (json?.results) {
          setResults(json.results);
        } else if (isVotable) {
          // Anónimo: /interact no agrega; pedimos los resultados públicos.
          const r = await fetch(
            `/api/stories/${storyId}/results?widget_id=${encodeURIComponent(widget.id)}`,
            { cache: "no-store" }
          );
          const j = await r.json().catch(() => ({}));
          if (j?.results) setResults(j.results);
        }
      } catch {
        /* noop */
      } finally {
        onBusy(false);
      }
    },
    [storyId, widget.id, onBusy, isVotable]
  );

  if (widget.kind === "poll") {
    return (
      <div>
        <p style={{ color: "#fff", fontSize: 14, marginBottom: 6 }}>{widget.question}</p>
        {answered === null ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {widget.options.map((o) => (
              <button key={o.key} onClick={() => send(o.key, o.key)} style={pillStyle(false)}>
                {o.label}
              </button>
            ))}
          </div>
        ) : (
          <ResultBars
            options={widget.options}
            results={results}
            answered={answered}
          />
        )}
      </div>
    );
  }

  if (widget.kind === "micro_challenge") {
    const resolved = widget.correctOption === "yes" || widget.correctOption === "no";
    const YESNO = [
      { key: "yes", label: "SÍ" },
      { key: "no", label: "NO" },
    ];
    return (
      <div>
        <p style={{ color: "#fff", fontSize: 14, marginBottom: 6 }}>{widget.question}</p>
        {answered === null && !resolved ? (
          <div style={{ display: "flex", gap: 8 }}>
            {YESNO.map((o) => (
              <button key={o.key} onClick={() => send(o.key, o.key)} style={pillStyle(false)}>
                {o.label}
              </button>
            ))}
          </div>
        ) : (
          <>
            <ResultBars
              options={YESNO}
              results={results}
              answered={answered}
              correct={resolved ? widget.correctOption : null}
            />
            {resolved ? (
              answered !== null ? (
                <p style={{ color: answered === widget.correctOption ? "#4ade80" : "#f87171", fontSize: 13, fontWeight: 700, margin: "6px 0 0" }}>
                  {answered === widget.correctOption ? "✅ ¡Acertaste!" : "❌ Esta vez no"}
                </p>
              ) : (
                <p style={{ color: "#c9d2e3", fontSize: 12, margin: "6px 0 0" }}>
                  Resuelto: {widget.correctOption === "yes" ? "SÍ" : "NO"} hubo más goles.
                </p>
              )
            ) : (
              answered !== null && (
                <p style={{ color: "#8a94b0", fontSize: 12, margin: "6px 0 0" }}>
                  Voto registrado · se resuelve al final del partido
                </p>
              )
            )}
          </>
        )}
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

// Barras de resultados (estilo encuesta IG): % por opción, la tuya marcada.
function ResultBars({
  options,
  results,
  answered,
  correct,
}: {
  options: { key: string; label: string }[];
  results: Record<string, number> | null;
  answered: string | null;
  correct?: string | null;
}) {
  const total = results ? Object.values(results).reduce((a, b) => a + b, 0) : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {options.map((o) => {
        const count = results?.[o.key] ?? 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const mine = answered === o.key;
        const isCorrect = correct != null && o.key === correct;
        return (
          <div
            key={o.key}
            style={{
              position: "relative",
              borderRadius: 999,
              border: `1px solid ${isCorrect ? "#4ade80" : mine ? GOLD : "rgba(255,255,255,0.25)"}`,
              overflow: "hidden",
              background: "rgba(255,255,255,0.08)",
            }}
          >
            <span
              style={{
                position: "absolute",
                inset: 0,
                width: `${total > 0 ? pct : 0}%`,
                background: isCorrect
                  ? "rgba(74,222,128,0.25)"
                  : mine
                  ? "rgba(201,168,76,0.3)"
                  : "rgba(255,255,255,0.12)",
                transition: "width 600ms ease",
              }}
            />
            <span
              style={{
                position: "relative",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
                padding: "9px 14px",
                color: "#fff",
                fontSize: 13,
                fontWeight: mine ? 800 : 600,
              }}
            >
              <span>
                {o.label} {mine ? " · tu voto" : ""} {isCorrect ? " ✓" : ""}
              </span>
              <span>{total > 0 ? `${pct}%` : "—"}</span>
            </span>
          </div>
        );
      })}
      <span style={{ color: "#8a94b0", fontSize: 11 }}>
        {total === 1 ? "1 voto" : `${total} votos`}
      </span>
    </div>
  );
}

// ─── Reacciones rápidas (estilo IG) ─────────────────────────────────────────
// Una fila de emojis; el tap registra la reacción como interacción del widget
// virtual "reaction". Cambiar de emoji actualiza la reacción (no suma otra).
const REACTIONS = ["❤️", "🔥", "👏", "😮"];

function ReactionsBar({ storyId, initial }: { storyId: string; initial?: unknown }) {
  const [selected, setSelected] = useState<string | null>(
    typeof initial === "string" ? initial : null
  );
  const [pop, setPop] = useState<string | null>(null);

  const react = useCallback(
    (emoji: string) => {
      setSelected(emoji);
      setPop(emoji);
      window.setTimeout(() => setPop(null), 350);
      fetch(`/api/stories/${storyId}/interact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widget_id: "reaction", answer: emoji }),
      }).catch(() => {});
    },
    [storyId]
  );

  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
      {REACTIONS.map((e) => (
        <button
          key={e}
          onClick={() => react(e)}
          aria-label={`Reaccionar ${e}`}
          style={{
            background: selected === e ? "rgba(201,168,76,0.25)" : "rgba(255,255,255,0.08)",
            border: `1px solid ${selected === e ? GOLD : "rgba(255,255,255,0.18)"}`,
            borderRadius: "50%",
            width: 38,
            height: 38,
            fontSize: 18,
            lineHeight: 1,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            transform: pop === e ? "scale(1.35)" : "scale(1)",
            transition: "transform 250ms ease, background 200ms ease",
          }}
        >
          {e}
        </button>
      ))}
    </div>
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
