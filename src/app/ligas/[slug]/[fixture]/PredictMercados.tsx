"use client";

// Mercados de predicción AVANZADOS del Centro de Partido de liga (Fase A1):
//   · Over/Under 2.5 goles      (+15 Fútcoins)
//   · Primer equipo en marcar   (+15)
//   · Ambos marcan (BTTS)       (+12)
// Un pick por mercado y partido (unique en BD). Se guardan a nombre del usuario
// vía POST /api/ligas/predict y el cron abona Fútcoins al acertar. Solo se pinta
// para partidos NO empezados y ligas de Ola 1 (el server revalida ambas cosas).
// Complementa a MatchPoll (1X2 + marcador exacto); no lo reemplaza. Sin emojis.

import { useCallback, useEffect, useState, type CSSProperties } from "react";

const GOLD = "#c9a84c";
const DIM = "#a69a82";

type TypedMarket = "ou_goals" | "first_goal" | "btts" | "ou_corners" | "ou_cards" | "first_goal_half" | "first_scorer" | "duel";
type Saved = Partial<Record<TypedMarket, Record<string, unknown>>>;

type PlayerLite = { id: number; name: string };
type SidePlayers = { teamId: number; name: string; players: PlayerLite[] };
type PlayersPayload = { home: SidePlayers; away: SidePlayers };

// Estilos compartidos por los mercados con selector de jugador (A2b).
const headStyle: CSSProperties = { display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 };
const titleStyle: CSSProperties = { fontSize: 13, fontWeight: 500, color: "#fff" };
const savedStyle: CSSProperties = { margin: 0, fontSize: 12.5, fontWeight: 500, color: GOLD, textAlign: "center" };
const selectStyle: CSSProperties = { width: "100%", border: "1px solid rgba(201,168,76,0.4)", background: "#14110a", color: "#fff", fontSize: 13, padding: "10px 8px", borderRadius: 10, appearance: "none" };
function rowStyle(last: boolean): CSSProperties {
  return { paddingBottom: last ? 0 : 14, marginBottom: last ? 0 : 14, borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.07)" };
}
function pickBtnStyle(busy: boolean): CSSProperties {
  return { border: "1px solid rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.06)", color: "#fff", fontSize: 13, fontWeight: 500, padding: "11px 6px", borderRadius: 10, cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" };
}

export default function PredictMercados({
  fixtureId,
  slug,
  homeName,
  awayName,
}: {
  fixtureId: number;
  slug: string;
  homeName: string;
  awayName: string;
}) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [saved, setSaved] = useState<Saved>({});
  const [busy, setBusy] = useState<TypedMarket | null>(null);
  const [error, setError] = useState("");
  const [players, setPlayers] = useState<PlayersPayload | null>(null);

  useEffect(() => {
    fetch(`/api/ligas/predict?fixtureId=${fixtureId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j) return;
        setAuthed(!!j.authed);
        if (j.typed && typeof j.typed === "object") setSaved(j.typed as Saved);
      })
      .catch(() => setAuthed(false));
  }, [fixtureId]);

  // Plantillas de ambos equipos para los selectores de goleador/duelo. Solo para
  // usuarios logueados (los anónimos no ven estos mercados) y bajo demanda.
  useEffect(() => {
    if (authed !== true) return;
    let alive = true;
    fetch(`/api/ligas/players?fixtureId=${fixtureId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (alive && j && j.home && j.away) setPlayers(j as PlayersPayload);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [authed, fixtureId]);

  const send = useCallback(
    async (market: TypedMarket, data: Record<string, unknown>) => {
      if (busy || saved[market]) return;
      setBusy(market);
      setError("");
      try {
        const r = await fetch("/api/ligas/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fixtureId, slug, market, data }),
        });
        const j = await r.json().catch(() => ({}));
        if (r.ok || j?.error === "already_predicted") {
          setSaved((s) => ({ ...s, [market]: data }));
        } else if (j?.error === "match_started") {
          setError("El partido ya empezó: las predicciones cierran al saque.");
        } else if (j?.error === "not_available" || j?.error === "market_not_available") {
          setError("Este mercado aún no está disponible.");
        } else {
          setError("No se pudo guardar. Inténtalo de nuevo.");
        }
      } catch {
        setError("Sin conexión. Inténtalo de nuevo.");
      } finally {
        setBusy(null);
      }
    },
    [busy, saved, fixtureId, slug],
  );

  // Anónimo: no ofrecemos los mercados avanzados (empujón suave a registrarse).
  if (authed === false) {
    return (
      <section className="zl-card--raised" style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 14.5, fontWeight: 500, color: "#fff", margin: "0 0 6px", textAlign: "center" }}>Más mercados</h2>
        <p style={{ margin: 0, fontSize: 12, color: DIM, textAlign: "center" }}>
          <a href="/registro?next=/ligas" style={{ color: GOLD, textDecoration: "none" }}>Crea tu cuenta gratis</a> para predecir goles, primer gol y más — y ganar Fútcoins. Sin apuestas.
        </p>
      </section>
    );
  }
  if (authed === null) return null; // cargando: sin salto de layout

  return (
    <section className="zl-card--raised" style={{ marginTop: 16 }}>
      <h2 style={{ fontSize: 14.5, fontWeight: 500, color: "#fff", margin: "0 0 2px", textAlign: "center" }}>Más mercados</h2>
      <p style={{ margin: "0 0 14px", fontSize: 12, color: GOLD, textAlign: "center" }}>Más formas de acertar y sumar Fútcoins. Sin apuestas.</p>

      <Market
        title="Total de goles"
        reward={15}
        saved={saved.ou_goals ? (saved.ou_goals.side === "over" ? "Más de 2.5 goles" : "Menos de 2.5 goles") : null}
        busy={busy === "ou_goals"}
        options={[
          { label: "Más de 2.5", onPick: () => send("ou_goals", { side: "over" }) },
          { label: "Menos de 2.5", onPick: () => send("ou_goals", { side: "under" }) },
        ]}
      />

      <Market
        title="Primer equipo en marcar"
        reward={15}
        saved={saved.first_goal ? (saved.first_goal.pick === "home" ? homeName : saved.first_goal.pick === "away" ? awayName : "Sin goles") : null}
        busy={busy === "first_goal"}
        options={[
          { label: homeName, onPick: () => send("first_goal", { pick: "home" }) },
          { label: "Sin goles", onPick: () => send("first_goal", { pick: "none" }) },
          { label: awayName, onPick: () => send("first_goal", { pick: "away" }) },
        ]}
      />

      <Market
        title="Ambos marcan"
        reward={12}
        saved={saved.btts ? (saved.btts.pick === "yes" ? "Sí, ambos marcan" : "No marcan ambos") : null}
        busy={busy === "btts"}
        options={[
          { label: "Sí", onPick: () => send("btts", { pick: "yes" }) },
          { label: "No", onPick: () => send("btts", { pick: "no" }) },
        ]}
      />

      <Market
        title="Total de córners"
        reward={15}
        saved={saved.ou_corners ? (saved.ou_corners.side === "over" ? "Más de 9.5 córners" : "Menos de 9.5 córners") : null}
        busy={busy === "ou_corners"}
        options={[
          { label: "Más de 9.5", onPick: () => send("ou_corners", { side: "over" }) },
          { label: "Menos de 9.5", onPick: () => send("ou_corners", { side: "under" }) },
        ]}
      />

      <Market
        title="Total de tarjetas"
        reward={12}
        saved={saved.ou_cards ? (saved.ou_cards.side === "over" ? "Más de 4.5 tarjetas" : "Menos de 4.5 tarjetas") : null}
        busy={busy === "ou_cards"}
        options={[
          { label: "Más de 4.5", onPick: () => send("ou_cards", { side: "over" }) },
          { label: "Menos de 4.5", onPick: () => send("ou_cards", { side: "under" }) },
        ]}
      />

      <Market
        title="¿Cuándo cae el 1er gol?"
        reward={15}
        saved={saved.first_goal_half ? (saved.first_goal_half.pick === "first" ? "1ª mitad" : saved.first_goal_half.pick === "second" ? "2ª mitad" : "Sin goles") : null}
        busy={busy === "first_goal_half"}
        options={[
          { label: "1ª mitad", onPick: () => send("first_goal_half", { pick: "first" }) },
          { label: "Sin goles", onPick: () => send("first_goal_half", { pick: "none" }) },
          { label: "2ª mitad", onPick: () => send("first_goal_half", { pick: "second" }) },
        ]}
      />

      <ScorerMarket
        players={players}
        saved={saved.first_scorer}
        busy={busy === "first_scorer"}
        onPick={(d) => send("first_scorer", d)}
      />

      <DuelMarket
        players={players}
        saved={saved.duel}
        busy={busy === "duel"}
        onPick={(d) => send("duel", d)}
      />

      {error ? <p style={{ margin: "12px 0 0", fontSize: 12, color: "#ef6a6a", textAlign: "center" }}>{error}</p> : null}
    </section>
  );
}

function Market({
  title,
  reward,
  saved,
  busy,
  options,
  last = false,
}: {
  title: string;
  reward: number;
  saved: string | null;
  busy: boolean;
  options: { label: string; onPick: () => void }[];
  last?: boolean;
}) {
  return (
    <div style={{ paddingBottom: last ? 0 : 14, marginBottom: last ? 0 : 14, borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>{title}</span>
        <span style={{ fontSize: 11, color: saved ? GOLD : DIM }}>+{reward} Fútcoins</span>
      </div>
      {saved ? (
        <p style={{ margin: 0, fontSize: 12.5, fontWeight: 500, color: GOLD, textAlign: "center" }}>
          Tu pronóstico: {saved}
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${options.length}, 1fr)`, gap: 8 }}>
          {options.map((o) => (
            <button
              key={o.label}
              onClick={o.onPick}
              disabled={busy}
              style={{
                border: "1px solid rgba(201,168,76,0.4)",
                background: "rgba(201,168,76,0.06)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 500,
                padding: "11px 6px",
                borderRadius: 10,
                cursor: busy ? "default" : "pointer",
                opacity: busy ? 0.6 : 1,
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Primer goleador (+30). Un único select con ambas plantillas + "sin goleador".
function ScorerMarket({
  players,
  saved,
  busy,
  onPick,
}: {
  players: PlayersPayload | null;
  saved: Record<string, unknown> | undefined;
  busy: boolean;
  onPick: (data: Record<string, unknown>) => void;
}) {
  return (
    <div style={rowStyle(false)}>
      <div style={headStyle}>
        <span style={titleStyle}>Primer goleador</span>
        <span style={{ fontSize: 11, color: saved ? GOLD : DIM }}>+30 Fútcoins</span>
      </div>
      {saved ? (
        <p style={savedStyle}>Tu pronóstico: {saved.playerId === 0 ? "Sin goleador" : String(saved.name)}</p>
      ) : !players ? (
        <p style={{ margin: 0, fontSize: 12, color: DIM, textAlign: "center" }}>Cargando plantillas…</p>
      ) : (
        <select
          defaultValue=""
          disabled={busy}
          onChange={(e) => {
            const v = e.target.value;
            if (!v) return;
            if (v === "none") { onPick({ playerId: 0, name: "" }); return; }
            const sep = v.indexOf("|");
            onPick({ playerId: Number(v.slice(0, sep)), name: v.slice(sep + 1) });
          }}
          style={selectStyle}
        >
          <option value="" disabled>Elige al goleador…</option>
          <optgroup label={players.home.name}>
            {players.home.players.map((p) => (
              <option key={`h${p.id}`} value={`${p.id}|${p.name}`}>{p.name}</option>
            ))}
          </optgroup>
          <optgroup label={players.away.name}>
            {players.away.players.map((p) => (
              <option key={`a${p.id}`} value={`${p.id}|${p.name}`}>{p.name}</option>
            ))}
          </optgroup>
          <option value="none">Sin goleador (0-0 o solo autogoles)</option>
        </select>
      )}
    </div>
  );
}

// Duelo de jugadores (+20). Un jugador de cada equipo; gana quien más aporte.
function DuelMarket({
  players,
  saved,
  busy,
  onPick,
}: {
  players: PlayersPayload | null;
  saved: Record<string, unknown> | undefined;
  busy: boolean;
  onPick: (data: Record<string, unknown>) => void;
}) {
  const [aId, setAId] = useState("");
  const [bId, setBId] = useState("");
  const a = players?.home.players.find((p) => String(p.id) === aId) ?? null;
  const b = players?.away.players.find((p) => String(p.id) === bId) ?? null;
  return (
    <div style={rowStyle(true)}>
      <div style={headStyle}>
        <span style={titleStyle}>Duelo de jugadores</span>
        <span style={{ fontSize: 11, color: saved ? GOLD : DIM }}>+20 Fútcoins</span>
      </div>
      {saved ? (
        <p style={savedStyle}>Tu pronóstico: Gana {saved.pick === "a" ? String(saved.aName) : String(saved.bName)}</p>
      ) : !players ? (
        <p style={{ margin: 0, fontSize: 12, color: DIM, textAlign: "center" }}>Cargando plantillas…</p>
      ) : (
        <>
          <p style={{ margin: "0 0 8px", fontSize: 11.5, color: DIM, textAlign: "center" }}>
            Uno de cada equipo. Gana quien más aporte (goles y asistencias).
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <select value={aId} onChange={(e) => setAId(e.target.value)} disabled={busy} style={selectStyle}>
              <option value="" disabled>{players.home.name}</option>
              {players.home.players.map((p) => (
                <option key={p.id} value={String(p.id)}>{p.name}</option>
              ))}
            </select>
            <select value={bId} onChange={(e) => setBId(e.target.value)} disabled={busy} style={selectStyle}>
              <option value="" disabled>{players.away.name}</option>
              {players.away.players.map((p) => (
                <option key={p.id} value={String(p.id)}>{p.name}</option>
              ))}
            </select>
          </div>
          {a && b ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button disabled={busy} onClick={() => onPick({ aId: a.id, aName: a.name, bId: b.id, bName: b.name, pick: "a" })} style={pickBtnStyle(busy)}>
                Gana {a.name}
              </button>
              <button disabled={busy} onClick={() => onPick({ aId: a.id, aName: a.name, bId: b.id, bName: b.name, pick: "b" })} style={pickBtnStyle(busy)}>
                Gana {b.name}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
