// src/app/app/modo-carrera/jugar/LegacyView.tsx
// Pilar 7 — Legado DT. Vitrina de trofeos (con reveal a pantalla completa al
// pulsar o al ganar uno nuevo), récords permanentes con count-up y un botón para
// compartir el legado. Los assets de trofeo llegan con fallback (copa dorada).
// SVG-only, sin emojis.

"use client";

import { useEffect, useState } from "react";
import { BG2, BG3, GOLD, GOLD2, MID, DIM } from "./fx";
import TrophyReveal from "./TrophyReveal";
import { SELECCIONES } from "@/data/selecciones";
import type { CareerState, Trophy } from "@/lib/modo-carrera/types";

const TROPHY_IMG = "/img/modo-carrera/trofeos/trofeo-mundial.webp";

// Elegimos la imagen del trofeo por palabras clave del nombre (no hay subtipo
// en los datos). Por defecto, la copa del Mundial.
function trophyImg(name: string): string {
  const t = name.toLowerCase();
  if (/grupo|fase de grupos/.test(t)) return "/img/modo-carrera/trofeos/trofeo-grupos.webp";
  if (/octavo|cuarto|eliminator|fase final/.test(t)) return "/img/modo-carrera/trofeos/trofeo-octavos.webp";
  return TROPHY_IMG;
}

/** Cuenta animada de 0 al valor al montar. */
function useCountUp(target: number, ms = 900): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (target <= 0) { setV(0); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  const shown = useCountUp(value);
  return (
    <div style={{ padding: 14, borderRadius: 12, background: BG3, textAlign: "center" }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: accent ?? "#fff" }}>{shown}</div>
      <div style={{ fontSize: 11, color: DIM, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700, marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default function LegacyView({ career, paseDT = false }: { career: CareerState; paseDT?: boolean }) {
  const { legacy } = career;
  const { records } = legacy;
  // Re-ver la celebración al pulsar un trofeo de la vitrina. El auto-reveal al
  // GANAR uno nuevo lo dispara CareerGame (vale en cualquier pestaña).
  const [reveal, setReveal] = useState<Trophy | null>(null);
  // Confirmación de copia inline (antes era un alert() que bloqueaba la página).
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(t);
  }, [copied]);

  const share = async () => {
    const nation = SELECCIONES.find((s) => s.slug === career.identity.nationSlug)?.nombre ?? "su selección";
    const text =
      `Mi legado como DT en ZonaMundial — ${career.identity.name || "DT"} al mando de ${nation}: ` +
      `overall ${career.progression.overall}, ${legacy.trophies.length} trofeo(s), ` +
      `${records.wins}V-${records.draws}E-${records.losses}D en ${records.matchesPlayed} partidos.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Mi legado DT — ZonaMundial", text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
      }
    } catch {
      /* el usuario canceló el diálogo de compartir */
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <style>{`
        .mc-vitrina {
          background-image: linear-gradient(180deg, rgba(20,17,10,0.82), rgba(0,0,0,0.94)), url('/img/modo-carrera/trofeos/vitrina-bg.webp');
          background-size: cover; background-position: center;
        }
        @media (max-width: 640px) {
          .mc-vitrina {
            background-image: linear-gradient(180deg, rgba(20,17,10,0.82), rgba(0,0,0,0.94)), url('/img/modo-carrera/trofeos/vitrina-bg-mobile.webp');
          }
        }
      `}</style>
      {reveal && <TrophyReveal trophy={reveal} paseDT={paseDT} onClose={() => setReveal(null)} />}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>Legado</h2>
          <p style={{ fontSize: 13, color: MID, marginTop: 4 }}>Tu huella como director técnico a lo largo de las temporadas.</p>
        </div>
        <button
          type="button"
          onClick={share}
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            border: `1px solid ${copied ? "#22c55e" : GOLD}`,
            background: copied ? "rgba(34,197,94,0.12)" : "rgba(201,168,76,0.12)",
            color: copied ? "#22c55e" : GOLD2,
            fontWeight: 800,
            fontSize: 13.5,
            cursor: "pointer",
          }}
        >
          {copied ? "Copiado al portapapeles" : "Compartir mi legado"}
        </button>
      </div>

      {/* Vitrina de trofeos */}
      <div
        className="mc-vitrina"
        style={{
          position: "relative",
          overflow: "hidden",
          padding: 18,
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.05)",
          marginBottom: 16,
        }}
      >
        <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: GOLD, marginBottom: 14, position: "relative" }}>Vitrina</h3>
        {legacy.trophies.length === 0 ? (
          <div style={{ color: DIM, fontSize: 14, padding: "20px 0", textAlign: "center" }}>
            La vitrina está vacía. Gana torneos para llenarla de gloria.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 14 }}>
            {legacy.trophies.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setReveal(t)}
                title="Ver celebración"
                style={{ padding: 16, borderRadius: 12, background: BG3, textAlign: "center", border: `1px solid ${GOLD}33`, cursor: "pointer", color: "#fff" }}
              >
                <div aria-hidden style={{ position: "relative", width: 54, height: 54, margin: "0 auto 10px" }}>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      background: `radial-gradient(circle at 35% 30%, ${GOLD2}, ${GOLD} 60%, #8a6f28)`,
                      boxShadow: "0 6px 18px rgba(201,168,76,0.35)",
                    }}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={trophyImg(t.name)}
                    alt=""
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>Temporada {t.season}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Récords */}
      <div style={{ padding: 18, borderRadius: 16, background: BG2, border: "1px solid rgba(255,255,255,0.05)" }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: GOLD, marginBottom: 14 }}>Récords</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(96px,1fr))", gap: 10 }}>
          <Stat label="Partidos" value={records.matchesPlayed} />
          <Stat label="Victorias" value={records.wins} accent={GOLD2} />
          <Stat label="Empates" value={records.draws} />
          <Stat label="Derrotas" value={records.losses} />
          <Stat label="GF" value={records.goalsFor} />
          <Stat label="GC" value={records.goalsAgainst} />
          <Stat label="Títulos" value={records.titlesWon} accent={GOLD2} />
        </div>
      </div>
    </div>
  );
}
