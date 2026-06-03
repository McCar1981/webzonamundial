// src/components/bracket/DebatePanel.tsx
//
// IA Coach MODO 5: Debate / Reto IA vs Humanos. Chat MULTI-TURN contra el
// Retador. Feature PREMIUM (Founders Pass) + requiere cuenta. El panel maneja
// con elegancia los estados de "inicia sesión" (401) y "hazte Founder" (402).

"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import type { BracketState } from "@/lib/bracket/types";
import { IconDebate } from "@/components/ia-coach/icons";
import type {
  DebateMessage,
  DebateResponse,
  DebateErrorResponse,
} from "@/lib/ia-coach/debate-types";

// Paleta alineada con el resto del bracket (dorado ZonaMundial).
const BG2 = "#12161D";
const BG3 = "#1A2029";
const GOLD = "#C9A84C";
const GOLD2 = "#FDE68A";
const MID = "#C7CEDA";
const DIM = "#8A93A3";
const RED = "#E5604D";

const MAX_USER_TURNS = 10;

type Gate = "none" | "auth" | "premium";

function debateError(code: string): string {
  switch (code) {
    case "turn_limit":
      return "Has alcanzado el límite de turnos de esta sesión. Recarga para empezar de nuevo.";
    case "anthropic_failed":
      return "El Retador se quedó sin palabras. Inténtalo de nuevo.";
    case "invalid_messages":
      return "No se pudo enviar tu mensaje.";
    default:
      return "Algo falló en el debate. Inténtalo de nuevo.";
  }
}

export default function DebatePanel({
  state,
  userName = null,
}: {
  state: BracketState;
  /** Nombre de registro del usuario (presentación). El saludo dentro del prompt
   *  del Retador se resuelve server-side; esto es solo para el copy del panel. */
  userName?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [stance, setStance] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gate, setGate] = useState<Gate>("none");
  const listRef = useRef<HTMLDivElement | null>(null);

  const userTurns = messages.filter((m) => m.role === "user").length;
  const limitReached = userTurns >= MAX_USER_TURNS;

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || limitReached) return;

    const nextMessages: DebateMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);
    setGate("none");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 32_000);
    try {
      const res = await fetch("/api/ia-coach/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ champion: state.champion ?? null, messages: nextMessages }),
        signal: controller.signal,
      });
      if (res.status === 401) {
        setGate("auth");
        setMessages(messages); // revierte el mensaje optimista
        return;
      }
      if (res.status === 402) {
        setGate("premium");
        setMessages(messages);
        return;
      }
      const data = (await res.json()) as DebateResponse | DebateErrorResponse;
      if (data.ok) {
        const reply = data.turn.challenge
          ? `${data.turn.reply}\n\n${data.turn.challenge}`
          : data.turn.reply;
        setMessages([...nextMessages, { role: "assistant", content: reply }]);
        setStance(data.turn.stance || null);
      } else {
        setError(debateError("error" in data ? data.error : "unknown"));
        setMessages(messages);
      }
    } catch (err) {
      setError(
        (err as Error).name === "AbortError"
          ? "El Retador tardó demasiado. Inténtalo de nuevo."
          : "Error de red al contactar al Retador.",
      );
      setMessages(messages);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
      requestAnimationFrame(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
      });
    }
  }, [input, loading, limitReached, messages, state.champion]);

  return (
    <div
      style={{
        marginTop: 18,
        background: BG2,
        border: `1px solid ${GOLD}33`,
        borderRadius: 14,
        padding: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ color: GOLD2, display: "inline-flex" }}>
          <IconDebate size={20} />
        </span>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontWeight: 700, color: GOLD2, fontSize: 15 }}>
            Reta al Retador
            <span
              style={{
                marginLeft: 8,
                fontSize: 10,
                fontWeight: 800,
                color: "#0C0F14",
                background: GOLD2,
                borderRadius: 6,
                padding: "2px 6px",
                letterSpacing: 0.5,
                verticalAlign: "middle",
              }}
            >
              PREMIUM
            </span>
          </div>
          <div style={{ color: DIM, fontSize: 12 }}>
            Debate tus pronósticos cara a cara con la IA
          </div>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            background: open ? "#3A3F49" : GOLD,
            color: open ? MID : "#0C0F14",
            border: "none",
            borderRadius: 9,
            padding: "9px 16px",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {open ? "Cerrar" : "Abrir debate"}
        </button>
      </div>

      {open && (
        <div style={{ marginTop: 14 }}>
          {gate === "auth" && (
            <GateBox
              text="Para debatir con el Retador necesitas una cuenta."
              cta="Iniciar sesión"
              href="/login?next=/bracket"
            />
          )}
          {gate === "premium" && (
            <GateBox
              text="El Retador es una función exclusiva del Founders Pass."
              cta="Conseguir Founders Pass"
              href="/founders"
            />
          )}

          {stance && messages.length > 0 && (
            <div
              style={{
                fontSize: 11,
                color: DIM,
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Postura del Retador: <span style={{ color: GOLD2 }}>{stance}</span>
            </div>
          )}

          {messages.length > 0 && (
            <div
              ref={listRef}
              style={{
                maxHeight: 320,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 12,
                paddingRight: 4,
              }}
            >
              {messages.map((m, i) => (
                <Bubble key={i} role={m.role}>
                  {m.content}
                </Bubble>
              ))}
              {loading && (
                <Bubble role="assistant">
                  <span style={{ color: DIM }}>El Retador piensa su jugada…</span>
                </Bubble>
              )}
            </div>
          )}

          {messages.length === 0 && gate === "none" && (
            <div style={{ color: DIM, fontSize: 12.5, marginBottom: 12, lineHeight: 1.5 }}>
              {userName ? `${userName}, defiende` : "Defiende"} tu campeón y tus pronósticos. El Retador los pondrá a prueba con
              argumentos. {state.champion ? "Empieza explicando por qué tu campeón levantará la copa." : "Empieza lanzando tu predicción más atrevida."}
            </div>
          )}

          {error && (
            <div
              style={{
                marginBottom: 10,
                background: `${RED}1A`,
                border: `1px solid ${RED}55`,
                borderRadius: 9,
                padding: "9px 11px",
                color: RED,
                fontSize: 12.5,
              }}
            >
              {error}
            </div>
          )}

          {limitReached ? (
            <div style={{ color: DIM, fontSize: 12.5, textAlign: "center" }}>
              Fin del asalto: alcanzaste los {MAX_USER_TURNS} turnos. Recarga para volver a empezar.
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder="Lanza tu argumento…"
                rows={2}
                disabled={loading}
                style={{
                  flex: 1,
                  background: BG3,
                  border: `1px solid ${GOLD}33`,
                  borderRadius: 9,
                  padding: "9px 11px",
                  color: MID,
                  fontSize: 13.5,
                  resize: "none",
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
              <button
                onClick={() => void send()}
                disabled={loading || !input.trim()}
                style={{
                  background: input.trim() && !loading ? GOLD : "#3A3F49",
                  color: input.trim() && !loading ? "#0C0F14" : DIM,
                  border: "none",
                  borderRadius: 9,
                  padding: "10px 16px",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: loading || !input.trim() ? "default" : "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Enviar
              </button>
            </div>
          )}

          {messages.length > 0 && !limitReached && (
            <div style={{ color: DIM, fontSize: 11, textAlign: "right", marginTop: 6 }}>
              Turno {userTurns}/{MAX_USER_TURNS}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Bubble({
  role,
  children,
}: {
  role: "user" | "assistant";
  children: React.ReactNode;
}) {
  const isUser = role === "user";
  return (
    <div
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "85%",
        background: isUser ? GOLD : BG3,
        color: isUser ? "#0C0F14" : MID,
        border: isUser ? "none" : `1px solid ${GOLD}22`,
        borderRadius: 12,
        borderBottomRightRadius: isUser ? 3 : 12,
        borderBottomLeftRadius: isUser ? 12 : 3,
        padding: "9px 12px",
        fontSize: 13.5,
        lineHeight: 1.45,
        fontWeight: isUser ? 600 : 400,
        whiteSpace: "pre-wrap",
      }}
    >
      {children}
    </div>
  );
}

function GateBox({ text, cta, href }: { text: string; cta: string; href: string }) {
  return (
    <div
      style={{
        background: BG3,
        border: `1px solid ${GOLD}55`,
        borderRadius: 11,
        padding: "13px 14px",
        marginBottom: 12,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ color: MID, fontSize: 13.5, lineHeight: 1.45 }}>{text}</div>
      <Link
        href={href}
        style={{
          alignSelf: "flex-start",
          background: GOLD,
          color: "#0C0F14",
          borderRadius: 9,
          padding: "8px 15px",
          fontWeight: 700,
          fontSize: 13,
          textDecoration: "none",
        }}
      >
        {cta}
      </Link>
    </div>
  );
}
