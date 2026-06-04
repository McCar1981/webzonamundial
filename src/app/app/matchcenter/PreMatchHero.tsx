"use client";

// Cabecera de PREVIA del Match Center: se muestra antes del saque (status NS).
// Presenta el partido de forma limpia y atractiva — banderas circulares sobre
// un fondo con los colores de cada selección, cuenta atrás en vivo al saque,
// sede y fase. Sustituye visualmente la cancha "parada" mientras no hay juego.
// SVG-only (sin emojis), igual que el resto de la app.

import { useEffect, useState } from "react";
import type { MatchMeta } from "@/lib/match-center/types";

const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const MID = "#8a94b0";

function flagUrl(code: string): string {
  return `https://flagcdn.com/w160/${code}.png`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function fmtKickoff(iso?: string): { date: string; time: string } | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return {
    date: d.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
    time: d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
  };
}

interface Props {
  meta: MatchMeta;
  kickoff?: string;
  /** Foto de fondo (p.ej. el estadio). Opcional. */
  image?: string;
}

export default function PreMatchHero({ meta, kickoff, image }: Props) {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const ko = fmtKickoff(kickoff);
  const target = kickoff ? new Date(kickoff).getTime() : NaN;
  const diff = Number.isNaN(target) ? NaN : target - now;
  const counting = !Number.isNaN(diff) && diff > 0;

  let h = 0,
    m = 0,
    s = 0;
  if (counting) {
    const total = Math.floor(diff / 1000);
    h = Math.floor(total / 3600);
    m = Math.floor((total % 3600) / 60);
    s = total % 60;
  }

  const homeColor = meta.home.color || GOLD;
  const awayColor = meta.away.color || GOLD;

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.08)",
        marginBottom: 14,
        background: "#0B1825",
      }}
    >
      {/* Foto de fondo (estadio) con velo oscuro para legibilidad */}
      {image && (
        <>
          <img
            src={image}
            alt={[meta.venue, meta.city].filter(Boolean).join(", ")}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.5,
              pointerEvents: "none",
            }}
          />
          <span
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(11,24,37,0.55) 0%, rgba(11,24,37,0.82) 100%)",
              pointerEvents: "none",
            }}
          />
        </>
      )}

      {/* Tintes de color por selección a cada lado */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(100deg, ${homeColor}40 0%, transparent 42%, transparent 58%, ${awayColor}40 100%)`,
          pointerEvents: "none",
        }}
      />
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: -90,
          left: "50%",
          transform: "translateX(-50%)",
          width: 280,
          height: 200,
          background: "radial-gradient(closest-side, rgba(201,168,76,0.18), transparent)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", padding: "20px clamp(12px,4vw,28px) 22px" }}>
        {/* Fase + sede */}
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "5px 14px",
              borderRadius: 999,
              background: "rgba(0,0,0,0.32)",
              border: `1px solid ${GOLD}55`,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: GOLD2,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: GOLD2 }} />
            {meta.phase}
          </span>
          <div style={{ marginTop: 8, fontSize: 12.5, fontWeight: 600, color: MID }}>
            {[meta.venue, meta.city].filter(Boolean).join(", ")}
          </div>
        </div>

        {/* Equipos + cuenta atrás */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "clamp(6px,3vw,20px)",
          }}
        >
          <TeamSide name={meta.home.name} flag={meta.home.flag} color={homeColor} />

          <div style={{ flex: "0 0 auto", textAlign: "center", minWidth: "clamp(120px,40vw,210px)" }}>
            {counting ? (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    gap: "clamp(4px,2vw,10px)",
                  }}
                >
                  <Unit value={pad(h)} label="hrs" />
                  <Colon />
                  <Unit value={pad(m)} label="min" />
                  <Colon />
                  <Unit value={pad(s)} label="seg" />
                </div>
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: GOLD2,
                    textTransform: "capitalize",
                  }}
                >
                  {ko ? `${ko.date} · ${ko.time}h` : "Por comenzar"}
                </div>
              </>
            ) : (
              <>
                <div
                  className="mc-condensed"
                  style={{
                    fontSize: "clamp(20px,6vw,30px)",
                    fontWeight: 700,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: GOLD2,
                  }}
                >
                  A punto de empezar
                </div>
                {ko && (
                  <div style={{ marginTop: 8, fontSize: 12.5, fontWeight: 700, color: MID }}>
                    Saque previsto · {ko.time}h
                  </div>
                )}
              </>
            )}
          </div>

          <TeamSide name={meta.away.name} flag={meta.away.flag} color={awayColor} />
        </div>
      </div>
    </div>
  );
}

function TeamSide({ name, flag, color }: { name: string; flag: string; color: string }) {
  return (
    <div
      style={{
        flex: "1 1 0",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
      }}
    >
      <img
        src={flagUrl(flag)}
        alt={name}
        style={{
          width: "clamp(54px,16vw,82px)",
          height: "clamp(54px,16vw,82px)",
          borderRadius: "50%",
          objectFit: "cover",
          border: `3px solid ${color}`,
          boxShadow: `0 0 0 1px rgba(0,0,0,0.5), 0 8px 22px rgba(0,0,0,0.45)`,
        }}
      />
      <div
        className="mc-condensed"
        style={{
          fontWeight: 700,
          fontSize: "clamp(12px,3.6vw,17px)",
          textAlign: "center",
          textTransform: "uppercase",
          lineHeight: 1.1,
          maxWidth: "100%",
        }}
      >
        {name}
      </div>
    </div>
  );
}

function Unit({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <span
        className="mc-num"
        style={{
          fontSize: "clamp(30px,9vw,48px)",
          fontWeight: 700,
          lineHeight: 1,
          color: "#fff",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
      <span
        style={{
          marginTop: 5,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          color: MID,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function Colon() {
  return (
    <span
      className="mc-num"
      style={{
        fontSize: "clamp(24px,7vw,40px)",
        fontWeight: 700,
        lineHeight: 1,
        color: GOLD,
        opacity: 0.55,
      }}
    >
      :
    </span>
  );
}
