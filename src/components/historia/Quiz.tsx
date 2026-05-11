// ZonaMundial — Quiz interactivo del Mundial
"use client";

import { useState } from "react";
import type { QuizPregunta } from "@/lib/content/ediciones";

const GOLD = "#c9a84c";

interface Props {
  preguntas: QuizPregunta[];
}

export default function Quiz({ preguntas }: Props) {
  const [actual, setActual] = useState(0);
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const [aciertos, setAciertos] = useState(0);
  const [terminado, setTerminado] = useState(false);
  const [respondidas, setRespondidas] = useState<{ correcta: boolean; idx: number }[]>([]);

  const p = preguntas[actual];
  const ya = seleccion !== null;

  const handleSeleccion = (idx: number) => {
    if (ya) return;
    setSeleccion(idx);
    const correcta = idx === p.correcta;
    if (correcta) setAciertos((a) => a + 1);
    setRespondidas((r) => [...r, { correcta, idx: actual }]);
  };

  const siguiente = () => {
    if (actual + 1 >= preguntas.length) {
      setTerminado(true);
    } else {
      setActual((a) => a + 1);
      setSeleccion(null);
    }
  };

  const reiniciar = () => {
    setActual(0);
    setSeleccion(null);
    setAciertos(0);
    setTerminado(false);
    setRespondidas([]);
  };

  if (terminado) {
    const pct = Math.round((aciertos / preguntas.length) * 100);
    let nivel = "";
    let color = "#94A3B8";
    if (pct >= 90) {
      nivel = "🏆 LEYENDA MUNDIALISTA";
      color = GOLD;
    } else if (pct >= 75) {
      nivel = "⚽ EXPERTO";
      color = "#22C55E";
    } else if (pct >= 50) {
      nivel = "📚 APRENDIZ";
      color = "#3B82F6";
    } else if (pct >= 25) {
      nivel = "🌱 NOVATO";
      color = "#F59E0B";
    } else {
      nivel = "🎓 ESTUDIANTE";
      color = "#94A3B8";
    }

    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">{pct >= 75 ? "🏆" : pct >= 50 ? "⚽" : "📚"}</div>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
          {aciertos}/{preguntas.length}
        </h2>
        <div className="text-base font-bold mb-6" style={{ color }}>
          {nivel} · {pct}%
        </div>
        <div className="max-w-md mx-auto space-y-2 mb-6">
          {respondidas.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2 rounded text-sm"
              style={{ background: r.correcta ? "rgba(34,197,94,0.1)" : "rgba(220,38,38,0.1)" }}
            >
              <span className="tabular-nums text-gray-500">#{i + 1}</span>
              <span style={{ color: r.correcta ? "#22C55E" : "#DC2626" }}>
                {r.correcta ? "✓ Correcta" : "✗ Incorrecta"}
              </span>
              <span className="text-xs text-gray-400 truncate flex-1 text-left">
                {preguntas[i].pregunta.slice(0, 50)}…
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={reiniciar}
          className="px-6 py-3 rounded-lg font-bold text-sm text-[#060B14]"
          style={{ background: "linear-gradient(135deg, #c9a84c, #e8d48b)" }}
        >
          Volver a jugar
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            Pregunta {actual + 1} / {preguntas.length}
          </span>
          <span className="text-[11px] tabular-nums" style={{ color: GOLD }}>
            {aciertos} acierto{aciertos !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${((actual + 1) / preguntas.length) * 100}%`,
              background: `linear-gradient(90deg, ${GOLD}, #e8d48b)`,
            }}
          />
        </div>
      </div>

      {/* Pregunta */}
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 leading-snug">
        {p.pregunta}
      </h2>

      {/* Opciones */}
      <div className="space-y-2 mb-6">
        {p.opciones.map((op, i) => {
          const esCorrecta = i === p.correcta;
          const esSeleccionada = i === seleccion;
          let bg = "#0F1D32";
          let border = "#1E293B";
          let textColor = "#E2E8F0";
          if (ya) {
            if (esCorrecta) {
              bg = "rgba(34,197,94,0.15)";
              border = "#22C55E";
            } else if (esSeleccionada) {
              bg = "rgba(220,38,38,0.15)";
              border = "#DC2626";
              textColor = "#FCA5A5";
            } else {
              textColor = "#64748B";
            }
          }
          return (
            <button
              key={i}
              onClick={() => handleSeleccion(i)}
              disabled={ya}
              className="block w-full text-left p-4 rounded-xl border text-sm font-medium transition-all disabled:cursor-default"
              style={{
                background: bg,
                borderColor: border,
                color: textColor,
              }}
            >
              <span className="tabular-nums opacity-50 mr-3">
                {String.fromCharCode(65 + i)}.
              </span>
              {op}
              {ya && esCorrecta && (
                <span className="float-right" style={{ color: "#22C55E" }}>✓</span>
              )}
              {ya && esSeleccionada && !esCorrecta && (
                <span className="float-right" style={{ color: "#DC2626" }}>✗</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Explicación */}
      {ya && (
        <div
          className="p-4 rounded-xl mb-6"
          style={{
            background: "rgba(201,168,76,0.08)",
            borderLeft: `3px solid ${GOLD}`,
          }}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: GOLD }}>
            Explicación
          </div>
          <p className="text-sm text-gray-200 leading-relaxed">{p.explicacion}</p>
        </div>
      )}

      {/* Siguiente */}
      {ya && (
        <button
          onClick={siguiente}
          className="w-full px-5 py-3 rounded-lg font-bold text-sm text-[#060B14]"
          style={{ background: "linear-gradient(135deg, #c9a84c, #e8d48b)" }}
        >
          {actual + 1 < preguntas.length ? "Siguiente pregunta →" : "Ver resultados →"}
        </button>
      )}
    </div>
  );
}
