"use client";

// src/app/grupos/mejores-terceros/TercerosPicker.tsx
//
// Mini-juego de la landing #1 (mejores terceros): "marca los 8 terceros que
// crees que pasan a dieciseisavos". Mueve las DOS métricas que pidió Carlos:
//  - TIEMPO DE INTERACCIÓN: es interactivo (tocas, ves progreso, completas).
//  - REGISTRO: al completar los 8 se desbloquea "guarda tu pronóstico ->
//    crea tu cuenta", justo en el pico de implicación.
//
// 100% CLIENT-SIDE y de bajo riesgo: opera solo sobre los datos que el
// servidor ya calculó (los 12 grupos + su tercero actual) y guarda en
// localStorage. NO toca KV en vivo, auth ni dinero. Replica el patrón ya
// probado del Bracket (clave zm:bracket:v1 -> aquí zm:pronostico-terceros:v1).
//
// El pick es por GRUPO (letra), no por equipo: el tercero de cada grupo aún
// cambia con cada jornada, así que el pronóstico "el tercero del grupo F se
// clasifica" es estable aunque cambie quién es ese tercero.
//
// Reduce-motion: algunos usuarios (incl. la máquina de Carlos) tienen
// "reducir movimiento" ON -> la señal de "completo" es ESTÁTICA (badge + ✓),
// no depende de ninguna animación.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Trophy } from "lucide-react";

const GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a", GREEN = "#22c55e";
const STORAGE_KEY = "zm:pronostico-terceros:v1";
const TARGET = 8;

export interface TerceroOption {
  letra: string;
  team: string | null;
  flag: string | null;
}

export default function TercerosPicker({ terceros }: { terceros: TerceroOption[] }) {
  const [picks, setPicks] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Carga del pronóstico guardado (tras montar, nunca en SSR).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          const valid = arr
            .filter((l) => typeof l === "string" && terceros.some((t) => t.letra === l))
            .slice(0, TARGET);
          setPicks(valid);
        }
      }
    } catch {
      /* sin localStorage: empezamos en blanco */
    }
    setHydrated(true);
    // Cargar UNA sola vez al montar. `terceros` (letras A-L) es estable, así
    // que lo omitimos de deps a propósito: si el RSC revalida (revalidate:60)
    // y entrega una referencia nueva del array, no queremos re-disparar la
    // carga y pisar los picks que el usuario está eligiendo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(picks));
    } catch {
      /* ignore */
    }
  }, [picks, hydrated]);

  const complete = picks.length >= TARGET;

  const toggle = (letra: string) => {
    setPicks((prev) => {
      if (prev.includes(letra)) return prev.filter((l) => l !== letra);
      if (prev.length >= TARGET) return prev; // tope 8
      return [...prev, letra];
    });
  };

  return (
    <aside
      style={{
        margin: "26px 0 8px",
        padding: "22px 16px 22px",
        borderRadius: 16,
        border: "1px solid rgba(201,168,76,0.28)",
        background: "linear-gradient(135deg, rgba(201,168,76,0.10), rgba(201,168,76,0.02))",
      }}
    >
      <p style={{ color: GOLD, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
        <Trophy size={13} aria-hidden /> Juega gratis · sin apuestas
      </p>
      <p style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 8px", lineHeight: 1.2 }}>
        ¿Qué 8 terceros crees que se clasifican?
      </p>
      <p style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 16px" }}>
        De los 12 grupos, marca los <b style={{ color: "#fff" }}>8</b> cuyos terceros crees que pasarán a
        dieciseisavos. Completa tu pronóstico y compite por las Gift Cards.
      </p>

      {/* Progreso */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, height: 8, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${Math.min(picks.length, TARGET) / TARGET * 100}%`,
              background: complete ? GREEN : `linear-gradient(90deg, ${GOLD}, ${GOLD2})`,
              transition: "width .2s ease",
            }}
          />
        </div>
        <span aria-live="polite" style={{ fontSize: 13, fontWeight: 800, color: complete ? GREEN : GOLD2, minWidth: 34, textAlign: "right" }}>
          {picks.length}/{TARGET}
        </span>
      </div>

      {/* Rejilla de 12 grupos */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
        {terceros.map((t) => {
          const selected = picks.includes(t.letra);
          const atLimit = complete && !selected;
          return (
            <button
              key={t.letra}
              type="button"
              aria-pressed={selected}
              aria-label={`Grupo ${t.letra}: ${t.team ?? "por definir"}${selected ? " (elegido)" : ""}`}
              aria-disabled={atLimit}
              onClick={() => toggle(t.letra)}
              style={{
                position: "relative",
                textAlign: "left",
                cursor: atLimit ? "not-allowed" : "pointer",
                background: selected ? "rgba(201,168,76,0.14)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${selected ? GOLD : "rgba(255,255,255,0.10)"}`,
                borderRadius: 12,
                padding: "10px 12px",
                color: MID,
                fontFamily: "inherit",
                opacity: atLimit ? 0.4 : 1,
                transition: "border-color .15s, background .15s, opacity .15s",
              }}
            >
              <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: selected ? GOLD2 : DIM, fontWeight: 700, marginBottom: 6 }}>
                Grupo {t.letra}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {t.flag ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://flagcdn.com/w40/${t.flag.toLowerCase()}.png`}
                    alt=""
                    width={22}
                    height={15}
                    loading="lazy"
                    decoding="async"
                    style={{ borderRadius: 2, flexShrink: 0 }}
                  />
                ) : (
                  <span style={{ width: 22, height: 15, borderRadius: 2, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
                )}
                <span style={{ color: t.team ? "#fff" : DIM, fontSize: 13.5, fontWeight: 600, fontStyle: t.team ? "normal" : "italic" }}>
                  {t.team ?? "Por definir"}
                </span>
              </div>
              {selected && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 18,
                    height: 18,
                    borderRadius: 999,
                    background: GOLD,
                    color: "#0A1422",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* CTA: bloqueado hasta completar los 8 (mecánica que sube la interacción) */}
      <div style={{ marginTop: 18 }}>
        {complete ? (
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: GREEN, fontWeight: 800, fontSize: 14 }}>
                <Check size={16} strokeWidth={3} aria-hidden /> Pronóstico completo
              </span>
              <Link
                href="/registro"
                style={{
                  display: "inline-block",
                  background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
                  color: "#0A1422",
                  fontWeight: 800,
                  fontSize: 15,
                  padding: "12px 24px",
                  borderRadius: 12,
                  textDecoration: "none",
                }}
              >
                Guárdalo y compite — crear cuenta gratis →
              </Link>
            </div>
            <p style={{ margin: "10px 0 0", fontSize: 12.5, color: DIM }}>
              ¿Cambiar? Toca un grupo marcado para soltarlo.
            </p>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 13.5, color: DIM }}>
            Elige <b style={{ color: GOLD2 }}>{TARGET - picks.length}</b> más para desbloquear y guardar tu pronóstico.
          </p>
        )}
      </div>
    </aside>
  );
}
