"use client";

// src/app/que-necesita-cada-seleccion-mundial-2026/ConsultaSeleccion.tsx
//
// Selector de selección: el usuario elige su país y ve, en una tarjeta, qué
// necesita para PASAR a dieciseisavos y para quedar 1º, su último partido y sus
// posibles cruces. Resuelve la intención #1 ("¿pasa mi selección?") sin obligar
// a recorrer los 12 grupos. Todos los textos vienen calculados (seguros) del
// servidor; la isla solo muestra el del país elegido.

import { useMemo, useState } from "react";

const GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#a69a82", DIM = "#6e6552", GREEN = "#22c55e", AMBER = "#e8a33d", RED = "#ef6a6a";

type Badge = "primero" | "clasificado" | "decide" | "fuera";

export interface TeamView {
  flag: string; nombre: string; grupo: string;
  pos: number; pj: number; pts: number; gd: number;
  badge: Badge;
  pass: string; first: string;
  rival: string | null; cuando: string | null;
  cruce1: string | null; cruce2: string | null;
}

const BADGE: Record<Badge, { txt: string; color: string }> = {
  primero: { txt: "1º asegurado", color: GOLD2 },
  clasificado: { txt: "Clasificado", color: GREEN },
  decide: { txt: "Se decide en la última jornada", color: AMBER },
  fuera: { txt: "Top-2 imposible", color: RED },
};

function Flag({ code, size = 24 }: { code: string; size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`} alt="" width={size} height={size * 0.7} loading="lazy" decoding="async" style={{ borderRadius: 3, flexShrink: 0, verticalAlign: "-3px" }} />;
}

export default function ConsultaSeleccion({ teams }: { teams: TeamView[] }) {
  const [flag, setFlag] = useState("");

  // Agrupar por grupo para los <optgroup>, en orden A→L y por posición.
  const byGroup = useMemo(() => {
    const map = new Map<string, TeamView[]>();
    for (const t of teams) {
      if (!map.has(t.grupo)) map.set(t.grupo, []);
      map.get(t.grupo)!.push(t);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.pos - b.pos);
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [teams]);

  const team = teams.find((t) => t.flag === flag) ?? null;
  const b = team ? BADGE[team.badge] : null;

  return (
    <div style={{ border: "1px solid rgba(201,168,76,0.28)", borderRadius: 16, padding: "18px 16px", background: "linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.02))" }}>
      <p style={{ color: GOLD, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, margin: "0 0 6px" }}>
        Consulta tu selección
      </p>
      <p style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: "0 0 12px", lineHeight: 1.2 }}>
        Elige tu equipo y mira qué necesita
      </p>

      <label htmlFor="sel-equipo" style={{ display: "block", fontSize: 12, color: DIM, marginBottom: 6 }}>Selección</label>
      <select
        id="sel-equipo"
        value={flag}
        onChange={(e) => setFlag(e.target.value)}
        style={{
          width: "100%", maxWidth: 360, fontFamily: "inherit", fontSize: 16, fontWeight: 600,
          color: "#fff", background: "#0a0906", border: `1px solid ${GOLD}`, borderRadius: 12,
          padding: "12px 14px", appearance: "none", cursor: "pointer", touchAction: "manipulation",
        }}
      >
        <option value="">Elige tu selección…</option>
        {byGroup.map(([letra, arr]) => (
          <optgroup key={letra} label={`Grupo ${letra}`}>
            {arr.map((t) => (
              <option key={t.flag} value={t.flag}>{t.nombre}</option>
            ))}
          </optgroup>
        ))}
      </select>

      {team && b && (
        <div style={{ marginTop: 16, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "16px", background: "rgba(255,255,255,0.02)" }}>
          {/* Cabecera */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <Flag code={team.flag} size={34} />
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, color: "#fff", fontSize: 20, fontWeight: 800, lineHeight: 1.1 }}>{team.nombre}</p>
              <p style={{ margin: "2px 0 0", color: DIM, fontSize: 12.5 }}>
                Grupo {team.grupo} · {team.pos}º · {team.pts} pts · DG {team.gd > 0 ? `+${team.gd}` : team.gd}
              </p>
            </div>
            <span style={{ marginLeft: "auto", color: b.color, fontWeight: 800, fontSize: 13, border: `1px solid ${b.color}`, borderRadius: 999, padding: "4px 12px", whiteSpace: "nowrap" }}>
              {b.txt}
            </span>
          </div>

          {/* Qué necesita */}
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            <div>
              <p style={{ margin: "0 0 3px", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: GREEN, fontWeight: 700 }}>
                Para pasar a dieciseisavos
              </p>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: "#fff" }}>{team.pass}</p>
            </div>
            <div>
              <p style={{ margin: "0 0 3px", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD2, fontWeight: 700 }}>
                Para quedar primera de grupo
              </p>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: "#fff" }}>{team.first}</p>
            </div>
          </div>

          {/* Último partido + cruces */}
          {(team.rival || team.cruce1 || team.cruce2) && (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.07)", display: "grid", gap: 6, fontSize: 13, color: MID }}>
              {team.rival && (
                <div><b style={{ color: "#fff" }}>Último partido:</b> vs {team.rival}{team.cuando ? ` · ${team.cuando}` : ""}</div>
              )}
              {(team.cruce1 || team.cruce2) && (
                <div>
                  <b style={{ color: "#fff" }}>Cruce en dieciseisavos:</b>{" "}
                  {team.cruce1 ? <>si queda 1º → <b style={{ color: GOLD2 }}>{team.cruce1}</b></> : null}
                  {team.cruce1 && team.cruce2 ? " · " : ""}
                  {team.cruce2 ? <>si queda 2º → <b style={{ color: GOLD2 }}>{team.cruce2}</b></> : null}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
