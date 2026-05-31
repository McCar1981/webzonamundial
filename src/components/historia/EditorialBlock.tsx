// src/components/historia/EditorialBlock.tsx
// Server component: renderiza el artículo editorial extenso de una página
// /historia/* a partir de su slug. Añade prosa original sustancial + FAQ con
// datos estructurados JSON-LD (FAQPage) para SEO/AdSense. Si no hay contenido
// para el slug, no renderiza nada.

import { HISTORIA_EDITORIAL } from "@/data/historia-editorial";

export default function EditorialBlock({ slug }: { slug: string }) {
  const article = HISTORIA_EDITORIAL[slug];
  if (!article) return null;

  const faqLd =
    article.faq && article.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: article.faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;

  return (
    <section className="mt-16 border-t border-[#1E293B] pt-10 mb-12">
      <article className="max-w-3xl">
        <p className="text-base sm:text-lg text-gray-300 leading-relaxed mb-8">
          {article.lead}
        </p>

        {article.sections.map((s) => (
          <div key={s.h} className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 leading-snug">
              {s.h}
            </h2>
            {s.body.map((p, i) => (
              <p
                key={i}
                className="text-[15px] sm:text-base text-gray-300 leading-relaxed mb-3"
              >
                {p}
              </p>
            ))}
          </div>
        ))}

        {article.faq && article.faq.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              Preguntas frecuentes
            </h2>
            <div className="flex flex-col gap-4">
              {article.faq.map((f) => (
                <div
                  key={f.q}
                  className="rounded-xl border border-[#1E293B] bg-[#0B1825] p-4"
                >
                  <h3 className="text-[15px] sm:text-base font-bold text-[#c9a84c] mb-1.5">
                    {f.q}
                  </h3>
                  <p className="text-sm sm:text-[15px] text-gray-300 leading-relaxed">
                    {f.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </article>

      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}
    </section>
  );
}
