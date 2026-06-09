"use client";

// src/components/stories/StoryCreator.tsx
//
// Crear una Story propia, estilo Instagram. Dos modos:
//   • Plantilla (cromo): elegir template + texto.
//   • Foto: subir una imagen del dispositivo + pegar stickers (emoji) encima.
// En ambos modos se puede escribir un texto y, al publicar, compartir a RRSS.
//
// Lee /api/stories/templates y postea a /api/stories/create y /share.

import { useCallback, useEffect, useRef, useState } from "react";
import type { StorySticker } from "@/lib/stories/types";

const GOLD = "#c9a84c";
const NAVY = "#0a1729";

// Resultado del proxy /api/stories/stickers/search (Giphy).
interface GiphySticker {
  id: string;
  url: string;
  preview: string;
  title: string;
  w: number | null;
  h: number | null;
}

// Galería de stickers (emoji) tipo IG. Simple y temática fútbol/celebración.
const STICKER_GALLERY = [
  "⚽", "🏆", "🔥", "🥅", "🎯", "💪", "🙌", "👏",
  "❤️", "😍", "🤩", "😎", "🥳", "💥", "⭐", "✨",
  "🇪🇸", "🇲🇽", "🇦🇷", "🇧🇷", "🇨🇴", "🇺🇾", "🇫🇷", "🇩🇪",
  "🟡", "🔴", "🟢", "🔵", "👑", "⚡", "🎉", "🚀",
];

interface TemplateDTO {
  id: string;
  name: string;
  category: string;
  emoji: string;
  gradient: string;
  defaultText: string;
  premium: boolean;
  dataSource: string | null;
}

type Mode = "template" | "photo";

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

/** Sticker emoji nativo a un tamaño dado. (CDN externo bloqueado por CSP). */
function StickerImg({ emoji, size }: { emoji: string; size: number }) {
  return (
    <span style={{ fontSize: size, lineHeight: 1, userSelect: "none" }} aria-hidden>
      {emoji}
    </span>
  );
}

export default function StoryCreator() {
  const [mode, setMode] = useState<Mode>("template");
  const [templates, setTemplates] = useState<TemplateDTO[]>([]);
  const [selected, setSelected] = useState<TemplateDTO | null>(null);
  const [text, setText] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [stickers, setStickers] = useState<StorySticker[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Buscador de stickers Giphy.
  const [giphyOpen, setGiphyOpen] = useState(false);
  const [giphyQuery, setGiphyQuery] = useState("");
  const [giphyResults, setGiphyResults] = useState<GiphySticker[]>([]);
  const [giphyState, setGiphyState] = useState<"idle" | "loading" | "empty" | "off">("idle");

  useEffect(() => {
    fetch("/api/stories/templates", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setTemplates(j.templates ?? []))
      .catch(() => setTemplates([]));
  }, []);

  function pick(t: TemplateDTO) {
    setSelected(t);
    setText(t.defaultText);
    setPublishedId(null);
  }

  function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === "string" ? reader.result : null;
      if (!src) return;
      // Redimensionar/comprimir antes de guardar: una foto de varios MB como
      // data-URL infla la fila de la BD y el feed. La bajamos a máx. 1080px de
      // lado y JPEG ~0.82 (de ~5 MB a ~150 KB típicos). Si falla, usamos la
      // original (degradación elegante).
      const img = new Image();
      img.onload = () => {
        const MAX = 1080;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setPhotoUrl(src);
          setPublishedId(null);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        setPhotoUrl(canvas.toDataURL("image/jpeg", 0.82));
        setPublishedId(null);
      };
      img.onerror = () => {
        setPhotoUrl(src);
        setPublishedId(null);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }

  function addSticker(emoji: string) {
    // Aparece en el centro; el usuario lo arrastra a donde quiera.
    setStickers((prev) => [...prev, { id: uid(), emoji, x: 0.5, y: 0.5, scale: 1 }]);
  }

  function addImageSticker(url: string) {
    // Sticker de imagen (Giphy). Ancho ~35% del contenedor por defecto.
    setStickers((prev) => [...prev, { id: uid(), url, w: 0.35, x: 0.5, y: 0.5, scale: 1 }]);
  }

  // Busca en Giphy (vía proxy server). Debounced desde el effect de abajo.
  const runGiphySearch = useCallback(async (q: string) => {
    setGiphyState("loading");
    try {
      const res = await fetch(`/api/stories/stickers/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      const json = (await res.json()) as { stickers?: GiphySticker[]; configured?: boolean };
      if (json.configured === false) {
        setGiphyResults([]);
        setGiphyState("off");
        return;
      }
      const list = json.stickers ?? [];
      setGiphyResults(list);
      setGiphyState(list.length ? "idle" : "empty");
    } catch {
      setGiphyResults([]);
      setGiphyState("empty");
    }
  }, []);

  // Al abrir el buscador (o cambiar la query) lanza la búsqueda con debounce.
  useEffect(() => {
    if (!giphyOpen) return;
    const t = setTimeout(() => runGiphySearch(giphyQuery.trim()), 350);
    return () => clearTimeout(t);
  }, [giphyOpen, giphyQuery, runGiphySearch]);

  function moveSticker(id: string, x: number, y: number) {
    setStickers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, x, y } : s)),
    );
  }

  function removeSticker(id: string) {
    setStickers((prev) => prev.filter((s) => s.id !== id));
  }

  const canPublish =
    mode === "template" ? !!selected && !!text.trim() : !!photoUrl;

  async function publish() {
    if (!canPublish) return;
    setPublishing(true);
    setPublishError(null);
    try {
      const payload =
        mode === "photo"
          ? {
              media_type: "image",
              media_url: photoUrl,
              overlay_text: text,
              template_data: { stickers },
            }
          : {
              template_id: selected!.id,
              overlay_text: text,
              template_data: stickers.length ? { stickers } : undefined,
            };
      const res = await fetch("/api/stories/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok && json.story) {
        setPublishedId(json.story.id);
      } else {
        // Mensaje claro de por qué no se creó (sesión caducada, validación…).
        // Si el backend manda `detail` (causa real del fallo), lo mostramos.
        setPublishError(
          res.status === 401
            ? "Inicia sesión para publicar tu Story."
            : json.detail
              ? `No se pudo crear: ${json.detail}`
              : json.error || "No se pudo crear la Story. Inténtalo de nuevo."
        );
      }
    } catch {
      setPublishError("Sin conexión. Revisa tu internet e inténtalo de nuevo.");
    } finally {
      setPublishing(false);
    }
  }

  async function share(to: string) {
    if (publishedId) {
      fetch(`/api/stories/${publishedId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }),
      }).catch(() => {});
    }

    const SHARE_URL = "https://zonamundial.app/app";
    const msg = text.trim() || "Mira mi Story en ZonaMundial ⚽";

    if (to === "whatsapp") {
      const url = `https://wa.me/?text=${encodeURIComponent(`${msg} ${SHARE_URL}`)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    if (to === "twitter") {
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}&url=${encodeURIComponent(SHARE_URL)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    if (to === "instagram") {
      // Instagram no admite prefill por web: usamos el diálogo nativo (en móvil
      // deja elegir Instagram); en escritorio abrimos la web como último recurso.
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({ title: "ZonaMundial", text: msg, url: SHARE_URL });
        } catch {
          /* cancelado */
        }
      } else {
        window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
      }
      return;
    }
    // native
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "ZonaMundial", text: msg, url: SHARE_URL });
      } catch {
        /* cancelado */
      }
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 18, width: "100%", maxWidth: 440, margin: "0 auto", boxSizing: "border-box" }}>
      {/* Toggle de modo */}
      <div style={{ display: "flex", gap: 8 }}>
        {([
          { m: "template", label: "Plantilla" },
          { m: "photo", label: "Foto" },
        ] as { m: Mode; label: string }[]).map(({ m, label }) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setPublishedId(null);
            }}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 10,
              border: mode === m ? `2px solid ${GOLD}` : "1px solid rgba(255,255,255,0.2)",
              background: mode === m ? "rgba(201,168,76,0.14)" : "rgba(255,255,255,0.05)",
              color: mode === m ? GOLD : "#c9d2e3",
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Modo Plantilla ───────────────────────────────────────────── */}
      {mode === "template" && (
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>Elige una plantilla</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px,1fr))", gap: 10 }}>
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => pick(t)}
                style={{
                  position: "relative",
                  aspectRatio: "3/4",
                  borderRadius: 12,
                  border: selected?.id === t.id ? `2px solid ${GOLD}` : "2px solid transparent",
                  background: t.gradient,
                  color: "#fff",
                  cursor: "pointer",
                  padding: 8,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: 22 }}>{t.emoji}</span>
                <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>{t.name}</span>
                {t.premium && (
                  <span style={{ position: "absolute", top: 6, right: 6, fontSize: 9, fontWeight: 800, background: "rgba(0,0,0,0.35)", padding: "2px 5px", borderRadius: 6 }}>
                    PRO
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Modo Foto: subir imagen ──────────────────────────────────── */}
      {mode === "photo" && !photoUrl && (
        <label
          style={{
            display: "grid",
            placeItems: "center",
            gap: 8,
            padding: "40px 20px",
            borderRadius: 16,
            border: "2px dashed rgba(201,168,76,0.6)",
            background: "rgba(255,255,255,0.04)",
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: 40 }}>📷</span>
          <span style={{ fontWeight: 800, fontSize: 15, color: GOLD }}>Sube una foto</span>
          <span style={{ fontSize: 12, color: "#8a94b0" }}>Desde tu galería o cámara</span>
          <input type="file" accept="image/*" onChange={onPickPhoto} style={{ display: "none" }} />
        </label>
      )}

      {/* ── Editor + preview (cromo o foto) ──────────────────────────── */}
      {((mode === "template" && selected) || (mode === "photo" && photoUrl)) && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 14 }}>
          <Preview
            mode={mode}
            gradient={selected?.gradient ?? ""}
            emoji={selected?.emoji ?? ""}
            text={text}
            photoUrl={photoUrl}
            stickers={stickers}
            onMoveSticker={moveSticker}
            onRemoveSticker={removeSticker}
          />

          {/* Galería de stickers */}
          <div>
            <span style={{ fontSize: 12, color: "#8a94b0", fontWeight: 600 }}>Stickers · toca para añadir</span>
            <div
              style={{
                display: "flex",
                gap: 4,
                overflowX: "auto",
                minWidth: 0,
                padding: "8px 2px",
                marginTop: 6,
              }}
            >
              {STICKER_GALLERY.map((emoji, i) => (
                <button
                  key={`${emoji}-${i}`}
                  onClick={() => addSticker(emoji)}
                  style={{
                    flex: "0 0 auto",
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    cursor: "pointer",
                    lineHeight: 1,
                    display: "grid",
                    placeItems: "center",
                    padding: 0,
                  }}
                  aria-label={`Añadir ${emoji}`}
                >
                  <StickerImg emoji={emoji} size={24} />
                </button>
              ))}
            </div>
            {stickers.length > 0 && (
              <p style={{ fontSize: 11, color: "#6b7488", margin: "2px 0 0" }}>
                Arrastra para mover · pulsa la × para quitarlo
              </p>
            )}
          </div>

          {/* Buscador de GIFs/Stickers (Giphy) */}
          <div>
            <button
              onClick={() => setGiphyOpen((v) => !v)}
              style={{
                ...shareBtn,
                width: "100%",
                flex: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: giphyOpen ? "rgba(201,168,76,0.14)" : "rgba(255,255,255,0.08)",
                borderColor: giphyOpen ? GOLD : "rgba(255,255,255,0.25)",
                color: giphyOpen ? GOLD : "#fff",
              }}
            >
              🎬 Buscar GIFs y stickers
            </button>

            {giphyOpen && (
              <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                <input
                  value={giphyQuery}
                  onChange={(e) => setGiphyQuery(e.target.value)}
                  placeholder="Busca: gol, festejo, balón…"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: 10,
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.06)",
                    color: "#fff",
                    fontSize: 14,
                  }}
                />

                {giphyState === "off" && (
                  <p style={{ fontSize: 12, color: "#e0a857", margin: 0 }}>
                    Stickers de Giphy no configurados (falta API key).
                  </p>
                )}
                {giphyState === "loading" && (
                  <p style={{ fontSize: 12, color: "#8a94b0", margin: 0 }}>Buscando…</p>
                )}
                {giphyState === "empty" && (
                  <p style={{ fontSize: 12, color: "#8a94b0", margin: 0 }}>Sin resultados.</p>
                )}

                {giphyResults.length > 0 && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: 6,
                      maxHeight: 220,
                      overflowY: "auto",
                    }}
                  >
                    {giphyResults.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => addImageSticker(g.url)}
                        style={{
                          aspectRatio: "1/1",
                          borderRadius: 8,
                          border: "1px solid rgba(255,255,255,0.1)",
                          background: "rgba(255,255,255,0.04)",
                          cursor: "pointer",
                          padding: 2,
                          overflow: "hidden",
                        }}
                        aria-label={`Añadir sticker ${g.title || g.id}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={g.preview}
                          alt={g.title}
                          loading="lazy"
                          onError={(e) => {
                            const btn = e.currentTarget.parentElement as HTMLElement | null;
                            if (btn) btn.style.display = "none";
                          }}
                          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                        />
                      </button>
                    ))}
                  </div>
                )}
                <span style={{ fontSize: 10, color: "#6b7488" }}>Powered by GIPHY</span>
              </div>
            )}
          </div>

          {/* Foto: opción de cambiar imagen */}
          {mode === "photo" && (
            <label style={{ ...shareBtn, textAlign: "center", display: "inline-block" }}>
              Cambiar foto
              <input type="file" accept="image/*" onChange={onPickPhoto} style={{ display: "none" }} />
            </label>
          )}

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#8a94b0", fontWeight: 600 }}>
              {mode === "photo" ? "Texto (opcional)" : "Tu texto"}
            </span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              maxLength={120}
              placeholder={mode === "photo" ? "Añade un texto…" : ""}
              style={{
                width: "100%",
                boxSizing: "border-box",
                resize: "vertical",
                padding: 10,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                fontFamily: "inherit",
                fontSize: 14,
              }}
            />
          </label>

          {!publishedId ? (
            <div style={{ display: "grid", gap: 8 }}>
              <button onClick={publish} disabled={publishing || !canPublish} style={primaryBtn}>
                {publishing ? "Publicando…" : "Publicar Story"}
              </button>
              {publishError && (
                <p style={{ color: "#f87171", fontSize: 13, fontWeight: 600, margin: 0, textAlign: "center" }}>
                  ⚠️ {publishError}
                </p>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <p style={{ color: "#4ade80", fontSize: 14, fontWeight: 700, margin: 0 }}>
                ✅ Publicada en tu feed. ¡Compártela!
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { to: "native", label: "Compartir" },
                  { to: "whatsapp", label: "WhatsApp" },
                  { to: "instagram", label: "Instagram" },
                  { to: "twitter", label: "X" },
                ].map((s) => (
                  <button key={s.to} onClick={() => share(s.to)} style={shareBtn}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Preview({
  mode,
  gradient,
  emoji,
  text,
  photoUrl,
  stickers,
  onMoveSticker,
  onRemoveSticker,
}: {
  mode: Mode;
  gradient: string;
  emoji: string;
  text: string;
  photoUrl: string | null;
  stickers: StorySticker[];
  onMoveSticker: (id: string, x: number, y: number) => void;
  onRemoveSticker: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const dragId = useRef<string | null>(null);

  function clientToRel(clientX: number, clientY: number) {
    const el = ref.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (clientY - r.top) / r.height));
    return { x, y };
  }

  function onPointerDown(e: React.PointerEvent, id: string) {
    e.preventDefault();
    dragId.current = id;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragId.current) return;
    const rel = clientToRel(e.clientX, e.clientY);
    if (rel) onMoveSticker(dragId.current, rel.x, rel.y);
  }

  function onPointerUp() {
    // Para borrar se usa la × del sticker (antes un tap accidental lo quitaba).
    dragId.current = null;
  }

  const isPhoto = mode === "photo" && photoUrl;

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      style={{
        margin: "0 auto",
        width: "min(260px, 80vw)",
        aspectRatio: "9/16",
        borderRadius: 16,
        background: isPhoto ? `#000 center/cover no-repeat url(${photoUrl})` : gradient,
        position: "relative",
        display: "grid",
        placeItems: "center",
        padding: 20,
        overflow: "hidden",
        boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
        touchAction: "none",
      }}
    >
      {!isPhoto && <span style={{ position: "absolute", top: 14, left: 14, fontSize: 26 }}>{emoji}</span>}

      {/* Texto: en cromo centrado grande; en foto abajo tipo caption. */}
      {isPhoto ? (
        text.trim() && (
          <p
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 28,
              margin: 0,
              padding: "0 16px",
              color: "#fff",
              fontSize: 16,
              fontWeight: 800,
              textAlign: "center",
              lineHeight: 1.3,
              textShadow: "0 2px 10px rgba(0,0,0,0.7)",
            }}
          >
            {text}
          </p>
        )
      ) : (
        <p style={{ color: "#fff", fontSize: 20, fontWeight: 800, textAlign: "center", lineHeight: 1.3, textShadow: "0 2px 10px rgba(0,0,0,0.4)" }}>
          {text || "Tu texto aquí"}
        </p>
      )}

      {/* Stickers arrastrables */}
      {stickers.map((st) => (
        <span
          key={st.id}
          onPointerDown={(e) => onPointerDown(e, st.id)}
          onPointerUp={onPointerUp}
          style={{
            position: "absolute",
            left: `${st.x * 100}%`,
            top: `${st.y * 100}%`,
            transform: `translate(-50%,-50%) scale(${st.scale ?? 1})`,
            width: st.url ? `${(st.w ?? 0.35) * 100}%` : undefined,
            filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.5))",
            cursor: "grab",
            touchAction: "none",
            userSelect: "none",
            lineHeight: 0,
          }}
        >
          {st.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={st.url}
              alt=""
              draggable={false}
              // GIF/sticker caído: lo quitamos en vez de mostrar el icono roto.
              onError={() => onRemoveSticker(st.id)}
              style={{ width: "100%", height: "auto", display: "block", pointerEvents: "none" }}
            />
          ) : (
            <StickerImg emoji={st.emoji ?? ""} size={40} />
          )}

          {/* Botón × para eliminar (no inicia arrastre). */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onRemoveSticker(st.id);
            }}
            aria-label="Quitar sticker"
            style={{
              position: "absolute",
              top: -10,
              right: -10,
              width: 22,
              height: 22,
              borderRadius: "50%",
              border: "none",
              background: "rgba(0,0,0,0.7)",
              color: "#fff",
              fontSize: 14,
              lineHeight: 1,
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              padding: 0,
              touchAction: "none",
            }}
          >
            ×
          </button>
        </span>
      ))}

      <span style={{ position: "absolute", bottom: 12, right: 14, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.85)", letterSpacing: 1 }}>
        ZONAMUNDIAL
      </span>
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "13px",
  borderRadius: 12,
  border: "none",
  background: GOLD,
  color: NAVY,
  fontWeight: 800,
  fontSize: 15,
  cursor: "pointer",
};

const shareBtn: React.CSSProperties = {
  flex: 1,
  minWidth: 80,
  boxSizing: "border-box",
  padding: "10px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.25)",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};
