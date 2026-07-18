// src/app/tu-mundial/RecapCard.tsx
//
// Tarjeta visual de "Tu Mundial 2026". Presentacional (sin hooks): la comparten
// la página pública (/tu-mundial) y la privada (/app/tu-mundial). Sin emojis
// (regla de marca): se usan solo texto y tipografía. Estilo oscuro + dorado.

import type { TuMundialStats } from "@/lib/tu-mundial/share";

const GOLD = "#c9a84c";
const DIM = "#a69a82";

function Tile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        padding: "18px 8px",
        borderRadius: 16,
        background: accent ? "rgba(201,168,76,0.10)" : "rgba(255,255,255,0.03)",
        border: "1px solid rgba(201,168,76,0.24)",
      }}
    >
      <span style={{ fontSize: 30, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 12.5, color: DIM, fontWeight: 600, textAlign: "center" }}>{label}</span>
    </div>
  );
}

export default function RecapCard({ s }: { s: TuMundialStats }) {
  const tiles: { label: string; value: string; accent?: boolean }[] = [
    { label: "Puntos", value: s.points.toLocaleString("es"), accent: true },
    { label: "Aciertos", value: String(s.correct) },
    { label: "Acierto", value: `${s.accuracy}%` },
    { label: "Puesto global", value: s.rank == null ? "—" : `#${s.rank}` },
    { label: "Nivel", value: String(s.level) },
    { label: "Fútcoins", value: s.coins.toLocaleString("es") },
  ];
  if (s.albumPct > 0) tiles.push({ label: "Álbum", value: `${s.albumPct}%` });
  if (s.fantasyPoints > 0) tiles.push({ label: "Fantasy", value: s.fantasyPoints.toLocaleString("es") });

  return (
    <div
      style={{
        maxWidth: 560,
        margin: "0 auto",
        padding: 24,
        borderRadius: 24,
        background:
          "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(201,168,76,0.14), transparent 60%), linear-gradient(180deg, #000000, #000000)",
        border: "1px solid rgba(201,168,76,0.3)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: 3, color: GOLD }}>TU MUNDIAL 2026</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: DIM }}>zonamundial.app</span>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, color: DIM, fontWeight: 600 }}>El Mundial de</div>
        <div style={{ fontSize: 34, fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>{s.name}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {tiles.map((t) => (
          <Tile key={t.label} label={t.label} value={t.value} accent={t.accent} />
        ))}
      </div>

      {s.perfect > 0 && (
        <p style={{ margin: "16px 0 0", textAlign: "center", color: GOLD, fontWeight: 800, fontSize: 14 }}>
          {s.perfect} partido{s.perfect === 1 ? "" : "s"} perfecto{s.perfect === 1 ? "" : "s"} (8/8 aciertos)
        </p>
      )}
    </div>
  );
}
