"use client";

// Ranking de PREDICTORES de la liga (leaderboard de Fútcoins). El marcador
// competitivo de Zona de Ligas: le da sentido a predecir y acertar. Cliente:
// sondea /api/ligas/leaderboard, resalta tu fila y muestra tu posición. Estado
// vacío honesto ("sé el primero") mientras no haya predicciones resueltas.

import { useEffect, useState } from "react";

const GOLD = "#c9a84c";
const DIM = "#a69a82";
const MEDAL = ["#f4e1a0", "#cdd3da", "#d8a15a"]; // oro, plata, bronce (top 3)

type Entry = {
  position: number;
  user: { id: string; display_name: string; avatar_url: string | null };
  coins: number;
  correct_count: number;
  predictions_count: number;
};

export default function LigaLeaderboard({ slug, shortName }: { slug: string; shortName: string }) {
  const [rows, setRows] = useState<Entry[] | null>(null);
  const [myPos, setMyPos] = useState<number | null>(null);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/ligas/leaderboard?slug=${encodeURIComponent(slug)}&limit=50`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive) return;
        setRows(j && Array.isArray(j.rankings) ? (j.rankings as Entry[]) : []);
        setMyPos(j && typeof j.my_position === "number" ? j.my_position : null);
        setAuthed(!!(j && j.authed));
      })
      .catch(() => { if (alive) setRows([]); });
    return () => { alive = false; };
  }, [slug]);

  if (rows === null) {
    return (
      <section style={{ marginTop: 34 }}>
        <h2 className="zl-h2">Mejores predictores</h2>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: DIM }}>Cargando ranking…</p>
      </section>
    );
  }

  return (
    <section style={{ marginTop: 34 }}>
      <h2 className="zl-h2">Mejores predictores</h2>
      <p style={{ margin: "2px 0 12px", fontSize: 12.5, color: DIM }}>
        Ranking de Fútcoins por aciertos en {shortName}. Sin apuestas.
      </p>

      {rows.length === 0 ? (
        <div className="zl-card--raised" style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--zl-body)" }}>
            Aún no hay ranking. Sé el primero: predice esta jornada y suma Fútcoins.
          </p>
        </div>
      ) : (
        <div className="zl-card" style={{ padding: "4px 8px" }}>
          {rows.slice(0, 10).map((e, idx, arr) => {
            const mine = myPos === e.position;
            const medal = e.position <= 3 ? MEDAL[e.position - 1] : null;
            return (
              <div
                key={e.user.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 8px",
                  borderRadius: 10,
                  background: mine ? "rgba(201,168,76,0.14)" : "transparent",
                  borderBottom: idx < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}
              >
                <span style={{ width: 22, textAlign: "center", fontSize: 13, fontWeight: 700, color: medal ?? DIM, fontVariantNumeric: "tabular-nums", flex: "0 0 auto" }}>
                  {e.position}
                </span>
                {e.user.avatar_url ? (
                  <img src={e.user.avatar_url} alt="" width={28} height={28} loading="lazy" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flex: "0 0 auto" }} />
                ) : (
                  <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#241e12", flex: "0 0 auto" }} aria-hidden />
                )}
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13.5, color: "#fff", fontWeight: mine ? 600 : 400, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                    {e.user.display_name}{mine ? " · tú" : ""}
                  </span>
                  <span style={{ display: "block", fontSize: 11, color: DIM }}>{e.correct_count} aciertos</span>
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: GOLD, fontVariantNumeric: "tabular-nums", flex: "0 0 auto", minWidth: 56, textAlign: "right" }}>
                  {e.coins.toLocaleString("es")}
                </span>
              </div>
            );
          })}
          {authed && (
            <p style={{ margin: "10px 4px 6px", fontSize: 12, color: myPos ? GOLD : DIM, textAlign: "center" }}>
              {myPos ? `Tu posición: #${myPos}` : "Predice y acierta para entrar al ranking."}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
