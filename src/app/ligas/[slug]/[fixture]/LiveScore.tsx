"use client";

// Centro del marcador del Centro de Partido con AUTO-REFRESCO en vivo: si el
// partido está en juego, sondea /api/ligas/fixture-score (cacheado) cada 20 s y
// actualiza marcador + minuto sin recargar. Para partidos no-en-vivo es estático
// (mismo render que servía el servidor). Sin emojis.

import { useEffect, useRef, useState } from "react";
import LocalTime from "../LocalTime";

const DIM = "#9db0c9";
const FINISHED = new Set(["FT", "AET", "PEN"]);
const LIVE = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"]);

export default function LiveScore({
  fixtureId,
  status: status0,
  elapsed: elapsed0,
  scoreHome: home0,
  scoreAway: away0,
  kickoff,
}: {
  fixtureId: number;
  status: string;
  elapsed: number | null;
  scoreHome: number | null;
  scoreAway: number | null;
  kickoff: string;
}) {
  const [status, setStatus] = useState(status0);
  const [elapsed, setElapsed] = useState(elapsed0);
  const [home, setHome] = useState(home0);
  const [away, setAway] = useState(away0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!LIVE.has(status)) return; // solo se refresca en vivo
    let alive = true;
    const poll = async () => {
      try {
        const r = await fetch(`/api/ligas/fixture-score?fixtureId=${fixtureId}`);
        if (!r.ok) return;
        const j = await r.json();
        if (!alive || !j?.status) return;
        setStatus(j.status);
        setElapsed(j.elapsed ?? null);
        setHome(j.home ?? null);
        setAway(j.away ?? null);
        if (FINISHED.has(j.status) && timer.current) clearInterval(timer.current);
      } catch {
        // reintenta en el siguiente tick
      }
    };
    timer.current = setInterval(poll, 20_000);
    return () => { alive = false; if (timer.current) clearInterval(timer.current); };
  }, [fixtureId, status]);

  const finished = FINISHED.has(status);
  const live = LIVE.has(status);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      {finished || live ? (
        <span style={{ fontSize: 34, fontWeight: 500, fontVariantNumeric: "tabular-nums", color: "#fff" }}>{home ?? 0} - {away ?? 0}</span>
      ) : (
        <span style={{ fontSize: 20, fontWeight: 500, color: "#fff" }}><LocalTime iso={kickoff} mode="time" fallback={kickoff.slice(11, 16)} /></span>
      )}
      <span style={{ fontSize: 11.5, fontWeight: 500, color: live ? "#d85a30" : DIM }}>
        {live ? (elapsed != null ? `EN VIVO ${elapsed}'` : "EN VIVO") : finished ? "Final" : <LocalTime iso={kickoff} mode="date" fallback={kickoff.slice(0, 10)} />}
      </span>
    </div>
  );
}
