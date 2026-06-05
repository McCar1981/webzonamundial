// src/app/app/modo-carrera/jugar/OnboardingDT.tsx
// PILAR 1 — Identidad DT, contado como UNA HISTORIA (estilo "The Journey").
// Escenas: Prólogo → Cap.1 Nombre → Cap.2 Filosofía → Cap.3 Nación → El comienzo.
// Cada escena tiene narrativa, fondo cinemático (con fallback si falta la imagen)
// y animaciones CSS. Al terminar siembra la primera entrada de narrativa (Pilar 6).

"use client";

import { useMemo, useState } from "react";
import { BG, BG2, BG3, GOLD, GOLD2, MID, DIM, flagUrl } from "./fx";
import FichaDT, { PhilosophyIcon } from "./FichaDT";
import { PHILOSOPHIES } from "@/lib/modo-carrera/constants";
import type { CareerState, Philosophy, NarrativeEntry } from "@/lib/modo-carrera/types";
import { SELECCIONES } from "@/data/selecciones";

type Scene = "prologo" | "nombre" | "filosofia" | "nacion" | "comienzo";
const ORDER: Scene[] = ["prologo", "nombre", "filosofia", "nacion", "comienzo"];

// Fondo cinemático por escena. Si la imagen no existe, el degradado base hace de
// fallback (el <img> de fondo simplemente no carga y no rompe nada).
const SCENE_BG = "/img/modo-carrera/onboarding-bg.webp";

function buildOpeningNarrative(name: string, nationName: string, philName: string): NarrativeEntry {
  return {
    id: `op-${Date.now()}`,
    kind: "titular",
    body: `Nace una era: ${name} toma las riendas de ${nationName}. Promete una identidad clara — ${philName.toLowerCase()} — y un sueño: levantar la copa. La historia comienza hoy.`,
    createdAt: new Date().toISOString(),
    chosen: null,
  };
}

export default function OnboardingDT({
  career,
  onChange,
  onFinish,
}: {
  career: CareerState;
  onChange: (next: CareerState) => void;
  onFinish: () => void;
}) {
  const [scene, setScene] = useState<Scene>("prologo");
  const [query, setQuery] = useState("");
  const id = career.identity;
  const idx = ORDER.indexOf(scene);

  const patchIdentity = (patch: Partial<CareerState["identity"]>) =>
    onChange({ ...career, identity: { ...career.identity, ...patch }, updatedAt: new Date().toISOString() });

  const nations = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...SELECCIONES].sort((a, b) => (a.rankingFIFA ?? 999) - (b.rankingFIFA ?? 999));
    return q ? list.filter((s) => s.nombre.toLowerCase().includes(q)) : list;
  }, [query]);

  const nationName = SELECCIONES.find((s) => s.slug === id.nationSlug)?.nombre ?? "tu selección";
  const philName = PHILOSOPHIES.find((p) => p.id === id.philosophy)?.name ?? "tu estilo";

  const canNext =
    (scene === "prologo") ||
    (scene === "nombre" && id.name.trim().length >= 2) ||
    (scene === "filosofia" && !!id.philosophy) ||
    (scene === "nacion" && !!id.nationSlug) ||
    (scene === "comienzo");

  const next = () => {
    if (scene === "comienzo") {
      const opening = buildOpeningNarrative(id.name.trim() || "El nuevo DT", nationName, philName);
      onChange({
        ...career,
        identity: { ...career.identity, createdAt: new Date().toISOString() },
        narrative: [opening, ...career.narrative],
        updatedAt: new Date().toISOString(),
      });
      onFinish();
      return;
    }
    setScene(ORDER[idx + 1]);
  };
  const back = () => idx > 0 && setScene(ORDER[idx - 1]);

  // Capítulo (kicker) por escena.
  const KICKER: Record<Scene, string> = {
    prologo: "Prólogo",
    nombre: "Capítulo 1",
    filosofia: "Capítulo 2",
    nacion: "Capítulo 3",
    comienzo: "El comienzo",
  };

  const showCard = scene !== "prologo";

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: BG, color: "#fff", fontFamily: "'Outfit',sans-serif", overflow: "hidden" }}>
      {/* Keyframes (estilo inline, como el resto de la web) */}
      <style>{`
        @keyframes mcFadeUp { from { opacity:0; transform:translateY(24px);} to {opacity:1; transform:translateY(0);} }
        @keyframes mcFadeIn { from { opacity:0;} to {opacity:1;} }
        @keyframes mcPop { 0%{opacity:0; transform:scale(.85);} 60%{transform:scale(1.04);} 100%{opacity:1; transform:scale(1);} }
        @keyframes mcShine { 0%{transform:translateX(-120%);} 100%{transform:translateX(120%);} }
        @keyframes mcFloat { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-10px);} }
        @keyframes mcBarGrow { from { transform:scaleX(0);} to {transform:scaleX(1);} }
        .mc-anim-up { animation: mcFadeUp .7s cubic-bezier(.2,.8,.2,1) both; }
        .mc-anim-in { animation: mcFadeIn .9s ease both; }
        .mc-anim-pop { animation: mcPop .6s cubic-bezier(.2,.8,.2,1) both; }
        .mc-card-reveal { animation: mcPop .8s cubic-bezier(.2,.8,.2,1) both, mcFloat 5s ease-in-out 1s infinite; }
        .mc-delay-1 { animation-delay:.12s; } .mc-delay-2 { animation-delay:.24s; } .mc-delay-3 { animation-delay:.36s; }
      `}</style>

      {/* Fondo cinemático + degradado (fallback si la imagen no existe) */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SCENE_BG} alt="" aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.35 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 30% 20%, rgba(201,168,76,0.16), transparent 55%), linear-gradient(180deg, rgba(6,11,20,0.7), ${BG} 85%)` }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1040, margin: "0 auto", padding: "48px 20px 90px" }}>
        {/* Barra de capítulos */}
        <div style={{ display: "flex", gap: 8, marginBottom: 40, maxWidth: 540 }}>
          {ORDER.map((s, i) => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= idx ? GOLD : "rgba(255,255,255,0.12)", transition: "background .4s" }} />
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: showCard ? "1fr auto" : "1fr", gap: 48, alignItems: "center" }}>
          {/* Columna narrativa */}
          <div key={scene} className="mc-anim-up">
            <span style={{ color: GOLD, fontSize: 12, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase" }}>{KICKER[scene]}</span>

            {scene === "prologo" && (
              <>
                <h1 className="mc-anim-up mc-delay-1" style={{ fontSize: "clamp(34px,6vw,60px)", fontWeight: 900, lineHeight: 1.05, margin: "14px 0 18px" }}>
                  Cada leyenda<br />tiene un <span style={{ color: GOLD }}>comienzo</span>
                </h1>
                <p className="mc-anim-up mc-delay-2" style={{ color: MID, fontSize: 18, lineHeight: 1.75, maxWidth: 560 }}>
                  No naciste con un trofeo en las manos. Naciste con una idea. Hoy te sientas por primera vez en el
                  banquillo de una selección, con un país entero mirándote. Lo que pase a partir de aquí —los títulos,
                  las remontadas, las noches eternas— lo escribes tú. <span style={{ color: GOLD2, fontWeight: 600 }}>Esta es tu historia.</span>
                </p>
              </>
            )}

            {scene === "nombre" && (
              <>
                <h2 className="mc-anim-up mc-delay-1" style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 900, margin: "12px 0 8px" }}>¿Cómo te recordarán?</h2>
                <p className="mc-anim-up mc-delay-2" style={{ color: MID, fontSize: 17, lineHeight: 1.7, marginBottom: 24, maxWidth: 520 }}>
                  El nombre que la prensa gritará en cada portada. El que corearán las gradas. Escríbelo.
                </p>
                <input
                  value={id.name}
                  onChange={(e) => patchIdentity({ name: e.target.value.slice(0, 40) })}
                  placeholder="Nombre del DT"
                  maxLength={40}
                  autoFocus
                  className="mc-anim-up mc-delay-3"
                  style={{ width: "100%", maxWidth: 440, padding: "16px 18px", borderRadius: 12, background: BG2, border: `1px solid ${id.name.trim().length >= 2 ? GOLD : "rgba(255,255,255,0.1)"}`, color: "#fff", fontSize: 19, fontWeight: 600, outline: "none" }}
                />
              </>
            )}

            {scene === "filosofia" && (
              <>
                <h2 className="mc-anim-up mc-delay-1" style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 900, margin: "12px 0 8px" }}>¿En qué crees?</h2>
                <p className="mc-anim-up mc-delay-2" style={{ color: MID, fontSize: 17, lineHeight: 1.7, marginBottom: 22, maxWidth: 520 }}>
                  Todo gran técnico tiene un ADN. El tuyo definirá cómo juega tu equipo y cómo te ve el mundo.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 14 }}>
                  {PHILOSOPHIES.map((p, i) => {
                    const active = id.philosophy === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => patchIdentity({ philosophy: p.id as Philosophy })}
                        className="mc-anim-pop"
                        style={{
                          textAlign: "left", cursor: "pointer", padding: 18, borderRadius: 16, background: BG2,
                          border: `2px solid ${active ? p.accent : "rgba(255,255,255,0.08)"}`,
                          boxShadow: active ? `0 0 0 4px ${p.accent}22, 0 12px 30px ${p.accent}22` : "none",
                          transform: active ? "translateY(-3px)" : "none", transition: "border .2s, box-shadow .2s, transform .2s",
                          color: "#fff", animationDelay: `${i * 0.07}s`,
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
              </>
            )}

            {scene === "nacion" && (
              <>
                <h2 className="mc-anim-up mc-delay-1" style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 900, margin: "12px 0 8px" }}>¿A quién llevarás a la gloria?</h2>
                <p className="mc-anim-up mc-delay-2" style={{ color: MID, fontSize: 17, lineHeight: 1.7, marginBottom: 16, maxWidth: 520 }}>
                  48 naciones sueñan con la copa. Elige la tuya. A partir de hoy, su bandera es la tuya.
                </p>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar selección…"
                  style={{ width: "100%", maxWidth: 360, padding: "12px 16px", borderRadius: 10, background: BG2, border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 15, outline: "none", marginBottom: 16 }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10, maxHeight: 380, overflowY: "auto", paddingRight: 4 }}>
                  {nations.map((s) => {
                    const active = id.nationSlug === s.slug;
                    return (
                      <button
                        key={s.slug}
                        onClick={() => patchIdentity({ nationSlug: s.slug })}
                        style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 12px", borderRadius: 10, background: active ? "rgba(201,168,76,0.14)" : BG2, border: `1.5px solid ${active ? GOLD : "rgba(255,255,255,0.06)"}`, color: "#fff" }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={flagUrl(s.flagCode)} alt={s.nombre} width={28} height={20} style={{ borderRadius: 3, objectFit: "cover", flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.nombre}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {scene === "comienzo" && (
              <>
                <h2 className="mc-anim-up mc-delay-1" style={{ fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, margin: "12px 0 10px" }}>
                  {id.name || "DT"}, el mundo te espera
                </h2>
                <p className="mc-anim-up mc-delay-2" style={{ color: MID, fontSize: 17, lineHeight: 1.75, marginBottom: 22, maxWidth: 540 }}>
                  Asumes el mando de <strong style={{ color: "#fff" }}>{nationName}</strong> con una idea clara:{" "}
                  <strong style={{ color: GOLD2 }}>{philName}</strong>. Empiezas siendo un desconocido (overall 50), pero cada
                  partido, cada decisión y cada titular te acercará a la inmortalidad.
                </p>
                <div className="mc-anim-up mc-delay-3" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {[["50", "Overall inicial"], ["70", "Moral"], ["Amateur", "Rango"]].map(([v, l]) => (
                    <div key={l} style={{ padding: "12px 18px", borderRadius: 12, background: BG3, minWidth: 100 }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: GOLD }}>{v}</div>
                      <div style={{ fontSize: 11, color: DIM }}>{l}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Navegación */}
            <div className="mc-anim-in" style={{ display: "flex", gap: 12, marginTop: 38 }}>
              {idx > 0 && (
                <button onClick={back} style={{ padding: "14px 26px", borderRadius: 12, background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                  Atrás
                </button>
              )}
              <button
                onClick={next}
                disabled={!canNext}
                style={{
                  padding: "15px 34px", borderRadius: 12, border: "none",
                  background: canNext ? `linear-gradient(135deg,${GOLD},${GOLD2})` : "rgba(255,255,255,0.08)",
                  color: canNext ? BG : DIM, fontWeight: 800, fontSize: 15,
                  cursor: canNext ? "pointer" : "not-allowed",
                  boxShadow: canNext ? "0 10px 30px rgba(201,168,76,0.35)" : "none",
                }}
              >
                {scene === "prologo" ? "Comienza tu historia" : scene === "comienzo" ? "Iniciar carrera" : "Continuar"}
              </button>
            </div>
          </div>

          {/* Carta DT (aparece desde el Cap.1) con reveal en la escena final */}
          {showCard && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div className={scene === "comienzo" ? "mc-card-reveal" : "mc-anim-pop"} style={{ position: "relative" }}>
                <FichaDT identity={career.identity} progression={career.progression} />
                {scene === "comienzo" && (
                  <div style={{ position: "absolute", inset: 0, borderRadius: 20, overflow: "hidden", pointerEvents: "none" }}>
                    <div style={{ position: "absolute", top: 0, bottom: 0, width: "60%", background: "linear-gradient(115deg, transparent, rgba(255,255,255,0.5), transparent)", animation: "mcShine 1.6s ease-in-out .4s 1 both" }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
