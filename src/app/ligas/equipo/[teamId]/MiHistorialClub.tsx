"use client";

// Tu relación con ESTE club: cuántos de sus partidos has predicho y cómo te ha
// ido. Va en cliente porque la ficha del club es ISR (misma página cacheada
// para todos), así que nada personal puede renderizarse en el servidor.
//
// Silencioso por diseño: si eres invitado, no tienes ninguna predicción de este
// club o falla la petición, no se pinta NADA. Una tarjeta vacía de "0 de 0" no
// aporta y ensucia la ficha.

import { useEffect, useState } from "react";

const GOLD = "#c9a84c";
const DIM = "#a69a82";
const VERDE = "#3fbf6a";

interface Balance {
  authed: boolean;
  total: number;
  aciertos: number;
  fallos: number;
  pendientes: number;
  sinPredecir: number;
}

export default function MiHistorialClub({ fixtureIds, clubName }: { fixtureIds: number[]; clubName: string }) {
  const [bal, setBal] = useState<Balance | null>(null);

  useEffect(() => {
    if (fixtureIds.length === 0) return;
    let vivo = true;
    fetch(`/api/ligas/mis-predicciones-club?fixtures=${fixtureIds.join(",")}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (vivo && d?.authed) setBal(d); })
      .catch(() => { /* silencioso: la ficha funciona sin esto */ });
    return () => { vivo = false; };
  }, [fixtureIds]);

  if (!bal || bal.total === 0) return null;

  const resueltas = bal.aciertos + bal.fallos;
  const pct = resueltas > 0 ? Math.round((bal.aciertos / resueltas) * 100) : null;

  return (
    <section style={{ marginTop: 20, padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, marginBottom: 8 }}>
        Tu historial con {clubName}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
          {bal.total} {bal.total === 1 ? "predicción" : "predicciones"}
        </span>
        {pct !== null && (
          <span style={{ fontSize: 13, fontWeight: 700, color: pct >= 50 ? VERDE : DIM }}>
            {bal.aciertos} de {resueltas} acertadas · {pct}%
          </span>
        )}
      </div>
      {(bal.pendientes > 0 || bal.sinPredecir > 0) && (
        <div style={{ fontSize: 12, color: DIM, marginTop: 6 }}>
          {bal.pendientes > 0 && <>{bal.pendientes} sin resolver</>}
          {bal.pendientes > 0 && bal.sinPredecir > 0 && " · "}
          {bal.sinPredecir > 0 && <>{bal.sinPredecir} {bal.sinPredecir === 1 ? "partido" : "partidos"} que aún puedes predecir</>}
        </div>
      )}
    </section>
  );
}
