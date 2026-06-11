// src/app/calendario/page.tsx
// ZonaMundial.app — Calendario del Mundial 2026 (UX "modo torneo")
//
// Horarios: matches.ts guarda las horas en ET; aquí TODO se muestra en la
// zona horaria del usuario (detectada vía Intl tras hidratar) y los partidos
// se agrupan por el día LOCAL del usuario — un sábado 22:00 de América es
// domingo de madrugada en Europa y se lista en el domingo del usuario.
//
// UX: la página es una HERRAMIENTA, no una landing — hero compacto (el
// primer partido se ve sin scroll en móvil), barra sticky única de días con
// HOY + Filtros (bottom-sheet), filas de agenda en escritorio y auto-salto
// al día actual durante el torneo.
//
// Imagen de hero (opcional): public/images/calendario/hero.webp — 1920×800,
// muy oscura o tolerante al overlay navy que se pinta encima. Si el archivo
// no existe, el degradado actual hace de fondo (onError oculta el <img>).

"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { useLanguage } from "@/i18n/LanguageContext";
import { SvgIcon } from "@/components/icons";
import { SELECCIONES } from "@/data/selecciones";
import { flagUrl } from "@/data/matches";
import type { Match } from "@/data/matches";
import {
  WC_MATCHES,
  WC_VENUES,
  TOURNAMENT_DAYS,
  SOURCE_TZ,
  OPENING_INSTANT,
  FINAL_INSTANT,
  POSTMATCH_MS,
  getUserTimezone,
  groupByLocalDay,
  localDayKey,
  matchInstant,
  fmtTime,
  tzCityLabel,
} from "@/lib/calendario/time";
import { isLive } from "@/lib/calendario/live";
import {
  DateHeader,
  DayChips,
  FilterSheet,
  MatchModal,
  MatchRow,
  MobileTimeline,
  TournamentStrip,
} from "./_components";
import { useLiveScores } from "./_components/useLiveScores";
import CalendarExportButton from "@/components/CalendarExportButton";

const BG = "#060B14";

const COUNTRY_ORDER: Record<string, number> = { us: 0, mx: 1, ca: 2 };
const COUNTRY_LABELS: Record<string, string> = {
  us: "EE.UU.",
  mx: "México",
  ca: "Canadá",
};

export default function CalendarioPage() {
  const { t } = useLanguage();
  const cT = t.calendario;
  const nav = t.nav;

  const [phase, setPhase] = useState("all");
  const [group, setGroup] = useState("all");
  const [selected, setSelected] = useState<Match | null>(null);
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [venueFilter, setVenueFilter] = useState<string>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // TZ del usuario. Arranca en ET (mismo render en servidor y cliente, sin
  // hydration mismatch) y tras montar cambia a la del navegador.
  const [tz, setTz] = useState(SOURCE_TZ);
  const [mounted, setMounted] = useState(false);
  const [liveActive, setLiveActive] = useState(false);
  const [tournamentOver, setTournamentOver] = useState(false);
  const [todayKey, setTodayKey] = useState<string | null>(null);

  const scrollToDay = useCallback((key: string) => {
    const desktop = window.matchMedia("(min-width: 640px)").matches;
    const el =
      document.getElementById(`day-${desktop ? "d" : "m"}-${key}`) ||
      document.getElementById(`day-${desktop ? "m" : "d"}-${key}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveDay(key);
  }, []);

  useEffect(() => {
    const userTz = getUserTimezone();
    setTz(userTz);
    setMounted(true);

    const now = Date.now();
    // Polling de marcadores solo desde 1h antes del saque inaugural hasta que
    // acaba la final; fuera de ese rango, ni una petición.
    setLiveActive(
      now >= OPENING_INSTANT.getTime() - 3_600_000 &&
        now <= FINAL_INSTANT.getTime() + POSTMATCH_MS
    );
    setTournamentOver(now > FINAL_INSTANT.getTime() + POSTMATCH_MS);

    // ¿Hoy (en el reloj del usuario) hay jornada? → chip HOY + auto-salto.
    const k = localDayKey(new Date(now), userTz);
    const hasToday = groupByLocalDay(WC_MATCHES, userTz).some((d) => d.key === k);
    if (hasToday) {
      setTodayKey(k);
      // Con el torneo en marcha y sin deep-link, aterriza directamente en HOY
      // (la pregunta del 90% de las visitas es "¿qué hay hoy?").
      const started = now >= OPENING_INSTANT.getTime() - 6 * 3_600_000;
      if (started && !window.location.hash) {
        window.setTimeout(() => scrollToDay(k), 250);
      }
    }
  }, [scrollToDay]);

  const liveMap = useLiveScores(liveActive);

  // Modal con deep-link: #match-<id> abre el partido (las URLs del JSON-LD y
  // del feed ICS apuntan aquí), y abrir/cerrar mantiene el hash compartible.
  const openMatch = useCallback((m: Match | null) => {
    setSelected(m);
    if (typeof window === "undefined") return;
    if (m) {
      window.history.replaceState(null, "", `#match-${m.i}`);
    } else {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const match = /^#match-(\d+)$/.exec(hash);
    if (match) {
      const found = WC_MATCHES.find((x) => x.i === Number(match[1]));
      if (found) setSelected(found);
    }
  }, []);

  const FAVORITE_TEAMS = useMemo(
    () => ["ar", "br", "es", "fr", "mx", "us", "pt", "de", "gb-eng"],
    []
  );

  const teamOptions = useMemo(
    () => [
      { value: "all", label: cT.todas },
      ...SELECCIONES.map((s) => ({
        value: s.flagCode,
        label: s.nombre,
        icon: flagUrl(s.flagCode, 40)!,
      })),
    ],
    [cT.todas]
  );

  const venueOptions = useMemo(() => {
    const sortedVenues = [...WC_VENUES].sort((a, b) => {
      const aOrder = COUNTRY_ORDER[a.flag] ?? 99;
      const bOrder = COUNTRY_ORDER[b.flag] ?? 99;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.name.localeCompare(b.name);
    });

    const options: { value: string; label: string; icon?: string }[] = [
      { value: "all", label: cT.todas },
    ];
    let lastCountry = "";
    sortedVenues.forEach((v) => {
      const country = COUNTRY_LABELS[v.flag] ?? "";
      if (country && country !== lastCountry) {
        options.push({ value: `__header_${v.flag}`, label: country });
        lastCountry = country;
      }
      options.push({
        value: v.name,
        label: `${v.name} (${v.city})`,
        icon: flagUrl(v.flag, 40)!,
      });
    });
    return options;
  }, [cT.todas]);

  const filtered = useMemo(
    () =>
      WC_MATCHES.filter((m) => {
        if (phase !== "all" && m.p !== phase) return false;
        if (group !== "all" && m.g !== group) return false;
        if (teamFilter !== "all" && m.hf !== teamFilter && m.af !== teamFilter)
          return false;
        if (venueFilter !== "all" && m.vn !== venueFilter) return false;
        if (
          favoritesOnly &&
          !FAVORITE_TEAMS.includes(m.hf || "") &&
          !FAVORITE_TEAMS.includes(m.af || "")
        )
          return false;
        return true;
      }),
    [phase, group, teamFilter, venueFilter, favoritesOnly, FAVORITE_TEAMS]
  );

  // Agrupación por día LOCAL del usuario, con días y partidos ordenados por
  // instante real de saque.
  const grouped = useMemo(() => groupByLocalDay(filtered, tz), [filtered, tz]);

  // Datos del strip "HOY": del calendario COMPLETO (no del filtrado) — el
  // resumen del día refleja la realidad aunque haya filtros puestos.
  const todayStats = useMemo(() => {
    if (!todayKey) return { count: 0, nextKickoff: null as string | null };
    const day = groupByLocalDay(WC_MATCHES, tz).find((d) => d.key === todayKey);
    if (!day) return { count: 0, nextKickoff: null as string | null };
    const now = Date.now();
    const next = day.matches
      .map((m) => matchInstant(m))
      .find((at) => at !== null && at.getTime() > now);
    return {
      count: day.matches.length,
      nextKickoff: next ? fmtTime(next, tz) : null,
    };
  }, [todayKey, tz, liveMap]);

  const liveCount = useMemo(
    () => Object.values(liveMap).filter((l) => isLive(l)).length,
    [liveMap]
  );

  const activeFilterCount =
    (phase !== "all" ? 1 : 0) +
    (group !== "all" ? 1 : 0) +
    (teamFilter !== "all" ? 1 : 0) +
    (venueFilter !== "all" ? 1 : 0) +
    (favoritesOnly ? 1 : 0);

  const clearFilters = useCallback(() => {
    setPhase("all");
    setGroup("all");
    setTeamFilter("all");
    setVenueFilter("all");
    setFavoritesOnly(false);
  }, []);

  const handleNav = (id: number) => {
    const m = WC_MATCHES.find((x) => x.i === id);
    if (m) openMatch(m);
  };

  // Día activo en la barra: sigue al scroll (IntersectionObserver sobre las
  // secciones de día visibles, tanto móvil como escritorio). Se mantiene un
  // set de secciones dentro de la franja superior y manda la PRIMERA en orden
  // de calendario (con días cortos puede haber dos a la vez en la franja y la
  // última entrada del observer no es necesariamente la que se está viendo).
  useEffect(() => {
    if (!mounted) return;
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-daykey]"));
    if (sections.length === 0) return;
    const visible = new Set<string>();
    const order = grouped.map((d) => d.key);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const key = (e.target as HTMLElement).dataset.daykey;
          if (!key) continue;
          if (e.isIntersecting) visible.add(key);
          else visible.delete(key);
        }
        const first = order.find((k) => visible.has(k));
        if (first) setActiveDay(first);
      },
      { rootMargin: "-64px 0px -55% 0px", threshold: 0 }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [mounted, grouped]);

  // Animación de contenido al cambiar filtros (corta: la página es una
  // herramienta, no un escaparate).
  useEffect(() => {
    if (!contentRef.current) return;
    gsap.fromTo(
      contentRef.current.children,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.25, stagger: 0.03, ease: "power2.out" }
    );
  }, [phase, group, teamFilter, venueFilter, favoritesOnly]);

  const dayChipData = useMemo(
    () => grouped.map((d) => ({ key: d.key, instant: d.instant })),
    [grouped]
  );

  return (
    <div className="min-h-screen text-white" style={{ background: BG }}>
      {/* ── Hero compacto ── */}
      <div className="relative overflow-hidden px-6 pb-5 pt-4">
        {/* Imagen de fondo (public/images/calendario/hero.webp). Si faltara,
            onError la oculta y queda el degradado. A plena opacidad: la
            imagen ya es nocturna y con el velo anterior (img 60 + navy 55-82)
            no se veía nada en pantallas reales. La legibilidad la garantiza
            el scrim lateral izquierdo (zona del título) + el fundido inferior
            hacia el fondo de la página. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/calendario/hero.webp"
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(6,11,20,0.72) 0%, rgba(6,11,20,0.25) 42%, transparent 65%), linear-gradient(180deg, rgba(6,11,20,0.18) 0%, rgba(6,11,20,0.38) 55%, #060B14 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "linear-gradient(180deg, rgba(201,168,76,0.05), transparent 60%)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-6xl">
          {/* Breadcrumb */}
          <div className="mb-3 flex items-center gap-2">
            <Link
              href="/"
              className="text-[13px] text-[#8a94b0] no-underline transition-colors hover:text-white"
            >
              {nav.inicio}
            </Link>
            <span className="text-[#6a7a9a]">/</span>
            <span className="text-[13px] font-semibold text-[#c9a84c]">
              {nav.calendario}
            </span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1
                  className="text-3xl font-black leading-none sm:text-5xl"
                  style={{
                    background: "linear-gradient(135deg, #fff 0%, #c9a84c 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {cT.title}
                </h1>
                <span className="rounded-lg border border-[#c9a84c]/20 bg-[#c9a84c]/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#c9a84c]">
                  {cT.badge}
                </span>
              </div>
              <p className="mt-2 text-[13px] text-[#8a94b0]">
                <strong className="font-bold text-[#e6e9f2]">{WC_MATCHES.length}</strong>{" "}
                {cT.partidos.toLowerCase()} ·{" "}
                <strong className="font-bold text-[#e6e9f2]">{WC_VENUES.length}</strong>{" "}
                {cT.sedes.toLowerCase()} ·{" "}
                <strong className="font-bold text-[#e6e9f2]">{TOURNAMENT_DAYS}</strong>{" "}
                {cT.dias.toLowerCase()}
                {mounted && (
                  <>
                    {" "}
                    · 🌍 {cT.horariosEnTuZona}:{" "}
                    <strong className="font-bold text-[#e8d48b]">{tzCityLabel(tz)}</strong>
                  </>
                )}
              </p>
            </div>
            <div className="flex-shrink-0">
              <CalendarExportButton variant="hero" label={cT.addCalendar} />
            </div>
          </div>

          <div className="mt-4">
            <TournamentStrip
              tournamentOver={tournamentOver}
              todayCount={todayStats.count}
              nextKickoff={todayStats.nextKickoff}
              liveCount={liveCount}
              canJumpToToday={!!todayKey && grouped.some((d) => d.key === todayKey)}
              onVerHoy={() => todayKey && scrollToDay(todayKey)}
            />
          </div>
        </div>
      </div>

      {/* ── Contenido principal ── */}
      <div className="mx-auto max-w-6xl px-6 pb-20">
        {/* Barra sticky única: HOY + días + Filtros */}
        <DayChips
          days={dayChipData}
          activeKey={activeDay}
          todayKey={todayKey && grouped.some((d) => d.key === todayKey) ? todayKey : null}
          tz={tz}
          onDay={scrollToDay}
          onOpenFilters={() => setSheetOpen(true)}
          filterCount={activeFilterCount}
        />

        {/* Resumen de filtros activos */}
        {activeFilterCount > 0 && (
          <div className="mb-4 flex items-center gap-3 text-[13px] text-[#6a7a9a]">
            <span>
              <strong className="text-white">{filtered.length}</strong> {cT.encontrados}
            </span>
            <button
              onClick={clearFilters}
              className="font-semibold text-[#c9a84c] hover:underline"
            >
              {cT.limpiar}
            </button>
          </div>
        )}

        {/* Vista móvil: filas densas por día */}
        <MobileTimeline matches={filtered} onClick={openMatch} tz={tz} live={liveMap} />

        {/* Vista escritorio: agenda por día (día LOCAL del usuario) */}
        <div ref={contentRef} className="hidden sm:block">
          {grouped.map((day) => (
            <section
              key={day.key}
              id={`day-d-${day.key}`}
              data-daykey={day.key}
              className="mb-7"
              style={{ scrollMarginTop: 64 }}
            >
              <DateHeader instant={day.instant} tz={tz} count={day.matches.length} />
              <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0c1626]/60">
                {day.matches.map((m) => (
                  <MatchRow
                    key={m.i}
                    m={m}
                    tz={tz}
                    live={liveMap[m.i]}
                    onClick={() => openMatch(m)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/5 bg-[#0B1825]">
              <svg
                className="h-10 w-10 text-[#6a7a9a]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">{cT.noPartidos}</h3>
            <p className="mb-4 text-[#6a7a9a]">{cT.ajustaFiltros}</p>
            <button
              onClick={clearFilters}
              className="text-sm font-semibold text-[#c9a84c] hover:underline"
            >
              {cT.limpiar}
            </button>
          </div>
        )}

        {/* CTA Final */}
        <div
          className="mt-16 rounded-[28px] border border-[#c9a84c]/15 p-8 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(201,168,76,0.1), transparent)",
          }}
        >
          <SvgIcon name="predicciones" size={48} className="mx-auto mb-4 block" />
          <h2 className="mb-3 text-2xl font-black sm:text-[28px]">{cT.ctaTitle}</h2>
          <p className="mx-auto mb-6 max-w-lg text-base text-[#8a94b0]">
            {cT.ctaDesc}
          </p>
          <Link
            href="/app/predicciones"
            className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-br from-[#c9a84c] to-[#e8d48b] px-8 py-4 text-base font-extrabold text-[#060B14] no-underline shadow-[0_8px_32px_rgba(201,168,76,0.3)] transition-transform hover:scale-[1.02]"
          >
            {cT.ctaBtn}
          </Link>
        </div>
      </div>

      {/* Panel de filtros */}
      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        phase={phase}
        setPhase={setPhase}
        group={group}
        setGroup={setGroup}
        teamFilter={teamFilter}
        setTeamFilter={setTeamFilter}
        venueFilter={venueFilter}
        setVenueFilter={setVenueFilter}
        favoritesOnly={favoritesOnly}
        setFavoritesOnly={setFavoritesOnly}
        teamOptions={teamOptions}
        venueOptions={venueOptions}
        resultCount={filtered.length}
        hasActiveFilters={activeFilterCount > 0}
        onClear={clearFilters}
      />

      {/* Modal de partido */}
      {selected && (
        <MatchModal
          m={selected}
          tz={tz}
          live={liveMap[selected.i]}
          onClose={() => openMatch(null)}
          onNav={handleNav}
        />
      )}
    </div>
  );
}
