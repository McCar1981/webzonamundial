// Server Component — wrapper de la ficha BIBLIA Mundial 2026.
// Compone Hero + Mini-nav + secciones siempre visibles + tabs profundos.

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
  return (
    <div className="min-h-screen relative">
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

        {/* Pendientes en commits siguientes */}
        <PlaceholderSection
          id="sedes"
          title="Base + Sedes + CTA Final"
          note="Pendiente — commit 7"
        />
      </div>
    </div>
  );
}

function PlaceholderSection({
  id,
  title,
  note,
}: {
  id: string;
  title: string;
  note: string;
}) {
  return (
    <section
      id={id}
      className="rounded-2xl border border-[#1E293B]/50 p-8"
      style={{
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.4), rgba(11,24,37,0.2))",
      }}
    >
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-sm text-gray-500">{note}</p>
    </section>
  );
}
