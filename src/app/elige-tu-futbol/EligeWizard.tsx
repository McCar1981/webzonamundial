"use client";

// Wizard del GATE de fútbol (2 pasos):
//   1. Elige tus ligas — multiselección del catálogo, agrupado por región
//      (América primero, coherente con el hub /ligas). Tope de 8.
//   2. Elige tus clubes — pestañas por liga elegida; los equipos salen de
//      /api/ligas/equipos (cacheado). Multiselección (uno o varios, tope 8).
// Al terminar guarda ambas preferencias (server action) y entra al lobby /app.
// SVG-only, sin dependencias nuevas.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveFootballPrefsAction, type SaveClubInput } from "./actions";

const GOLD = "#C9A84C";
const GOLD2 = "#FDE68A";
const MAX_LIGAS = 8;
const MAX_CLUBES = 8;

type LigaOpt = {
  slug: string;
  name: string;
  short: string;
  flag: string | null;
  region: "americas" | "europa" | "global";
};
type Team = { id: number; name: string; logo: string | null };

const REGION_ORDER: LigaOpt["region"][] = ["americas", "europa", "global"];
const REGION_LABEL: Record<LigaOpt["region"], string> = {
  americas: "América",
  europa: "Europa",
  global: "Mundial",
};

function flagUrl(code: string | null): string | null {
  return code ? `https://flagcdn.com/w40/${code}.png` : null;
}

export default function EligeWizard({ ligas }: { ligas: LigaOpt[] }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [clubs, setClubs] = useState<(SaveClubInput & { fromSlug: string })[]>([]);

  // Club step: pestaña activa + caché de equipos por liga + estado de carga.
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [teamsBySlug, setTeamsBySlug] = useState<Record<string, Team[]>>({});
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [teamsError, setTeamsError] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedLigas = ligas.filter((l) => selected.includes(l.slug));

  const toggleLiga = useCallback((slug: string) => {
    setError(null);
    setSelected((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= MAX_LIGAS) return prev; // tope silencioso
      return [...prev, slug];
    });
  }, []);

  // Carga perezosa de los equipos de la pestaña activa (una vez por liga).
  useEffect(() => {
    if (step !== 2 || !activeTab || teamsBySlug[activeTab]) return;
    let alive = true;
    setLoadingTeams(true);
    setTeamsError(false);
    fetch(`/api/ligas/equipos?slug=${encodeURIComponent(activeTab)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j: { teams?: Team[] }) => {
        if (!alive) return;
        setTeamsBySlug((prev) => ({ ...prev, [activeTab]: j.teams ?? [] }));
      })
      .catch(() => {
        if (alive) setTeamsError(true);
      })
      .finally(() => {
        if (alive) setLoadingTeams(false);
      });
    return () => {
      alive = false;
    };
  }, [step, activeTab, teamsBySlug]);

  function goToClubStep() {
    if (selected.length === 0) {
      setError("Elige al menos una liga para continuar.");
      return;
    }
    setError(null);
    // Se descartan los clubes cuya liga de origen ya no está seleccionada.
    setClubs((prev) => prev.filter((c) => selected.includes(c.fromSlug)));
    setActiveTab((prev) => (prev && selected.includes(prev) ? prev : selected[0]));
    setStep(2);
  }

  async function finish() {
    if (clubs.length === 0) {
      setError("Elige al menos un club para terminar.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await saveFootballPrefsAction({
      ligas: selected,
      clubs: clubs.map((c) => ({ ligaSlug: c.ligaSlug, clubId: c.clubId, clubName: c.clubName, clubLogo: c.clubLogo })),
    });
    if (!res.ok) {
      setSaving(false);
      setError(res.error ?? "No pudimos guardar. Inténtalo de nuevo.");
      return;
    }
    // Prefs guardadas → el gate del layout de /app ya deja pasar.
    router.push("/app");
    router.refresh();
  }

  const activeTeams = activeTab ? teamsBySlug[activeTab] : undefined;

  return (
    <div>
      {/* Cabecera + progreso */}
      <div className="mb-8 text-center">
        <div
          className="mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ borderColor: "rgba(201,168,76,0.3)", color: GOLD, background: "rgba(201,168,76,0.05)" }}
        >
          Paso {step} de 2
        </div>
        <h1 className="text-2xl font-black text-white sm:text-3xl">
          {step === 1 ? (
            <>Elige tu <span style={{ color: GOLD2 }}>fútbol</span></>
          ) : (
            <>Elige tus <span style={{ color: GOLD2 }}>clubes</span></>
          )}
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-[#a69a82]">
          {step === 1
            ? "Selecciona las ligas y copas que quieres seguir. Tu lobby se arma con lo que elijas — y podrás cambiarlo cuando quieras."
            : "Elige uno o varios equipos. Marcaremos sus partidos y noticias en tu inicio."}
        </p>
      </div>

      {/* PASO 1 — ligas por región */}
      {step === 1 && (
        <div>
          {REGION_ORDER.map((region) => {
            const items = ligas.filter((l) => l.region === region);
            if (items.length === 0) return null;
            return (
              <section key={region} className="mb-6">
                <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7d8db0]">
                  {REGION_LABEL[region]}
                </h2>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {items.map((l) => {
                    const on = selected.includes(l.slug);
                    const fUrl = flagUrl(l.flag);
                    return (
                      <button
                        key={l.slug}
                        type="button"
                        onClick={() => toggleLiga(l.slug)}
                        aria-pressed={on}
                        className="flex items-center gap-2.5 rounded-2xl border px-3 py-3 text-left transition-transform active:scale-[0.98]"
                        style={{
                          borderColor: on ? GOLD : "rgba(255,255,255,0.1)",
                          background: on
                            ? "linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.06))"
                            : "rgba(255,255,255,0.03)",
                        }}
                      >
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full"
                          style={{ background: "rgba(255,255,255,0.06)" }}
                        >
                          {fUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={fUrl} alt="" width={20} height={14} style={{ objectFit: "cover", borderRadius: 2 }} />
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                              <path
                                d="M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"
                                stroke={GOLD}
                                strokeWidth="1.5"
                              />
                            </svg>
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold text-white">{l.short}</span>
                        </span>
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                          style={{
                            borderColor: on ? GOLD : "rgba(255,255,255,0.2)",
                            background: on ? GOLD : "transparent",
                          }}
                        >
                          {on && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                              <path d="M20 6L9 17l-5-5" stroke="#0a0906" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-[#7d8db0]">
              {selected.length}/{MAX_LIGAS} elegidas
            </span>
          </div>

          {error && <p className="mt-3 text-center text-sm text-[#ff8a8a]">{error}</p>}

          <button
            type="button"
            onClick={goToClubStep}
            disabled={selected.length === 0}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold transition-transform active:scale-[0.99] disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`, color: "#0a0906" }}
          >
            Continuar
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" stroke="#0a0906" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}

      {/* PASO 2 — club */}
      {step === 2 && (
        <div>
          {/* Pestañas por liga elegida */}
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {selectedLigas.map((l) => {
              const on = activeTab === l.slug;
              return (
                <button
                  key={l.slug}
                  type="button"
                  onClick={() => setActiveTab(l.slug)}
                  className="shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors"
                  style={{
                    borderColor: on ? GOLD : "rgba(255,255,255,0.12)",
                    color: on ? "#0a0906" : "#e6decb",
                    background: on ? GOLD : "rgba(255,255,255,0.03)",
                  }}
                >
                  {l.short}
                </button>
              );
            })}
          </div>

          {/* Rejilla de equipos */}
          <div className="min-h-[220px]">
            {loadingTeams && !activeTeams ? (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="h-[58px] animate-pulse rounded-2xl" style={{ background: "rgba(255,255,255,0.05)" }} />
                ))}
              </div>
            ) : teamsError ? (
              <p className="py-10 text-center text-sm text-[#a69a82]">
                No pudimos cargar los equipos de esta liga. Prueba con otra pestaña.
              </p>
            ) : activeTeams && activeTeams.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {activeTeams.map((t) => {
                  const on = clubs.some((c) => c.clubId === t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        setClubs((prev) =>
                          prev.some((c) => c.clubId === t.id)
                            ? prev.filter((c) => c.clubId !== t.id)
                            : prev.length >= MAX_CLUBES
                              ? prev
                              : [...prev, { fromSlug: activeTab!, ligaSlug: activeTab!, clubId: t.id, clubName: t.name, clubLogo: t.logo }],
                        )
                      }
                      aria-pressed={on}
                      className="flex items-center gap-2.5 rounded-2xl border px-3 py-3 text-left transition-transform active:scale-[0.98]"
                      style={{
                        borderColor: on ? GOLD : "rgba(255,255,255,0.1)",
                        background: on
                          ? "linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.06))"
                          : "rgba(255,255,255,0.03)",
                      }}
                    >
                      {t.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.logo} alt="" width={24} height={24} loading="lazy" style={{ width: 24, height: 24, objectFit: "contain", flexShrink: 0 }} />
                      ) : (
                        <span className="h-6 w-6 shrink-0 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
                      )}
                      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-white">{t.name}</span>
                      {on && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path d="M20 6L9 17l-5-5" stroke={GOLD} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-[#a69a82]">
                Esta competición no tiene equipos disponibles ahora. Prueba con otra pestaña.
              </p>
            )}
          </div>

          {clubs.length > 0 && (
            <p className="mt-4 text-center text-sm text-[#e6decb]">
              {clubs.length === 1 ? "Tu club: " : `Tus clubes (${clubs.length}): `}
              <b style={{ color: GOLD2 }}>{clubs.map((c) => c.clubName).join(", ")}</b>
            </p>
          )}
          {error && <p className="mt-3 text-center text-sm text-[#ff8a8a]">{error}</p>}

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep(1);
              }}
              className="rounded-full border px-5 py-3.5 text-sm font-semibold text-[#e6decb]"
              style={{ borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.03)" }}
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={finish}
              disabled={clubs.length === 0 || saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold transition-transform active:scale-[0.99] disabled:opacity-40"
              style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`, color: "#0a0906" }}
            >
              {saving ? "Guardando…" : "Entrar a mi lobby"}
              {!saving && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="#0a0906" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
