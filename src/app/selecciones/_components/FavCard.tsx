// FavCard — card editorial de favorito con bandera fullbleed.
// Modo hero (con pull-quote, sin meta-grid) o normal (con meta-grid).

"use client";

import Link from "next/link";
import type { Seleccion } from "@/data/selecciones";
import { getConfedConfig } from "./confed-config";
import { POWER_INDEX, QUOTES, getFifaTrend, getTitlesFromMejor } from "./team-meta";
import Sparkline from "./Sparkline";
import PowerBar from "./PowerBar";
import PullQuote from "./PullQuote";
import styles from "../selecciones.module.css";

interface FavCardProps {
  team: Seleccion;
  isHero?: boolean;
  onClick?: () => void;
  labels: {
    grupo: string;
    mundiales: string;
    mejor: string;
    powerIndex: string;
    twelveMonth: string;
  };
}

const FLAG_LARGE = (code: string, sz: number) => `https://flagcdn.com/w${sz}/${code}.png`;

export default function FavCard({ team, isHero = false, onClick, labels }: FavCardProps) {
  const cf = getConfedConfig(team.confederacion);
  const power = POWER_INDEX[team.slug] ?? 0;
  const quote = QUOTES[team.slug];
  const fifaRank = team.rankingFIFA ?? 999;
  const trend = getFifaTrend(team.slug, fifaRank);
  const trendDelta = trend[0] - trend[trend.length - 1]; // positivo = mejora ranking
  const titles = getTitlesFromMejor(team.mejorResultado);
  const flagCode = team.flagCode ?? team.slug;

  const className = `${styles.favCard} ${isHero ? styles.favCardHero : ""}`;

  const Inner = (
    <>
      <div
        className={styles.flagBg}
        style={{ backgroundImage: `url(${FLAG_LARGE(flagCode, 1280)})` }}
      />
      <div className={styles.topRow}>
        <span
          className={styles.confTag}
          style={{ borderColor: `${cf.color}66`, color: cf.color }}
        >
          <span className={styles.dot} style={{ background: cf.color }} />
          {cf.name}
        </span>
        <span>
          {labels.grupo} {team.grupo}
        </span>
      </div>

      {isHero && quote && <PullQuote text={quote.text} source={quote.source} />}

      <div className={styles.cardBottom}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.flagImg}
          src={FLAG_LARGE(flagCode, isHero ? 320 : 160)}
          alt=""
          loading="lazy"
        />
        <div className={styles.name}>{team.nombre}</div>
        <div className={styles.bigstat}>
          <span className={styles.hash}>#</span>
          {team.rankingFIFA ?? "—"}
          {titles > 0 && (
            <sup>
              x{titles} {titles > 1 ? "mundiales" : "mundial"}
            </sup>
          )}
        </div>

        {power > 0 && (
          <PowerBar pct={power} color={cf.color} label={labels.powerIndex} />
        )}

        <div className={styles.sparkRow}>
          <Sparkline data={trend} color={cf.color} height={isHero ? 36 : 24} />
          <span
            className={`${styles.delta} ${
              trendDelta > 0 ? styles.deltaUp : trendDelta < 0 ? styles.deltaDn : ""
            }`}
          >
            {trendDelta > 0 ? "↑" : trendDelta < 0 ? "↓" : "→"} {Math.abs(trendDelta) || "–"}
            <em>{labels.twelveMonth}</em>
          </span>
        </div>

        {!isHero && (
          <div className={styles.metaGrid}>
            <div className={styles.cell}>
              <div className={styles.lbl}>{labels.mundiales}</div>
              <div className={styles.vl}>{team.mundiales}</div>
            </div>
            <div className={styles.cell}>
              <div className={styles.lbl}>{labels.mejor}</div>
              <div className={styles.vl}>{team.mejorResultado}</div>
            </div>
          </div>
        )}
      </div>
    </>
  );

  if (isHero) {
    return (
      <Link
        href={`/selecciones/${team.slug}`}
        className={className}
        style={{ ["--accent" as string]: cf.color, textDecoration: "none", color: "inherit" } as React.CSSProperties}
      >
        {Inner}
      </Link>
    );
  }
  return (
    <div
      className={className}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`Promover ${team.nombre} a hero`}
    >
      {Inner}
    </div>
  );
}
