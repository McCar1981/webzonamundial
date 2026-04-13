// src/app/calendario/page.tsx
// ZonaMundial.app — Calendario del Mundial 2026 (Diseño ESPECTACULAR)

"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLanguage } from "@/i18n/LanguageContext";
import { AnimatedSection } from "@/components/AnimatedSection";
import { SvgIcon } from "@/components/icons";
import { SELECCIONES } from "@/data/selecciones";
import {
  MATCHES,
  PHASES,
  GROUPS,
  VENUES,
  flagUrl,
  GOLD,
  MID,
  DIM,
} from "@/data/matches";
import useCountdown from "@/hooks/useCountdown";
import {
  CountdownBanner,
  DateHeader,
  Dropdown,
  FilterBtn,
  MatchCard,
  MatchModal,
  MobileTimeline,
} from "./_components";

gsap.registerPlugin(ScrollTrigger);

const BG = "#060B14";

const COUNTRY_ORDER: Record<string, number> = { us: 0, mx: 1, ca: 2 };
const COUNTRY_LABELS: Record<string, string> = {
  us: "EE.UU.",
  mx: "México",
  ca: "Canadá",
};

export default function CalendarioPage() {
  const { t, locale } = useLanguage();
  const cT = t.calendario;
  const nav = t.nav;

  const [phase, setPhase] = useState("Fase de grupos");
  const [group, setGroup] = useState("all");
  const [selected, setSelected] = useState<(typeof MATCHES)[0] | null>(null);
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [venueFilter, setVenueFilter] = useState<string>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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
    const sortedVenues = [...VENUES].sort((a, b) => {
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
      MATCHES.filter((m) => {
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

  const grouped = useMemo(() => {
    const map = new Map<string, typeof MATCHES>();
    filtered.forEach((m) => {
      if (!map.has(m.d)) map.set(m.d, []);
      map.get(m.d)!.push(m);
    });
    return new Map([...map.entries()].sort());
  }, [filtered]);

  const handleNav = (id: number) => {
    const m = MATCHES.find((x) => x.i === id);
    if (m) setSelected(m);
  };

  // Animación de contenido al cambiar filtros
  useEffect(() => {
    if (!contentRef.current) return;
    gsap.fromTo(
      contentRef.current.children,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" }
    );
  }, [phase, group, teamFilter, venueFilter, favoritesOnly]);

  return (
    <div
      ref={scrollRef}
      className="min-h-screen text-white"
      style={{ background: BG }}
    >
      {/* Hero Section */}
      <div
        className="relative overflow-hidden px-6 pb-10 pt-5"
        style={{
          background: "linear-gradient(180deg, rgba(201,168,76,0.08), transparent)",
        }}
      >
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2"
          style={{
            background: "radial-gradient(circle, rgba(201,168,76,0.1), transparent 70%)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-6xl">
          <AnimatedSection>
            {/* Breadcrumb */}
            <div className="mb-5 flex items-center gap-2">
              <Link
                href="/"
                className="text-sm text-[#6a7a9a] no-underline transition-colors hover:text-white"
              >
                {nav.inicio}
              </Link>
              <span className="text-[#6a7a9a]">/</span>
              <span className="text-sm font-semibold text-[#c9a84c]">
                {nav.calendario}
              </span>
            </div>

            <div className="flex flex-col items-center gap-8 text-center">
              <div className="max-w-2xl">
                <span className="inline-block rounded-lg border border-[#c9a84c]/20 bg-[#c9a84c]/10 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-[0.2em] text-[#c9a84c]">
                  {cT.badge}
                </span>

                <h1
                  className="mb-4 mt-5 text-4xl font-black leading-none sm:text-6xl md:text-7xl"
                  style={{
                    background: "linear-gradient(135deg, #fff 0%, #c9a84c 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {cT.title}
                </h1>

                <p className="mx-auto mb-6 max-w-xl text-lg leading-relaxed text-[#8a94b0]">
                  {cT.subtitle}
                </p>

                <div className="flex flex-wrap justify-center gap-4">
                  <div className="rounded-2xl border border-white/[0.06] bg-[#0F1D32] px-6 py-4">
                    <p className="text-2xl font-black text-[#c9a84c] sm:text-[28px]">
                      {MATCHES.length}
                    </p>
                    <p className="text-[13px] text-[#6a7a9a]">{cT.partidos}</p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.06] bg-[#0F1D32] px-6 py-4">
                    <p className="text-2xl font-black text-white sm:text-[28px]">16</p>
                    <p className="text-[13px] text-[#6a7a9a]">{cT.sedes}</p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.06] bg-[#0F1D32] px-6 py-4">
                    <p className="text-2xl font-black text-white sm:text-[28px]">39</p>
                    <p className="text-[13px] text-[#6a7a9a]">{cT.dias}</p>
                  </div>
                </div>
              </div>

              <div className="w-full max-w-3xl">
                <CountdownBanner />
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="mx-auto max-w-6xl px-6 pb-20">
        {/* Tabs de Fase */}
        <div className="mb-4 flex gap-1 overflow-x-auto rounded-[20px] border border-white/5 bg-[#0F1D32] p-1.5">
          <FilterBtn
            label={cT.todas}
            active={phase === "all"}
            onClick={() => {
              setPhase("all");
              setGroup("all");
            }}
          />
          {PHASES.map((p) => (
            <FilterBtn
              key={p}
              label={p}
              active={phase === p}
              onClick={() => {
                setPhase(p);
                setGroup("all");
              }}
            />
          ))}
        </div>

        {/* Filtros avanzados sticky */}
        <div
          className="sticky top-0 z-30 -mx-2 mb-4 border-y border-white/5 px-2 py-3 backdrop-blur-sm sm:-mx-3 sm:px-3"
          style={{
            background:
              "linear-gradient(180deg, rgba(6,11,20,0.95) 0%, rgba(6,11,20,0.85) 100%)",
          }}
        >
          <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Dropdown
              label={cT.seleccion}
              value={teamFilter}
              options={teamOptions}
              onChange={setTeamFilter}
            />
            <Dropdown
              label={cT.sede}
              value={venueFilter}
              options={venueOptions}
              onChange={(v) => {
                if (!v.startsWith("__header_")) setVenueFilter(v);
              }}
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFavoritesOnly(!favoritesOnly)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                  favoritesOnly
                    ? "border-[#c9a84c]/40 bg-[#c9a84c]/15 text-[#c9a84c]"
                    : "border-white/8 bg-[#0B1825] text-[#8a94b0] hover:border-white/15"
                }`}
              >
                <svg
                  className="h-4 w-4"
                  fill={favoritesOnly ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                Solo favoritos
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="text-sm text-[#6a7a9a]">
                <strong className="text-white">{filtered.length}</strong>{" "}
                {cT.encontrados}
              </span>
              {(phase !== "all" ||
                group !== "all" ||
                teamFilter !== "all" ||
                venueFilter !== "all" ||
                favoritesOnly) && (
                <button
                  onClick={() => {
                    setPhase("all");
                    setGroup("all");
                    setTeamFilter("all");
                    setVenueFilter("all");
                    setFavoritesOnly(false);
                  }}
                  className="text-sm font-semibold text-[#c9a84c] hover:underline"
                >
                  {cT.limpiar}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs de Grupo (solo en fase de grupos) */}
        {(phase === "all" || phase === "Fase de grupos") && (
          <div className="mb-6 flex flex-wrap justify-center gap-1.5">
            <FilterBtn
              label={cT.todos}
              active={group === "all"}
              onClick={() => setGroup("all")}
            />
            {GROUPS.map((g) => (
              <button
                key={g}
                onClick={() => setGroup(g)}
                className="min-w-[44px] rounded-xl px-4 py-2 text-sm transition-all"
                style={{
                  border:
                    group === g
                      ? `2px solid ${GOLD}`
                      : "1px solid rgba(255,255,255,0.08)",
                  background:
                    group === g ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.03)",
                  color: group === g ? GOLD : MID,
                  fontWeight: group === g ? 800 : 500,
                }}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {/* Vista móvil: timeline */}
        <MobileTimeline matches={filtered} onClick={setSelected} />

        {/* Vista desktop: lista de partidos por fecha */}
        <div ref={contentRef} className="hidden sm:block">
          {[...grouped.entries()].map(([date, matches]) => (
            <div key={date} className="mb-8">
              <DateHeader date={date} count={matches.length} />

              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                }}
              >
                {matches.map((m) => (
                  <MatchCard key={m.i} m={m} onClick={() => setSelected(m)} />
                ))}
              </div>
            </div>
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
            <h3 className="mb-2 text-xl font-bold text-white">No hay partidos</h3>
            <p className="text-[#6a7a9a]">Ajusta los filtros para ver más partidos</p>
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

      {/* Modal de partido */}
      {selected && (
        <MatchModal
          m={selected}
          onClose={() => setSelected(null)}
          onNav={handleNav}
        />
      )}
    </div>
  );
}
