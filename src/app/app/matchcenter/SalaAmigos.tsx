"use client";

// "SALA CON AMIGOS" (watch party) por partido: crea o únete con un código de 6
// letras, comparte por WhatsApp (deep-link ?sala=CODE que auto-rellena al
// abrir), y chatea con tu grupo en directo con TEXTO y GIFs de GIPHY. Sala
// efímera en KV; sondeo cada ~6s. Premium, contenido del partido.

import { useCallback, useEffect, useRef, useState } from "react";
import { ensureAnonId } from "@/lib/anon-id";

const BG2 = "#14110a";
const BG3 = "#0a0906";
const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const MID = "#a69a82";
const DIM = "#6e6552";

interface Msg { id: string; name: string; text?: string; gif?: string; ts: number }
interface View { room: { code: string; matchId: number }; members: string[]; messages: Msg[] }
interface Gif { id: string; url: string; preview: string; title: string }

const POLL_MS = 6000;

export default function SalaAmigos({ matchId, homeName, awayName }: { matchId: number; homeName: string; awayName: string }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [view, setView] = useState<View | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [gifOpen, setGifOpen] = useState(false);
  const [gifQuery, setGifQuery] = useState("");
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [copied, setCopied] = useState(false);
  const memberRef = useRef("");
  const feedRef = useRef<HTMLDivElement>(null);

  // Identidad + nombre + sala guardada de ESTE partido + deep-link ?sala=
  useEffect(() => {
    memberRef.current = ensureAnonId();
    try {
      setName(localStorage.getItem("zm_room_name") || "");
      const saved = localStorage.getItem(`zm_room_${matchId}`);
      if (saved) setCode(saved);
      const fromUrl = new URLSearchParams(window.location.search).get("sala");
      if (fromUrl && !saved) setJoinCode(fromUrl.toUpperCase().slice(0, 6));
    } catch {
      /* sin storage */
    }
  }, [matchId]);

  const persistName = (n: string) => {
    setName(n);
    try { localStorage.setItem("zm_room_name", n.trim()); } catch { /* */ }
  };

  const enterRoom = (c: string) => {
    setCode(c);
    try { localStorage.setItem(`zm_room_${matchId}`, c); } catch { /* */ }
  };

  const leave = useCallback(() => {
    setCode(null);
    setView(null);
    try { localStorage.removeItem(`zm_room_${matchId}`); } catch { /* */ }
  }, [matchId]);

  // Sondeo de la sala mientras estás dentro (pausa con pestaña oculta). UNA sola
  // cadena recursiva (poll se auto-reprograma); al recibir el server fusiona los
  // mensajes optimistas 'tmp-' aún no confirmados para que no parpadeen.
  useEffect(() => {
    if (!code) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const poll = async () => {
      if (!alive) return;
      if (document.visibilityState === "visible") {
        try {
          const r = await fetch(`/api/match-center/room/${code}`, { cache: "no-store" });
          if (r.ok) {
            const v = (await r.json()) as View;
            if (alive) {
              setView((prev) => {
                const serverKeys = new Set(v.messages.map((m) => `${m.name}|${m.text || ""}|${m.gif || ""}`));
                const pendingTmp = (prev?.messages ?? []).filter(
                  (m) => m.id.startsWith("tmp-") && !serverKeys.has(`${m.name}|${m.text || ""}|${m.gif || ""}`),
                );
                return { ...v, messages: [...v.messages, ...pendingTmp] };
              });
            }
          } else if (r.status === 404 && alive) {
            leave(); // sala caducada: salir limpio
            return;
          }
        } catch { /* reintenta */ }
      }
      if (alive) timer = setTimeout(poll, POLL_MS);
    };
    void poll();
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, [code, leave]);

  // Auto-scroll del feed al llegar mensajes nuevos.
  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [view?.messages.length]);

  const create = useCallback(async () => {
    setBusy(true); setErr(null);
    try {
      const r = await fetch("/api/match-center/room", {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
        body: JSON.stringify({ action: "create", matchId, memberId: memberRef.current, name: name.trim() || "Invitado" }),
      });
      const d = await r.json();
      if (d.ok && d.code) { enterRoom(d.code); setView(d.view ?? null); }
      else setErr("No se pudo crear la sala.");
    } catch { setErr("Error de conexión."); } finally { setBusy(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, name]);

  const join = useCallback(async () => {
    const c = joinCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    if (c.length !== 6) { setErr("El código tiene 6 caracteres."); return; }
    setBusy(true); setErr(null);
    try {
      const r = await fetch("/api/match-center/room", {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
        body: JSON.stringify({ action: "join", code: c, memberId: memberRef.current, name: name.trim() || "Invitado" }),
      });
      const d = await r.json();
      if (d.ok) { enterRoom(c); setView(d.view ?? null); }
      else setErr(d.error === "not_found" ? "No existe esa sala." : d.error === "full" ? "La sala está llena." : "No se pudo unir.");
    } catch { setErr("Error de conexión."); } finally { setBusy(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinCode, name]);

  const send = useCallback(async (payload: { text?: string; gif?: string }) => {
    if (!code) return;
    // Optimista: pinta el mensaje al instante.
    const optimistic: Msg = { id: `tmp-${Date.now()}`, name: name.trim() || "Invitado", text: payload.text, gif: payload.gif, ts: Date.now() };
    setView((v) => (v ? { ...v, messages: [...v.messages, optimistic] } : v));
    try {
      await fetch(`/api/match-center/room/${code}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
        body: JSON.stringify({ memberId: memberRef.current, name: name.trim() || "Invitado", ...payload }),
      });
    } catch { /* el sondeo reconciliará */ }
  }, [code, name]);

  const sendText = () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    void send({ text: t });
  };

  const loadGifs = useCallback(async (q: string) => {
    try {
      const r = await fetch(`/api/match-center/gifs/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      const d = await r.json();
      setGifs(d.gifs ?? []);
    } catch { setGifs([]); }
  }, []);

  useEffect(() => {
    if (!gifOpen) return;
    const t = setTimeout(() => loadGifs(gifQuery.trim()), gifQuery ? 350 : 0);
    return () => clearTimeout(t);
  }, [gifOpen, gifQuery, loadGifs]);

  const shareUrl = typeof window !== "undefined" && code
    ? `${window.location.origin}/app/matchcenter/${matchId}?sala=${code}`
    : "";
  const waText = `¡Vamos a ver ${homeName} vs ${awayName} juntos en ZonaMundial! Únete a mi sala con el código ${code}: ${shareUrl}`;

  /* ----------------------------- RENDER ----------------------------- */
  const card: React.CSSProperties = { background: BG2, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: "14px 16px", marginBottom: 14 };

  if (!code) {
    return (
      <section style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 18 }}>👥</span>
          <span className="mc-condensed" style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>Sala con amigos</span>
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 12.5, color: MID }}>Ve el partido con tu grupo: chat y GIFs en directo.</p>
        <input
          value={name}
          onChange={(e) => persistName(e.target.value)}
          placeholder="Tu nombre"
          maxLength={24}
          style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, background: BG3, border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 14, marginBottom: 10 }}
        />
        <button onClick={create} disabled={busy} style={{ width: "100%", padding: "11px", borderRadius: 12, background: `linear-gradient(135deg,${GOLD},${GOLD2})`, border: "none", color: BG3, fontWeight: 800, fontSize: 14, cursor: "pointer", marginBottom: 10 }}>
          {busy ? "Creando…" : "Crear sala"}
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
            placeholder="Código"
            style={{ flex: 1, minWidth: 0, padding: "10px 12px", borderRadius: 10, background: BG3, border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 14, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}
          />
          <button onClick={join} disabled={busy || joinCode.length < 6} style={{ padding: "10px 16px", borderRadius: 10, background: BG3, border: `1px solid ${GOLD}55`, color: GOLD2, fontWeight: 700, fontSize: 14, cursor: joinCode.length < 6 ? "default" : "pointer", opacity: joinCode.length < 6 ? 0.5 : 1 }}>
            Unirse
          </button>
        </div>
        {err && <p style={{ margin: "10px 0 0", fontSize: 12, color: "#ef6b6b" }}>{err}</p>}
      </section>
    );
  }

  const members = view?.members ?? [];
  return (
    <section style={card}>
      {/* Cabecera de la sala */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 16 }}>👥</span>
          <span className="mc-condensed" style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>Sala</span>
          <button
            onClick={() => { try { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* */ } }}
            style={{ background: BG3, border: `1px solid ${GOLD}55`, color: GOLD2, fontWeight: 800, letterSpacing: 2, fontSize: 14, padding: "3px 10px", borderRadius: 8, cursor: "pointer" }}
          >
            {copied ? "¡Copiado!" : code}
          </button>
          <span style={{ fontSize: 12, color: MID, whiteSpace: "nowrap" }}>· {members.length} en la sala</span>
        </div>
        <button onClick={leave} style={{ background: "transparent", border: "none", color: DIM, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Salir</button>
      </div>

      {/* Compartir + miembros */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
          target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#1f3b2e", border: "1px solid #25d36655", color: "#9ff0bf", fontSize: 12, fontWeight: 700, padding: "6px 12px", borderRadius: 999, textDecoration: "none" }}
        >
          Invitar por WhatsApp
        </a>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {members.slice(0, 8).map((m, i) => (
            <span key={i} title={m} style={{ width: 26, height: 26, borderRadius: "50%", background: BG3, border: `1px solid ${GOLD}44`, color: GOLD2, fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              {m.slice(0, 1).toUpperCase()}
            </span>
          ))}
          {members.length > 8 && <span style={{ fontSize: 11, color: DIM, alignSelf: "center" }}>+{members.length - 8}</span>}
        </div>
      </div>

      {/* Chat */}
      <div ref={feedRef} style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, padding: "4px 2px", background: BG3, borderRadius: 12, marginBottom: 10 }}>
        {(view?.messages.length ?? 0) === 0 && (
          <p style={{ margin: 0, padding: 16, fontSize: 12.5, color: DIM, textAlign: "center" }}>Aún no hay mensajes. ¡Saluda a tu grupo! 👋</p>
        )}
        {view?.messages.map((m) => (
          <div key={m.id} style={{ padding: "2px 10px" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: GOLD2 }}>{m.name}</span>
            {m.text && <span style={{ fontSize: 14, color: "#e7ecf5", marginLeft: 6 }}>{m.text}</span>}
            {m.gif && (
              <div style={{ marginTop: 4 }}>
                <img src={m.gif} alt="GIF" loading="lazy" style={{ maxWidth: 180, maxHeight: 160, borderRadius: 10, display: "block" }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Barra de entrada */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") sendText(); }}
          placeholder="Escribe…"
          maxLength={300}
          style={{ flex: 1, minWidth: 0, padding: "10px 12px", borderRadius: 10, background: BG3, border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 14 }}
        />
        <button onClick={() => setGifOpen((o) => { if (o) { setGifs([]); setGifQuery(""); } return !o; })} title="Enviar un GIF" style={{ padding: "8px 12px", borderRadius: 10, background: gifOpen ? GOLD : BG3, border: `1px solid ${GOLD}55`, color: gifOpen ? BG3 : GOLD2, fontWeight: 800, fontSize: 13, cursor: "pointer" }}>GIF</button>
        <button onClick={sendText} disabled={!text.trim()} style={{ padding: "8px 14px", borderRadius: 10, background: `linear-gradient(135deg,${GOLD},${GOLD2})`, border: "none", color: BG3, fontWeight: 800, fontSize: 14, cursor: text.trim() ? "pointer" : "default", opacity: text.trim() ? 1 : 0.5 }}>➤</button>
      </div>

      {/* Selector de GIFs (GIPHY) */}
      {gifOpen && (
        <div style={{ marginTop: 10, background: BG3, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", padding: 10 }}>
          <input
            value={gifQuery}
            onChange={(e) => setGifQuery(e.target.value)}
            placeholder="Buscar GIFs (gol, celebración, llanto…)"
            style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px", borderRadius: 8, background: BG2, border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 13, marginBottom: 8 }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, maxHeight: 220, overflowY: "auto" }}>
            {gifs.map((g) => (
              <button
                key={g.id}
                onClick={() => { void send({ gif: g.url }); setGifOpen(false); setGifQuery(""); }}
                style={{ padding: 0, border: "none", borderRadius: 8, overflow: "hidden", cursor: "pointer", background: BG2, aspectRatio: "1", lineHeight: 0 }}
              >
                <img src={g.preview} alt={g.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </button>
            ))}
            {gifs.length === 0 && <span style={{ gridColumn: "1/-1", fontSize: 12, color: DIM, textAlign: "center", padding: 12 }}>Sin resultados.</span>}
          </div>
          <div style={{ textAlign: "right", marginTop: 4 }}>
            <span style={{ fontSize: 9, color: DIM }}>GIFs vía GIPHY</span>
          </div>
        </div>
      )}
    </section>
  );
}
