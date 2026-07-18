"use client";

// src/app/app/matchcenter/MicroLive.tsx
//
// UI EN VIVO de las Micro-predicciones. Sondea la micro activa del partido y, en
// cuanto aparece una (la emite el backend desde el poller), muestra un popup
// fijo abajo-derecha con su pregunta, opciones y un timer de cuenta atrás
// sincronizado con `closes_at`. Al responder hace POST y bloquea las opciones.
//
// No genera nada por su cuenta: solo refleja lo que el backend ya decidió. El
// sondeo es ligero (2s) y se ralentiza cuando no hay micro activa.

import { useCallback, useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const BG = "#000000";
const SURFACE = "#14110a";
const GOLD = "#c9a84c";
const GOLD_LIGHT = "#e8d48b";

interface MicroOption {
  key: string;
  label: string;
}
interface ActiveMicro {
  id: string;
  kind: string;
  category: string;
  emoji: string;
  question: string;
  options: MicroOption[];
  window_seconds: number;
  base_points: number;
  match_multiplier: number;
  activated_at: string;
  closes_at: string;
}
interface FireChain {
  count: number;
  multiplier: number;
  label: string;
  emoji: string;
}
interface RecentResult {
  micro_id: string;
  question: string;
  emoji: string;
  is_correct: boolean;
  points: number;
  selected_label: string | null;
  correct_label: string | null;
  resolved_at: string;
}
interface LastClosed {
  id: string;
  emoji: string;
  question: string;
  options: MicroOption[];
  status: string;
  correct_option: string | null;
  closes_at: string;
}
interface ActiveResponse {
  match_id: string;
  micro: ActiveMicro | null;
  last_closed?: LastClosed | null;
  already_responded: boolean;
  my_option: string | null;
  fire_chain: FireChain;
  recent_result: RecentResult | null;
}
/** Estado "llegaste tarde": qué micro acaba de cerrarse y cómo contarlo. */
interface LateInfo {
  emoji: string;
  question: string;
  correctLabel: string | null;
  closedAgoS: number;
  note?: string;
}

export default function MicroLive({ matchId }: { matchId: number }) {
  const [micro, setMicro] = useState<ActiveMicro | null>(null);
  const [fireChain, setFireChain] = useState<FireChain | null>(null);
  const [myOption, setMyOption] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [sending, setSending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [closing, setClosing] = useState(false);
  const [result, setResult] = useState<RecentResult | null>(null);
  const [late, setLate] = useState<LateInfo | null>(null);

  const aliveRef = useRef(true);
  // Id de la micro que ya mostramos: para reiniciar estado al cambiar de micro.
  const shownIdRef = useRef<string | null>(null);
  // Resultados ya mostrados (por micro_id) + baseline en el primer sondeo, para
  // no toastear resoluciones antiguas al abrir la página.
  const seenResultsRef = useRef<Set<string>>(new Set());
  const resultInitRef = useRef(false);
  const resultTimerRef = useRef<number | null>(null);
  // Primer sondeo tras montar (llegada típica desde el push).
  const arrivalRef = useRef(true);
  const lateTimerRef = useRef<number | null>(null);
  // Cierre automático tras responder (el popup no debe tapar el partido).
  const closeTimerRef = useRef<number | null>(null);

  /** Cierra el popup con su animación SIN olvidar la micro mostrada (shownIdRef
   *  se conserva para que el sondeo no la vuelva a abrir). */
  const dismissPopup = useCallback((delayMs: number) => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      if (!aliveRef.current) return;
      setClosing(true);
      window.setTimeout(() => {
        if (aliveRef.current) setMicro(null);
      }, 330);
    }, delayMs);
  }, []);

  const showLate = useCallback((info: LateInfo) => {
    setLate(info);
    if (lateTimerRef.current) window.clearTimeout(lateTimerRef.current);
    lateTimerRef.current = window.setTimeout(() => {
      if (aliveRef.current) setLate(null);
    }, 12_000);
  }, []);

  // ── Sesión (para saber si puede responder o invitarle a entrar) ─────────────
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (aliveRef.current) setAuthed(!!data.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (aliveRef.current) setAuthed(!!session?.user);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // ── Sondeo de la micro activa ───────────────────────────────────────────────
  const poll = useCallback(async () => {
    // ?arrival=1 solo en el PRIMER sondeo: si la ventana ya venció (lo normal al
    // entrar desde el push), el backend devuelve la última micro cerrada para
    // explicar "llegaste tarde" en vez de no mostrar nada.
    const arrival = arrivalRef.current;
    arrivalRef.current = false;
    try {
      const res = await fetch(`/api/micro/match/${matchId}/active${arrival ? "?arrival=1" : ""}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as ActiveResponse;
      if (!aliveRef.current) return;

      setFireChain(data.fire_chain ?? null);

      // ── Resultado recién resuelto → toast (acierto/fallo + puntos + 🔥) ──
      const rr = data.recent_result;
      if (!resultInitRef.current) {
        // Primer sondeo: marca lo ya resuelto como visto (baseline) sin toastear.
        if (rr) seenResultsRef.current.add(rr.micro_id);
        resultInitRef.current = true;
      } else if (rr && !seenResultsRef.current.has(rr.micro_id)) {
        seenResultsRef.current.add(rr.micro_id);
        setResult(rr);
        if (resultTimerRef.current) window.clearTimeout(resultTimerRef.current);
        resultTimerRef.current = window.setTimeout(() => {
          if (aliveRef.current) setResult(null);
        }, 6000);
      }

      const next = data.micro;
      if (!next) {
        // Sin micro activa. Si acabamos de llegar (push) y una se cerró hace
        // nada, cuéntalo en vez de dejar la pantalla muda.
        const lc = data.last_closed;
        if (arrival && lc && !shownIdRef.current) {
          showLate({
            emoji: lc.emoji,
            question: lc.question,
            correctLabel: lc.correct_option
              ? lc.options.find((o) => o.key === lc.correct_option)?.label ?? lc.correct_option
              : null,
            closedAgoS: Math.max(1, Math.round((Date.now() - new Date(lc.closes_at).getTime()) / 1000)),
          });
        }
        // Cerramos el popup si estaba abierto.
        if (shownIdRef.current) {
          shownIdRef.current = null;
          setMicro(null);
        }
        return;
      }

      // Nueva micro distinta a la mostrada: reinicia el estado de respuesta.
      if (shownIdRef.current !== next.id) {
        // Ya respondida (recarga u otra pestaña): no la abras — el popup solo
        // tapa pantalla mientras se puede jugar.
        if (data.already_responded) {
          shownIdRef.current = next.id;
          return;
        }
        if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
        shownIdRef.current = next.id;
        setClosing(false);
        setMicro(next);
        setAnswered(false);
        setMyOption(data.my_option);
        setLate(null); // la micro real manda sobre el aviso de "llegaste tarde"
      } else {
        // Misma micro: solo refresca si el backend ya registró nuestra respuesta.
        if (data.already_responded) {
          setAnswered(true);
          setMyOption(data.my_option);
        }
      }
    } catch {
      /* silencioso: reintenta en el siguiente tick */
    }
  }, [matchId, showLate]);

  // Más frecuente cuando hay micro abierta (timer fino); lento en reposo.
  useEffect(() => {
    aliveRef.current = true;
    poll();
    const id = setInterval(poll, micro ? 2000 : 4000);
    return () => {
      aliveRef.current = false;
      clearInterval(id);
    };
  }, [poll, micro]);

  // Limpia los timers (toast, aviso de cierre y auto-cierre) al desmontar.
  useEffect(() => () => {
    if (resultTimerRef.current) window.clearTimeout(resultTimerRef.current);
    if (lateTimerRef.current) window.clearTimeout(lateTimerRef.current);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
  }, []);

  // ── Cuenta atrás de la ventana ──────────────────────────────────────────────
  useEffect(() => {
    if (!micro) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((new Date(micro.closes_at).getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        // Ventana vencida: animación de salida y cierre.
        setClosing(true);
        window.setTimeout(() => {
          if (!aliveRef.current) return;
          shownIdRef.current = null;
          setMicro(null);
        }, 350);
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [micro]);

  // ── Responder ───────────────────────────────────────────────────────────────
  const respond = async (option: string) => {
    if (!micro || sending || answered || secondsLeft <= 0) return;
    if (authed === false) {
      window.location.href = `/login?next=/app/matchcenter/${matchId}`;
      return;
    }
    setSending(true);
    // Optimista: marca la opción al instante; el backend confirma.
    setMyOption(option);
    try {
      const res = await fetch(`/api/micro/${micro.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ option }),
      });
      if (res.status === 401) {
        setMyOption(null);
        window.location.href = `/login?next=/app/matchcenter/${matchId}`;
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (!aliveRef.current) return;
        setAnswered(true);
        if (typeof data.fire_multiplier === "number") {
          setFireChain((p) => (p ? { ...p, multiplier: data.fire_multiplier } : p));
        }
        // Confirmación breve y fuera: el popup no debe tapar el partido.
        dismissPopup(1100);
      } else if (res.status === 409) {
        // Ya respondida (otra pestaña / carrera): sí está registrada.
        setAnswered(true);
        dismissPopup(700);
      } else {
        // 400 (ventana cerrada justo antes de llegar tu respuesta): NO finjas
        // que quedó registrada. Cierra el popup y dilo claro.
        setMyOption(null);
        setClosing(true);
        window.setTimeout(() => {
          if (!aliveRef.current) return;
          shownIdRef.current = null;
          setMicro(null);
        }, 350);
        showLate({
          emoji: micro.emoji,
          question: micro.question,
          correctLabel: null,
          closedAgoS: 0,
          note: "Tu respuesta llegó justo después del cierre — no quedó registrada.",
        });
      }
    } catch {
      if (aliveRef.current) setMyOption(null);
    } finally {
      if (aliveRef.current) setSending(false);
    }
  };

  const resultToast = result ? <MicroResultToast result={result} raised={!!micro} /> : null;

  // Tarjeta "llegaste tarde": misma esquina que el popup, sin timer ni opciones.
  const lateCard =
    !micro && late ? (
      <div
        role="status"
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: "min(360px, calc(100vw - 32px))",
          zIndex: 9997,
          borderRadius: 18,
          background: `linear-gradient(180deg, ${SURFACE} 0%, ${BG} 100%)`,
          border: "1px solid rgba(201,168,76,0.30)",
          padding: 18,
          color: "#fff",
          animation: "micro-slide-up 0.42s cubic-bezier(0.16,1,0.3,1)",
          fontFamily: "var(--font-inter, Inter, system-ui, sans-serif)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>{late.emoji}</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.55)",
                padding: "3px 8px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              Micro · cerrada
            </span>
          </div>
          <button
            onClick={() => setLate(null)}
            aria-label="Cerrar aviso"
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.55)",
              fontSize: 16,
              fontWeight: 800,
              cursor: "pointer",
              padding: "2px 6px",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        <h3 style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.3, margin: "0 0 8px", color: "rgba(255,255,255,0.85)" }}>
          {late.question}
        </h3>

        {late.correctLabel && (
          <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>
            Correcta: <span style={{ color: GOLD_LIGHT, fontWeight: 800 }}>{late.correctLabel}</span>
          </div>
        )}

        <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
          {late.note ?? `⏱️ Se cerró hace ${late.closedAgoS}s — llegaste tarde.`}{" "}
          La próxima salta en cualquier momento: quédate en el partido. 👀
        </div>
      </div>
    ) : null;

  if (!micro) {
    return (
      <>
        {resultToast}
        {lateCard}
      </>
    );
  }

  const total = Math.max(1, micro.window_seconds);
  const pct = Math.max(0, Math.min(100, (secondsLeft / total) * 100));
  const urgent = secondsLeft <= 5;
  const hasFire = !!fireChain && fireChain.count >= 2;

  return (
    <>
    {resultToast}
    <div
      role="dialog"
      aria-label="Micro-predicción en vivo"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        width: "min(360px, calc(100vw - 32px))",
        zIndex: 9997,
        borderRadius: 18,
        background: `linear-gradient(180deg, ${SURFACE} 0%, ${BG} 100%)`,
        border: "1px solid rgba(201,168,76,0.30)",
        padding: 18,
        color: "#fff",
        animation: closing
          ? "micro-slide-down 0.32s ease forwards"
          : "micro-slide-up 0.42s cubic-bezier(0.16,1,0.3,1), micro-border-pulse 2.2s ease-in-out infinite",
        fontFamily: "var(--font-inter, Inter, system-ui, sans-serif)",
      }}
    >
      {/* Cabecera: tipo + timer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>{micro.emoji}</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: GOLD,
              padding: "3px 8px",
              borderRadius: 999,
              background: "rgba(201,168,76,0.12)",
              border: "1px solid rgba(201,168,76,0.25)",
            }}
          >
            Micro · en vivo
          </span>
        </div>
        <div
          aria-hidden="true"
          style={{
            minWidth: 38,
            textAlign: "center",
            fontSize: 15,
            fontWeight: 900,
            color: urgent ? "#ff6b6b" : GOLD_LIGHT,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {secondsLeft}s
        </div>
      </div>

      {/* Barra de tiempo */}
      <div style={{ height: 4, borderRadius: 999, background: "rgba(255,255,255,0.10)", overflow: "hidden", marginBottom: 14 }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: 999,
            background: urgent ? "#ff6b6b" : `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`,
            transition: "width 0.25s linear",
          }}
        />
      </div>

      {/* Cadena de Fuego */}
      {hasFire && fireChain && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 12,
            padding: "5px 10px",
            borderRadius: 999,
            background: "rgba(255,107,53,0.12)",
            border: "1px solid rgba(255,140,90,0.35)",
            fontSize: 11,
            fontWeight: 800,
            color: "#ffb38a",
          }}
        >
          <span>{fireChain.emoji}</span>
          <span>
            {fireChain.label} · racha {fireChain.count} · ×{fireChain.multiplier.toFixed(1)}
          </span>
        </div>
      )}

      {/* Pregunta */}
      <h3 style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.3, margin: "0 0 14px", color: "#fff" }}>
        {micro.question}
      </h3>

      {/* Opciones */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {micro.options.map((opt) => {
          const selected = myOption === opt.key;
          const locked = answered || sending || secondsLeft <= 0;
          const dimmed = answered && !selected;
          return (
            <button
              key={opt.key}
              onClick={() => respond(opt.key)}
              disabled={locked}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                textAlign: "left",
                background: selected ? `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})` : "rgba(255,255,255,0.06)",
                border: selected ? "none" : "1px solid rgba(255,255,255,0.12)",
                color: selected ? BG : "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: locked ? "default" : "pointer",
                opacity: dimmed ? 0.45 : 1,
                transition: "background 0.2s, opacity 0.2s, transform 0.1s",
              }}
              onMouseEnter={(e) => {
                if (!locked && !selected) e.currentTarget.style.background = "rgba(255,255,255,0.12)";
              }}
              onMouseLeave={(e) => {
                if (!locked && !selected) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Pie: estado */}
      <div style={{ marginTop: 12, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.55)", textAlign: "center" }}>
        {answered
          ? "Respuesta registrada — se resuelve en vivo"
          : authed === false
            ? "Inicia sesión para participar"
            : `+${micro.base_points} pts${micro.match_multiplier > 1 ? ` · ×${Number(micro.match_multiplier).toFixed(1)} partido` : ""}`}
      </div>
    </div>
    </>
  );
}

// ── Toast de resultado ─────────────────────────────────────────────────────────
// Aparece abajo-derecha cuando una micro en la que participaste se resuelve.
// `raised` lo sube para no solaparse con el popup de pregunta si hay una activa.
function MicroResultToast({ result, raised }: { result: RecentResult; raised: boolean }) {
  const ok = result.is_correct;
  const accent = ok ? "#4ade80" : "#ff6b6b";
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: raised ? 384 : 20,
        right: 20,
        width: "min(360px, calc(100vw - 32px))",
        zIndex: 9998,
        borderRadius: 16,
        background: `linear-gradient(180deg, ${SURFACE} 0%, ${BG} 100%)`,
        border: `1px solid ${ok ? "rgba(74,222,128,0.45)" : "rgba(255,107,53,0.45)"}`,
        padding: "14px 16px",
        color: "#fff",
        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
        animation: "micro-slide-up 0.42s cubic-bezier(0.16,1,0.3,1)",
        fontFamily: "var(--font-inter, Inter, system-ui, sans-serif)",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          fontSize: 26,
          lineHeight: 1,
          width: 40,
          height: 40,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 12,
          background: ok ? "rgba(74,222,128,0.15)" : "rgba(255,107,53,0.15)",
        }}
      >
        {ok ? "✅" : "❌"}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14 }}>{result.emoji}</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: accent }}>
            {ok ? `¡Acertaste! +${result.points} pts` : "Fallaste · cadena rota"}
          </span>
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "rgba(255,255,255,0.6)",
            marginTop: 3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {result.correct_label ? `Correcto: ${result.correct_label}` : result.question}
        </div>
      </div>
    </div>
  );
}
