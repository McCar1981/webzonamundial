"use client";

// Comentarios en vivo del Match Center estilo "hoja inferior" (bottom-sheet):
// un botón flotante con icono + contador abre una ventana modal con la lista y
// una barra de escritura fija abajo. Cualquiera puede LEER; solo los usuarios
// registrados pueden ESCRIBIR (si no hay sesión, CTA a /login). La bandera del
// país se renderiza con flagcdn (consistente con la app; sin emojis).

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { MatchMeta } from "@/lib/match-center/types";

const BG2 = "#14110a";
const BG3 = "#0a0906";
const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const MID = "#a69a82";
const DIM = "#6e6552";

const MAX_LEN = 280;

interface Comment {
  id: string;
  uid: string;
  name: string;
  country: string;
  avatar: string;
  text: string;
  ts: number;
}

function flagUrl(code: string): string {
  return `https://flagcdn.com/w20/${code}.png`;
}

function relTime(ts: number): string {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return "ahora";
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

function initial(name: string): string {
  return (name.trim()[0] || "?").toUpperCase();
}

export default function CommentsPanel({ matchId, meta }: { matchId: number; meta: MatchMeta }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [authed, setAuthed] = useState<boolean | null>(null); // null = comprobando
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loginHref, setLoginHref] = useState("/login");
  const aliveRef = useRef(true);

  const endpoint = `/api/match-center/comments/${matchId}`;

  // Sesión: lee el usuario y se suscribe a cambios de auth.
  useEffect(() => {
    if (typeof window !== "undefined") {
      setLoginHref(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    }
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (aliveRef.current) setAuthed(!!data.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (aliveRef.current) setAuthed(!!session?.user);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { comments: Comment[] };
      if (aliveRef.current && Array.isArray(data.comments)) setComments(data.comments);
    } catch {
      /* silencioso: reintenta en el siguiente tick */
    }
  }, [endpoint]);

  // Polling: más frecuente con la ventana abierta; lento (solo contador) cerrada.
  useEffect(() => {
    aliveRef.current = true;
    load();
    const id = setInterval(load, open ? 12000 : 60000);
    return () => {
      aliveRef.current = false;
      clearInterval(id);
    };
  }, [load, open]);

  // Bloquea el scroll del fondo y permite cerrar con Escape mientras está abierta.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setErr(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: body }),
      });
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      if (res.status === 429) {
        setErr("Espera unos segundos antes de comentar de nuevo.");
        return;
      }
      if (!res.ok) {
        setErr("No se pudo publicar. Inténtalo de nuevo.");
        return;
      }
      const data = (await res.json()) as { comment: Comment };
      setText("");
      // Add optimista: el comentario se ve al instante. NO hacemos load() aquí:
      // con la caché de borde (s-maxage=8) un refetch inmediato podría traer la
      // lista cacheada SIN este comentario y hacerlo "parpadear". El siguiente
      // poll (12s) ya reconcilia con la caché refrescada (que sí lo incluye).
      if (data.comment) setComments((prev) => [data.comment, ...prev].slice(0, 60));
    } catch {
      setErr("Sin conexión. Inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  }

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "https://zonamundial.app";
    const title = `${meta.home.name} vs ${meta.away.name}`;
    const shareText = `Sigue ${title} en directo en ZonaMundial`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text: shareText, url });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setErr("Enlace copiado al portapapeles.");
        setTimeout(() => setErr(null), 2500);
      }
    } catch {
      /* el usuario canceló */
    }
  }

  const count = comments.length;

  return (
    <>
      {/* Botón flotante con contador (abre la ventana). Abajo-izquierda para no
          chocar con la IA Coach (abajo-derecha) ni el menú social (centro). En
          móvil la barra de navegación de la app es fija (zIndex 950, ~64px):
          el media query lo sube por encima, igual que el lanzador del Coach. */}
      <style>{`
        @media(max-width:768px){
          .mc-comments-fab{ bottom: calc(74px + env(safe-area-inset-bottom)) !important; }
        }
      `}</style>
      <button
        type="button"
        className="mc-comments-fab"
        onClick={() => setOpen(true)}
        aria-label="Abrir comentarios"
        style={{
          position: "fixed",
          left: 16,
          bottom: 20,
          zIndex: 960,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: BG2,
          border: `1px solid ${GOLD}55`,
          boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            stroke={GOLD2}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {count > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              minWidth: 20,
              height: 20,
              padding: "0 5px",
              borderRadius: 999,
              background: GOLD,
              color: "#0a0906",
              fontSize: 11,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `2px solid ${BG3}`,
            }}
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {/* Ventana modal (bottom-sheet) */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Comentarios"
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            // Sobre la barra de navegación (950) y el lanzador del Coach (1200):
            // antes, con 70, la bottom-nav se dibujaba ENCIMA del panel abierto.
            zIndex: 1300,
            background: "rgba(0,0,0,0.62)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 640,
              maxHeight: "86vh",
              background: BG3,
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              border: "1px solid rgba(255,255,255,0.08)",
              borderBottom: "none",
              display: "flex",
              flexDirection: "column",
              animation: "mcSheetUp .28s cubic-bezier(.22,1,.36,1)",
            }}
          >
            {/* Asa */}
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 10 }}>
              <span style={{ width: 44, height: 5, borderRadius: 999, background: "rgba(255,255,255,0.18)" }} />
            </div>

            {/* Cabecera */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "12px clamp(14px,4vw,20px) 12px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>
                Comentarios {count > 0 ? `(${count})` : ""}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  onClick={share}
                  aria-label="Compartir partido"
                  style={iconBtnStyle}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13"
                      stroke={GOLD2}
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar"
                  style={iconBtnStyle}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M6 6l12 12M18 6L6 18" stroke={MID} strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Lista (scroll) */}
            <div style={{ flex: 1, overflowY: "auto", padding: "14px clamp(14px,4vw,20px)" }}>
              {err && (
                <p style={{ margin: "0 0 12px", fontSize: 12.5, color: GOLD2, fontWeight: 600 }}>{err}</p>
              )}
              {count === 0 ? (
                <p style={{ margin: 0, fontSize: 14, color: MID, fontWeight: 500 }}>
                  Sé el primero en comentar.
                </p>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                  {comments.map((c) => (
                    <li key={c.id} style={{ display: "flex", gap: 10 }}>
                      {c.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.avatar}
                          alt={c.name}
                          width={36}
                          height={36}
                          style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.12)" }}
                        />
                      ) : (
                        <span
                          style={{
                            width: 36,
                            height: 36,
                            flexShrink: 0,
                            borderRadius: "50%",
                            background: "rgba(201,168,76,0.18)",
                            color: GOLD2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 15,
                            fontWeight: 800,
                          }}
                        >
                          {initial(c.name)}
                        </span>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          {c.country && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={flagUrl(c.country)}
                              alt={c.country}
                              width={18}
                              height={13}
                              style={{ borderRadius: 2, objectFit: "cover", flexShrink: 0 }}
                            />
                          )}
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: "#e7edf7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {c.name}
                          </span>
                          <span style={{ fontSize: 11, color: DIM, flexShrink: 0 }}>· {relTime(c.ts)}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.45, color: "#d7deec", wordBreak: "break-word" }}>
                          {c.text}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Barra de escritura fija / CTA de login */}
            {authed ? (
              <form
                onSubmit={submit}
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 8,
                  padding: "10px clamp(12px,4vw,18px)",
                  paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
                  borderTop: "1px solid rgba(255,255,255,0.07)",
                  background: BG2,
                }}
              >
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
                  placeholder="¿Qué opinas?"
                  rows={1}
                  style={{
                    flex: 1,
                    resize: "none",
                    maxHeight: 120,
                    background: BG3,
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 22,
                    color: "#e7edf7",
                    fontSize: 14.5,
                    padding: "10px 14px",
                    outline: "none",
                    fontFamily: "inherit",
                    lineHeight: 1.4,
                  }}
                />
                <button
                  type="submit"
                  disabled={!text.trim() || sending}
                  aria-label="Enviar comentario"
                  style={{
                    width: 44,
                    height: 44,
                    flexShrink: 0,
                    borderRadius: "50%",
                    border: "none",
                    background: !text.trim() || sending ? "rgba(201,168,76,0.4)" : `linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
                    cursor: !text.trim() || sending ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 20V5M5 12l7-7 7 7" stroke="#0a0906" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </form>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                  padding: "12px clamp(12px,4vw,18px)",
                  paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
                  borderTop: "1px solid rgba(255,255,255,0.07)",
                  background: BG2,
                }}
              >
                <span style={{ fontSize: 13.5, color: "#cfd8ea", fontWeight: 600 }}>
                  Regístrate o inicia sesión para comentar.
                </span>
                <Link
                  href={loginHref}
                  style={{
                    background: `linear-gradient(90deg, ${GOLD}, ${GOLD2})`,
                    color: "#0a0906",
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 800,
                    padding: "8px 18px",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  Iniciar sesión
                </Link>
              </div>
            )}
          </div>

          <style>{`
            @keyframes mcSheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
          `}</style>
        </div>
      )}
    </>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
