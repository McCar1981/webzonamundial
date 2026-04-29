// Server Component
// Sección 8 — Análisis profesional con probabilidades.

import type { NationalTeam, Analysis } from "@/types/team";
import SectionCard, { SectionHeader } from "./SectionCard";

const PROB_LABELS: Record<keyof Analysis["probabilities"], string> = {
  advance_groups: "Pasar de grupos",
  round_of_32: "32avos",
  round_of_16: "Octavos",
  quarter_finals: "Cuartos",
  semi_finals: "Semifinales",
  final: "Final",
  champion: "Campeón",
};

export default function AnalysisSection({ team }: { team: NationalTeam }) {
  const a = team.wc_2026?.analysis;
  if (!a) return null;

  const probEntries = Object.entries(a.probabilities) as Array<
    [keyof Analysis["probabilities"], number]
  >;

  return (
    <SectionCard id="analisis">
      <SectionHeader
        eyebrow="Análisis profesional"
        title={`¿Cómo juega ${team.name_es}?`}
      />

      {/* Estilo */}
      {a.style ? (
        <div className="mb-8">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--bb-text-muted)] mb-2">
            Sistema y estilo
          </div>
          <p className="text-sm sm:text-base text-[var(--bb-text-soft)] leading-relaxed">
            {a.style}
          </p>
        </div>
      ) : null}

      {/* Strengths / Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {a.strengths?.length ? (
          <BulletList
            title="Fortalezas"
            items={a.strengths}
            tone="ok"
          />
        ) : null}
        {a.weaknesses?.length ? (
          <BulletList
            title="Debilidades"
            items={a.weaknesses}
            tone="bad"
          />
        ) : null}
      </div>

      {/* X-Factor */}
      {a.x_factor?.player ? (
        <div
          className="rounded-2xl p-5 mb-8 border"
          style={{
            background:
              "linear-gradient(135deg, rgba(201,168,76,0.1), rgba(201,168,76,0.02))",
            borderColor: "rgba(201,168,76,0.25)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">⚡</span>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#C9A84C]">
              X-Factor
            </div>
          </div>
          <div className="text-lg font-black text-white mb-2">
            {a.x_factor.player}
          </div>
          <p className="text-sm text-[var(--bb-text-soft)] leading-relaxed">
            {a.x_factor.reason}
          </p>
        </div>
      ) : null}

      {/* Probabilities */}
      {probEntries.length > 0 ? (
        <div className="mb-8">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--bb-text-muted)] mb-3">
            Pronóstico — probabilidad por fase
          </div>
          <div className="space-y-2">
            {probEntries.map(([k, v]) => (
              <ProbBar key={k} label={PROB_LABELS[k]} value={v} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Prediction */}
      {a.prediction_text ? (
        <div className="rounded-xl border border-[#1E293B]/60 bg-[#0B1825]/50 p-5 mb-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#C9A84C] mb-2">
            Veredicto
          </div>
          <p className="text-sm text-[var(--bb-text-soft)] leading-relaxed">
            {a.prediction_text}
          </p>
        </div>
      ) : null}

      {/* vs últimos 3 mundiales */}
      {a.vs_last_3_wcs ? (
        <p className="text-xs text-[var(--bb-text-muted)] leading-relaxed italic pt-3 border-t border-white/5">
          {a.vs_last_3_wcs}
        </p>
      ) : null}
    </SectionCard>
  );
}

function BulletList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "ok" | "bad";
}) {
  const palette =
    tone === "ok"
      ? { border: "rgba(34,197,94,0.25)", text: "#4ade80", bullet: "✓" }
      : { border: "rgba(239,68,68,0.25)", text: "#f87171", bullet: "✗" };
  return (
    <div
      className="rounded-xl border p-5"
      style={{ borderColor: palette.border, background: "rgba(11,24,37,0.5)" }}
    >
      <div
        className="text-[10px] font-bold uppercase tracking-widest mb-3"
        style={{ color: palette.text }}
      >
        {title}
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-[var(--bb-text-soft)] leading-snug">
            <span style={{ color: palette.text }} className="flex-shrink-0">
              {palette.bullet}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProbBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-3">
      <div className="text-xs text-[var(--bb-text-muted)] w-32 flex-shrink-0">{label}</div>
      <div className="flex-1 h-7 rounded-md bg-[#0B1825] border border-[#1E293B]/50 overflow-hidden relative">
        <div
          className="absolute inset-y-0 left-0 transition-all"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #A8893D, #C9A84C, #E8D48B)",
          }}
        />
        <span
          className="absolute inset-0 flex items-center justify-end px-3 text-xs font-bold"
          style={{ color: pct > 50 ? "#030712" : "#cbd5e1" }}
        >
          {pct}%
        </span>
      </div>
    </div>
  );
}
