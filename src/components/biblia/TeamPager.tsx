// TeamPager — navegación anterior/siguiente entre fichas BIBLIA.
// Server component (recibe lista de slugs disponibles desde el wrapper).

import Link from "next/link";

interface NavTeam {
  slug: string;
  name: string;
  iso: string;
}

export default function TeamPager({
  prev,
  next,
}: {
  prev: NavTeam | null;
  next: NavTeam | null;
}) {
  if (!prev && !next) return null;

  return (
    <nav
      aria-label="Navegación entre selecciones"
      className="grid grid-cols-2 gap-3 mt-4"
    >
      {prev ? (
        <PagerCard team={prev} direction="prev" />
      ) : (
        <span aria-hidden />
      )}
      {next ? (
        <PagerCard team={next} direction="next" />
      ) : (
        <span aria-hidden />
      )}
    </nav>
  );
}

function PagerCard({
  team,
  direction,
}: {
  team: NavTeam;
  direction: "prev" | "next";
}) {
  const isPrev = direction === "prev";
  return (
    <Link
      href={`/selecciones/${team.slug}`}
      className="bb-focusable group rounded-2xl border p-4 transition-all hover:border-[var(--bb-gold)]/30 hover:bg-[var(--bb-gold)]/[0.04]"
      style={{
        borderColor: "var(--bb-border-subtle)",
        background: "var(--bb-card-ghost)",
      }}
      aria-label={`${isPrev ? "Anterior" : "Siguiente"}: ${team.name}`}
    >
      <div className={`flex items-center gap-3 ${isPrev ? "" : "flex-row-reverse text-right"}`}>
        <svg
          className={`w-4 h-4 text-[var(--bb-text-muted)] group-hover:text-[var(--bb-gold)] transition-all flex-shrink-0 ${
            isPrev ? "group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          {isPrev ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.4}
              d="M15 19l-7-7 7-7"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.4}
              d="M9 5l7 7-7 7"
            />
          )}
        </svg>
        <span className="flex-1 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--bb-text-muted)] block">
            {isPrev ? "Anterior" : "Siguiente"}
          </span>
          <span className="text-base font-bold text-white block truncate group-hover:text-[var(--bb-gold)] transition-colors">
            {team.name}
          </span>
        </span>
        <span
          className="w-10 h-7 rounded-md overflow-hidden flex-shrink-0 border border-white/5"
          aria-hidden
        >
          <img
            src={`https://flagcdn.com/w160/${team.iso}.png`}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </span>
      </div>
    </Link>
  );
}
