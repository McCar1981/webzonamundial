"use client";

// src/app/que-necesita-cada-seleccion-mundial-2026/EscenariosSimulador.tsx
//
// Simulador interactivo de la última jornada. El usuario ajusta los marcadores
// de los partidos pendientes de un grupo y la tabla se reordena al instante con
// el MOTOR DE DESEMPATES FIFA REAL (standingsOrder, el mismo de /grupos), así
// que responde "qué necesita cada selección" sin afirmar prosa que pueda fallar.
// 100% client-side: standings.ts es puro (solo MATCHES estático + un LiveMap).

import { useMemo, useState } from "react";
import Link from "next/link";
import { standingsOrder, type TeamMeta } from "@/lib/grupos/standings";
import type { LiveMap } from "@/lib/calendario/live";

const GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a", GREEN = "#22c55e", AMBER = "#e8a33d", RED = "#ef6a6a";

interface FinalView { i: number; hf: string; hn: string; af: string; an: string; sede: string; fecha: string; jugado: boolean; }
interface CruceDest { rival: string; sede: string; fecha: string; }
export interface SimGroup {
  letra: string;
  teams: TeamMeta[];
  live: LiveMap;                 // resultados reales (forma {s,sc})
  finals: FinalView[];           // partidos de la última jornada
  cruces: { primero: CruceDest | null; segundo: CruceDest | null };
}

function Flag({ code }: { code: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`https://flagcdn.com/w20/${code.toLowerCase()}.png`} alt="" width={20} height={14} loading="lazy" decoding="async" style={{ borderRadius: 2, flexShrink: 0, verticalAlign: "-2px" }} />;
}

const TH: React.CSSProperties = { textAlign: "center", padding: "8px 6px", fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: DIM, fontWeight: 700 };
const TD: React.CSSProperties = { textAlign: "center", padding: "9px 6px", fontSize: 13.5, color: MID };

export default function EscenariosSimulador({ groups }: { groups: SimGroup[] }) {
  const [sel, setSel] = useState(groups[0]?.letra ?? "A");
  // Marcadores simulados por grupo→partido. Inicial: real si jugado, si no 0-0.
  const [scores, setScores] = useState<Record<string, Record<number, [number, number]>>>(() => {
    const init: Record<string, Record<number, [number, number]>> = {};
    for (const g of groups) {
      init[g.letra] = {};
      for (const f of g.finals) {
        const real = f.jugado && g.live[f.i] ? g.live[f.i].sc : null;
        init[g.letra][f.i] = real ? [real[0], real[1]] : [0, 0];
      }
    }
    return init;
  });

  const group = groups.find((g) => g.letra === sel) ?? groups[0];

  const setGoal = (mid: number, side: 0 | 1, delta: number) => {
    setScores((prev) => {
      const cur = prev[sel]?.[mid] ?? [0, 0];
      const next: [number, number] = [cur[0], cur[1]];
      next[side] = Math.max(0, Math.min(19, next[side] + delta));
      return { ...prev, [sel]: { ...prev[sel], [mid]: next } };
    });
  };

  const resetGroup = () => {
    setScores((prev) => {
      const g = group;
      const reset: Record<number, [number, number]> = {};
      for (const f of g.finals) {
        const real = f.jugado && g.live[f.i] ? g.live[f.i].sc : null;
        reset[f.i] = real ? [real[0], real[1]] : [0, 0];
      }
      return { ...prev, [g.letra]: reset };
    });
  };

  // Tabla simulada: motor FIFA real con los marcadores elegidos para las finales.
  const ordered = useMemo(() => {
    const merged: LiveMap = { ...group.live };
    for (const f of group.finals) {
      const sc = scores[group.letra]?.[f.i] ?? [0, 0];
      merged[f.i] = { s: "FT", sc, el: 0 };
    }
    return standingsOrder(group.letra, group.teams, merged).ordered;
  }, [group, scores]);

  const chip = (idx: number) => {
    if (idx <= 1) return { txt: "Clasifica", color: GREEN };
    if (idx === 2) return { txt: "Mejor 3º", color: AMBER };
    return { txt: "Fuera", color: RED };
  };

  return (
    <div style={{ border: "1px solid rgba(201,168,76,0.28)", borderRadius: 16, padding: "18px 16px", background: "linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.02))" }}>
      <p style={{ color: GOLD, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, margin: "0 0 6px" }}>
        Simulador · última jornada
      </p>
      <p style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: "0 0 4px", lineHeight: 1.2 }}>
        Ajusta los marcadores y mira quién pasa
      </p>
      <p style={{ fontSize: 14, lineHeight: 1.55, margin: "0 0 14px" }}>
        Toca los marcadores de la última jornada del grupo y la tabla se reordena al instante con los criterios oficiales (puntos, diferencia de goles, goles a favor y mini-liga).
      </p>

      {/* Selector de grupo */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        {groups.map((g) => (
          <button
            key={g.letra}
            type="button"
            onClick={() => setSel(g.letra)}
            aria-pressed={g.letra === sel}
            style={{
              cursor: "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: 13,
              width: 38, height: 38, borderRadius: 10,
              border: `1px solid ${g.letra === sel ? GOLD : "rgba(255,255,255,0.12)"}`,
              background: g.letra === sel ? "rgba(201,168,76,0.18)" : "rgba(255,255,255,0.03)",
              color: g.letra === sel ? GOLD2 : MID,
            }}
          >
            {g.letra}
          </button>
        ))}
      </div>

      {/* Partidos de la última jornada con steppers */}
      <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
        {group.finals.map((f) => {
          const sc = scores[group.letra]?.[f.i] ?? [0, 0];
          return (
            <div key={f.i} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 12px", background: "rgba(255,255,255,0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff", fontWeight: 600, fontSize: 14 }}>
                  <Flag code={f.hf} /> {f.hn}
                </span>
                <Stepper value={sc[0]} onMinus={() => setGoal(f.i, 0, -1)} onPlus={() => setGoal(f.i, 0, 1)} disabled={f.jugado} />
                <span style={{ color: DIM, fontWeight: 800 }}>–</span>
                <Stepper value={sc[1]} onMinus={() => setGoal(f.i, 1, -1)} onPlus={() => setGoal(f.i, 1, 1)} disabled={f.jugado} />
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff", fontWeight: 600, fontSize: 14 }}>
                  {f.an} <Flag code={f.af} />
                </span>
              </div>
              <div style={{ textAlign: "center", marginTop: 6, fontSize: 11.5, color: DIM }}>
                {f.jugado ? "Resultado final" : "Por jugar · ajusta el marcador"} · {f.sede}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabla simulada */}
      <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 380 }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)" }}>
              <th style={{ ...TH, textAlign: "left", paddingLeft: 12 }}>#</th>
              <th style={{ ...TH, textAlign: "left" }}>Selección</th>
              <th style={TH}>PJ</th>
              <th style={TH}>DG</th>
              <th style={TH}>Pts</th>
              <th style={{ ...TH, textAlign: "right", paddingRight: 12 }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((t, i) => {
              const c = chip(i);
              return (
                <tr key={t.flagCode} style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderLeft: `3px solid ${i <= 1 ? GREEN : i === 2 ? AMBER : "#7f1d1d"}` }}>
                  <td style={{ ...TD, textAlign: "left", paddingLeft: 12, fontWeight: 800, color: i <= 1 ? GREEN : i === 2 ? AMBER : DIM }}>{i + 1}</td>
                  <td style={{ ...TD, textAlign: "left" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "#fff", fontWeight: 600 }}>
                      <Flag code={t.flagCode} /> {t.nombre}
                    </span>
                  </td>
                  <td style={TD}>{t.row.pj}</td>
                  <td style={TD}>{t.row.gd > 0 ? `+${t.row.gd}` : t.row.gd}</td>
                  <td style={{ ...TD, color: "#fff", fontWeight: 800 }}>{t.row.pts}</td>
                  <td style={{ ...TD, textAlign: "right", paddingRight: 12, color: c.color, fontWeight: 700, fontSize: 12 }}>{c.txt}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
        <p style={{ margin: 0, fontSize: 11.5, color: DIM }}>
          <span style={{ color: GREEN }}>■</span> 1º y 2º clasifican · <span style={{ color: AMBER }}>■</span> 3º depende de los{" "}
          <Link href="/grupos/mejores-terceros" style={{ color: GOLD, textDecoration: "none" }}>mejores terceros</Link>
        </p>
        <button type="button" onClick={resetGroup} style={{ cursor: "pointer", fontFamily: "inherit", fontSize: 12, color: GOLD, background: "transparent", border: `1px solid rgba(201,168,76,0.4)`, borderRadius: 8, padding: "6px 12px" }}>
          Reiniciar grupo
        </button>
      </div>

      {/* Posibles cruces del grupo seleccionado */}
      {(group.cruces.primero || group.cruces.segundo) && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ color: GOLD2, fontWeight: 700, fontSize: 14, margin: "0 0 8px" }}>Posibles cruces en dieciseisavos</p>
          <div style={{ display: "grid", gap: 6, fontSize: 13.5, lineHeight: 1.5 }}>
            {group.cruces.primero && (
              <div><b style={{ color: "#fff" }}>Si queda 1º</b> → contra <b style={{ color: GOLD2 }}>{group.cruces.primero.rival}</b> · {group.cruces.primero.sede}</div>
            )}
            {group.cruces.segundo && (
              <div><b style={{ color: "#fff" }}>Si queda 2º</b> → contra <b style={{ color: GOLD2 }}>{group.cruces.segundo.rival}</b> · {group.cruces.segundo.sede}</div>
            )}
          </div>
          <Link href="/dieciseisavos-mundial-2026" style={{ display: "inline-block", marginTop: 10, color: GOLD, textDecoration: "none", fontSize: 13 }}>
            Ver el cuadro completo de dieciseisavos →
          </Link>
        </div>
      )}
    </div>
  );
}

function Stepper({ value, onMinus, onPlus, disabled }: { value: number; onMinus: () => void; onPlus: () => void; disabled?: boolean }) {
  const btn: React.CSSProperties = {
    cursor: disabled ? "default" : "pointer", fontFamily: "inherit", width: 26, height: 30, borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.04)", color: disabled ? DIM : "#fff", fontSize: 16, fontWeight: 700, lineHeight: 1,
  };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {!disabled && <button type="button" aria-label="menos" onClick={onMinus} style={btn}>−</button>}
      <span style={{ minWidth: 22, textAlign: "center", color: "#fff", fontWeight: 800, fontSize: 18 }}>{value}</span>
      {!disabled && <button type="button" aria-label="más" onClick={onPlus} style={btn}>+</button>}
    </span>
  );
}
