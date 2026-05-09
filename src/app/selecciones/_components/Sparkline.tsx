// Sparkline SVG inline para trayectoria FIFA (12 puntos, valores invertidos:
// menor ranking = mejor, así que valores bajos están "arriba" en el gráfico).

import styles from "../selecciones.module.css";

interface SparklineProps {
  data: number[];
  color: string;
  height?: number;
}

export default function Sparkline({ data, color, height = 28 }: SparklineProps) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = ((v - min) / range) * height;
    return `${x},${y}`;
  });
  const path = "M" + pts.join(" L");
  const area = path + ` L${w},${height} L0,${height} Z`;
  const lastY = ((data[data.length - 1] - min) / range) * height;
  return (
    <svg
      className={styles.sparkline}
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={area} fill={color} fillOpacity="0.12" />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={w} cy={lastY} r="2" fill={color} />
    </svg>
  );
}
