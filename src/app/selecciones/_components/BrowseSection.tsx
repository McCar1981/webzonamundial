// BrowseSection — tabla densa con buscador, chips de filtro y FIFA bar.
// En mobile se transforma en cards verticales.

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SELECCIONES, type Seleccion } from "@/data/selecciones";
import { CONFEDS, CONFED_KEYS, type ConfedKey } from "./confed-config";
import { isDebutante, isHost } from "./team-meta";
import styles from "../selecciones.module.css";

const FLAG = (code: string, sz: number) => `https://flagcdn.com/w${sz}/${code}.png`;
const MAX_FIFA = 110;

interface BrowseSectionProps {
  labels: {
    numTag: string;
    title: string;
    deck: string;
    searchPlaceholder: string;
    todas: string;
    soloAnfitriones: string;
    metaSeleccion: string;
    metaSelecciones: string;
    metaFilter: string;
    metaQuery: string;
    colSeleccion: string;
    colConf: string;
    colGrupo: string;
    colMundiales: string;
    colMejor: string;
    colFifa: string;
    badgeHost: string;
    badgeDebut: string;
  };
}

export default function BrowseSection({ labels }: BrowseSectionProps) {
  const [q, setQ] = useState("");
  const [conf, setConf] = useState<ConfedKey | null>(null);
  const [hostsOnly, setHostsOnly] = useState(false);

  const list = useMemo<Seleccion[]>(() => {
    let out = (SELECCIONES as Seleccion[])
      .slice()
      .sort((a, b) => (a.rankingFIFA ?? 999) - (b.rankingFIFA ?? 999));
    if (conf) out = out.filter((s) => s.confederacion === conf);
    if (hostsOnly) out = out.filter((s) => isHost(s.slug));
    if (q.trim()) {
      const qq = q.toLowerCase().trim();
      out = out.filter(
        (s) =>
          s.nombre.toLowerCase().includes(qq) ||
          s.confederacion.toLowerCase().includes(qq),
      );
    }
    return out;
  }, [q, conf, hostsOnly]);

  const isPlural = list.length !== 1;
  const metaCount = isPlural ? labels.metaSelecciones : labels.metaSeleccion;

  return (
    <section className={styles.section} id="browse">
      <div className={styles.container}>
        <div className={styles.secHead}>
          <span className={styles.numTag}>{labels.numTag}</span>
          <div className={styles.titleBlock}>
            <h2>{labels.title}</h2>
            <p className={styles.deck}>{labels.deck}</p>
          </div>
        </div>

        <div className={styles.browseToolbar}>
          <div className={styles.browseSearch}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              placeholder={labels.searchPlaceholder}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label={labels.searchPlaceholder}
            />
          </div>

          <div className={styles.filterChips}>
            <button
              type="button"
              className={`${styles.chip} ${!conf ? styles.chipOn : ""}`}
              onClick={() => setConf(null)}
            >
              {labels.todas}
            </button>
            {CONFED_KEYS.map((k) => {
              const cf = CONFEDS[k];
              const on = conf === k;
              return (
                <button
                  key={k}
                  type="button"
                  className={`${styles.chip} ${on ? styles.chipOn : ""}`}
                  onClick={() => setConf(on ? null : k)}
                  style={
                    on
                      ? ({
                          background: cf.color,
                          borderColor: cf.color,
                          color: k === "CONMEBOL" || k === "OFC" ? "#0A0A14" : "#fff",
                        } as React.CSSProperties)
                      : undefined
                  }
                >
                  <span className={styles.chipSwatch} style={{ background: cf.color }} />
                  {cf.name}
                </button>
              );
            })}
            <button
              type="button"
              className={`${styles.chip} ${hostsOnly ? styles.chipOn : ""}`}
              onClick={() => setHostsOnly((v) => !v)}
            >
              ★ {labels.soloAnfitriones}
            </button>
          </div>
        </div>

        <div className={styles.browseMeta}>
          <strong>{list.length}</strong> {metaCount}
          {conf && (
            <span>
              {" "}
              · {labels.metaFilter} {conf}
            </span>
          )}
          {q && (
            <span>
              {" "}
              · {labels.metaQuery} &ldquo;{q}&rdquo;
            </span>
          )}
        </div>

        <div className={styles.browseTableWrap}>
          <table className={styles.browseTable}>
            <thead>
              <tr>
                <th aria-label="flag" />
                <th>{labels.colSeleccion}</th>
                <th>{labels.colConf}</th>
                <th>{labels.colGrupo}</th>
                <th>{labels.colMundiales}</th>
                <th>{labels.colMejor}</th>
                <th className={styles.numRight}>{labels.colFifa}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => {
                const cf = CONFEDS[s.confederacion as ConfedKey] ?? CONFEDS.UEFA;
                const fifa = s.rankingFIFA ?? MAX_FIFA;
                const w = ((MAX_FIFA - Math.min(fifa, MAX_FIFA)) / MAX_FIFA) * 100;
                return (
                  <tr key={s.slug} className={styles.browseRow}>
                    <td className={styles.flagCell}>
                      <Link href={`/selecciones/${s.slug}`} aria-label={s.nombre}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={FLAG(s.flagCode ?? s.slug, 80)} alt="" loading="lazy" />
                      </Link>
                    </td>
                    <td className={styles.nmCell}>
                      <Link href={`/selecciones/${s.slug}`}>{s.nombre}</Link>
                      {isHost(s.slug) && (
                        <span className={styles.browseHostBadge}>★ {labels.badgeHost}</span>
                      )}
                      {isDebutante(s.slug) && (
                        <span className={styles.browseDebutBadge}>{labels.badgeDebut}</span>
                      )}
                    </td>
                    <td className={styles.confCell}>
                      <span
                        className={styles.confPillSm}
                        style={{ background: cf.colorSoft, color: cf.color }}
                      >
                        {s.confederacion}
                      </span>
                    </td>
                    <td className={styles.groupCell}>{s.grupo}</td>
                    <td>{s.mundiales}</td>
                    <td className={styles.bestCell}>{s.mejorResultado}</td>
                    <td className={styles.numRight}>
                      <div className={styles.rnkCell}>
                        <div className={styles.rnkBar}>
                          <div
                            className={styles.rnkFill}
                            style={{ width: `${w}%`, background: cf.color }}
                          />
                        </div>
                        <span className={styles.rnkNum}>#{s.rankingFIFA ?? "—"}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
