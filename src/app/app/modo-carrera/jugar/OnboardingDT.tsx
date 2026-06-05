// src/app/app/modo-carrera/jugar/OnboardingDT.tsx
// PILAR 1 — Identidad DT. Wizard de creación del director técnico:
//   1) Nombre  2) Filosofía  3) Nación  4) Reveal de la carta DT
// Edita el CareerState en vivo (preview en la Ficha DT) y al confirmar marca
// createdAt para que CareerGame muestre el Hub.

"use client";

import { useMemo, useState } from "react";
import { BG, BG2, BG3, GOLD, GOLD2, MID, DIM, flagUrl } from "./fx";
import FichaDT, { PhilosophyIcon } from "./FichaDT";
import { PHILOSOPHIES } from "@/lib/modo-carrera/constants";
import type { CareerState, Philosophy } from "@/lib/modo-carrera/types";
import { SELECCIONES } from "@/data/selecciones";

type Step = 0 | 1 | 2 | 3;

export default function OnboardingDT({
  career,
  onChange,
  onFinish,
}: {
  career: CareerState;
  onChange: (next: CareerState) => void;
  onFinish: () => void;
}) {
  const [step, setStep] = useState<Step>(0);
  const [query, setQuery] = useState("");
  const id = career.identity;

  const patchIdentity = (patch: Partial<CareerState["identity"]>) =>
    onChange({ ...career, identity: { ...career.identity, ...patch }, updatedAt: new Date().toISOString() });

  const nations = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...SELECCIONES].sort((a, b) => (a.rankingFIFA ?? 999) - (b.rankingFIFA ?? 999));
    return q ? list.filter((s) => s.nombre.toLowerCase().includes(q)) : list;
  }, [query]);

  const canNext =
    (step === 0 && id.name.trim().length >= 2) ||
    (step === 1 && !!id.philosophy) ||
    (step === 2 && !!id.nationSlug) ||
    step === 3;

  const next = () => {
    if (step < 3) setStep((step + 1) as Step);
    else {
      patchIdentity({ createdAt: new Date().toISOString() });
      onFinish();
    }
  };
  const back = () => step > 0 && setStep((step - 1) as Step);

  const STEPS = ["Nombre", "Filosofía", "Nación", "Tu carta"];

  return (
    <div style={{ background: BG, color: "#fff", minHeight: "100vh", fontFamily: "'Outfit',sans-serif", padding: "40px 20px 80px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Progreso de pasos */}
        <div style={{ display: "flex", gap: 8, marginBottom: 32, maxWidth: 480 }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ height: 4, borderRadius: 2, background: i <= step ? GOLD : "rgba(255,255,255,0.12)", transition: "background .3s" }} />
              <div style={{ fontSize: 11, marginTop: 6, color: i === step ? GOLD : DIM, fontWeight: i === step ? 700 : 500 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 40, alignItems: "start" }}>
          {/* Columna izquierda: paso activo */}
          <div>
            {step === 0 && (
              <div>
                <span style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Paso 1</span>
                <h2 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 900, margin: "12px 0 8px" }}>Crea tu leyenda</h2>
                <p style={{ color: MID, marginBottom: 24, lineHeight: 1.6 }}>¿Cómo te llamarás en los banquillos del mundo?</p>
                <input
                  value={id.name}
                  onChange={(e) => patchIdentity({ name: e.target.value.slice(0, 40) })}
                  placeholder="Nombre del DT"
                  maxLength={40}
                  autoFocus
                  style={{
                    width: "100%", maxWidth: 420, padding: "16px 18px", borderRadius: 12,
                    background: BG2, border: "1px solid rgba(255,255,255,0.1)", color: "#fff",
                    fontSize: 18, fontWeight: 600, outline: "none",
                  }}
                />
              </div>
            )}

            {step === 1 && (
              <div>
                <span style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Paso 2</span>
                <h2 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 900, margin: "12px 0 8px" }}>Tu filosofía</h2>
                <p style={{ color: MID, marginBottom: 24, lineHeight: 1.6 }}>Define el ADN de tu equipo. Marca tu estilo de juego.</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
                  {PHILOSOPHIES.map((p) => {
                    const active = id.philosophy === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => patchIdentity({ philosophy: p.id as Philosophy })}
                        style={{
                          textAlign: "left", cursor: "pointer", padding: 18, borderRadius: 16,
                          background: BG2,
                          border: `2px solid ${active ? p.accent : "rgba(255,255,255,0.08)"}`,
                          boxShadow: active ? `0 0 0 4px ${p.accent}22` : "none",
                          transition: "border .2s, box-shadow .2s, transform .2s",
                          transform: active ? "translateY(-3px)" : "none",
                          color: "#fff",
                        }}
                      >
                        <div style={{ color: p.accent, marginBottom: 10 }}><PhilosophyIcon id={p.id} size={28} /></div>
                        <div style={{ fontWeight: 800, fontSize: 16 }}>{p.name}</div>
                        <div style={{ color: p.accent, fontSize: 12, fontWeight: 600, margin: "2px 0 8px" }}>{p.tagline}</div>
                        <div style={{ color: MID, fontSize: 13, lineHeight: 1.5 }}>{p.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <span style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Paso 3</span>
                <h2 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 900, margin: "12px 0 8px" }}>Adopta una selección</h2>
                <p style={{ color: MID, marginBottom: 16, lineHeight: 1.6 }}>Elige una de las 48 selecciones del Mundial 2026.</p>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar selección…"
                  style={{
                    width: "100%", maxWidth: 360, padding: "12px 16px", borderRadius: 10,
                    background: BG2, border: "1px solid rgba(255,255,255,0.1)", color: "#fff",
                    fontSize: 15, outline: "none", marginBottom: 16,
                  }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10, maxHeight: 420, overflowY: "auto" }}>
                  {nations.map((s) => {
                    const active = id.nationSlug === s.slug;
                    return (
                      <button
                        key={s.slug}
                        onClick={() => patchIdentity({ nationSlug: s.slug })}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                          padding: "10px 12px", borderRadius: 10, background: active ? "rgba(201,168,76,0.14)" : BG2,
                          border: `1.5px solid ${active ? GOLD : "rgba(255,255,255,0.06)"}`, color: "#fff",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={flagUrl(s.flagCode)} alt={s.nombre} width={28} height={20} style={{ borderRadius: 3, objectFit: "cover", flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.nombre}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <span style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>¡Listo!</span>
                <h2 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 900, margin: "12px 0 8px" }}>Tu carta DT</h2>
                <p style={{ color: MID, marginBottom: 24, lineHeight: 1.6 }}>
                  Esta es tu identidad. Empiezas con overall 50 (rango Amateur). Dirige partidos, completa misiones y
                  haz crecer tu leyenda hasta llegar a <span style={{ color: GOLD2, fontWeight: 700 }}>Inmortal</span>.
                </p>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ padding: "12px 16px", borderRadius: 12, background: BG3, minWidth: 110 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: GOLD }}>50</div>
                    <div style={{ fontSize: 11, color: DIM }}>Overall inicial</div>
                  </div>
                  <div style={{ padding: "12px 16px", borderRadius: 12, background: BG3, minWidth: 110 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: GOLD }}>70</div>
                    <div style={{ fontSize: 11, color: DIM }}>Moral</div>
                  </div>
                </div>
              </div>
            )}

            {/* Navegación */}
            <div style={{ display: "flex", gap: 12, marginTop: 36 }}>
              {step > 0 && (
                <button onClick={back} style={{ padding: "14px 28px", borderRadius: 12, background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                  Atrás
                </button>
              )}
              <button
                onClick={next}
                disabled={!canNext}
                style={{
                  padding: "14px 32px", borderRadius: 12, border: "none",
                  background: canNext ? `linear-gradient(135deg,${GOLD},${GOLD2})` : "rgba(255,255,255,0.08)",
                  color: canNext ? BG : DIM, fontWeight: 800, fontSize: 15,
                  cursor: canNext ? "pointer" : "not-allowed",
                  boxShadow: canNext ? "0 8px 24px rgba(201,168,76,0.3)" : "none",
                }}
              >
                {step === 3 ? "Iniciar carrera" : "Continuar"}
              </button>
            </div>
          </div>

          {/* Columna derecha: preview de la carta en vivo */}
          <div style={{ position: "sticky", top: 24, display: "flex", justifyContent: "center" }}>
            <FichaDT identity={career.identity} progression={career.progression} />
          </div>
        </div>
      </div>
    </div>
  );
}
