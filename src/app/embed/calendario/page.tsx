// /embed/calendario — versión iframe-friendly del calendario para que medios
// externos lo embeban con un <iframe>. Sin header global, footer ni promos.
//
// Filtros opcionales por query string:
//   ?team=es           → solo partidos de un equipo (flag ISO)
//   ?phase=grupos      → solo fase de grupos
//   ?venue=us          → solo sedes de un país
//   ?compact=1         → modo compacto (sin imagen banderas)
//
// Uso desde un blog externo:
//   <iframe src="https://zonamundial.app/embed/calendario?team=es"
//           width="100%" height="600" frameborder="0"
//           style="border:0;border-radius:14px"></iframe>

import type { Metadata } from "next";
import Link from "next/link";
import { MATCHES } from "@/data/matches";

export const metadata: Metadata = {
  title: "Calendario Mundial 2026 — Embed",
  robots: { index: false, follow: true },
};

export const dynamic = "force-static";

interface PageProps {
  searchParams: {
    team?: string;
    phase?: string;
    venue?: string;
    compact?: string;
  };
}

const PHASE_MAP: Record<string, string> = {
  grupos: "Fase de grupos",
  "fase-de-grupos": "Fase de grupos",
  octavos: "Octavos",
  cuartos: "Cuartos",
  semis: "Semifinales",
  semifinales: "Semifinales",
  final: "Final",
  "tercer-puesto": "Tercer puesto",
};

function flagSrc(iso: string): string {
  return `https://flagcdn.com/${iso}.svg`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function EmbedCalendarioPage({ searchParams }: PageProps) {
  const teamFilter = (searchParams.team || "").toLowerCase().trim();
  const phaseFilter = (searchParams.phase || "").toLowerCase().trim();
  const venueFilter = (searchParams.venue || "").toLowerCase().trim();
  const compact = searchParams.compact === "1";

  let filtered = MATCHES;
  if (teamFilter) {
    filtered = filtered.filter(
      (m) => m.hf.toLowerCase() === teamFilter || m.af.toLowerCase() === teamFilter
    );
  }
  if (phaseFilter) {
    const targetPhase = PHASE_MAP[phaseFilter] || phaseFilter;
    filtered = filtered.filter((m) => m.p.toLowerCase().includes(targetPhase.toLowerCase()));
  }
  if (venueFilter) {
    filtered = filtered.filter((m) => m.vf.toLowerCase() === venueFilter);
  }

  return (
    <div
      style={{
        background: "#060B14",
        color: "#fff",
        fontFamily: "Outfit, system-ui, sans-serif",
        minHeight: "100vh",
        padding: "16px 12px 24px",
      }}
    >
      {/* Header mini */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          padding: "8px 12px",
          borderRadius: 10,
          background: "linear-gradient(180deg, rgba(15,31,48,0.6), rgba(11,24,37,0.4))",
          border: "1px solid rgba(201,168,76,0.20)",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#C9A84C",
              fontWeight: 700,
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            // CALENDARIO MUNDIAL 2026
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
            {filtered.length} {filtered.length === 1 ? "partido" : "partidos"}
            {teamFilter && ` · equipo: ${teamFilter.toUpperCase()}`}
          </div>
        </div>
        <Link
          href="/calendario"
          target="_top"
          style={{
            fontSize: 11,
            color: "#FDE68A",
            textDecoration: "none",
            padding: "5px 12px",
            borderRadius: 99,
            border: "1px solid rgba(201,168,76,0.30)",
            fontWeight: 600,
          }}
        >
          Ver completo →
        </Link>
      </div>

      {/* Lista partidos */}
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.length === 0 && (
          <li
            style={{
              padding: 24,
              textAlign: "center",
              color: "#94a3b8",
              fontSize: 14,
              border: "1px dashed rgba(255,255,255,0.10)",
              borderRadius: 12,
            }}
          >
            No hay partidos que coincidan con tus filtros.
          </li>
        )}
        {filtered.map((m) => (
          <li
            key={m.i}
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto 1fr auto",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.06)",
              fontSize: 13,
            }}
          >
            <div
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10,
                color: "#94a3b8",
                minWidth: 80,
              }}
            >
              {fmtDate(m.d)}
              <div style={{ color: "#C9A84C", marginTop: 2 }}>{m.t}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end", minWidth: 0 }}>
              <span style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {m.h}
              </span>
              {!compact && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={flagSrc(m.hf)} alt="" width={18} height={13} style={{ borderRadius: 2 }} />
              )}
            </div>
            <div
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 11,
                color: "#FDE68A",
                padding: "2px 8px",
                borderRadius: 99,
                background: "rgba(201,168,76,0.10)",
              }}
            >
              vs
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              {!compact && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={flagSrc(m.af)} alt="" width={18} height={13} style={{ borderRadius: 2 }} />
              )}
              <span style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {m.a}
              </span>
            </div>
            <div
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 9,
                color: "#94a3b8",
                textAlign: "right",
                minWidth: 60,
              }}
            >
              {m.vc}
            </div>
          </li>
        ))}
      </ul>

      {/* Footer mini con branding */}
      <div
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 11,
          color: "#94a3b8",
        }}
      >
        <span>
          Datos · <Link href="/calendario" target="_top" style={{ color: "#FDE68A", textDecoration: "none" }}>zonamundial.app</Link>
        </span>
        <span style={{ fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.1em" }}>
          MUNDIAL 2026
        </span>
      </div>
    </div>
  );
}
