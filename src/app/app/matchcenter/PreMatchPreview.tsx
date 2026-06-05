"use client";

// Previa editorial del amistoso Portugal-Chile. Texto redactado con cuidado:
// solo afirma hechos verificables (Portugal, campeón de Europa 2016 y de la
// UEFA Nations League 2019; Chile, bicampeón de la Copa América en 2015 y 2016)
// y enmarca el choque como partido de preparación, sin inventar alineaciones,
// resultados ni historiales.

import { useState } from "react";

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
            Portugal–Chile: ensayo de preparación con la mira en 2026
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
        <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 15, lineHeight: 1.65, color: "#d7deec", marginTop: 14 }}>
          <p style={{ margin: 0 }}>
            Portugal y Chile se miden en un amistoso de preparación: no hay
            puntos en juego, pero sí la ocasión de dar continuidad al proyecto,
            repartir minutos y afinar automatismos de cara a la próxima cita
            mundialista.
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: GOLD2 }}>Portugal</strong>, campeona de
            Europa en 2016 y de la UEFA Nations League en 2019, llega con su
            habitual caudal ofensivo. Un amistoso así sirve sobre todo para
            medir variantes —la salida de balón, el último pase, las
            alternativas en ataque— y para calibrar el punto físico tras el
            cierre de la temporada de clubes.
          </p>
          <p style={{ margin: 0 }}>
            Enfrente, <strong style={{ color: GOLD2 }}>Chile</strong>,
            bicampeón de la Copa América (2015 y 2016). Una selección de
            tradición competitiva y carácter, de las que obligan a tener
            paciencia y a no perder la concentración. Para La Roja chilena,
            medirse a una potencia europea es un examen de nivel y un termómetro
            de su recambio generacional.
          </p>
          <p style={{ margin: 0 }}>
            Tres claves a seguir: la fluidez del once, el ritmo competitivo en
            un partido sin presión de resultado y la respuesta defensiva ante
            las transiciones rivales.
          </p>

          <p style={{ margin: "4px 0 0", fontSize: 11, color: DIM, lineHeight: 1.5 }}>
            Previa editorial con fines informativos; las alineaciones y novedades
            se confirman antes del saque.
          </p>
        </div>
      )}
    </section>
  );
}
