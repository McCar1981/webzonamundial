// src/components/grupos/GrupoEditorial.tsx
//
// Bloque editorial al pie de cada /grupos/grupo-X. Lee de GRUPOS_EDITORIAL
// los 7 apartados (intro, contexto, favoritos, sorpresa, partido estrella,
// pronóstico, curiosidad) y los renderiza con estructura semántica.
// Añade ~600 palabras a cada página de grupo.

import Link from "next/link";
import { GRUPOS_EDITORIAL } from "@/data/grupos-editorial";

const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const GOLD3 = "#FDE68A";
const TEXT = "#cbd5e1";
const MUTED = "#94a3b8";
const BORDER = "rgba(201,168,76,0.18)";

interface Props {
  letter: string; // "A", "B", ..., "L"
}

export default function GrupoEditorial({ letter }: Props) {
  const data = GRUPOS_EDITORIAL[letter];
  if (!data) return null;

  return (
    <section
      aria-labelledby={`grupo-${letter.toLowerCase()}-editorial`}
      style={{
        background: "#060B14",
        padding: "60px 20px 50px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <article
        style={{
          maxWidth: 820,
          margin: "0 auto",
          color: TEXT,
          fontSize: 16,
          lineHeight: 1.75,
        }}
      >
        <div
          style={{
            color: GOLD,
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          // Análisis editorial · Grupo {letter}
        </div>

        <h2
          id={`grupo-${letter.toLowerCase()}-editorial`}
          style={{
            color: GOLD2,
            fontSize: "clamp(24px, 4vw, 32px)",
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            margin: "0 0 12px",
          }}
        >
          Grupo {letter}: análisis profundo, favoritos y predicción
        </h2>

        <p style={{ color: MUTED, fontSize: 14, marginBottom: 26 }}>
          Redacción de ZonaMundial · Actualizado el 21 de mayo de 2026 ·
          Lectura ~4 min
        </p>

        <p style={{ fontSize: 18, color: "#e2e8f0", marginBottom: 22 }}>
          {data.intro}
        </p>

        <h3 style={h3}>Contexto: cómo llegan las cuatro selecciones</h3>
        <p>{data.contexto}</p>

        <h3 style={h3}>Favoritos para clasificar</h3>
        <p>{data.favoritos}</p>

        <h3 style={h3}>Posible sorpresa o debutante destacado</h3>
        <p>{data.debutante_o_sorpresa}</p>

        <h3 style={h3}>El partido estrella del grupo</h3>
        <p>{data.partido_estrella}</p>

        <h3 style={h3}>Pronóstico final de clasificación</h3>
        <p>{data.pronostico}</p>

        {data.curiosidad && (
          <div
            style={{
              marginTop: 26,
              padding: "18px 22px",
              border: `1px solid ${BORDER}`,
              borderRadius: 14,
              background:
                "linear-gradient(180deg, rgba(201,168,76,0.04), rgba(11,24,37,0.4))",
            }}
          >
            <p
              style={{
                color: GOLD3,
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: 700,
                marginBottom: 6,
                margin: 0,
              }}
            >
              // Dato curioso
            </p>
            <p style={{ margin: 0, fontSize: 15, color: TEXT }}>
              {data.curiosidad}
            </p>
          </div>
        )}

        <p style={{ marginTop: 26, fontSize: 14, color: MUTED }}>
          Para ver las fichas individuales de cada selección de este grupo,
          visita la{" "}
          <Link href="/selecciones" style={linkGold}>
            sección de las 48 selecciones
          </Link>
          . Para predecir el ganador del grupo y el progreso en la fase
          eliminatoria, usa el{" "}
          <Link href="/bracket" style={linkGold}>Bracket Challenge</Link>{" "}
          o pide{" "}
          <Link href="/bracket" style={linkGold}>análisis al Coach IA</Link>{" "}
          para cualquier partido específico.
        </p>
      </article>
    </section>
  );
}

const h3 = {
  color: GOLD3,
  fontSize: "clamp(19px, 3vw, 24px)",
  fontWeight: 800,
  letterSpacing: "-0.01em",
  marginTop: 26,
  marginBottom: 10,
  lineHeight: 1.25,
};

const linkGold = {
  color: GOLD2,
  textDecoration: "underline",
  textUnderlineOffset: 3,
  textDecorationThickness: 1,
};
