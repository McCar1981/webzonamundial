"use client";

// Previa editorial del amistoso España-Irak (Riazor). Texto redactado con
// cuidado: solo afirma hechos verificables (España campeona de Europa 2024;
// Irak campeón de Asia 2007; Riazor, casa del Deportivo) y enmarca el choque
// como partido de preparación, sin inventar alineaciones, resultados ni
// historiales. Incluye el crédito de la foto (Wikimedia Commons, CC BY-SA 3.0).

import { useState } from "react";

const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const MID = "#8a94b0";
const DIM = "#6a7a9a";
const BG2 = "#0F1D32";

export default function PreMatchPreview() {
  // Colapsada por defecto para no empujar la cancha hacia abajo.
  const [open, setOpen] = useState(false);

  return (
    <section
      style={{
        background: BG2,
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "14px clamp(14px,4vw,26px)",
        marginBottom: 14,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          width: "100%",
          background: "transparent",
          border: "none",
          padding: "4px 0",
          cursor: "pointer",
          textAlign: "left",
          color: "inherit",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: GOLD2,
              marginBottom: 4,
            }}
          >
            Previa del partido
          </span>
          <span
            className="mc-condensed"
            style={{
              display: "block",
              fontSize: "clamp(16px,4.4vw,24px)",
              fontWeight: 700,
              lineHeight: 1.18,
              color: "#fff",
            }}
          >
            España–Irak: primer ensayo de preparación con la mira en 2026
          </span>
        </div>
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          style={{
            flexShrink: 0,
            transition: "transform .25s ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke={GOLD2}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {!open && (
        <p style={{ margin: "8px 0 0", fontSize: 12.5, color: MID, fontWeight: 600 }}>
          Toca para leer la previa
        </p>
      )}

      {open && (
        <>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 15, lineHeight: 1.65, color: "#d7deec", marginTop: 14 }}>
        <p style={{ margin: 0 }}>
          España, vigente campeona de Europa, abre su ventana de amistosos
          recibiendo a Irak en el Estadio de Riazor. Es un partido de
          preparación: no hay puntos en juego, pero sí la ocasión de dar
          continuidad al proyecto, repartir minutos y afinar automatismos de
          cara a la próxima cita mundialista.
        </p>
        <p style={{ margin: 0 }}>
          La <strong style={{ color: GOLD2 }}>Roja</strong> llega fiel a su
          identidad: posesión, asociación y presión alta para recuperar pronto.
          Un amistoso así sirve sobre todo para medir variantes —la salida de
          balón, el último pase, las alternativas en ataque— y para calibrar el
          punto físico tras el cierre de la temporada de clubes.
        </p>
        <p style={{ margin: 0 }}>
          Enfrente,{" "}
          <strong style={{ color: GOLD2 }}>Irak</strong>, los Leones de
          Mesopotamia, campeones de Asia en 2007. Una selección física,
          ordenada y combativa, de las que obligan a tener paciencia y a no
          perder la concentración. Para el conjunto iraquí, medirse a una
          potencia europea es un examen de nivel y un termómetro de su
          crecimiento.
        </p>
        <p style={{ margin: 0 }}>
          El escenario acompaña: Riazor, casa del Deportivo de La Coruña, es uno
          de los feudos clásicos del fútbol español. Tres claves a seguir: la
          fluidez del once, el ritmo competitivo en un partido sin presión de
          resultado y la respuesta defensiva ante las transiciones rivales.
        </p>
      </div>

      <p style={{ margin: "16px 0 0", fontSize: 11, color: DIM, lineHeight: 1.5 }}>
        Foto del Estadio de Riazor:{" "}
        <a
          href="https://commons.wikimedia.org/wiki/File:Estadio_de_Riazor.A_Corunha.Galiza.jpg"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: MID, textDecoration: "underline" }}
        >
          Albert galiza
        </a>{" "}
        ·{" "}
        <a
          href="https://creativecommons.org/licenses/by-sa/3.0/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: MID, textDecoration: "underline" }}
        >
          CC BY-SA 3.0
        </a>{" "}
        vía Wikimedia Commons. Previa editorial con fines informativos; las
        alineaciones y novedades se confirman antes del saque.
      </p>
        </>
      )}
    </section>
  );
}
