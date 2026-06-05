"use client";

/**
 * FootballScoreboard
 * ------------------
 * Marcador de fútbol estilo gráfica de retransmisión (broadcast):
 * panel local oscuro + acento rojo, bloque central rojo con el resultado,
 * panel visitante oscuro y panel de tiempo cyan con glow.
 *
 * Totalmente responsive (clamp), reutilizable y con colores configurables
 * por `theme` (CSS variables). Sin librerías externas; CSS en módulo aparte.
 *
 * Ejemplo de uso:
 *
 *   <FootballScoreboard
 *     homeTeam="GER"
 *     awayTeam="MEX"
 *     homeScore={0}
 *     awayScore={1}
 *     matchTime="41:23"
 *     homeFlag="https://flagcdn.com/w80/de.png"
 *     awayFlag="https://flagcdn.com/w80/mx.png"
 *   />
 *
 * Con tema personalizado:
 *
 *   <FootballScoreboard
 *     {...props}
 *     theme={{ resultColor: "#1b8f3a", timeColor: "#ffcc00" }}
 *   />
 */

import type { CSSProperties } from "react";
import styles from "./FootballScoreboard.module.css";

export interface ScoreboardTheme {
  /** Color principal del panel del resultado. */
  resultColor?: string;
  /** Color oscuro del degradado del resultado. */
  resultColorDark?: string;
  /** Color principal del panel de tiempo. */
  timeColor?: string;
  /** Color oscuro del degradado del tiempo. */
  timeColorDark?: string;
  /** Color de fondo de los paneles de equipo. */
  backgroundColor?: string;
  /** Color del acento diagonal izquierdo. */
  accentColor?: string;
  /** Color del texto. */
  textColor?: string;
}

export interface FootballScoreboardProps {
  /** Abreviatura del equipo local, p. ej. "GER". */
  homeTeam: string;
  /** Abreviatura del equipo visitante, p. ej. "MEX". */
  awayTeam: string;
  /**
   * Goles del equipo local. Si se omite (junto con awayScore) el panel
   * central muestra "VS" en vez de un marcador — útil antes del saque,
   * para no aparentar un 0-0 de un partido que aún no ha empezado.
   */
  homeScore?: number | null;
  /** Goles del equipo visitante. Ver homeScore. */
  awayScore?: number | null;
  /**
   * Tiempo de partido a mostrar, p. ej. "41:23", "HT", "FT".
   * Si se omite, el panel de tiempo no se renderiza (útil para
   * marcadores previos al partido o en predicciones).
   */
  matchTime?: string;
  /** URL de la bandera circular del equipo local. */
  homeFlag: string;
  /** URL de la bandera circular del equipo visitante. */
  awayFlag: string;
  /** Sobrescritura opcional de colores. */
  theme?: ScoreboardTheme;
  /** Clase extra para el contenedor (posicionamiento desde fuera). */
  className?: string;
}

/** Mapea el theme a las CSS variables que consume el módulo CSS. */
function themeToCssVars(theme?: ScoreboardTheme): CSSProperties {
  if (!theme) return {};
  const vars: Record<string, string> = {};
  if (theme.resultColor) vars["--fsb-result"] = theme.resultColor;
  if (theme.resultColorDark) vars["--fsb-result-dark"] = theme.resultColorDark;
  if (theme.timeColor) vars["--fsb-time"] = theme.timeColor;
  if (theme.timeColorDark) vars["--fsb-time-dark"] = theme.timeColorDark;
  if (theme.backgroundColor) vars["--fsb-bg"] = theme.backgroundColor;
  if (theme.accentColor) vars["--fsb-accent"] = theme.accentColor;
  if (theme.textColor) vars["--fsb-text"] = theme.textColor;
  return vars as CSSProperties;
}

export default function FootballScoreboard({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  matchTime,
  homeFlag,
  awayFlag,
  theme,
  className,
}: FootballScoreboardProps) {
  const hasScore = homeScore != null && awayScore != null;
  const scoreLabel = hasScore
    ? `${homeTeam} ${homeScore}, ${awayTeam} ${awayScore}`
    : `${homeTeam} contra ${awayTeam}`;
  const ariaLabel = matchTime ? `${scoreLabel}, minuto ${matchTime}` : scoreLabel;

  return (
    <div
      className={`${styles.scoreboard}${className ? ` ${className}` : ""}`}
      style={themeToCssVars(theme)}
      role="img"
      aria-label={ariaLabel}
    >
      {/* Panel local */}
      <div className={`${styles.team} ${styles.home}`}>
        <span className={styles.accent} aria-hidden />
        <span className={styles.flagWrap}>
          <img className={styles.flag} src={homeFlag} alt={`Bandera de ${homeTeam}`} />
        </span>
        <span className={styles.abbr}>{homeTeam}</span>
      </div>

      {/* Panel central del resultado (o "VS" antes del saque) */}
      <div className={styles.result}>
        {hasScore ? (
          <>
            <span className={styles.score}>{homeScore}</span>
            <span className={styles.colon} aria-hidden>
              :
            </span>
            <span className={styles.score}>{awayScore}</span>
          </>
        ) : (
          <span className={styles.vs}>VS</span>
        )}
      </div>

      {/* Panel visitante */}
      <div className={`${styles.team} ${styles.away}`}>
        <span className={styles.flagWrap}>
          <img className={styles.flag} src={awayFlag} alt={`Bandera de ${awayTeam}`} />
        </span>
        <span className={styles.abbr}>{awayTeam}</span>
      </div>

      {/* Panel de tiempo (cyan) — solo si hay matchTime */}
      {matchTime ? (
        <div className={styles.time}>
          <span className={styles.timeText}>{matchTime}</span>
        </div>
      ) : null}
    </div>
  );
}
