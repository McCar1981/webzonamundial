"use client";

// La portada operativa de /ligas para un usuario con preferencias: una única
// agenda transversal en vez de obligarle a revisar liga por liga.

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { trackProductEvent } from "@/lib/analytics/track-event";
import { matchStateFromApiStatus } from "@/lib/analytics/product-events";
import {
  buildPersonalMatchday,
  type PersonalMatchdayFeed,
  type PersonalMatchdayItem,
  type PersonalMatchdayMode,
} from "@/lib/ligas/personal-matchday";

const GOLD = "#c9a84c";
const DIM = "#a69a82";
const LIVE = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"]);

function isLive(status: string): boolean {
  return LIVE.has(String(status || "").trim().toUpperCase());
}

function localTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function kickoffLabel(item: PersonalMatchdayItem, mode: PersonalMatchdayMode): string {
  if (isLive(item.status)) return item.elapsed != null ? `${item.elapsed}' · En vivo` : "En vivo";
  try {
    return new Intl.DateTimeFormat("es-ES", {
      weekday: mode === "upcoming" ? "short" : undefined,
      day: mode === "upcoming" ? "numeric" : undefined,
      month: mode === "upcoming" ? "short" : undefined,
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(item.kickoff));
  } catch {
    return item.kickoff.slice(0, 16).replace("T", " ");
  }
}

function TeamLine({
  team,
  score,
  showScore,
}: {
  team: PersonalMatchdayItem["home"];
  score: number | null;
  showScore: boolean;
}) {
  return (
    <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
        {team.logo ? (
          <img src={team.logo} alt="" width={26} height={26} loading="lazy" style={{ width: 26, height: 26, objectFit: "contain", flexShrink: 0 }} />
        ) : (
          <span aria-hidden style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,.07)", flexShrink: 0 }} />
        )}
        <span style={{ color: "#fff", fontSize: 14.5, fontWeight: 650, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {team.name}
        </span>
      </span>
      {showScore ? (
        <span className="zl-num" style={{ color: "#fff", fontSize: 20, flexShrink: 0 }}>{score ?? 0}</span>
      ) : null}
    </span>
  );
}

function modeCopy(mode: PersonalMatchdayMode, liveCount: number, todayCount: number) {
  if (mode === "live") {
    return {
      title: "Tu jornada está en juego",
      sub: `${liveCount} ${liveCount === 1 ? "partido en vivo" : "partidos en vivo"}${todayCount > liveCount ? ` · ${todayCount - liveCount} después` : ""}`,
      badge: "EN VIVO",
    };
  }
  if (mode === "today") {
    return {
      title: "Tu fútbol, hoy",
      sub: `${todayCount} ${todayCount === 1 ? "partido de tus ligas" : "partidos de tus ligas"} para seguir y predecir`,
      badge: "HOY",
    };
  }
  return {
    title: "Lo próximo para ti",
    sub: "Las siguientes citas de las competiciones que sigues",
    badge: "PRÓXIMOS",
  };
}

export default function PersonalMatchday({ feeds }: { feeds: PersonalMatchdayFeed[] }) {
  const timeZone = useMemo(localTimeZone, []);
  const model = useMemo(() => buildPersonalMatchday(feeds, new Date(), timeZone), [feeds, timeZone]);
  const viewed = useRef("");

  useEffect(() => {
    if (model.mode === "empty") return;
    const signature = `${model.mode}:${model.fixtures.map((item) => item.fixtureId).join(",")}`;
    if (viewed.current === signature) return;
    viewed.current = signature;
    trackProductEvent("personal_matchday_viewed", {
      competition_count: model.competitionCount,
      fixture_count: model.fixtures.length,
      live_count: model.liveCount,
      today_count: model.todayCount,
      mode: model.mode,
      surface: "ligas_hub",
    });
  }, [model]);

  if (model.mode === "empty" || model.fixtures.length === 0) return null;

  const mode = model.mode;
  const copy = modeCopy(mode, model.liveCount, model.todayCount);
  const [featured, ...secondary] = model.fixtures;

  const trackSelection = (item: PersonalMatchdayItem, position: number) => {
    trackProductEvent("personal_match_selected", {
      fixture_id: item.fixtureId,
      competition_slug: item.competitionSlug,
      match_state: matchStateFromApiStatus(item.status),
      surface: "personal_matchday",
      mode,
      position,
    });
  };

  const featuredLive = isLive(featured.status);
  const showScore = featuredLive;

  return (
    <section className="zl-card--featured" style={{ marginTop: 26 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <span>
          <span className="zl-label" style={{ display: "block", color: GOLD, marginBottom: 4 }}>Jornada personal</span>
          <span style={{ display: "block", color: "#fff", fontSize: 20, fontWeight: 750, letterSpacing: "-.25px" }}>{copy.title}</span>
          <span style={{ display: "block", color: DIM, fontSize: 12.5, marginTop: 3 }}>{copy.sub}</span>
        </span>
        <span
          className={featuredLive ? "zl-chip zl-card--live" : "zl-chip"}
          style={{ color: featuredLive ? "var(--zl-live)" : GOLD, flexShrink: 0 }}
        >
          {featuredLive ? <span className="zl-live-dot" aria-hidden /> : null}
          {copy.badge}
        </span>
      </div>

      <Link
        href={`/ligas/${featured.competitionSlug}/${featured.fixtureId}`}
        onClick={() => trackSelection(featured, 1)}
        className={featuredLive ? "zl-card zl-card--live zl-tap" : "zl-card zl-tap"}
        style={{ display: "block", marginTop: 14, padding: 14, textDecoration: "none" }}
      >
        <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
          <span style={{ color: DIM, fontSize: 11.5, fontWeight: 600 }}>{featured.competitionShort}</span>
          <span style={{ color: featuredLive ? "var(--zl-live)" : GOLD, fontSize: 11.5, fontWeight: 700 }}>
            {kickoffLabel(featured, mode)}
          </span>
        </span>
        <span style={{ display: "grid", gap: 8 }}>
          <TeamLine team={featured.home} score={featured.score.home} showScore={showScore} />
          <TeamLine team={featured.away} score={featured.score.away} showScore={showScore} />
        </span>
        <span style={{ display: "flex", justifyContent: "flex-end", marginTop: 11, color: GOLD, fontSize: 12.5, fontWeight: 700 }}>
          {featuredLive ? "Entrar al partido" : mode === "today" ? "Predecir ahora" : "Ver la previa"} <span className="zl-chev" aria-hidden>&nbsp;&rsaquo;</span>
        </span>
      </Link>

      {secondary.length > 0 ? (
        <div style={{ marginTop: 8 }}>
          {secondary.map((item, index) => {
            const live = isLive(item.status);
            return (
              <Link
                key={item.fixtureId}
                href={`/ligas/${item.competitionSlug}/${item.fixtureId}`}
                onClick={() => trackSelection(item, index + 2)}
                className="zl-row zl-tap"
                style={{ display: "grid", gridTemplateColumns: "68px minmax(0,1fr) auto", alignItems: "center", gap: 9, padding: "10px 2px", textDecoration: "none" }}
              >
                <span style={{ color: live ? "var(--zl-live)" : DIM, fontSize: 11, fontWeight: 650 }}>
                  {kickoffLabel(item, mode)}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", color: "#fff", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.home.name} – {item.away.name}
                  </span>
                  <span style={{ display: "block", color: DIM, fontSize: 10.5, marginTop: 1 }}>{item.competitionShort}</span>
                </span>
                <span className="zl-chev" aria-hidden style={{ color: GOLD, fontSize: 18 }}>&rsaquo;</span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
