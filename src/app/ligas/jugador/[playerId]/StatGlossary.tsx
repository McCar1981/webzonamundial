"use client";

// Leyenda de la nomenclatura de las estadísticas de la ficha de jugador.
// Colapsable (no ensucia por defecto). Explica cada sigla/concepto usado, tanto
// en las tarjetas por competición como en las tablas de carrera.

import { useState } from "react";

const GOLD = "#c9a84c";
const DIM = "#a69a82";
const LINE = "1px solid rgba(255,255,255,0.06)";

const GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: "Partido",
    items: [
      ["PJ · Partidos", "Partidos en los que jugó (titular o suplente)."],
      ["Titularidades", "Partidos que empezó como titular."],
      ["Min", "Minutos jugados."],
      ["Nota", "Nota media del jugador por partido (api-football, escala 0-10; 7+ es una gran actuación)."],
      ["Entró / salió", "Veces que entró desde el banquillo / fue sustituido."],
    ],
  },
  {
    title: "Ataque",
    items: [
      ["G · Goles", "Goles marcados (no incluye los de penalti fallado)."],
      ["A · Asistencias", "Pases que terminan directamente en gol."],
      ["Tiros (a puerta)", "Tiros totales y, entre paréntesis, los que van a puerta."],
      ["Regates (éxito)", "Regates completados / intentados y su porcentaje."],
      ["Penaltis (marcados / fallados)", "Penaltis anotados y errados por el jugador."],
      ["Penaltis provocados", "Penaltis que forzó a favor de su equipo."],
    ],
  },
  {
    title: "Creación",
    items: [
      ["Pases (clave)", "Pases totales y, entre paréntesis, los pases clave (los que generan una ocasión de tiro)."],
      ["Precisión de pase", "Porcentaje de pases completados."],
    ],
  },
  {
    title: "Defensa",
    items: [
      ["Entradas", "Entradas defensivas al rival (tackles)."],
      ["Bloqueos", "Tiros o pases del rival bloqueados."],
      ["Intercepciones", "Balones del rival interceptados."],
      ["Duelos ganados", "Duelos ganados / disputados (aéreos y de suelo) y su porcentaje."],
      ["Regateado (superado)", "Veces que un rival le superó en el regate."],
      ["Faltas (cometidas / recibidas)", "Faltas que hizo y faltas que recibió."],
      ["Penaltis cometidos", "Penaltis que concedió al rival por falta."],
    ],
  },
  {
    title: "Portería",
    items: [
      ["Paradas", "Paradas realizadas por el portero."],
      ["Goles encajados", "Goles recibidos mientras estaba en el campo."],
      ["Penaltis parados", "Penaltis detenidos por el portero."],
    ],
  },
  {
    title: "Disciplina",
    items: [
      ["TA · Amarillas", "Tarjetas amarillas."],
      ["2A · Doble amarilla", "Segunda amarilla en un mismo partido (supone la expulsión)."],
      ["TR · Rojas", "Tarjetas rojas directas."],
    ],
  },
];

export default function StatGlossary() {
  const [open, setOpen] = useState(false);
  return (
    <section style={{ marginTop: 16 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "12px 14px", cursor: "pointer" }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: "#e6decb" }}>¿Qué significa cada estadística?</span>
        <span aria-hidden style={{ color: GOLD, fontSize: 13, transform: open ? "rotate(90deg)" : "none", transition: "transform .15s" }}>&rsaquo;</span>
      </button>

      {open && (
        <div style={{ marginTop: 10 }}>
          {GROUPS.map((g) => (
            <div key={g.title} style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: GOLD, marginBottom: 2 }}>{g.title}</div>
              {g.items.map(([term, desc]) => (
                <div key={term} style={{ padding: "8px 0", borderTop: LINE }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{term}</div>
                  <div style={{ fontSize: 12, color: DIM, marginTop: 1 }}>{desc}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
