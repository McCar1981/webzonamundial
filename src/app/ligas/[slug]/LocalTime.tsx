"use client";

// Formatea un instante ISO (con zona de api-sports) a la ZONA HORARIA DEL USUARIO
// —table-stake de la investigación UX: nada de Eastern Time hardcodeado—. Recibe
// un `fallback` ya formateado en servidor para renderizar lo mismo en SSR y en el
// primer paint del cliente (sin desajuste de hidratación); tras montar, lo
// reemplaza por la hora/fecha local del visitante.

import { useEffect, useState } from "react";

export default function LocalTime({
  iso,
  mode,
  fallback,
}: {
  iso: string;
  mode: "time" | "date";
  fallback: string;
}) {
  const [txt, setTxt] = useState(fallback);

  useEffect(() => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return;
    setTxt(
      mode === "time"
        ? d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })
        : d.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" }),
    );
  }, [iso, mode]);

  return <time dateTime={iso}>{txt}</time>;
}
