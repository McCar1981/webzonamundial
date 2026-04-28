// Server Component
// Sección 11 + 12 — Cuerpo técnico + base de entrenamiento + sedes propias.
// Combinadas en un bloque para que sean compactas (la 12 enlaza al detalle
// que ya vive en /sedes).

import Link from "next/link";
import type { NationalTeam } from "@/types/team";

export default function CoachAndBase({ team }: { team: NationalTeam }) {
  const coach = team.wc_2026?.coach;
  const captain = team.wc_2026?.captain;
  const star = team.wc_2026?.star_player;
  const base = team.wc_2026?.base_camp;
  const schedule = team.wc_2026?.schedule ?? [];

  // Stadiums únicos del calendario (las 3 sedes propias)
  const venues = Array.from(
    new Map(
      schedule
        .filter((m) => m.venue?.stadium && !m.venue.stadium.startsWith("["))
        .map((m) => [m.venue!.stadium, m.venue!])
    ).values()
  );

  if (!coach && !base && venues.length === 0) return null;

  return (
    <section
      id="sedes"
      className="rounded-2xl border border-[#1E293B]/50 p-6 sm:p-8"
      style={{
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.6), rgba(11,24,37,0.4))",
      }}
    >
      <div className="mb-6">
        <div className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest mb-2">
          Cuerpo técnico · Base · Sedes
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          Quién dirige y dónde juega {team.name_es}
        </h2>
      </div>

      {/* DT + capitán + estrella */}
      {(coach || captain || star) ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          {coach ? (
            <RoleCard
              role="DT"
              name={coach.name}
              meta={
                [
                  coach.age ? `${coach.age} años` : null,
                  coach.nationality,
                  coach.since ? `desde ${coach.since.slice(0, 4)}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")
              }
              note={coach.profile_summary}
            />
          ) : null}
          {captain ? (
            <RoleCard
              role="Capitán"
              name={captain.name}
              meta={captain.club}
            />
          ) : null}
          {star ? (
            <RoleCard
              role="Estrella"
              name={star.name}
              meta={star.club}
              note={star.reason}
              accent
            />
          ) : null}
        </div>
      ) : null}

      {/* Base de entrenamiento */}
      {base ? (
        <div className="mb-8">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
            Base de entrenamiento · Mundial 2026
          </div>
          <div className="rounded-xl border border-[#1E293B]/60 bg-[#0B1825]/50 p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">📍</span>
              <div className="text-base font-bold text-white">
                {!base.city.startsWith("[")
                  ? `${base.city}${base.country ? `, ${base.country}` : ""}`
                  : `Base por confirmar${base.country ? ` · ${base.country}` : ""}`}
              </div>
            </div>
            {base.facility_name && !base.facility_name.startsWith("[") ? (
              <div className="text-sm text-gray-400 ml-7">
                {base.facility_name}
              </div>
            ) : null}
            {base.status === "pending" || base.status === "needs_review" ? (
              <div className="text-[11px] text-gray-500 mt-2 ml-7 italic">
                Anuncio oficial pendiente de la federación.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Sedes donde juega la fase de grupos */}
      {venues.length > 0 ? (
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
            Sus {venues.length} sedes en fase de grupos
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {venues.map((v, i) => (
              <Link
                key={i}
                href={`/sedes/${slugifyStadium(v.stadium)}`}
                className="group rounded-xl border border-[#1E293B]/60 bg-[#0B1825]/50 p-4 hover:border-[#C9A84C]/30 transition-all"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  {v.country_iso?.toUpperCase() ?? ""}
                </div>
                <div className="text-sm font-bold text-white group-hover:text-[#C9A84C] transition-colors">
                  {v.stadium}
                </div>
                {v.city ? (
                  <div className="text-xs text-gray-500 mt-1">{v.city}</div>
                ) : null}
              </Link>
            ))}
          </div>
          <Link
            href="/sedes"
            className="inline-flex items-center gap-1.5 text-xs text-[#C9A84C] mt-4 hover:underline font-semibold"
          >
            Ver las 16 sedes del Mundial 2026 →
          </Link>
        </div>
      ) : null}
    </section>
  );
}

function RoleCard({
  role,
  name,
  meta,
  note,
  accent,
}: {
  role: string;
  name: string;
  meta?: string;
  note?: string;
  accent?: boolean;
}) {
  return (
    <article
      className="rounded-xl border p-4"
      style={{
        borderColor: accent ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.06)",
        background: accent ? "rgba(201,168,76,0.05)" : "rgba(11,24,37,0.5)",
      }}
    >
      <div
        className="text-[10px] font-bold uppercase tracking-widest mb-2"
        style={{ color: accent ? "#C9A84C" : "#9ca3af" }}
      >
        {role}
      </div>
      <div className="text-base font-black text-white mb-1">{name}</div>
      {meta ? <div className="text-xs text-gray-500 mb-2">{meta}</div> : null}
      {note ? (
        <div className="text-xs text-gray-400 leading-relaxed line-clamp-4">
          {note}
        </div>
      ) : null}
    </article>
  );
}

/** Heurístico — convierte nombre de estadio a slug. Provisional hasta tener
 *  un mapa stadium→slug oficial coherente con la sección /sedes. */
function slugifyStadium(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
