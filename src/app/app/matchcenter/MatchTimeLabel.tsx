"use client";

// Etiqueta de fecha/hora de un partido para la parrilla del hub del Match
// Center, en la HORA LOCAL del usuario (como el Calendario), no en ET cruda.
//
// SSR-safe: en el primer render (servidor y cliente) usa la hora del ESTADIO
// (ET), idéntica en ambos → sin mismatch de hidratación. Tras montar, detecta
// el huso del visitante y re-renderiza en su hora local. Cero layout shift
// (el formato ocupa lo mismo).

import { useEffect, useState } from "react";
import { etToDate, getUserTimezone, SOURCE_TZ } from "@/lib/bracket/match-time";

export default function MatchTimeLabel({
  date,
  time,
  group,
}: {
  date: string;
  time: string;
  group: string;
}) {
  const [tz, setTz] = useState(SOURCE_TZ);
  useEffect(() => {
    setTz(getUserTimezone());
  }, []);

  const grp = group ? ` · Grupo ${group}` : "";
  const abs = etToDate(date, time);
  if (!abs) return <>{date} · {time}{grp}</>;

  const parts = new Intl.DateTimeFormat("es-ES", {
    timeZone: tz,
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(abs);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  const wd = get("weekday").replace(".", "");
  const day = get("day").replace(/^0/, "");
  const mon = get("month").replace(".", "");
  const hh = get("hour");
  const mm = get("minute");
  // Cuando el visitante está en la zona del estadio (ET) marcamos "ET"; si no,
  // es su hora local.
  const suffix = tz === SOURCE_TZ ? " ET" : " · tu hora";

  return (
    <>
      {wd} {day} {mon} · {hh}:{mm}
      {suffix}
      {grp}
    </>
  );
}
