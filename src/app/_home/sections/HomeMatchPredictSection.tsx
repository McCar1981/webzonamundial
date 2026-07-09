"use client";

// HomeMatchPredictSection — fusiona Match Center + Predicciones en un bloque
// interactivo de la home:
//  · Partido destacado (el próximo del calendario) con un selector "¿Quién
//    gana?" jugable. El voto se anota localmente (preview); para que sume
//    puntos de verdad invita a registrarse / abrir el módulo de Predicciones.
//  · Tira de próximos partidos, cada uno enlaza a su Match Center.
// Datos 100% estáticos (src/data/matches.ts) — sin auth, sin API.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MATCHES, type Match } from "@/data/matches";

// Cruces KO sin resolver (h/a = "W97"/"L101", banderas "tbd"): no son jugables ni
// legibles como equipos — se excluyen de la sección para no romper la primera
// impresión con placeholders crudos.
function hasRealTeams(m: Match): boolean {
  return m.hf !== "tbd" && m.af !== "tbd";
}

const BG2 = "#0F1D32",
  BG3 = "#0B1825",
  GOLD = "#c9a84c",
  GOLD2 = "#e8d48b",
  MID = "#8a94b0",
  DIM = "#6a7a9a";

type Pick = "home" | "draw" | "away";

function upcomingMatches(limit: number): Match[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const future = MATCHES.filter((m) => {
    const d = new Date(`${m.d}T00:00:00`);
    return d.getTime() >= today.getTime() && hasRealTeams(m);
  });
  const pool = future.length > 0 ? future : MATCHES.filter(hasRealTeams);
  return [...pool]
    .sort((a, b) => (a.d === b.d ? a.t.localeCompare(b.t) : a.d.localeCompare(b.d)))
    .slice(0, limit);
}

function fmtDate(d: string): string {
  try {
    return new Date(`${d}T00:00:00`).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return d;
  }
}

function Flag({ code, size = 28 }: { code: string; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      alt=""
      style={{ width: size, height: Math.round(size * 0.67), borderRadius: 3, objectFit: "cover", flexShrink: 0 }}
    />
  );
}

export function HomeMatchPredictSection() {
  // 1 partido destacado + 8 tarjetas en "Próximos partidos".
  const matches = useMemo(() => upcomingMatches(9), []);
  const featured = matches[0];
  const rest = matches.slice(1);
  const [pick, setPick] = useState<Pick | null>(null);

  // El pick sobrevive a la navegación: la sección promete que acertar suma, así
  // que guardarlo solo en memoria era una promesa rota al primer refresh.
  useEffect(() => {
    if (!featured) return;
    try {
      const saved = localStorage.getItem(`zm-home-pick-${featured.i}`);
      if (saved === "home" || saved === "draw" || saved === "away") setPick(saved);
    } catch { /* sin storage */ }
  }, [featured]);
  const choose = (p: Pick) => {
    setPick(p);
    if (featured) {
      try { localStorage.setItem(`zm-home-pick-${featured.i}`, p); } catch { /* ignore */ }
    }
  };

  if (!featured) return null;

  const options: { key: Pick; label: string }[] = [
    { key: "home", label: featured.h },
    { key: "draw", label: "Empate" },
    { key: "away", label: featured.a },
  ];

  return (
    <section className="relative px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-8">
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] mb-3" style={{ color: GOLD }}>
            Match Center · Predicciones
          </div>
          <h2
            className="font-black text-white leading-tight"
            style={{ fontSize: "clamp(22px, 3.6vw, 36px)", letterSpacing: "-0.02em" }}
          >
            Predice el próximo partido
          </h2>
          <p className="text-sm mt-2" style={{ color: MID, maxWidth: 560, margin: "8px auto 0" }}>
            Elige tu resultado y entra al Match Center en directo. En la app,
            cada acierto suma puntos y te sube en el ranking.
          </p>
        </div>

        {/* Partido destacado + predicción */}
        <div
          className="relative overflow-hidden rounded-3xl border p-6 sm:p-8 mb-6"
          style={{
            borderColor: "rgba(201,168,76,0.25)",
            background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(11,24,37,0.85))",
          }}
        >
          <div
            aria-hidden
            className="absolute -top-24 -left-16 w-60 h-60 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(201,168,76,0.18), transparent 70%)",
              filter: "blur(45px)",
            }}
          />
          <div className="relative z-10">
            {/* Meta */}
            <div style={{ textAlign: "center", fontSize: 11, color: DIM, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
              {featured.p}{featured.g ? ` · Grupo ${featured.g}` : ""} · {fmtDate(featured.d)} · {featured.t} ET · {featured.vc}
            </div>

            {/* Equipos */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginBottom: 22, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Flag code={featured.hf} size={40} />
                <span style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}>{featured.h}</span>
              </div>
              <span style={{ color: GOLD, fontWeight: 800, fontSize: 16 }}>VS</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}>{featured.a}</span>
                <Flag code={featured.af} size={40} />
              </div>
            </div>

            {/* Selector ¿quién gana? */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, maxWidth: 520, margin: "0 auto" }}>
              {options.map((o) => {
                const active = pick === o.key;
                return (
                  <button
                    key={o.key}
                    onClick={() => choose(o.key)}
                    style={{
                      padding: "13px 8px",
                      borderRadius: 12,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontWeight: 800,
                      fontSize: 14,
                      color: active ? "#1A1208" : "#fff",
                      background: active ? `linear-gradient(135deg, ${GOLD}, ${GOLD2})` : BG2,
                      border: `1.5px solid ${active ? GOLD : "rgba(255,255,255,0.08)"}`,
                      transition: "all .15s",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>

            {/* Confirmación + CTAs */}
            {pick && (
              <div style={{ textAlign: "center", marginTop: 18 }}>
                <p style={{ color: GOLD2, fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
                  ¡Anotado! En la app, acertar este resultado te suma puntos.
                </p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  <Link href={`/app/predicciones/jugar?match=${featured.i}&pick=${pick}`} style={primaryBtn}>
                    Predecir en serio →
                  </Link>
                  <Link href={`/app/matchcenter/${featured.i}`} style={secondaryBtn}>
                    Ver Match Center
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Próximos partidos */}
        {rest.length > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
                Próximos partidos
              </h3>
              <Link href="/calendario" style={{ fontSize: 13, color: GOLD, fontWeight: 700, textDecoration: "none" }}>
                Ver calendario →
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
              {rest.map((m) => (
                <Link
                  key={m.i}
                  href={`/app/matchcenter/${m.i}`}
                  style={{
                    display: "block",
                    padding: "13px 15px",
                    borderRadius: 14,
                    background: BG3,
                    border: "1px solid rgba(255,255,255,0.06)",
                    textDecoration: "none",
                    transition: "border-color .2s",
                  }}
                >
                  <div style={{ fontSize: 10.5, color: DIM, fontWeight: 700, letterSpacing: 0.5, marginBottom: 9, textTransform: "uppercase" }}>
                    {fmtDate(m.d)} · {m.t} ET · {m.g ? `Gr. ${m.g}` : m.p}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, flex: 1, minWidth: 0 }}>
                      <Flag code={m.hf} size={22} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.h}</span>
                    </div>
                    <span style={{ fontSize: 11, color: DIM, fontWeight: 700 }}>vs</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, flex: 1, minWidth: 0, justifyContent: "flex-end" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.a}</span>
                      <Flag code={m.af} size={22} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

const primaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "13px 24px",
  borderRadius: 999,
  border: "none",
  cursor: "pointer",
  background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
  color: "#1A1208",
  fontWeight: 800,
  fontSize: 14,
  fontFamily: "inherit",
  textDecoration: "none",
  boxShadow: "0 0 30px -8px rgba(201,168,76,0.55)",
};

const secondaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "13px 22px",
  borderRadius: 999,
  cursor: "pointer",
  background: BG2,
  color: "#fff",
  fontWeight: 700,
  fontSize: 14,
  fontFamily: "inherit",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,0.1)",
};
