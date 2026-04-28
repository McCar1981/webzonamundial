// Server Component — wrapper de la ficha BIBLIA Mundial 2026.
// Compone Hero + Mini-nav + secciones siempre visibles + tabs profundos
// + cuerpo técnico + sedes + CTA + JSON-LD SportsTeam.

import type { NationalTeam } from "@/types/team";
import HeroSection from "@/components/biblia/HeroSection";
import MiniNav from "@/components/biblia/MiniNav";
import CountryCard from "@/components/biblia/CountryCard";
import KitSection from "@/components/biblia/KitSection";
import GroupSection from "@/components/biblia/GroupSection";
import ScheduleSection from "@/components/biblia/ScheduleSection";
import QualifyingPath from "@/components/biblia/QualifyingPath";
import SquadAndField from "@/components/biblia/SquadAndField";
import AnalysisSection from "@/components/biblia/AnalysisSection";
import DeepTabs from "@/components/biblia/DeepTabs";
import CoachAndBase from "@/components/biblia/CoachAndBase";
import TeamCTA from "@/components/biblia/TeamCTA";

const SECTIONS = [
  { id: "identidad", label: "Identidad" },
  { id: "ficha", label: "País" },
  { id: "equipacion", label: "Camiseta" },
  { id: "grupo", label: "Grupo" },
  { id: "schedule", label: "Partidos" },
  { id: "clasificacion", label: "Camino al Mundial" },
  { id: "plantilla", label: "Plantilla" },
  { id: "once", label: "11 Ideal" },
  { id: "analisis", label: "Análisis" },
  { id: "profundidad", label: "Historia & Datos" },
  { id: "sedes", label: "Sedes" },
];

export default function TeamPageBiblia({ team }: { team: NationalTeam }) {
  // Construye JSON-LD. Si el JSON ya trae seo.schema_org, lo usamos
  // tal cual. Si no, generamos uno mínimo desde los campos disponibles.
  const jsonLd = team.seo?.schema_org ?? buildSportsTeamJsonLd(team);

  return (
    <div className="min-h-screen relative">
      {/* JSON-LD SportsTeam */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HERO */}
      <HeroSection team={team} />

      {/* MINI-NAV STICKY */}
      <MiniNav sections={SECTIONS} />

      {/* SECCIONES */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        <CountryCard team={team} />
        <KitSection team={team} />
        <GroupSection team={team} />
        <ScheduleSection team={team} />
        <QualifyingPath team={team} />
        <SquadAndField team={team} />
        <AnalysisSection team={team} />
        <DeepTabs team={team} />
        <CoachAndBase team={team} />
        <TeamCTA team={team} />
      </div>
    </div>
  );
}

function buildSportsTeamJsonLd(team: NationalTeam): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: `Selección de ${team.name_es} de fútbol`,
    alternateName: team.nicknames ?? [],
    sport: "Football",
    memberOf: {
      "@type": "SportsOrganization",
      name: team.confederation,
    },
    coach: team.wc_2026?.coach
      ? { "@type": "Person", name: team.wc_2026.coach.name }
      : undefined,
    url: `https://www.zonamundial.app/selecciones/${team.slug}`,
  };
}
