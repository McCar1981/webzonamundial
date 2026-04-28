// Server Component — wrapper de la ficha BIBLIA Mundial 2026.
// Compone Hero + Mini-nav + secciones siempre visibles + tabs profundos.

import type { NationalTeam } from "@/types/team";
import HeroSection from "@/components/biblia/HeroSection";
import MiniNav from "@/components/biblia/MiniNav";

const SECTIONS = [
  { id: "identidad", label: "Identidad" },
  { id: "ficha", label: "País" },
  { id: "equipacion", label: "Camiseta" },
  { id: "grupo", label: "Grupo" },
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

      {/* SECCIONES — placeholders por ahora; se rellenan en commits siguientes */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-16">
        <PlaceholderSection
          id="ficha"
          title="Ficha país y federación"
          note="Pendiente — commit 3"
        />
        <PlaceholderSection
          id="equipacion"
          title="Equipación oficial"
          note="Pendiente — commit 3"
        />
        <PlaceholderSection
          id="grupo"
          title="Grupo y partidos en Mundial 2026"
          note="Pendiente — commit 3"
        />
        <PlaceholderSection
          id="clasificacion"
          title="Camino al Mundial 2026"
          note="Pendiente — commit 4"
        />
        <PlaceholderSection
          id="plantilla"
          title="Posibles convocados"
          note="Pendiente — commit 5"
        />
        <PlaceholderSection
          id="once"
          title="11 Ideal — Campo digital"
          note="Pendiente — commit 5"
        />
        <PlaceholderSection
          id="analisis"
          title="Análisis profesional"
          note="Pendiente — commit 6"
        />
        <PlaceholderSection
          id="profundidad"
          title="Historia · Palmarés · Récords · Icónicos · Curiosidades"
          note="Pendiente — commit 6 (TABS profundos)"
        />
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
