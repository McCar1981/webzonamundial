// Bloque de transparencia editorial al pie de cada ficha de selección.
// Muestra: autoría (equipo editorial ZonaMundial), fecha última actualización,
// método de verificación y número de fuentes consultadas. Vital para E-E-A-T
// y trust signals de AdSense/Google.
//
// Server component: no necesita JS.

import Link from "next/link";
import type { NationalTeam } from "@/types/team";

const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const MID = "rgba(255,255,255,0.65)";
const DIM = "rgba(255,255,255,0.40)";

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function EditorialMeta({ team }: { team: NationalTeam }) {
  const meta = team._meta;
  if (!meta) return null;

  const sources = meta.sources_validated?.length ?? 0;
  const lastUpdated = formatDate(meta.last_updated);

  return (
    <section
      aria-label="Información editorial"
      style={{
        marginTop: 48,
        padding: "28px 28px 24px",
        background: "rgba(11,24,37,0.5)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
        fontSize: 14,
        color: MID,
        lineHeight: 1.6,
      }}
    >
      <header
        style={{
          display: "flex",
          gap: 14,
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${GOLD}, #8B6914)`,
            display: "grid",
            placeItems: "center",
            color: "#060B14",
            fontWeight: 800,
            fontSize: 16,
            letterSpacing: "-0.02em",
            flexShrink: 0,
          }}
        >
          ZM
        </div>
        <div>
          <div style={{ color: "#E2E8F0", fontWeight: 600, fontSize: 15, marginBottom: 2 }}>
            Editorial ZonaMundial
          </div>
          <div style={{ color: DIM, fontSize: 12, letterSpacing: "0.05em" }}>
            Última actualización: <span style={{ color: GOLD }}>{lastUpdated}</span>
            {sources > 0 && (
              <>
                {" "}· Verificado con <span style={{ color: GOLD }}>{sources}</span> fuente
                {sources === 1 ? "" : "s"} oficial{sources === 1 ? "" : "es"}
              </>
            )}
          </div>
        </div>
      </header>

      <p style={{ margin: "0 0 12px" }}>
        Esta ficha de la selección de <strong style={{ color: "#E2E8F0" }}>{team.name_es}</strong> ha sido redactada,
        verificada y mantenida por el equipo editorial de ZonaMundial. Los datos numéricos (ranking FIFA, títulos,
        plantilla, calendario de clasificación, partidos icónicos) se cruzan con fuentes oficiales antes de publicarse:
        federaciones nacionales, FIFA.com, ESPN, medios especializados (Marca, Olé, A Bola, L&apos;Équipe, The Athletic)
        y archivos históricos verificados como RSSSF.
      </p>

      {meta.validation_method && (
        <p style={{ margin: "0 0 12px", fontSize: 13, color: MID }}>
          <strong style={{ color: "#E2E8F0" }}>Método de verificación:</strong> {meta.validation_method}
        </p>
      )}

      <p style={{ margin: "0 0 16px", fontSize: 13, color: DIM }}>
        Si detectas un error factual, una atribución incorrecta o un dato desactualizado, escríbenos a{" "}
        <a href="mailto:gol@zonamundial.app" style={{ color: GOLD }}>
          gol@zonamundial.app
        </a>{" "}
        indicando la URL del artículo y la corrección sugerida con su fuente. Publicamos erratas con marca de tiempo
        cuando corresponde.
      </p>

      <div
        style={{
          display: "flex",
          gap: 14,
          flexWrap: "wrap",
          fontSize: 12,
          paddingTop: 14,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          color: DIM,
          letterSpacing: "0.04em",
        }}
      >
        <Link href="/sobre" style={{ color: GOLD2, textDecoration: "none" }}>
          → Sobre ZonaMundial
        </Link>
        <Link href="/contacto" style={{ color: GOLD2, textDecoration: "none" }}>
          → Contacto y correcciones
        </Link>
        <Link href="/legal/privacidad" style={{ color: GOLD2, textDecoration: "none" }}>
          → Política de privacidad
        </Link>
      </div>
    </section>
  );
}
