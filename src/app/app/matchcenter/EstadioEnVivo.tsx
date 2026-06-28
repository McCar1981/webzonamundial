"use client";

// "ESTADIO EN VIVO" — presencia colectiva premium en la pestaña General:
//   - Espectadores ahora (contador con count-up + latido).
//   - Medidor de RUGIDO del estadio (sube con el volumen de reacciones de
//     todos; se dispara en los goles).
//   - Reacciones que FLOTAN: tocas un emoji y sube por la tarjeta; cuando el
//     rugido colectivo es alto, suben emojis "del público" en bandada.
// Todo por polling KV (heartbeat ~13s, pausa con la pestaña oculta). Anónimo.

import { useCallback, useEffect, useRef, useState } from "react";
import { ensureAnonId } from "@/lib/anon-id";

const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const MID = "#8a94b0";
const RED = "#e63946";

const EMOJIS = ["⚽", "🔥", "👏", "😱", "🙌"];
const HEARTBEAT_MS = 45_000; // VIEWERS_TTL=60 da holgura (<60); ~mitad de POSTs vs 22s

interface Float {
  key: number;
  emoji: string;
  left: number; // %
  dur: number; // s
  drift: number; // px
}

export default function EstadioEnVivo({ matchId, live }: { matchId: number; live: boolean }) {
  const [viewers, setViewers] = useState(0);
  const [shownViewers, setShownViewers] = useState(0);
  const [roar, setRoar] = useState(0);
  const [floats, setFloats] = useState<Float[]>([]);
  const [ready, setReady] = useState(false);
  const anonRef = useRef("");
  const roarRef = useRef(0);
  const seqRef = useRef(0);
  const aliveRef = useRef(true);

  useEffect(() => {
    anonRef.current = ensureAnonId();
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);
  useEffect(() => {
    roarRef.current = roar;
  }, [roar]);

  const beat = useCallback(
    async (reacted: boolean) => {
      try {
        const r = await fetch(`/api/match-center/presence/${matchId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ anonId: anonRef.current, reacted }),
        });
        if (!r.ok) return;
        const d = (await r.json()) as { viewers: number; roar: number };
        setViewers(d.viewers || 0);
        setRoar(Math.max(0, Math.min(1, d.roar || 0)));
        setReady(true);
      } catch {
        /* siguiente latido */
      }
    },
    [matchId],
  );

  // Heartbeat: cada ~13s, inmediato al montar, pausado con pestaña oculta.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let alive = true;
    const tick = async () => {
      if (!alive) return;
      if (document.visibilityState === "visible") await beat(false);
      if (alive) timer = setTimeout(tick, HEARTBEAT_MS);
    };
    void beat(false);
    timer = setTimeout(tick, HEARTBEAT_MS);
    // Al volver a la pestaña: REPROGRAMA el ciclo (no añade un latido suelto)
    // para no solapar dos POST seguidos.
    const onVis = () => {
      if (!alive || document.visibilityState !== "visible") return;
      if (timer) clearTimeout(timer);
      void beat(false);
      timer = setTimeout(tick, HEARTBEAT_MS);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [beat]);

  // Count-up suave del contador de espectadores.
  useEffect(() => {
    if (shownViewers === viewers) return;
    const step = Math.max(1, Math.ceil(Math.abs(viewers - shownViewers) / 12));
    const id = setTimeout(() => {
      setShownViewers((v) => (v < viewers ? Math.min(viewers, v + step) : Math.max(viewers, v - step)));
    }, 40);
    return () => clearTimeout(id);
  }, [viewers, shownViewers]);

  const spawn = useCallback((emoji: string) => {
    if (!aliveRef.current) return;
    seqRef.current += 1;
    const f: Float = {
      key: seqRef.current,
      emoji,
      left: 8 + Math.random() * 84,
      dur: 2.2 + Math.random() * 1.3,
      drift: (Math.random() - 0.5) * 60,
    };
    setFloats((prev) => [...prev.slice(-24), f]);
    setTimeout(() => {
      if (aliveRef.current) setFloats((prev) => prev.filter((x) => x.key !== f.key));
    }, (f.dur + 0.2) * 1000);
  }, []);

  const react = useCallback(
    (emoji: string) => {
      spawn(emoji);
      try {
        navigator.vibrate?.(15);
      } catch {
        /* sin háptica */
      }
      void beat(true);
    },
    [spawn, beat],
  );

  // Bandada ambiente: cuando el rugido colectivo es alto, suben emojis "del
  // público" (representan el volumen de todos, no reacciones individuales).
  useEffect(() => {
    const id = setInterval(() => {
      const r = roarRef.current;
      if (r <= 0.05) return;
      const n = Math.round(r * 3);
      for (let i = 0; i < n; i++) {
        setTimeout(() => spawn(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]), i * 180);
      }
    }, 1400);
    return () => clearInterval(id);
  }, [spawn]);

  // No mostramos nada hasta tener un primer dato (evita parpadeo a 0).
  if (!ready && viewers === 0) return null;

  const roarPct = Math.round(roar * 100);
  const roarColor = roar > 0.66 ? RED : roar > 0.33 ? "#f59e0b" : GOLD;
  const roarLabel =
    roar > 0.66 ? "¡Estadio en llamas!" : roar > 0.33 ? "Ambiente encendido" : roar > 0.05 ? "Se calienta" : "Tranquilo";

  return (
    <section
      style={{
        position: "relative",
        background: "#0F1D32",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "14px 16px",
        marginBottom: 14,
        overflow: "hidden",
      }}
    >
      {/* Capa de reacciones flotantes */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {floats.map((f) => (
          <span
            key={f.key}
            style={{
              position: "absolute",
              bottom: 54,
              left: `${f.left}%`,
              fontSize: 24,
              ["--zm-drift" as string]: `${f.drift}px`,
              animation: `zmFloatUp ${f.dur}s ease-out forwards`,
            }}
          >
            {f.emoji}
          </span>
        ))}
      </div>

      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            {live && (
              <span className="zm-est-dot" style={{ width: 9, height: 9, borderRadius: "50%", background: RED, display: "inline-block" }} />
            )}
            <span className="mc-num" style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>
              {shownViewers.toLocaleString("es-ES")}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: MID }}>viendo ahora</span>
          </span>
          <span style={{ fontSize: 11, fontWeight: 800, color: roarColor, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {roarLabel}
          </span>
        </div>

        {/* Medidor de rugido */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: MID, textTransform: "uppercase", letterSpacing: 1, flexShrink: 0 }}>Rugido</span>
          <div style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
            <div
              style={{
                width: `${Math.max(3, roarPct)}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${GOLD}, ${roarColor})`,
                borderRadius: 4,
                transition: "width .6s ease, background .6s ease",
                boxShadow: roar > 0.5 ? `0 0 10px ${roarColor}` : "none",
              }}
            />
          </div>
        </div>

        {/* Reacciones */}
        <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => react(e)}
              aria-label={`Reaccionar ${e}`}
              className="zm-est-rx"
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: 12,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                fontSize: 22,
                cursor: "pointer",
                lineHeight: 1,
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes zmFloatUp {
          0% { transform: translateY(0) scale(.8); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translateY(-120px) translateX(var(--zm-drift,0)) scale(1.25); opacity: 0; }
        }
        @keyframes zmEstDot { 0%,100% { opacity: 1; transform: scale(1);} 50% { opacity:.35; transform: scale(.7);} }
        .zm-est-dot { animation: zmEstDot 1.1s ease-in-out infinite; }
        .zm-est-rx { transition: transform .12s ease, background .12s ease; }
        .zm-est-rx:active { transform: scale(1.18); background: rgba(201,168,76,0.2); }
        @media (prefers-reduced-motion: reduce) {
          .zm-est-dot, [style*="zmFloatUp"] { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
