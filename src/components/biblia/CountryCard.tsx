// Server Component
// Sección 2: Ficha país + federación.

import type { NationalTeam } from "@/types/team";

export default function CountryCard({ team }: { team: NationalTeam }) {
  const country = team.country;
  const fed = team.federation;
  if (!country && !fed) return null;

  return (
    <section
      id="ficha"
      className="rounded-2xl border border-[#1E293B]/50 p-6 sm:p-8"
      style={{
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.6), rgba(11,24,37,0.4))",
      }}
    >
      <div className="mb-6">
        <div className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest mb-2">
          Ficha país
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          Sobre {team.name_es}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {country?.capital ? (
          <Field label="Capital" value={country.capital} />
        ) : null}
        {country?.population ? (
          <Field
            label="Población"
            value={`${country.population.toLocaleString("es-ES")} hab.`}
          />
        ) : null}
        {country?.area_km2 ? (
          <Field
            label="Superficie"
            value={`${country.area_km2.toLocaleString("es-ES")} km²`}
          />
        ) : null}
        {country?.language_official?.length ? (
          <Field
            label="Idioma oficial"
            value={country.language_official.join(", ")}
          />
        ) : null}
        {country?.continent ? (
          <Field label="Continente" value={country.continent} />
        ) : null}
        {country?.timezone ? (
          <Field label="Zona horaria" value={country.timezone} />
        ) : null}
      </div>

      {fed ? (
        <div className="mt-6 pt-6 border-t border-white/5">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
            Federación
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Nombre" value={fed.name} />
            {fed.abbreviation ? (
              <Field label="Abreviatura" value={fed.abbreviation} />
            ) : null}
            {fed.founded ? (
              <Field label="Fundada" value={String(fed.founded)} />
            ) : null}
            {fed.headquarters ? (
              <Field label="Sede" value={fed.headquarters} />
            ) : null}
            {fed.website ? (
              <div className="rounded-xl bg-[#0B1825]/50 border border-[#1E293B]/50 p-4">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Web oficial
                </div>
                <a
                  href={fed.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-[#C9A84C] hover:underline break-all"
                >
                  {fed.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#0B1825]/50 border border-[#1E293B]/50 p-4">
      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-sm font-semibold text-white">{value}</div>
    </div>
  );
}
