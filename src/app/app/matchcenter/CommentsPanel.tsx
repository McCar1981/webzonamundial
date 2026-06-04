"use client";

// Panel de comentarios en vivo del Match Center. Cualquiera puede LEER; solo los
// usuarios registrados pueden ESCRIBIR (si no hay sesión, se muestra un CTA a
// /login). La bandera del país se renderiza con flagcdn (consistente con el
// resto de la app; sin emojis). Hace polling cada 12s para refrescar.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { MatchMeta } from "@/lib/match-center/types";

const BG2 = "#0F1D32";
const BG3 = "#0B1825";
const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const MID = "#8a94b0";
const DIM = "#6a7a9a";

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

  // Polling cada 12s.
  useEffect(() => {
    aliveRef.current = true;
    load();
    const id = setInterval(load, 12000);
    return () => {
      aliveRef.current = false;
      clearInterval(id);
    };
  }, [load]);

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
      // Optimista: lo ponemos al frente y refrescamos en segundo plano.
      if (data.comment) setComments((prev) => [data.comment, ...prev].slice(0, 60));
      load();
    } catch {
      setErr("Sin conexión. Inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  }

  async function share() {
    const url =
      typeof window !== "undefined" ? window.location.href : "https://zonamundial.app";
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
      /* el usuario canceló: nada que hacer */
    }
  }

  return (
    <section
      style={{
        background: BG2,
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "16px clamp(12px,4vw,20px)",
        marginTop: 14,
      }}
    >
      {/* Cabecera */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              stroke={GOLD2}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: GOLD2 }}>
            Comentarios en vivo
          </span>
          {comments.length > 0 && (
            <span style={{ fontSize: 12, color: DIM, fontWeight: 700 }}>· {comments.length}</span>
          )}
        </div>
        <button
          type="button"
          onClick={share}
          aria-label="Compartir partido"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "transparent",
            border: `1px solid ${GOLD}55`,
            borderRadius: 999,
            color: GOLD2,
            fontSize: 12.5,
            fontWeight: 700,
            padding: "6px 12px",
            cursor: "pointer",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13"
              stroke={GOLD2}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Compartir
        </button>
      </div>

      {/* Caja de escritura / CTA de login */}
      {authed ? (
        <form onSubmit={submit} style={{ marginBottom: 14 }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
            placeholder="Escribe tu comentario…"
            rows={2}
            style={{
              width: "100%",
              resize: "vertical",
              background: BG3,
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              color: "#e7edf7",
              fontSize: 14,
              padding: "10px 12px",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontSize: 11, color: DIM }}>
              {text.length}/{MAX_LEN}
            </span>
            <button
              type="submit"
              disabled={!text.trim() || sending}
              style={{
                background: !text.trim() || sending ? "rgba(201,168,76,0.4)" : `linear-gradient(90deg, ${GOLD}, ${GOLD2})`,
                color: "#0B1825",
                border: "none",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 800,
                padding: "8px 18px",
                cursor: !text.trim() || sending ? "default" : "pointer",
              }}
            >
              {sending ? "Enviando…" : "Comentar"}
            </button>
          </div>
        </form>
      ) : authed === false ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
            background: BG3,
            border: `1px solid ${GOLD}33`,
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 14,
          }}
        >
          <span style={{ fontSize: 13.5, color: "#cfd8ea", fontWeight: 600 }}>
            Regístrate o inicia sesión para comentar el partido.
          </span>
          <Link
            href={loginHref}
            style={{
              background: `linear-gradient(90deg, ${GOLD}, ${GOLD2})`,
              color: "#0B1825",
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
      ) : (
        <div style={{ height: 1, marginBottom: 14 }} />
      )}

      {err && (
        <p style={{ margin: "0 0 12px", fontSize: 12.5, color: GOLD2, fontWeight: 600 }}>{err}</p>
      )}

      {/* Lista de comentarios */}
      {comments.length === 0 ? (
        <p style={{ margin: 0, fontSize: 13.5, color: MID, fontWeight: 500 }}>
          Sé el primero en comentar.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          {comments.map((c) => (
            <li key={c.id} style={{ display: "flex", gap: 10 }}>
              {/* Avatar o inicial */}
              {c.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.avatar}
                  alt={c.name}
                  width={34}
                  height={34}
                  style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.12)" }}
                />
              ) : (
                <span
                  style={{
                    width: 34,
                    height: 34,
                    flexShrink: 0,
                    borderRadius: "50%",
                    background: "rgba(201,168,76,0.18)",
                    color: GOLD2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                >
                  {initial(c.name)}
                </span>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
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
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#e7edf7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.name}
                  </span>
                  <span style={{ fontSize: 11, color: DIM, flexShrink: 0 }}>· {relTime(c.ts)}</span>
                </div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: "#d7deec", wordBreak: "break-word" }}>
                  {c.text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
