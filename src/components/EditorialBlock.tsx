// src/components/EditorialBlock.tsx
//
// Componente editorial reutilizable. Recibe un objeto con título, dateline,
// intro y secciones h3+párrafos. Diseñado para SEO + AdSense E-E-A-T:
// estructura semántica (article > h2 > h3 > p), dateline visible y un
// callout final.
//
// Uso:
//   <EditorialBlock data={{ ... }} />

import Link from "next/link";

const GOLD = "#c9a84c";
const GOLD2 = "#e8d48b";
const GOLD3 = "#FDE68A";
const TEXT = "#cbd5e1";
const MUTED = "#94a3b8";
const BORDER = "rgba(201,168,76,0.18)";

export interface EditorialSection {
  h3: string;
  paragraphs: Array<React.ReactNode>;
}

export interface EditorialData {
  eyebrow: string;
  id: string;
  title: string;
  datelineDate: string; // "21 de mayo de 2026"
  readMinutes: number;
  intro: React.ReactNode;
  sections: EditorialSection[];
  closingTitle?: string;
  closing?: React.ReactNode;
}

export default function EditorialBlock({ data }: { data: EditorialData }) {
  return (
    <section
      aria-labelledby={data.id}
      style={{
        background: "#060B14",
        padding: "70px 20px 60px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <article
        style={{
          maxWidth: 820,
          margin: "0 auto",
          color: TEXT,
          fontSize: 16,
          lineHeight: 1.75,
        }}
      >
        <div
          style={{
            color: GOLD,
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            fontWeight: 700,
            marginBottom: 14,
          }}
        >
          // {data.eyebrow}
        </div>

        <h2
          id={data.id}
          style={{
            color: GOLD2,
            fontSize: "clamp(26px, 4vw, 36px)",
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            margin: "0 0 14px",
          }}
        >
          {data.title}
        </h2>

        <p style={{ color: MUTED, fontSize: 14, marginBottom: 28 }}>
          Redacción de ZonaMundial · Actualizado el {data.datelineDate} ·
          Lectura ~{data.readMinutes} min
        </p>

        <div style={{ fontSize: 18, color: "#e2e8f0", marginBottom: 22 }}>
          {data.intro}
        </div>

        {data.sections.map((s, i) => (
          <div key={i}>
            <h3 style={h3Style}>{s.h3}</h3>
            {s.paragraphs.map((p, j) => (
              <p key={j} style={{ marginBottom: 14 }}>
                {p}
              </p>
            ))}
          </div>
        ))}

        {data.closing && (
          <div
            style={{
              marginTop: 30,
              padding: "20px 22px",
              border: `1px solid ${BORDER}`,
              borderRadius: 14,
              background:
                "linear-gradient(180deg, rgba(201,168,76,0.04), rgba(11,24,37,0.4))",
            }}
          >
            <p
              style={{
                color: GOLD3,
                fontSize: 12,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                fontWeight: 700,
                marginBottom: 8,
                margin: 0,
              }}
            >
              // {data.closingTitle || "Para saber más"}
            </p>
            <p style={{ margin: 0, fontSize: 15, color: TEXT }}>
              {data.closing}
            </p>
          </div>
        )}
      </article>
    </section>
  );
}

const h3Style = {
  color: GOLD3,
  fontSize: "clamp(20px, 3vw, 25px)",
  fontWeight: 800,
  letterSpacing: "-0.01em",
  marginTop: 30,
  marginBottom: 12,
  lineHeight: 1.25,
};

export const linkGold = {
  color: GOLD2,
  textDecoration: "underline",
  textUnderlineOffset: 3,
  textDecorationThickness: 1,
};
