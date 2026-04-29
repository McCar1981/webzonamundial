"use client";

// Tabs profundos — Historia · Palmarés · Récords · Icónicos · Curiosidades.
// Pieza C-híbrida: secciones densas pero secundarias al funnel.
// IMPORTANTE: el contenido se renderiza siempre en SSR. Solo escondo
// los inactivos con CSS (display:none) — Google indexa todo.

import { useState } from "react";
import Link from "next/link";
import type {
  NationalTeam,
  WorldCupParticipation,
  Trophy,
  IconicMatch,
  Trivia,
  PlayerRecord,
  MatchRecord,
} from "@/types/team";
import SectionCard, { SectionHeader } from "./SectionCard";

type TabId = "historia" | "palmares" | "records" | "iconicos" | "curiosidades";

interface TabDef {
  id: TabId;
  label: string;
  count?: number | null;
}

export default function DeepTabs({ team }: { team: NationalTeam }) {
  const tabs: TabDef[] = [
    { id: "historia", label: "Historia mundialista", count: team.history?.by_world_cup?.length },
    { id: "palmares", label: "Palmarés", count: team.history?.palmares?.length },
    { id: "records", label: "Récords", count: countRecords(team) },
    { id: "iconicos", label: "Momentos icónicos", count: team.iconic_matches?.length },
    { id: "curiosidades", label: "Curiosidades", count: validCuriosityCount(team.curiosities) },
  ];

  // Si todo está vacío, no renderizar la sección entera
  const total = tabs.reduce((acc, t) => acc + (t.count ?? 0), 0);
  if (total === 0) return null;

  // Empezar por la primera con datos
  const initial = tabs.find((t) => (t.count ?? 0) > 0)?.id ?? "historia";
  const [active, setActive] = useState<TabId>(initial);

  return (
    <SectionCard id="profundidad">
      <SectionHeader eyebrow="Profundidad" title="Historia, datos y leyenda" />

      {/* Tab strip */}
      <div
        role="tablist"
        className="flex gap-1 sm:gap-2 overflow-x-auto pb-3 mb-6 -mx-2 px-2"
        style={{ scrollbarWidth: "none" }}
      >
        {tabs.map((t) => {
          const isActive = active === t.id;
          const disabled = !t.count;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${t.id}`}
              tabIndex={isActive ? 0 : -1}
              disabled={disabled}
              onClick={() => setActive(t.id)}
              className="bb-focusable bb-touch flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: isActive
                  ? "linear-gradient(135deg, #C9A84C, #A8893D)"
                  : "rgba(11,24,37,0.5)",
                color: isActive ? "#030712" : "var(--bb-text-soft)",
                borderColor: isActive ? "#C9A84C" : "var(--bb-border-subtle)",
              }}
            >
              {t.label}
              {t.count ? (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-md font-mono"
                  style={{
                    background: isActive
                      ? "rgba(0,0,0,0.18)"
                      : "rgba(201,168,76,0.1)",
                    color: isActive ? "#030712" : "#C9A84C",
                  }}
                >
                  {t.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Panels (todos en DOM para SEO; CSS hide los inactivos) */}
      <Panel id="historia" active={active === "historia"}>
        <HistoriaPanel team={team} />
      </Panel>
      <Panel id="palmares" active={active === "palmares"}>
        <PalmaresPanel team={team} />
      </Panel>
      <Panel id="records" active={active === "records"}>
        <RecordsPanel team={team} />
      </Panel>
      <Panel id="iconicos" active={active === "iconicos"}>
        <IconicosPanel team={team} />
      </Panel>
      <Panel id="curiosidades" active={active === "curiosidades"}>
        <CuriosidadesPanel team={team} />
      </Panel>
    </SectionCard>
  );
}

function Panel({
  id,
  active,
  children,
}: {
  id: TabId;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      hidden={!active}
      className={active ? "" : "hidden"}
    >
      {children}
    </div>
  );
}

/* ─────────────── HISTORIA MUNDIALISTA ─────────────── */

function HistoriaPanel({ team }: { team: NationalTeam }) {
  const wc = team.history?.by_world_cup ?? [];
  const agg = team.history?.aggregate_stats_through_2022;
  const [expanded, setExpanded] = useState<number | null>(null);

  if (wc.length === 0) return <EmptyMsg msg="Aún sin datos de mundiales." />;

  // Stats agregadas (si vienen)
  return (
    <div>
      {agg ? (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
          <Stat label="PJ" value={agg.played} />
          <Stat label="PG" value={agg.won} accent />
          <Stat label="PE" value={agg.drawn} />
          <Stat label="PP" value={agg.lost} />
          <Stat label="GF" value={agg.goals_for} />
          <Stat label="GC" value={agg.goals_against} />
        </div>
      ) : null}

      {agg?.notes ? (
        <p className="text-[11px] text-[var(--bb-text-muted)] mb-6 italic">{agg.notes}</p>
      ) : null}

      <div className="space-y-2">
        {wc.map((p) => (
          <WCEdition
            key={p.year}
            edition={p}
            isOpen={expanded === p.year}
            onToggle={() => setExpanded(expanded === p.year ? null : p.year)}
          />
        ))}
      </div>

      <Link
        href="/historia"
        className="inline-flex items-center gap-2 text-xs text-[#C9A84C] mt-6 hover:underline font-semibold"
      >
        Ver historia general del Mundial →
      </Link>
    </div>
  );
}

function WCEdition({
  edition,
  isOpen,
  onToggle,
}: {
  edition: WorldCupParticipation;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const isChampion = edition.result === "Campeón";
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        borderColor: isChampion
          ? "rgba(201,168,76,0.3)"
          : "rgba(255,255,255,0.06)",
        background: isChampion ? "rgba(201,168,76,0.04)" : "rgba(11,24,37,0.4)",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full p-4 flex items-center gap-3 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div
          className="font-black text-lg flex-shrink-0 w-16"
          style={{ color: isChampion ? "#C9A84C" : "#cbd5e1" }}
        >
          {edition.year}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-white">{edition.result}</div>
          <div className="text-[11px] text-[var(--bb-text-muted)] truncate">
            Sede: {edition.host?.countries?.join(", ") ?? "—"} · DT: {edition.coach}
          </div>
        </div>
        <svg
          className="w-4 h-4 text-[var(--bb-text-muted)] transition-transform flex-shrink-0"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen ? (
        <div className="px-4 pb-4 pt-1 border-t border-white/5 text-sm leading-relaxed text-[var(--bb-text-soft)] space-y-3">
          {edition.narrative ? <p>{edition.narrative}</p> : null}
          {edition.notable_facts && edition.notable_facts.length > 0 ? (
            <ul className="space-y-1">
              {edition.notable_facts.map((f, i) => (
                <li key={i} className="flex gap-2 text-xs text-[var(--bb-text-muted)]">
                  <span className="text-[#C9A84C] flex-shrink-0">·</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {edition.team_top_scorers && edition.team_top_scorers.length > 0 ? (
            <div className="text-xs text-[var(--bb-text-muted)]">
              Goleadores:{" "}
              {edition.team_top_scorers
                .map((s) => `${s.player} (${s.goals})`)
                .join(" · ")}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* ─────────────── PALMARÉS ─────────────── */

function PalmaresPanel({ team }: { team: NationalTeam }) {
  const list = team.history?.palmares ?? [];
  const titles = team.history?.titles_years ?? [];

  return (
    <div className="space-y-6">
      {titles.length > 0 ? (
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#C9A84C] mb-3">
            Mundiales conquistados
          </div>
          <div className="flex flex-wrap gap-2">
            {titles.map((y) => (
              <Link
                key={y}
                href={`/historia#mundial-${y}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-bold text-sm transition-all hover:scale-105"
                style={{
                  borderColor: "rgba(201,168,76,0.4)",
                  background: "rgba(201,168,76,0.08)",
                  color: "#C9A84C",
                }}
              >
                <span>🏆</span>
                {y}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {list.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-[#1E293B]/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0B1825]/70 text-[10px] uppercase tracking-wider text-[var(--bb-text-muted)]">
                <th className="text-left font-semibold py-3 px-3">Competición</th>
                <th className="text-left font-semibold py-3 px-3">Año</th>
                <th className="text-left font-semibold py-3 px-3">Posición</th>
                <th className="text-left font-semibold py-3 px-3 hidden sm:table-cell">
                  Sede
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((t, i) => (
                <PalmaresRow key={i} t={t} />
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function PalmaresRow({ t }: { t: Trophy }) {
  const isChamp = t.position === "Campeón";
  return (
    <tr className="border-t border-[#1E293B]/40">
      <td className="py-2.5 px-3 text-white font-semibold">{t.competition}</td>
      <td className="py-2.5 px-3 text-[var(--bb-text-muted)] font-mono">{t.year}</td>
      <td className="py-2.5 px-3">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded"
          style={{
            background: isChamp ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.05)",
            color: isChamp ? "#C9A84C" : "#cbd5e1",
          }}
        >
          {t.position}
        </span>
      </td>
      <td className="py-2.5 px-3 text-[var(--bb-text-muted)] hidden sm:table-cell">
        {t.host}
      </td>
    </tr>
  );
}

/* ─────────────── RÉCORDS ─────────────── */

function RecordsPanel({ team }: { team: NationalTeam }) {
  const r = team.records;
  if (!r) return <EmptyMsg msg="Aún sin récords." />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {r.top_scorer_history ? (
        <RecordCard label="Máximo goleador histórico" rec={r.top_scorer_history} />
      ) : null}
      {r.most_capped ? (
        <RecordCard label="Más internacionalidades" rec={r.most_capped} />
      ) : null}
      {r.youngest_debut ? (
        <RecordCard label="Debut más joven" rec={r.youngest_debut} />
      ) : null}
      {r.biggest_win ? <MatchRecordCard label="Mayor goleada" rec={r.biggest_win} /> : null}
      {r.worst_loss ? (
        <MatchRecordCard label="Peor derrota" rec={r.worst_loss} tone="bad" />
      ) : null}
    </div>
  );
}

function RecordCard({ label, rec }: { label: string; rec: PlayerRecord }) {
  return (
    <div className="rounded-xl border border-[#1E293B]/60 bg-[#0B1825]/50 p-4">
      <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--bb-text-muted)] mb-2">
        {label}
      </div>
      <div className="flex items-end gap-2">
        <div className="text-xl font-black text-white">{rec.name}</div>
        <div className="text-2xl font-black text-[#C9A84C] leading-none">
          {rec.value}
        </div>
      </div>
      {rec.period ? (
        <div className="text-[11px] text-[var(--bb-text-muted)] mt-1">{rec.period}</div>
      ) : null}
      {rec.notes ? (
        <div className="text-xs text-[var(--bb-text-muted)] mt-2 leading-snug">{rec.notes}</div>
      ) : null}
    </div>
  );
}

function MatchRecordCard({
  label,
  rec,
  tone = "ok",
}: {
  label: string;
  rec: MatchRecord;
  tone?: "ok" | "bad";
}) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: tone === "bad" ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)",
        background: tone === "bad" ? "rgba(239,68,68,0.04)" : "rgba(34,197,94,0.04)",
      }}
    >
      <div
        className="text-[10px] font-bold uppercase tracking-widest mb-2"
        style={{ color: tone === "bad" ? "#f87171" : "#4ade80" }}
      >
        {label}
      </div>
      <div className="text-xl font-black text-white">
        {rec.result} <span className="text-[var(--bb-text-muted)]">vs</span> {rec.opponent}
      </div>
      <div className="text-[11px] text-[var(--bb-text-muted)] mt-1">
        {rec.date} · {rec.competition}
      </div>
    </div>
  );
}

/* ─────────────── MOMENTOS ICÓNICOS ─────────────── */

function IconicosPanel({ team }: { team: NationalTeam }) {
  const list = team.iconic_matches ?? [];
  if (list.length === 0) return <EmptyMsg msg="Sin momentos icónicos registrados." />;

  return (
    <div className="space-y-3">
      {list.map((m, i) => (
        <IconicCard key={i} m={m} />
      ))}
    </div>
  );
}

function IconicCard({ m }: { m: IconicMatch }) {
  return (
    <article className="rounded-xl border border-[#1E293B]/60 bg-[#0B1825]/50 p-5">
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div>
          <h3 className="text-base font-black text-white mb-1">{m.title}</h3>
          <div className="text-[11px] text-[var(--bb-text-muted)]">
            {m.competition} · {m.date}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <img
            src={`https://flagcdn.com/w40/${m.opponent.iso}.png`}
            alt=""
            aria-hidden
            className="w-6 h-4 object-cover rounded-sm"
          />
          <span className="text-sm font-bold text-white">
            {m.score}
          </span>
        </div>
      </div>
      <p className="text-sm text-[var(--bb-text-soft)] leading-relaxed">{m.narrative}</p>
      {m.site_link ? (
        <Link
          href={m.site_link}
          className="inline-flex items-center gap-1.5 text-xs text-[#C9A84C] mt-3 hover:underline font-semibold"
        >
          Ver detalle del momento →
        </Link>
      ) : null}
    </article>
  );
}

/* ─────────────── CURIOSIDADES ─────────────── */

function CuriosidadesPanel({ team }: { team: NationalTeam }) {
  const all = team.curiosities ?? [];
  const list = all.filter(
    (c) => c.status === "validated" || c.status === "single_source"
  );
  if (list.length === 0) return <EmptyMsg msg="Sin curiosidades verificadas." />;

  return (
    <div className="space-y-3">
      {list.map((c, i) => (
        <CuriosityCard key={i} c={c} />
      ))}
    </div>
  );
}

function CuriosityCard({ c }: { c: Trivia }) {
  return (
    <div
      className="rounded-xl border p-4 text-sm leading-relaxed"
      style={{
        borderColor: "rgba(201,168,76,0.15)",
        background: "rgba(201,168,76,0.03)",
        color: "#cbd5e1",
      }}
    >
      <div className="flex items-start gap-2">
        <span className="text-[#C9A84C] flex-shrink-0">★</span>
        <div className="flex-1">
          <p>{c.text}</p>
          <p className="text-[10px] text-[var(--bb-text-dim)] mt-2 italic">
            Fuente: {c.source}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── HELPERS ─────────────── */

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-xl border p-3 text-center"
      style={{
        borderColor: accent
          ? "rgba(201,168,76,0.3)"
          : "rgba(255,255,255,0.05)",
        background: accent
          ? "rgba(201,168,76,0.06)"
          : "rgba(11,24,37,0.5)",
      }}
    >
      <div
        className={`text-xl font-black leading-none ${accent ? "text-[#C9A84C]" : "text-white"}`}
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--bb-text-muted)] mt-1.5 font-semibold">
        {label}
      </div>
    </div>
  );
}

function EmptyMsg({ msg }: { msg: string }) {
  return <div className="text-sm text-[var(--bb-text-muted)] italic py-4">{msg}</div>;
}

function countRecords(team: NationalTeam): number {
  const r = team.records;
  if (!r) return 0;
  return [
    r.top_scorer_history,
    r.most_capped,
    r.youngest_debut,
    r.biggest_win,
    r.worst_loss,
  ].filter(Boolean).length;
}

function validCuriosityCount(list: Trivia[] | undefined): number {
  if (!list) return 0;
  return list.filter((c) => c.status === "validated" || c.status === "single_source").length;
}
