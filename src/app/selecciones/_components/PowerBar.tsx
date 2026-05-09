// PowerBar — barra horizontal con % de probabilidad de campeón.
// Glow color confederación.

import styles from "../selecciones.module.css";

interface PowerBarProps {
  /** % entre 0 y 100 */
  pct: number;
  color: string;
  label: string;
}

export default function PowerBar({ pct, color, label }: PowerBarProps) {
  // El track muestra hasta ~22% de probabilidad real (pct * 4.5).
  const fillWidth = Math.min(pct * 4.5, 100);
  return (
    <div className={styles.powerBar}>
      <div className={styles.powerTrack}>
        <div
          className={styles.powerFill}
          style={{ width: `${fillWidth}%`, background: color, color }}
        />
        {[10, 20, 30].map((t) => (
          <span
            key={t}
            className={styles.tick}
            style={{ left: `${t * 4.5}%`, position: "absolute", top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.18)" }}
          />
        ))}
      </div>
      <div className={styles.powerMeta}>
        <span className={styles.pct}>{pct.toFixed(1)}%</span>
        <span className={styles.lbl}>{label}</span>
      </div>
    </div>
  );
}
