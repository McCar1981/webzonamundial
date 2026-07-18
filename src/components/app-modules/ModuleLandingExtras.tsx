// src/components/app-modules/ModuleLandingExtras.tsx
// Bloque que agrupa los 3 componentes que añadimos al final de cada landing
// /app/[slug]: CTA de notificación, comparativa Free vs Founders y FAQ con
// schema. Una sola línea por landing.
//
// Uso:
//   <ModuleLandingExtras slug="predicciones" />

import ModuleNotifyCTA from "./ModuleNotifyCTA";
import ModuleFreeVsFounders from "./ModuleFreeVsFounders";
import ModuleFAQ from "./ModuleFAQ";
import { getModuleContent } from "@/data/app-modules-content";

interface Props {
  slug: string;
  /** Si quieres pasar otro label diferente al canónico (raro). */
  labelOverride?: string;
}

export default function ModuleLandingExtras({ slug, labelOverride }: Props) {
  const content = getModuleContent(slug);
  if (!content) return null;

  const label = labelOverride || content.label;

  return (
    <section
      style={{
        background:
          "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(201,168,76,0.08), transparent 60%), linear-gradient(180deg, #000000, #0a0906)",
        padding: "clamp(40px, 6vw, 72px) 20px",
        color: "#fff",
        fontFamily: "Outfit, system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <ModuleNotifyCTA slug={slug} label={label} />
        <ModuleFreeVsFounders moduleLabel={label} rows={content.compare} />
        <ModuleFAQ moduleLabel={label} items={content.faq} />
      </div>
    </section>
  );
}
