// src/components/bracket/CapsuleSealModal.tsx
// Modal para sellar la cápsula del tiempo del bracket. El usuario introduce
// un email y enviamos POST /api/bracket/capsule/seal con sus picks.

"use client";

import { useState } from "react";
import type { BracketState } from "@/lib/bracket/types";
import styles from "./bracket.module.css";

interface Props {
  open: boolean;
  state: BracketState;
  onClose: () => void;
}

export default function CapsuleSealModal({ open, state, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; hash?: string; error?: string } | null>(null);

  if (!open) return null;
  const pickCount = Object.keys(state.picks).length;

  async function handleSeal() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setResult({ ok: false, error: "Email no válido" });
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const r = await fetch("/api/bracket/capsule/seal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          picks: state.picks,
          champion: state.champion,
        }),
      });
      const data = await r.json();
      if (r.ok) {
        setResult({ ok: true, hash: data.hash });
      } else {
        setResult({ ok: false, error: data.error || `HTTP ${r.status}` });
      }
    } catch (e) {
      setResult({ ok: false, error: (e as Error).message });
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className={styles.modalShroud}
      data-open={open}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.modal} style={{ maxWidth: 460 }}>
        <div className={styles.modalHead}>
          <span className={styles.modalPhaseTag}>// CÁPSULA DEL TIEMPO</span>
          <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div style={{ padding: "20px 24px 0", position: "relative", zIndex: 2 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 10px" }}>
            🔒 Sellar tu cápsula
          </h2>
          {!result && (
            <>
              <p style={{ fontSize: 14, color: "var(--bb-text-2)", margin: "0 0 16px", lineHeight: 1.55 }}>
                Sella tus <b style={{ color: "var(--bb-gold-3)" }}>{pickCount} predicciones</b> ahora.
                Cuando termine el Mundial el 19 de julio de 2026, te enviaremos un email con tus
                aciertos. No podrás modificar tu bracket después.
              </p>
              <label style={{ fontSize: 12, color: "var(--bb-text-2)", display: "block", marginBottom: 6 }}>
                Tu email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 10,
                  color: "var(--bb-text)",
                  padding: "12px 14px",
                  fontSize: 15,
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                autoFocus
                disabled={sending}
              />
            </>
          )}

          {result?.ok && (
            <div
              style={{
                marginTop: 4,
                padding: "16px 18px",
                borderRadius: 12,
                background: "linear-gradient(90deg, rgba(201,168,76,0.18), rgba(201,168,76,0.04))",
                border: "1px solid rgba(201,168,76,0.45)",
                color: "#FDE68A",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>🎉 Cápsula sellada</div>
              <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.55 }}>
                Tu cápsula <code style={{ color: "#FDE68A" }}>#{result.hash}</code> está guardada
                en bóveda hasta el 20 de julio de 2026. Te llegará un email de confirmación en unos
                segundos.
              </div>
            </div>
          )}

          {result && !result.ok && (
            <div
              style={{
                marginTop: 12,
                padding: "12px 16px",
                borderRadius: 10,
                background: "rgba(239,68,68,0.10)",
                border: "1px solid rgba(239,68,68,0.4)",
                color: "#fca5a5",
                fontSize: 13,
              }}
            >
              {result.error}
            </div>
          )}
        </div>

        <div className={styles.modalActions}>
          {result?.ok ? (
            <button type="button" className={`${styles.btn} ${styles.btnGold}`} onClick={onClose}>
              Cerrar
            </button>
          ) : (
            <>
              <button type="button" className={styles.btn} onClick={onClose} disabled={sending}>
                Cancelar
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGold}`}
                onClick={handleSeal}
                disabled={sending || !email}
              >
                {sending ? "Sellando…" : "🔒 Sellar cápsula"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
