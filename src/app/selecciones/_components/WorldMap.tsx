// WorldMap — mapa mundi de puntos con 48 pins coloreados por confederación.
// Tooltip al hover, click filtra. SVG inline.

"use client";

import { useMemo, useRef, useState } from "react";
import { SELECCIONES, type Seleccion } from "@/data/selecciones";
import { CONFEDS, CONFED_KEYS, getConfedConfig, type ConfedKey } from "./confed-config";
import { TEAM_COORDS, isFavorite, isHost } from "./team-meta";
import { WORLD_DOTS, projectEquirectangular } from "./worldmap-data";
import styles from "../selecciones.module.css";

interface PinTeam {
  slug: string;
  nombre: string;
  conf: ConfedKey;
  fifa: number | null;
  grupo: string;
  mundiales: number;
  best: string;
  x: number;
  y: number;
  isHost: boolean;
  isFav: boolean;
}

interface WorldMapProps {
  filter: ConfedKey | null;
  onFilter: (c: ConfedKey | null) => void;
  labels: {
    fifaWc: string;
    hostsBadge: string;
    coords: string;
    teamsBadge: string;
  };
  tooltipLabels: {
    fifa: string;
    grupo: string;
    mundiales: string;
    mejor: string;
  };
}

export default function WorldMap({ filter, onFilter, labels, tooltipLabels }: WorldMapProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<PinTeam | null>(null);

  // Genera la lista de pins ubicados (solo equipos con coords)
  const pins = useMemo<PinTeam[]>(() => {
    return SELECCIONES.flatMap((s: Seleccion) => {
      const coords = TEAM_COORDS[s.slug];
      if (!coords) return [];
      const p = projectEquirectangular(coords.lon, coords.lat);
      const conf = (s.confederacion as ConfedKey) || "UEFA";
      return [{
        slug: s.slug,
        nombre: s.nombre,
        conf,
        fifa: s.rankingFIFA ?? null,
        grupo: s.grupo,
        mundiales: s.mundiales,
        best: s.mejorResultado,
        x: p.x,
        y: p.y,
        isHost: isHost(s.slug),
        isFav: isFavorite(s.slug),
      }];
    });
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const k of CONFED_KEYS) c[k] = 0;
    for (const p of pins) c[p.conf] = (c[p.conf] ?? 0) + 1;
    return c;
  }, [pins]);

  const handleLegendClick = (k: ConfedKey) => {
    onFilter(filter === k ? null : k);
  };

  return (
    <div className={styles.worldmapWrap} ref={wrapRef}>
      <span className={styles.labelTl}>{labels.fifaWc}</span>
      <span className={styles.labelTr}>{labels.hostsBadge}</span>
      <span className={styles.labelBl}>{labels.coords}</span>
      <span className={styles.labelBr}>● {labels.teamsBadge}</span>

      <svg
        className={styles.worldmap}
        viewBox="0 0 1440 720"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Mapa mundi con las 48 selecciones del Mundial 2026"
      >
        <defs>
          <radialGradient id="zm-pin-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.6" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Graticule */}
        {[-60, -30, 0, 30, 60].map((lat) => (
          <line
            key={`h${lat}`}
            x1="0"
            x2="1440"
            y1={((90 - lat) / 180) * 720}
            y2={((90 - lat) / 180) * 720}
            stroke="rgba(255,255,255,0.04)"
            strokeDasharray="2 6"
          />
        ))}
        {[-120, -60, 0, 60, 120].map((lon) => (
          <line
            key={`v${lon}`}
            y1="0"
            y2="720"
            x1={((lon + 180) / 360) * 1440}
            x2={((lon + 180) / 360) * 1440}
            stroke="rgba(255,255,255,0.04)"
            strokeDasharray="2 6"
          />
        ))}

        {/* Land dots */}
        {WORLD_DOTS.map((d, i) => {
          const p = projectEquirectangular(d.lon, d.lat);
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="2.4"
              fill="rgba(255,255,255,0.10)"
            />
          );
        })}

        {/* Pins */}
        {pins.map((p) => {
          const dim = filter !== null && p.conf !== filter;
          const c = CONFEDS[p.conf].color;
          return (
            <g
              key={p.slug}
              className={styles.pin}
              style={{ color: c, opacity: dim ? 0.15 : 1, transition: "opacity 300ms" }}
              transform={`translate(${p.x} ${p.y})`}
              onMouseEnter={() => setHover(p)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onFilter(p.conf === filter ? null : p.conf)}
            >
              <circle r="14" fill="url(#zm-pin-halo)" />
              <circle r="6" stroke={c} strokeWidth="0.8" fill="none" opacity="0.6" />
              <circle r="3.2" fill={c} />
              {(p.isHost || p.isFav) && (
                <circle r="5" fill="none" stroke={c} strokeWidth="0.8" opacity="0.9" />
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hover && wrapRef.current && (() => {
        const rect = wrapRef.current.getBoundingClientRect();
        const tx = (hover.x / 1440) * rect.width;
        const ty = (hover.y / 720) * rect.height;
        const cf = getConfedConfig(hover.conf);
        return (
          <div
            className={`${styles.worldmapTip} ${styles.on}`}
            style={{ left: tx, top: ty }}
            role="tooltip"
          >
            <span
              className={styles.confPill}
              style={{ background: cf.colorSoft, color: cf.color }}
            >
              {hover.conf}
            </span>
            <div className={styles.tipName}>{hover.nombre}</div>
            <div className={styles.tipRow}>
              <span>{tooltipLabels.fifa}</span>
              <span>#{hover.fifa ?? "—"}</span>
            </div>
            <div className={styles.tipRow}>
              <span>{tooltipLabels.grupo}</span>
              <span>{hover.grupo}</span>
            </div>
            <div className={styles.tipRow}>
              <span>{tooltipLabels.mundiales}</span>
              <span>{hover.mundiales}</span>
            </div>
            <div className={styles.tipRow}>
              <span>{tooltipLabels.mejor}</span>
              <span>{hover.best}</span>
            </div>
          </div>
        );
      })()}

      {/* Legend */}
      <div className={styles.mapLegend}>
        {CONFED_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            className={`${styles.item} ${filter !== null && filter !== k ? styles.dim : ""}`}
            onClick={() => handleLegendClick(k)}
            aria-pressed={filter === k}
          >
            <span className={styles.swatch} style={{ background: CONFEDS[k].color }} />
            <span className={styles.nm}>{CONFEDS[k].name}</span>
            <span className={styles.ct}>· {counts[k]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
