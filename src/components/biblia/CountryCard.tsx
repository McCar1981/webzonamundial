// CountryCard — Sección 2: Ficha país + federación.
// Migrado a SectionCard + tokens BIBLIA. Iconos azul con glow sutil.

import type { NationalTeam } from "@/types/team";
import SectionCard, { SectionHeader } from "./SectionCard";
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

  return (
    <SectionCard id="ficha">
      <SectionHeader eyebrow="Ficha país" title={`Sobre ${team.name_es}`} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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

      {fed ? (
        <div className="mt-10">
          <FederationHeader iso={team.iso} />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <FieldCard icon={<PersonIcon />} label="Nombre" value={fed.name} />
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
                className="bb-focusable group sm:col-span-2 lg:col-span-1"
                aria-label={`Web oficial: ${fed.website}, abre en nueva pestaña`}
              >
                <FieldCard
                  icon={<GlobeIcon />}
                  label="Web oficial"
                  value={
                    <span className="inline-flex items-center gap-2 text-[var(--bb-gold)] group-hover:underline">
                      {fed.website
                        .replace(/^https?:\/\//, "")
                        .replace(/\/$/, "")}
                      <span className="opacity-60" aria-hidden>
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
    </SectionCard>
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
      className="rounded-2xl border p-4 flex items-start gap-3 transition-colors hover:border-[var(--bb-gold)]/25"
      style={{
        borderColor: "var(--bb-border-subtle)",
        background:
          "linear-gradient(135deg, rgba(11,24,37,0.7), rgba(15,23,42,0.45))",
      }}
    >
      <span
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
        aria-hidden
      >
        <span
          className="absolute inset-0 rounded-xl"
          style={{
            background:
              "radial-gradient(circle, rgba(96,165,250,0.18), transparent 70%)",
            filter: "blur(4px)",
          }}
        />
        <span
          className="absolute inset-0 rounded-xl border"
          style={{
            borderColor: "var(--bb-border-blue)",
            background: "rgba(11,24,37,0.6)",
          }}
        />
        <span className="relative text-[var(--bb-icon-blue)]">{icon}</span>
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--bb-text-muted)] mb-1">
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
      <div className="text-[10px] font-bold text-[var(--bb-gold)] uppercase tracking-[0.25em]">
        Federación
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
