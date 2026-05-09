// TeamCard — card pequeña usada en los carruseles por confederación.
// Bandera 3:2, ranking, stats grid 3-col (Grupo, Mundiales, Mejor), badges host/debut.

"use client";

import Link from "next/link";
import type { Seleccion } from "@/data/selecciones";
import { getConfedConfig } from "./confed-config";
import { isDebutante, isHost } from "./team-meta";
import styles from "../selecciones.module.css";

interface TeamCardProps {
  team: Seleccion;
  labels: {
    grupo: string;
    mundiales: string;
    mejor: string;
    badgeHost: string;
    badgeDebut: string;
  };
}

const FLAG = (code: string, sz: number) => `https://flagcdn.com/w${sz}/${code}.png`;

export default function TeamCard({ team, labels }: TeamCardProps) {
  const cf = getConfedConfig(team.confederacion);
  const flagCode = team.flagCode ?? team.slug;
  const host = isHost(team.slug);
  const debut = isDebutante(team.slug);

  return (
    <Link
      href={`/selecciones/${team.slug}`}
      className={styles.teamCard}
      style={{ ["--c" as string]: cf.color } as React.CSSProperties}
    >
      {(host || debut) && (
        <div className={styles.badges}>
          {host && <span className={`${styles.badge} ${styles.badgeHost}`}>{labels.badgeHost}</span>}
          {debut && <span className={`${styles.badge} ${styles.badgeDebut}`}>{labels.badgeDebut}</span>}
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.flagLarge} src={FLAG(flagCode, 640)} alt="" loading="lazy" />
      <div className={styles.nameRow}>
        <span className={styles.nm}>{team.nombre}</span>
        <span className={styles.rnk}>#{team.rankingFIFA ?? "—"}</span>
      </div>
      <div className={styles.statsRow}>
        <div>
          <div>{labels.grupo}</div>
          <div className={styles.v} style={{ color: cf.color }}>{team.grupo}</div>
        </div>
        <div>
          <div>{labels.mundiales}</div>
          <div className={styles.v}>{team.mundiales}</div>
        </div>
        <div>
          <div>{labels.mejor}</div>
          <div className={styles.v} style={{ fontSize: 12 }}>{team.mejorResultado}</div>
        </div>
      </div>
    </Link>
  );
}
