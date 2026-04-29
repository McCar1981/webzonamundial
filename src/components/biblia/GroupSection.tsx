import Link from "next/link";
import type { NationalTeam } from "@/types/team";
import SectionCard, { SectionHeader } from "./SectionCard";

export default function GroupSection({ team }: { team: NationalTeam }) {
  const group = team.wc_2026?.group_2026;
  if (!group?.letter || !group.teams?.length) return null;

  const rivals = group.teams.filter((t) => t.iso !== team.iso);
  const groupSlug = `grupo-${group.letter.toLowerCase()}`;

  return (
    <SectionCard id="grupo">
      <SectionHeader
        eyebrow="Su grupo · Mundial 2026"
        title={`Grupo ${group.letter}`}
        subtitle={group.label ?? undefined}
        action={
          <Link
            href={`/grupos/${groupSlug}`}
            className="bb-focusable inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[var(--bb-gold)] text-xs font-bold uppercase tracking-wider hover:bg-[var(--bb-gold)]/10 transition-all bb-touch"
            style={{
              borderColor: "rgba(201,168,76,0.3)",
              background: "rgba(201,168,76,0.05)",
            }}
          >
            Ver grupo y simulador
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {rivals.map((r) => (
          <Link
            key={r.iso}
            href={`/selecciones/${slugFromName(r.name)}`}
            className="bb-focusable group rounded-xl border bg-[var(--bb-card-ghost)] p-4 transition-all hover:border-[var(--bb-gold)]/30 hover:bg-[var(--bb-gold)]/5 bb-touch"
            style={{ borderColor: "var(--bb-border-subtle)" }}
          >
            <div className="flex items-center gap-3">
              <span
                className="w-12 h-9 rounded-md overflow-hidden flex-shrink-0 border border-white/5"
                style={{ background: "#0B1825" }}
                aria-hidden
              >
                <img
                  src={`https://flagcdn.com/w160/${r.iso}.png`}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white group-hover:text-[var(--bb-gold)] transition-colors truncate">
                  {r.name}
                </div>
                <div className="text-[10px] text-[var(--bb-text-muted)] mt-0.5">
                  {r.fifa_rank ? `FIFA #${r.fifa_rank}` : "FIFA #—"}
                </div>
              </div>
              <svg
                className="w-4 h-4 text-[var(--bb-text-dim)] group-hover:text-[var(--bb-gold)] transition-colors flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {group.notes ? (
        <p className="text-[11px] text-[var(--bb-text-dim)] mt-4 italic">
          {group.notes}
        </p>
      ) : null}
    </SectionCard>
  );
}

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
