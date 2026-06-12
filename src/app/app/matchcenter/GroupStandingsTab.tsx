"use client";

// Pestaña CLASIFICACIÓN del Match Center: la tabla del GRUPO del partido,
// en vivo. Reutiliza el componente TablaClasificacion (motor standingsOrder con
// desempate FIFA) y el feed durable /api/calendario/live. Fuera de fase de
// grupos (amistoso o eliminatoria con equipos por definir) muestra un aviso.

import { useEffect, useState } from "react";
import { SELECCIONES } from "@/data/selecciones";
import TablaClasificacion from "@/components/TablaClasificacion";
import type { LiveMap } from "@/lib/calendario/live";

const MID = "#8a94b0";

export default function GroupStandingsTab({ group }: { group?: string }) {
  const [liveMap, setLiveMap] = useState<LiveMap>({});

  useEffect(() => {
    let alive = true;
    fetch("/api/calendario/live", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : {}))
      .then((m: LiveMap) => { if (alive) setLiveMap(m || {}); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const grupo = (group || "").trim();
  const selecciones = grupo ? SELECCIONES.filter((s) => s.grupo === grupo) : [];

  if (selecciones.length === 0) {
    return (
      <div style={{ background: "#0F1D32", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: "26px 18px", textAlign: "center", color: MID, fontSize: 13.5, lineHeight: 1.6 }}>
        La clasificación se mostrará cuando el partido pertenezca a un grupo del Mundial.
      </div>
    );
  }

  return (
    <TablaClasificacion
      selecciones={selecciones}
      groupColor="#c9a84c"
      liveMap={liveMap}
      caption={`Clasificación · Grupo ${grupo}`}
      href="/grupos"
    />
  );
}
