// Server Component
// Sección 15 — CTA final: predice, liga privada, fantasy.

import Link from "next/link";
import type { NationalTeam } from "@/types/team";

export default function TeamCTA({ team }: { team: NationalTeam }) {
  const groupLetter = team.wc_2026?.group_2026?.letter?.toLowerCase();
  const groupHref = groupLetter ? `/grupos/grupo-${groupLetter}` : "/grupos";

  return (
    <section
      id="cta-final"
      className="relative rounded-3xl border p-6 sm:p-10 text-center overflow-hidden"
      style={{
        borderColor: "rgba(201,168,76,0.2)",
        background:
          "radial-gradient(ellipse at center, rgba(201,168,76,0.12), rgba(11,24,37,0.6))",
      }}
    >
      <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
        Vive el Mundial con{" "}
        <span className="bg-gradient-to-r from-[#C9A84C] via-[#FDE68A] to-[#C9A84C] bg-clip-text text-transparent">
          {team.name_es}
        </span>
      </h2>
      <p className="text-sm text-[var(--bb-text-muted)] max-w-xl mx-auto mb-8">
        Predice los partidos, compite con tu liga privada y arma tu fantasy.
        Todo gratis, todo en español.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
        <CTACard
          icon="🎯"
          title="Predice partidos"
          desc={`Los 3 de ${team.name_es} y los 104 del Mundial`}
          href={groupHref}
          primary
        />
        <CTACard
          icon="🏆"
          title="Liga privada"
          desc={`Únete a fans de ${team.name_es}`}
          href={`/app/ligas?team=${team.slug}`}
        />
        <CTACard
          icon="⚽"
          title="Fantasy"
          desc="Arma tu equipo con sus estrellas"
          href="/app/fantasy"
        />
      </div>
    </section>
  );
}

function CTACard({
  icon,
  title,
  desc,
  href,
  primary,
}: {
  icon: string;
  title: string;
  desc: string;
  href: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className="bb-focusable group rounded-xl p-5 border transition-all hover:scale-[1.02] bb-touch"
      style={{
        borderColor: primary
          ? "rgba(201,168,76,0.4)"
          : "rgba(255,255,255,0.08)",
        background: primary
          ? "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))"
          : "rgba(11,24,37,0.6)",
      }}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div
        className="text-sm font-bold mb-1"
        style={{ color: primary ? "#C9A84C" : "#fff" }}
      >
        {title}
      </div>
      <div className="text-xs text-[var(--bb-text-muted)] group-hover:text-[var(--bb-text-soft)] transition-colors">
        {desc}
      </div>
    </Link>
  );
}
