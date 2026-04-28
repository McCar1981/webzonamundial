// Server Component
// Sección 2: Ficha país + federación.
// Diseño v2: cards con iconos line-art azul + glow,
// bandera de fondo decorativa a la derecha.

import type { NationalTeam } from "@/types/team";
import {
  CapitalIcon,
  PeopleIcon,
  MapIcon,
  ChatIcon,
  GlobeIcon,
  ClockIcon,
  PersonIcon,
  ShieldIcon,
  CalendarIcon,
  StadiumIcon,
  ExternalIcon,
} from "./icons";

export default function CountryCard({ team }: { team: NationalTeam }) {
  const country = team.country;
  const fed = team.federation;
  if (!country && !fed) return null;

  const flagUrl = `https://flagcdn.com/w1280/${team.iso}.png`;

  return (
    <section
      id="ficha"
      className="relative rounded-3xl border border-[#1E293B]/60 overflow-hidden p-6 sm:p-10"
      style={{
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.92), rgba(11,24,37,0.85))",
      }}
    >
      {/* Bandera decorativa de fondo a la derecha */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 hidden md:block"
        style={{
          width: "55%",
          background: `url(${flagUrl}) right center / cover no-repeat`,
          maskImage:
            "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.85) 100%)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.85) 100%)",
          opacity: 0.55,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 25% 30%, rgba(201,168,76,0.06), transparent 60%)",
        }}
      />

      <div className="relative z-10">
        {/* Encabezado */}
        <div className="mb-7">
          <div className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-[0.25em] mb-3">
            Ficha país
          </div>
          <h2
            className="font-black text-white"
            style={{
              fontSize: "clamp(28px, 4.5vw, 48px)",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            Sobre {team.name_es}
          </h2>
        </div>

        {/* Grid 6 campos país (1 col en mobile, 2 en sm, 3 en md+) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 max-w-[860px]">
          {country?.capital ? (
            <FieldCard icon={<CapitalIcon />} label="Capital" value={country.capital} />
          ) : null}
          {country?.population ? (
            <FieldCard
              icon={<PeopleIcon />}
              label="Población"
              value={`${country.population.toLocaleString("es-ES")} hab.`}
            />
          ) : null}
          {country?.area_km2 ? (
            <FieldCard
              icon={<MapIcon />}
              label="Superficie"
              value={`${country.area_km2.toLocaleString("es-ES")} km²`}
            />
          ) : null}
          {country?.language_official?.length ? (
            <FieldCard
              icon={<ChatIcon />}
              label="Idioma oficial"
              value={country.language_official.join(", ")}
            />
          ) : null}
          {country?.continent ? (
            <FieldCard
              icon={<GlobeIcon />}
              label="Continente"
              value={country.continent}
            />
          ) : null}
          {country?.timezone ? (
            <FieldCard
              icon={<ClockIcon />}
              label="Zona horaria"
              value={country.timezone}
              tight
            />
          ) : null}
        </div>

        {/* Federación */}
        {fed ? (
          <div className="mt-10 max-w-[860px]">
            <FederationHeader iso={team.iso} />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <FieldCard
                icon={<PersonIcon />}
                label="Nombre"
                value={fed.name}
              />
              {fed.abbreviation ? (
                <FieldCard
                  icon={<ShieldIcon />}
                  label="Abreviatura"
                  value={fed.abbreviation}
                />
              ) : null}
              {fed.founded ? (
                <FieldCard
                  icon={<CalendarIcon />}
                  label="Fundada"
                  value={String(fed.founded)}
                />
              ) : null}
              {fed.headquarters ? (
                <FieldCard
                  icon={<StadiumIcon />}
                  label="Sede"
                  value={fed.headquarters}
                />
              ) : null}
              {fed.website ? (
                <a
                  href={fed.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group sm:col-span-2 md:col-span-1"
                >
                  <FieldCard
                    icon={<GlobeIcon />}
                    label="Web oficial"
                    value={
                      <span className="inline-flex items-center gap-2 text-[#C9A84C] group-hover:underline">
                        {fed.website
                          .replace(/^https?:\/\//, "")
                          .replace(/\/$/, "")}
                        <span
                          className="opacity-60 group-hover:opacity-100 transition-opacity"
                          aria-hidden
                        >
                          <ExternalIcon className="w-3.5 h-3.5" />
                        </span>
                      </span>
                    }
                  />
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ─────────── Sub-componentes ─────────── */

function FieldCard({
  icon,
  label,
  value,
  tight,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tight?: boolean;
}) {
  return (
    <article
      className="rounded-2xl border p-4 flex items-start gap-3 transition-colors hover:border-[#C9A84C]/25"
      style={{
        borderColor: "rgba(255,255,255,0.06)",
        background:
          "linear-gradient(135deg, rgba(11,24,37,0.7), rgba(15,23,42,0.45))",
      }}
    >
      <span className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0">
        <span
          aria-hidden
          className="absolute inset-0 rounded-xl"
          style={{
            background:
              "radial-gradient(circle, rgba(96,165,250,0.18), transparent 70%)",
            filter: "blur(4px)",
          }}
        />
        <span
          aria-hidden
          className="absolute inset-0 rounded-xl border"
          style={{
            borderColor: "rgba(96,165,250,0.18)",
            background: "rgba(11,24,37,0.6)",
          }}
        />
        <span className="relative text-[#7CC0FF]">{icon}</span>
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1">
          {label}
        </div>
        <div
          className={`text-white font-semibold ${tight ? "text-xs sm:text-sm" : "text-sm sm:text-base"} leading-snug break-words`}
        >
          {value}
        </div>
      </div>
    </article>
  );
}

function FederationHeader({ iso }: { iso: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span
        className="inline-flex items-center justify-center w-10 h-10 rounded-xl border overflow-hidden flex-shrink-0"
        style={{
          borderColor: "rgba(201,168,76,0.3)",
          background: "rgba(201,168,76,0.06)",
        }}
        aria-hidden
      >
        <img
          src={`https://flagcdn.com/w80/${iso}.png`}
          alt=""
          className="w-full h-full object-cover"
        />
      </span>
      <div>
        <div className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-[0.25em]">
          Federación
        </div>
      </div>
      <span
        aria-hidden
        className="flex-1 h-px"
        style={{
          background:
            "linear-gradient(90deg, rgba(201,168,76,0.3), transparent)",
        }}
      />
    </div>
  );
}
