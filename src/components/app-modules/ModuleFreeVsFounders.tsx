// src/components/app-modules/ModuleFreeVsFounders.tsx
// Tabla comparativa Free vs Founders Pass específica del módulo. Cada landing
// recibe una lista personalizada de filas que tipifican qué hace cada plan.

import Link from "next/link";

export interface CompareRow {
  feature: string;
  free: string | boolean;
  founders: string | boolean;
}

interface Props {
  /** Etiqueta del módulo, ej "Predicciones". */
  moduleLabel: string;
  rows: CompareRow[];
}

function CellValue({ v }: { v: string | boolean }) {
  if (v === true)
    return (
      <span style={{ color: "#6ee7b7", fontSize: 18, fontWeight: 700 }} aria-label="Incluido">
        ✓
      </span>
    );
  if (v === false)
    return (
      <span style={{ color: "rgba(255,255,255,0.30)", fontSize: 18 }} aria-label="No incluido">
        —
      </span>
    );
  return <span>{v}</span>;
}

export default function ModuleFreeVsFounders({ moduleLabel, rows }: Props) {
  return (
    <div
      style={{
        marginTop: 32,
        padding: "26px 24px",
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "linear-gradient(180deg, rgba(15,31,48,0.5), rgba(11,24,37,0.25))",
      }}
    >
      <div
        style={{
          fontFamily: "JetBrains Mono, ui-monospace, monospace",
          fontSize: 11,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#C9A84C",
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {/* QUÉ INCLUYE */}
      </div>
      <h3
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "#fff",
          marginBottom: 18,
          letterSpacing: "-0.02em",
        }}
      >
        {moduleLabel}: Free vs Founders Pass
      </h3>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 14,
            color: "#cbd5e1",
            minWidth: 560,
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "1px solid rgba(201,168,76,0.30)",
                fontFamily: "JetBrains Mono, ui-monospace, monospace",
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#94a3b8",
              }}
            >
              <th style={{ textAlign: "left", padding: "12px 14px", fontWeight: 700 }}>
                Funcionalidad
              </th>
              <th style={{ textAlign: "center", padding: "12px 14px", fontWeight: 700 }}>Free</th>
              <th
                style={{
                  textAlign: "center",
                  padding: "12px 14px",
                  fontWeight: 700,
                  color: "#FDE68A",
                }}
              >
                Founders Pass
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <td
                  style={{
                    padding: "12px 14px",
                    color: "#fff",
                    fontWeight: 500,
                  }}
                >
                  {row.feature}
                </td>
                <td style={{ padding: "12px 14px", textAlign: "center" }}>
                  <CellValue v={row.free} />
                </td>
                <td
                  style={{
                    padding: "12px 14px",
                    textAlign: "center",
                    background: "rgba(201,168,76,0.04)",
                  }}
                >
                  <CellValue v={row.founders} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
        <Link
          href="/founders"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "#FDE68A",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Conocer el Founders Pass →
        </Link>
      </div>
    </div>
  );
}
