"use client";

// Comparativa/pronóstico del modelo de api-football: barras forma/ataque/
// defensa (local vs visitante) + consejo. Datos reales del proveedor (distinto
// del mercado del Latido de probabilidad). Se oculta si no hay datos.

import { useEffect, useState } from "react";

const BG2 = "#0F1D32";
const MID = "#8a94b0";
const DIM = "#6a7a9a";

interface Pred {
  found: boolean;
  comparison?: { form?: [number, number]; att?: [number, number]; def?: [number, number] };
  advice?: string;
}

export default function MatchPrediction({
  matchId,
  home,
  away,
}: {
  matchId: number;
  home: { name: string; color: string };
  away: { name: string; color: string };
}) {
  const [p, setP] = useState<Pred | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/match-center/predictions/${matchId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Pred | null) => { if (alive && d) setP(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, [matchId]);

  const rows: { label: string; v?: [number, number] }[] = [
    { label: "Forma", v: p?.comparison?.form },
    { label: "Ataque", v: p?.comparison?.att },
    { label: "Defensa", v: p?.comparison?.def },
  ].filter((r) => r.v);

  // El "advice" de api-football viene en inglés → no se muestra (off-brand);
  // las barras de comparativa son neutras de idioma.
  if (!p?.found || rows.length === 0) return null;

  return (
    <section style={{ background: BG2, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: DIM, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
        <span>Comparativa · análisis</span>
        <span style={{ color: home.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "35%" }}>{home.name}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((r) => {
          const [h, a] = r.v as [number, number];
          const total = h + a || 1;
          const hp = Math.round((h / total) * 100);
          const ap = 100 - hp;
          return (
            <div key={r.label}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 3 }}>
                <span style={{ fontWeight: 700, color: home.color }}>{hp}%</span>
                <span style={{ color: MID, fontWeight: 600 }}>{r.label}</span>
                <span style={{ fontWeight: 700, color: away.color }}>{ap}%</span>
              </div>
              <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", background: "rgba(255,255,255,0.06)" }}>
                <div style={{ width: `${hp}%`, background: home.color, transition: "width .5s ease" }} />
                <div style={{ width: `${ap}%`, background: away.color, transition: "width .5s ease" }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 8, fontSize: 9, color: DIM, textAlign: "right" }}>Modelo api-football</div>
    </section>
  );
}
