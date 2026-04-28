// Server Component
// Sección 3: Equipación oficial Mundial 2026.

import type { NationalTeam } from "@/types/team";

export default function KitSection({ team }: { team: NationalTeam }) {
  const kit = team.kit?.wc_2026;
  if (!kit) return null;

  const home = kit.home;
  const away = kit.away;
  const trivia = team.kit?.trivia ?? [];
  const validatedTrivia = trivia.filter(
    (t) => t.status === "validated" || t.status === "single_source"
  );

  return (
    <section
      id="equipacion"
      className="rounded-2xl border border-[#1E293B]/50 p-6 sm:p-8"
      style={{
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.6), rgba(11,24,37,0.4))",
      }}
    >
      <div className="mb-6">
        <div className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest mb-2">
          Equipación · Mundial 2026
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          Camiseta oficial{kit.brand ? ` · ${kit.brand}` : ""}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TITULAR */}
        <KitCard
          variant="home"
          frontUrl={home.front_url}
          primary={home.primary_color}
          secondary={home.secondary_color}
          description={home.description}
          alt={home.alt_text}
          label="Titular"
        />

        {/* VISITANTE */}
        <KitCard
          variant="away"
          frontUrl={away.front_url}
          primary={away.primary_color}
          secondary={away.secondary_color}
          description={away.description}
          alt={away.alt_text}
          label="Visitante"
        />
      </div>

      {/* TRIVIA validada */}
      {validatedTrivia.length > 0 ? (
        <div className="mt-6 space-y-3">
          {validatedTrivia.map((t, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#C9A84C]/15 bg-[#C9A84C]/[0.03] p-4 text-sm leading-relaxed text-gray-300"
            >
              <div className="flex items-start gap-2">
                <span className="text-[#C9A84C] flex-shrink-0">★</span>
                <div>
                  <p>{t.text}</p>
                  <p className="text-[10px] text-gray-600 mt-1.5 italic">
                    Fuente: {t.source}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function KitCard({
  frontUrl,
  primary,
  secondary,
  description,
  alt,
  label,
  variant,
}: {
  frontUrl: string | null;
  primary: string;
  secondary: string;
  description: string;
  alt: string;
  label: string;
  variant: "home" | "away";
}) {
  const hasImage = frontUrl && !frontUrl.startsWith("[");

  return (
    <div
      className="rounded-2xl border overflow-hidden flex flex-col"
      style={{
        borderColor: variant === "home" ? `${primary}33` : "rgba(255,255,255,0.08)",
        background: hasImage
          ? `radial-gradient(ellipse at center, ${primary}15 0%, transparent 70%), #0B1825`
          : "#0B1825",
      }}
    >
      {/* Imagen / placeholder */}
      <div
        className="relative flex items-center justify-center"
        style={{ aspectRatio: "1 / 1", padding: "12%" }}
      >
        {hasImage ? (
          <img
            src={frontUrl}
            alt={alt}
            className="w-full h-full object-contain"
            style={{
              filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.5))",
            }}
          />
        ) : (
          <div
            className="w-full h-full rounded-2xl flex items-center justify-center text-center text-xs font-bold uppercase tracking-wider"
            style={{
              background: `linear-gradient(135deg, ${primary}, ${secondary})`,
              color: "#000",
              opacity: 0.3,
            }}
          >
            Imagen pendiente
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-5 border-t border-white/5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            {label}
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-4 h-4 rounded-full border border-white/10"
              style={{ background: primary }}
              title={primary}
            />
            <span
              className="w-4 h-4 rounded-full border border-white/10"
              style={{ background: secondary }}
              title={secondary}
            />
          </div>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
