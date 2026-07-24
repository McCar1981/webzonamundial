"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SvgIcon } from "@/components/icons";
import { getCountryName } from "@/lib/countries";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import ModuleLandingExtras from "@/components/app-modules/ModuleLandingExtras";
import { COMPETITIONS } from "@/data/competitions";

const shortOf = (slug: string) => COMPETITIONS.find((c) => c.slug === slug)?.short ?? slug;

gsap.registerPlugin(ScrollTrigger);

const BG = "#000000", BG2 = "#14110a", BG3 = "#0a0906", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#a69a82", DIM = "#6e6552";

// ─── Tipos que devuelven los endpoints ──────────────────────────────────────
interface RankEntry { rank: number; userId: string; name: string | null; avatarUrl: string | null; country: string | null; coins: number; level: number; }
interface MyRank { userId: string; rank: number; coins: number; level: number; country: string | null; total: number; }
interface MyCountryRank { country: string; rank: number; total: number; coins: number; }
interface NationRank { rank: number; country: string; players: number; coins: number; topName: string | null; topAvatar: string | null; }
// Fila del leaderboard por liga (/api/ligas/leaderboard).
interface LigaRow { position: number; user: { id: string; display_name: string; avatar_url: string | null }; coins: number; correct_count: number; predictions_count: number; }

// Banderita por código ISO-3166 alpha-2. Solo renderiza con un código de 2
// letras válido, para no pedir imágenes rotas. `w` controla el ancho del PNG.
function Flag({ code, w = 24 }: { code: string | null; w?: number }) {
  if (!code || !/^[a-z]{2}$/i.test(code)) return null;
  const h = Math.round((w * 2) / 3);
  return (
    <img
      src={`https://flagcdn.com/w${w <= 40 ? 40 : 80}/${code.toLowerCase()}.png`}
      alt=""
      width={w}
      height={h}
      style={{ borderRadius: 3, objectFit: "cover", flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
    />
  );
}

// Color del número de puesto según el podio (oro/plata/bronce) o neutro.
function rankChipStyle(i: number): React.CSSProperties {
  return {
    background: i === 0 ? "rgba(201,168,76,0.18)" : i === 1 ? "rgba(192,192,192,0.12)" : i === 2 ? "rgba(205,127,50,0.12)" : "rgba(255,255,255,0.04)",
    color: i === 0 ? GOLD : i === 1 ? "#d1d5db" : i === 2 ? "#d97706" : DIM,
  };
}

// Vistas de primer nivel del centro de rankings.
type View = "ligas" | "global" | "naciones" | "country";

// Sub-pestañas del ranking GLOBAL: el global por saldo + uno por módulo (por
// Fútcoins generadas en él). value=null → global; value=slug → ?module=.
const MODULE_TABS: { value: string | null; label: string }[] = [
  { value: null, label: "Global" },
  { value: "predicciones", label: "Predicciones" },
  { value: "trivia", label: "Trivia" },
  { value: "fantasy", label: "Fantasy" },
  { value: "modo-carrera", label: "Modo Carrera" },
  { value: "draft-mundial", label: "Draft" },
  { value: "micro", label: "Micro" },
];

// Tarjetas "tipos de ranking": TODAS llevan a algo real (vista o ruta viva).
const RANK_TYPES: { icon: string; title: string; desc: string; view?: View; href?: string }[] = [
  { icon: "predicciones", title: "Tu liga", desc: "Los mejores predictores de la liga que sigues, por Fútcoins ganadas.", view: "ligas" },
  { icon: "ranking", title: "Global", desc: "Todos contra todos por Fútcoins acumuladas en toda la app.", view: "global" },
  { icon: "48 selecciones", title: "Naciones", desc: "El medallero de las aficiones: ¿qué país suma más Fútcoins?", view: "naciones" },
  { icon: "48 selecciones", title: "Tu país", desc: "Sube en el ranking nacional y lidera a tus compatriotas.", view: "country" },
  { icon: "ligas privadas", title: "Tus ligas", desc: "Compite frente a tus amigos en ligas privadas.", href: "/app/fantasy/jugar?tab=ligas" },
];

// Cómo se sube (real: las Fútcoins se ganan jugando los módulos). Sin inventar
// "rankings por fase" que no existen: esto enlaza a donde de verdad se puntúa.
const HOW_TO_CLIMB = [
  { icon: "predicciones", title: "Predice los partidos", desc: "Cada acierto suma Fútcoins. La racha multiplica.", href: "/app/predicciones" },
  { icon: "trivia", title: "Responde la trivia diaria", desc: "Un reto al día con puntos extra para el ranking.", href: "/trivia" },
  { icon: "fantasy", title: "Monta tu Fantasy", desc: "Puntúa por jornada con tu once ideal del Mundial.", href: "/app/fantasy" },
  { icon: "modo carrera", title: "Juega Modo Carrera", desc: "Dirige tu selección y gana reputación y monedas.", href: "/app/modo-carrera" },
];

export default function RankingsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  // ¿Hay sesión? null = aún no se sabe. Quien entra desde el lobby ya está
  // logueado → ve el TABLERO directo, sin la portada de captación. El visitante
  // sin sesión sí ve el hero + CTA de registro (bifurcación por sesión, no
  // cloaking: el ranking se muestra a ambos, solo cambia el envoltorio).
  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => {
    const sb = createSupabaseBrowserClient();
    let on = true;
    sb.auth.getUser().then(({ data }) => { if (on) setAuthed(!!data.user); }).catch(() => { if (on) setAuthed(false); });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => { if (on) setAuthed(!!session?.user); });
    return () => { on = false; sub.subscription.unsubscribe(); };
  }, []);

  // Vista activa + selección dentro de cada vista.
  const [view, setView] = useState<View>("global");
  const [tab, setTab] = useState<string | null>(null);            // módulo (vista global)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null); // vista país

  // Listas por vista.
  const [entries, setEntries] = useState<RankEntry[] | null>(null); // global / país / creador
  const [me, setMe] = useState<MyRank | null>(null);                // posición global
  const [countryMe, setCountryMe] = useState<MyCountryRank | null>(null); // posición nacional
  const [nations, setNations] = useState<NationRank[] | null>(null);
  const [myNation, setMyNation] = useState<NationRank | null>(null);
  const [champions, setChampions] = useState<RankEntry[] | null>(null); // campeones de la semana (Fútcoins ganadas en 7 días)

  // Mi país / mi creador (para precargar "Tu país" / "Por creador").
  const [myCountry, setMyCountry] = useState<string | null>(null);

  // Ranking POR LIGA (pivote): ligas seguidas + liga elegida + mi puesto.
  const [myLeagues, setMyLeagues] = useState<string[] | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [ligaMyPos, setLigaMyPos] = useState<number | null>(null);
  // Si el usuario toca el conmutador, no forzamos la vista "ligas" al cargar.
  const userSwitchedView = useRef(false);

  // 1) Al montar: cargo el medallero (sirve también para el selector de país) y
  //    mi posición global (de ahí saco mi país por defecto).
  useEffect(() => {
    let on = true;
    fetch("/api/ranking/naciones?limit=150")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { nations?: NationRank[]; myNation?: NationRank | null; me?: MyCountryRank | null } | null) => {
        if (!on || !d) return;
        setNations(d.nations ?? []);
        setMyNation(d.myNation ?? null);
        if (d.me?.country) setMyCountry((c) => c ?? d.me!.country);
      })
      .catch(() => { if (on) setNations([]); });

    fetch("/api/ranking?only=me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { me?: MyRank | null } | null) => {
        if (on && d?.me?.country) setMyCountry((c) => c ?? d.me!.country);
      })
      .catch(() => {});

    // Campeón de la semana: top por Fútcoins GANADAS en los últimos 7 días.
    // Resetea cada semana → todos tienen opción. Premio en estatus, no en dinero.
    fetch("/api/ranking/semana?limit=5")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { champions?: RankEntry[] } | null) => { if (on) setChampions(d?.champions ?? []); })
      .catch(() => { if (on) setChampions([]); });
    return () => { on = false; };
  }, []);

  // 1b) Ligas seguidas por el usuario → alimentan la vista "Tu liga". Pivote: si
  //     sigue ligas y no ha tocado el conmutador, esa es la vista primaria.
  useEffect(() => {
    if (authed !== true) { if (authed === false) setMyLeagues([]); return; }
    let on = true;
    fetch("/api/ligas/mis-ligas")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { ligas?: string[] } | null) => {
        if (!on) return;
        const ls = Array.isArray(d?.ligas) ? d!.ligas! : [];
        setMyLeagues(ls);
        setSelectedLeague((s) => s ?? ls[0] ?? null);
        if (ls.length > 0 && !userSwitchedView.current) setView("ligas");
      })
      .catch(() => { if (on) setMyLeagues([]); });
    return () => { on = false; };
  }, [authed]);

  // 2) Vista GLOBAL: top por módulo (o global). Se recarga al cambiar de tab.
  useEffect(() => {
    if (view !== "global") return;
    let on = true;
    setEntries(null);
    const url = tab ? `/api/ranking?limit=50&module=${tab}` : "/api/ranking?limit=50";
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { entries?: RankEntry[]; me?: MyRank | null } | null) => {
        if (!on || !d) return;
        setEntries(d.entries ?? []);
        setMe(d.me ?? null);
      })
      .catch(() => { if (on) setEntries([]); });
    return () => { on = false; };
  }, [view, tab]);

  // 3) Vista PAÍS: top de jugadores del país elegido + mi puesto nacional.
  const countryToShow = selectedCountry ?? myCountry;
  useEffect(() => {
    if (view !== "country" || !countryToShow) { if (view === "country") setEntries([]); return; }
    let on = true;
    setEntries(null);
    setCountryMe(null); // no arrastrar el banner del país anterior durante la carga
    fetch(`/api/ranking?country=${countryToShow}&limit=50`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { entries?: RankEntry[]; me?: MyCountryRank | null } | null) => {
        if (!on || !d) return;
        setEntries(d.entries ?? []);
        setCountryMe(d.me ?? null);
      })
      .catch(() => { if (on) setEntries([]); });
    return () => { on = false; };
  }, [view, countryToShow]);

  // 4) Vista LIGAS: top de predictores de la liga elegida por Fútcoins. Mapea la
  //    fila de /api/ligas/leaderboard a RankEntry (aciertos → `level`) para
  //    reutilizar PlayersList. Recarga al cambiar de liga.
  useEffect(() => {
    if (view !== "ligas") return;
    if (!selectedLeague) { setEntries([]); return; }
    let on = true;
    setEntries(null);
    setLigaMyPos(null);
    fetch(`/api/ligas/leaderboard?slug=${encodeURIComponent(selectedLeague)}&limit=50`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { rankings?: LigaRow[]; my_position?: number | null } | null) => {
        if (!on) return;
        if (!d) { setEntries([]); return; }
        setEntries((d.rankings ?? []).map((r) => ({
          rank: r.position, userId: r.user.id, name: r.user.display_name,
          avatarUrl: r.user.avatar_url, country: null, coins: r.coins, level: r.correct_count,
        })));
        setLigaMyPos(d.my_position ?? null);
      })
      .catch(() => { if (on) setEntries([]); });
    return () => { on = false; };
  }, [view, selectedLeague]);

  // ¿Mi posición global queda fuera del top mostrado? Entonces el resumen vale.
  const meOutsideTop = view === "global" && !tab && !!me && entries !== null && !entries.some((e) => e.userId === me.userId);

  // Opciones del selector de país: las naciones con jugadores + mi país aunque
  // aún no aparezca. Ordenadas alfabéticamente por nombre legible.
  const countryOptions = useMemo(() => {
    const codes = new Set<string>((nations ?? []).map((n) => n.country));
    if (myCountry) codes.add(myCountry);
    if (countryToShow) codes.add(countryToShow);
    return [...codes].map((c) => ({ code: c, name: getCountryName(c) })).sort((a, b) => a.name.localeCompare(b.name));
  }, [nations, myCountry, countryToShow]);

  // Animaciones de entrada (solo elementos estáticos; la lista no se anima para
  // no pelear con los re-render al cambiar de vista). Respeta reduced-motion.
  useEffect(() => {
    const ctx = gsap.context(() => {
      const heroTl = gsap.timeline();
      heroTl.from("[data-hero-badge]", { y: -20, opacity: 0, duration: 0.6, ease: "power2.out" })
            .from("[data-hero-title]", { y: 40, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.3")
            .from("[data-hero-desc]", { y: 30, opacity: 0, duration: 0.7, ease: "power2.out" }, "-=0.5")
            .from("[data-hero-cta]", { y: 30, opacity: 0, duration: 0.6, stagger: 0.1, ease: "back.out(1.7)" }, "-=0.4");

      gsap.from("[data-type-card]", { scrollTrigger: { trigger: "[data-types-grid]", start: "top 85%" }, y: 50, opacity: 0, duration: 0.7, stagger: 0.12, ease: "power3.out" });
      gsap.from("[data-how-card]", { scrollTrigger: { trigger: "[data-how-grid]", start: "top 85%" }, y: 40, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" });
      gsap.from("[data-cta-content]", { scrollTrigger: { trigger: "[data-cta-section]", start: "top 80%" }, y: 40, opacity: 0, duration: 0.8, stagger: 0.15, ease: "power3.out" });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  // Al pulsar una tarjeta de tipo: cambia de vista y baja al tablero.
  function goTo(v: View) {
    userSwitchedView.current = true;
    setView(v);
    if (typeof document !== "undefined") {
      document.getElementById("tablero")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const viewTitle = view === "naciones" ? "Naciones"
    : view === "country" ? (getCountryName(countryToShow) || "Tu país")
    : (tab ? MODULE_TABS.find((t) => t.value === tab)?.label : "Global");

  return (
    <div ref={containerRef} style={{ background: BG, color: "#fff", fontFamily: "'Outfit',sans-serif", minHeight: "100vh" }}>
      {/* ═══ Hero compacto: SOLO para visitantes SIN sesión (portada de captación).
          El usuario logueado que llega desde el lobby aterriza directo en el
          tablero, como describe la bifurcación por sesión de arriba. Antes se
          mostraba a todos → el logueado caía en la "página informativa". ═══ */}
      {authed === false && (
      <section style={{ padding: "18px 20px 28px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center,rgba(201,168,76,0.08) 0%,transparent 60%)" }} />
        <div style={{ maxWidth: 800, margin: "0 auto", position: "relative" }}>
          <span data-hero-badge style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", display: "inline-block" }}>Centro de Rankings</span>
          <h1 data-hero-title style={{ fontSize: "clamp(36px,7vw,56px)", fontWeight: 900, marginTop: 18, lineHeight: 1.1 }}>
            Los <span style={{ color: GOLD }}>Rankings</span>
          </h1>
          <p data-hero-desc style={{ color: MID, marginTop: 22, maxWidth: 600, margin: "22px auto 0", lineHeight: 1.7, fontSize: 18 }}>
            Demuestra quién sabe más de fútbol. Compite a nivel global, defiende el orgullo de tu país en el medallero de naciones o lidera tu liga privada.
          </p>
          <div style={{ marginTop: 34, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button data-hero-cta onClick={() => goTo("naciones")} style={{
              padding: "15px 32px", borderRadius: 14, cursor: "pointer",
              background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
              color: BG, fontWeight: 800, fontSize: 16, border: "none",
              boxShadow: "0 8px 32px rgba(201,168,76,0.3)",
            }}>
              Ver medallero de naciones
            </button>
            <span data-hero-cta style={{ padding: "15px 26px", borderRadius: 14, background: BG2, border: "1px solid rgba(255,255,255,0.1)", color: MID, fontWeight: 600, fontSize: 14 }}>
              Actualizado en vivo
            </span>
          </div>
        </div>
      </section>
      )}

      {/* ═══ Tablero (cambia según la vista) ═══ */}
      <section id="tablero" style={{ padding: "8px 20px 64px", background: BG }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          {/* Conmutador de vista */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 26, flexWrap: "wrap" }}>
            {([{ v: "ligas", l: "Tu liga" }, { v: "global", l: "Global" }, { v: "naciones", l: "Naciones" }, { v: "country", l: "Tu país" }] as { v: View; l: string }[]).map(({ v, l }) => {
              const active = view === v;
              return (
                <button key={v} onClick={() => { userSwitchedView.current = true; setView(v); }} style={{
                  padding: "11px 22px", borderRadius: 999, fontSize: 14.5, fontWeight: 800, cursor: "pointer",
                  color: active ? BG : "#fff",
                  background: active ? `linear-gradient(135deg,${GOLD},${GOLD2})` : BG2,
                  border: `1px solid ${active ? "transparent" : "rgba(255,255,255,0.08)"}`,
                  transition: "all .2s",
                }}>{l}</button>
              );
            })}
          </div>

          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h2 style={{ fontSize: "clamp(26px,5vw,40px)", fontWeight: 800 }}>
              {view === "naciones" ? <>Medallero de <span style={{ color: GOLD }}>naciones</span></>
                : view === "ligas" ? <>Ranking de <span style={{ color: GOLD }}>tu liga</span></>
                : <>Top <span style={{ color: GOLD }}>{viewTitle}</span></>}
            </h2>
            <p style={{ color: MID, marginTop: 10, fontSize: 15.5 }}>
              {view === "naciones" && "Países ordenados por las Fútcoins que suma toda su afición"}
              {view === "global" && (tab ? "Clasificación por Fútcoins ganadas en este módulo" : "Clasificación por Fútcoins acumuladas en toda ZonaMundial")}
              {view === "country" && "El ranking nacional de tu selección. ¿Quién manda en casa?"}
              {view === "ligas" && (selectedLeague ? `Los mejores predictores de ${shortOf(selectedLeague)} por Fútcoins ganadas prediciendo.` : "Sigue una liga para ver su ranking de predictores.")}
            </p>
          </div>

          {/* Sub-controles por vista */}
          {view === "global" && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 30 }}>
              {MODULE_TABS.map((t) => {
                const active = t.value === tab;
                return (
                  <button key={t.value ?? "global"} onClick={() => setTab(t.value)} style={{
                    padding: "8px 16px", borderRadius: 999, fontSize: 13.5, fontWeight: 700, cursor: "pointer",
                    color: active ? BG : MID,
                    background: active ? `linear-gradient(135deg,${GOLD},${GOLD2})` : BG2,
                    border: `1px solid ${active ? "transparent" : "rgba(255,255,255,0.08)"}`, transition: "all .2s",
                  }}>{t.label}</button>
                );
              })}
            </div>
          )}

          {view === "country" && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 26 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: BG2, borderRadius: 14, padding: "8px 14px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Flag code={countryToShow} w={28} />
                <select
                  aria-label="Elegir país"
                  value={countryToShow ?? ""}
                  onChange={(e) => setSelectedCountry(e.target.value || null)}
                  style={{ background: "transparent", color: "#fff", border: "none", fontSize: 15, fontWeight: 700, outline: "none", cursor: "pointer", minWidth: 160 }}
                >
                  {(!countryToShow || countryOptions.length === 0) && <option value="">Elige un país</option>}
                  {countryOptions.map((c) => (
                    <option key={c.code} value={c.code} style={{ color: "#000" }}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Selector de liga (vista "Tu liga", con más de una seguida) */}
          {view === "ligas" && myLeagues && myLeagues.length > 1 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 30 }}>
              {myLeagues.map((s) => {
                const active = s === selectedLeague;
                return (
                  <button key={s} onClick={() => setSelectedLeague(s)} style={{
                    padding: "8px 16px", borderRadius: 999, fontSize: 13.5, fontWeight: 700, cursor: "pointer",
                    color: active ? BG : MID,
                    background: active ? `linear-gradient(135deg,${GOLD},${GOLD2})` : BG2,
                    border: `1px solid ${active ? "transparent" : "rgba(255,255,255,0.08)"}`, transition: "all .2s",
                  }}>{shortOf(s)}</button>
                );
              })}
            </div>
          )}

          {/* ─── Campeón de la semana ─── */}
          {view === "global" && !tab && <WeeklyChampions entries={champions} />}

          {/* ─── Banner "tu posición" según la vista ─── */}
          {view === "global" && !tab && meOutsideTop && me && (
            <MeBanner rank={me.rank} flag={me.country} title="Tu posición" sub={`Nivel ${me.level} · de ${me.total.toLocaleString()} jugadores`} value={`${me.coins.toLocaleString()} FC`} />
          )}
          {view === "country" && countryMe && (
            <MeBanner rank={countryMe.rank} flag={countryMe.country} title={`Tu puesto en ${getCountryName(countryMe.country)}`} sub={`De ${countryMe.total.toLocaleString()} jugadores de tu país`} value={`${countryMe.coins.toLocaleString()} FC`} />
          )}
          {view === "naciones" && myNation && (
            <MeBanner rank={myNation.rank} flag={myNation.country} title={`${getCountryName(myNation.country)} en el medallero`} sub={`${myNation.players.toLocaleString()} jugadores compitiendo`} value={`${myNation.coins.toLocaleString()} FC`} />
          )}
          {/* ─── Lista ─── */}
          {view === "naciones" ? (
            <NationsList nations={nations} myCode={myCountry} onPick={(code) => { setSelectedCountry(code); setView("country"); }} />
          ) : view === "ligas" && myLeagues && myLeagues.length === 0 ? (
            <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", padding: "28px 20px", borderRadius: 16, background: BG2, border: "1px solid rgba(201,168,76,0.25)" }}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Sigue una liga para ver su ranking</div>
              <p style={{ color: MID, fontSize: 13.5, lineHeight: 1.5, marginBottom: 14 }}>Compite con el resto de aficionados de tu liga por las predicciones.</p>
              <Link href="/ligas" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 20px", borderRadius: 12, background: `linear-gradient(135deg,${GOLD},${GOLD2})`, color: BG, fontWeight: 800, fontSize: 14, textDecoration: "none" }}>Explorar ligas →</Link>
            </div>
          ) : (
            <PlayersList
              entries={entries}
              meId={view === "global" ? me?.userId ?? null : view === "ligas" && ligaMyPos != null ? (entries?.[ligaMyPos - 1]?.userId ?? null) : null}
              emptyKind={view === "country" ? "country" : view === "ligas" ? "liga" : "global"}
              metric={view === "ligas" ? "aciertos" : "level"}
            />
          )}
        </div>
      </section>

      {/* ═══ Explora los rankings (tarjetas que llevan a cada vista) ═══ */}
      <section style={{ padding: "56px 20px", background: BG3 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Competición</span>
            <h2 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 800, marginTop: 14 }}>5 formas de <span style={{ color: GOLD }}>competir</span></h2>
          </div>
          <div data-types-grid style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20 }}>
            {RANK_TYPES.map((t, i) => {
              const inner = (
                <>
                  <SvgIcon name={t.icon} size={44} style={{ marginBottom: 14 }} />
                  <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 8 }}>{t.title}</h3>
                  <p style={{ fontSize: 14, color: DIM, lineHeight: 1.6 }}>{t.desc}</p>
                </>
              );
              const cardStyle: React.CSSProperties = { padding: 26, borderRadius: 20, background: BG2, border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", textAlign: "left", color: "#fff", display: "block", width: "100%" };
              return t.href ? (
                <Link key={i} data-type-card href={t.href} className="zm-rank-card" style={{ ...cardStyle, textDecoration: "none" }}>{inner}</Link>
              ) : (
                <button key={i} data-type-card onClick={() => goTo(t.view!)} className="zm-rank-card" style={{ ...cardStyle, font: "inherit" }}>{inner}</button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ Cómo subir en el ranking (real: enlaza a los módulos que puntúan) ═══ */}
      <section style={{ padding: "56px 20px", background: BG3 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <h2 style={{ fontSize: "clamp(26px,5vw,40px)", fontWeight: 800 }}>Cómo <span style={{ color: GOLD }}>subir</span> en el ranking</h2>
            <p style={{ color: MID, marginTop: 10, fontSize: 15.5 }}>Las Fútcoins son la moneda única: gánalas jugando y escala en todos los rankings a la vez.</p>
          </div>
          <div data-how-grid style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
            {HOW_TO_CLIMB.map((h, i) => (
              <Link key={i} data-how-card href={h.href} className="zm-rank-card" style={{ padding: 20, borderRadius: 16, background: BG2, border: "1px solid rgba(255,255,255,0.05)", textDecoration: "none", color: "#fff", display: "block" }}>
                <SvgIcon name={h.icon} size={34} style={{ marginBottom: 12 }} />
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{h.title}</div>
                <div style={{ fontSize: 13, color: DIM, lineHeight: 1.55 }}>{h.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA + FAQ de captación: SOLO visitantes sin sesión ═══
          Quien ya tiene sesión (entra desde el lobby) no necesita "Registrarme
          gratis" ni la comparativa Free/Founders: para él/ella la página es el
          tablero. Esto evita la sensación de "portada de marketing". */}
      {authed !== true && (
        <>
          <section data-cta-section style={{ padding: "84px 20px", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(201,168,76,0.1) 0%, transparent 60%)" }} />
            <div style={{ maxWidth: 700, margin: "0 auto", position: "relative" }}>
              <SvgIcon name="ranking" size={60} style={{ marginBottom: 22, display: "inline-block" }} />
              <h2 data-cta-content style={{ fontSize: "clamp(28px,5vw,44px)", fontWeight: 900, marginBottom: 14 }}>¿Serás el <span style={{ color: GOLD }}>número 1</span>?</h2>
              <p data-cta-content style={{ color: MID, marginBottom: 34, fontSize: 18, maxWidth: 500, margin: "0 auto 34px", lineHeight: 1.6 }}>
                Cada acierto suma. Cada racha multiplica. Empieza a escalar posiciones y pon a tu país en lo más alto.
              </p>
              <Link href="/registro" data-cta-content className="zm-rank-card" style={{
                padding: "17px 42px", borderRadius: 14,
                background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
                color: BG, fontWeight: 800, fontSize: 18, textDecoration: "none", display: "inline-block",
                boxShadow: "0 8px 32px rgba(201,168,76,0.35)",
              }}>Registrarme gratis</Link>
            </div>
          </section>

          <ModuleLandingExtras slug="rankings" />
        </>
      )}

      <style>{`
        .zm-rank-card { transition: transform .25s ease, box-shadow .25s ease; }
        @media (hover:hover){ .zm-rank-card:hover { transform: translateY(-6px); } }
      `}</style>
    </div>
  );
}

// ─── Banner reutilizable "tu posición / tu país / tu comunidad" ─────────────
// `leading` permite sustituir la banderita por otro adorno (p. ej. el avatar
// del creador). Si no se pasa, usa la banderita de `flag`.
function MeBanner({ rank, flag, leading, title, sub, value }: { rank: number; flag?: string | null; leading?: React.ReactNode; title: string; sub: string; value: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 14,
      maxWidth: 800, margin: "0 auto 16px",
      background: "rgba(201,168,76,0.10)", border: "1px solid rgba(201,168,76,0.25)",
    }}>
      <div style={{ minWidth: 40, height: 32, padding: "0 8px", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, background: "rgba(201,168,76,0.18)", color: GOLD }}>#{rank}</div>
      {leading ?? <Flag code={flag ?? null} />}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
        <div style={{ fontSize: 12, color: DIM }}>{sub}</div>
      </div>
      <div style={{ fontWeight: 800, fontSize: 18, color: GOLD }}>{value}</div>
    </div>
  );
}

// ─── Campeón de la semana ───────────────────────────────────────────────────
// El que más Fútcoins ha GANADO en los últimos 7 días (no el saldo de siempre).
// Resetea cada semana, así cualquiera puede ser campeón. Premio en estatus.
function WeeklyChampions({ entries }: { entries: RankEntry[] | null }) {
  if (entries === null) return null;            // cargando: no ocupa sitio
  if (entries.length === 0) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto 18px", padding: "16px 18px", borderRadius: 16, background: "rgba(201,168,76,0.08)", border: "1px dashed rgba(201,168,76,0.35)", textAlign: "center" }}>
        <div style={{ fontWeight: 800, fontSize: 15 }}>Sé el <span style={{ color: GOLD }}>Campeón de la semana</span></div>
        <div style={{ color: DIM, fontSize: 12.5, marginTop: 4 }}>Quien más Fútcoins gane esta semana se lleva la corona. ¡Empieza a jugar!</div>
      </div>
    );
  }
  const champ = entries[0];
  const rest = entries.slice(1, 3);
  const champName = champ.name || "Jugador anónimo";
  return (
    <div style={{
      maxWidth: 800, margin: "0 auto 18px", padding: "18px 18px 16px", borderRadius: 18,
      background: "linear-gradient(135deg, rgba(201,168,76,0.16), rgba(201,168,76,0.04))",
      border: "1px solid rgba(201,168,76,0.45)", boxShadow: "0 8px 32px rgba(201,168,76,0.12)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 6 }}>
        <span style={{ color: GOLD, fontWeight: 900, fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase" }}>Campeón de la semana</span>
        <span style={{ color: DIM, fontSize: 11.5 }}>Se reinicia cada semana · últimos 7 días</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: champ.avatarUrl ? `url(${champ.avatarUrl}) center/cover no-repeat` : `linear-gradient(135deg,${GOLD},${GOLD2})`, boxShadow: `0 0 0 3px ${GOLD}`, color: BG, fontWeight: 900, fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center" }} aria-hidden>{!champ.avatarUrl && champName.charAt(0).toUpperCase()}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontWeight: 900, fontSize: 19, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{champName}</span>
            <Flag code={champ.country} />
          </div>
          <div style={{ color: MID, fontSize: 12.5, marginTop: 2 }}>Lidera la semana</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 22, color: GOLD }}>{champ.coins.toLocaleString()} FC</div>
          <div style={{ color: DIM, fontSize: 11 }}>esta semana</div>
        </div>
      </div>
      {rest.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          {rest.map((e, i) => (
            <div key={e.userId} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
              <span style={{ fontSize: 13, width: 22, textAlign: "center", flexShrink: 0, color: DIM, fontWeight: 800 }}>{i === 0 ? "2º" : "3º"}</span>
              <span style={{ flex: 1, minWidth: 0, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name || "Jugador anónimo"}</span>
              <Flag code={e.country} />
              <span style={{ fontWeight: 800, color: "#fff" }}>{e.coins.toLocaleString()} FC</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// PIVOTE LIGAS (jul-2026): "Gran Premio del Mundial" retirado — el sorteo/premio
// patrocinado y su ranking por mérito (GrandPrizeBanner, SponsorTag, MeritEntry,
// /api/ranking/merit, data/sponsored-prize.ts) se eliminaron con el torneo.

// ─── Lista de jugadores (global / por módulo / por país / por creador) ──────
function PlayersList({ entries, meId, emptyKind = "global", metric = "level" }: { entries: RankEntry[] | null; meId: string | null; emptyKind?: "global" | "country" | "creator" | "liga"; metric?: "level" | "aciertos" }) {
  const emptyMsg = emptyKind === "country"
    ? "Aún no hay jugadores con Fútcoins en este país. ¡Sé el primero!"
    : emptyKind === "creator"
    ? "Esta comunidad aún no tiene jugadores con Fútcoins. ¡Sé el primero!"
    : emptyKind === "liga"
    ? "Aún no hay ranking en esta liga. ¡Predice sus partidos y sé el primero!"
    : "Aún no hay nadie en el ranking. ¡Juega y gana las primeras Fútcoins!";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 800, margin: "0 auto" }}>
      {entries === null && <div style={{ textAlign: "center", color: DIM, padding: "32px 0", fontSize: 14 }}>Cargando ranking…</div>}
      {entries !== null && entries.length === 0 && (
        <div style={{ textAlign: "center", color: DIM, padding: "32px 0", fontSize: 14 }}>{emptyMsg}</div>
      )}
      {(entries ?? []).map((r, i) => {
        const isMe = !!meId && r.userId === meId;
        const name = r.name || "Jugador anónimo";
        const initial = name.charAt(0).toUpperCase();
        return (
          <div key={r.userId} className="zm-rank-card" style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 14,
            background: isMe ? "rgba(201,168,76,0.14)" : i < 3 ? `rgba(201,168,76,${0.08 - i * 0.02})` : BG2,
            border: `1px solid ${isMe ? "rgba(201,168,76,0.4)" : i < 3 ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.05)"}`,
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, flexShrink: 0, ...rankChipStyle(i) }}>{r.rank}</div>
            <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: r.avatarUrl ? `url(${r.avatarUrl}) center/cover no-repeat` : `linear-gradient(135deg,${GOLD},${GOLD2})`, color: BG, fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }} aria-hidden>{!r.avatarUrl && initial}</div>
            <Flag code={r.country} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}{isMe && <span style={{ color: GOLD, fontWeight: 600 }}> · tú</span>}</div>
              <div style={{ fontSize: 12, color: DIM }}>{metric === "aciertos" ? `${r.level} ${r.level === 1 ? "acierto" : "aciertos"}` : `Nivel ${r.level}`}</div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 18, color: i === 0 || isMe ? GOLD : "#fff" }}>{r.coins.toLocaleString()} FC</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Medallero de naciones ──────────────────────────────────────────────────
function NationsList({ nations, myCode, onPick }: { nations: NationRank[] | null; myCode: string | null; onPick: (code: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 800, margin: "0 auto" }}>
      {nations === null && <div style={{ textAlign: "center", color: DIM, padding: "32px 0", fontSize: 14 }}>Cargando medallero…</div>}
      {nations !== null && nations.length === 0 && (
        <div style={{ textAlign: "center", color: DIM, padding: "32px 0", fontSize: 14 }}>El medallero arranca cuando los jugadores empiecen a ganar Fútcoins. ¡Pon a tu país en lo alto!</div>
      )}
      {(nations ?? []).map((n, i) => {
        const isMine = !!myCode && n.country === myCode;
        return (
          <button key={n.country} onClick={() => onPick(n.country)} className="zm-rank-card" style={{
            display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderRadius: 14, cursor: "pointer", textAlign: "left", width: "100%", color: "#fff",
            background: isMine ? "rgba(201,168,76,0.14)" : i < 3 ? `rgba(201,168,76,${0.08 - i * 0.02})` : BG2,
            border: `1px solid ${isMine ? "rgba(201,168,76,0.4)" : i < 3 ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.05)"}`,
          }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15, flexShrink: 0, ...rankChipStyle(i) }}>{n.rank}</div>
            <Flag code={n.country} w={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getCountryName(n.country)}{isMine && <span style={{ color: GOLD, fontWeight: 600 }}> · tu país</span>}</div>
              <div style={{ fontSize: 12, color: DIM }}>{n.players.toLocaleString()} {n.players === 1 ? "jugador" : "jugadores"}{n.topName ? ` · líder: ${n.topName}` : ""}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: i === 0 ? GOLD : "#fff" }}>{n.coins.toLocaleString()} FC</div>
              <div style={{ fontSize: 11, color: DIM }}>Ver ranking →</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

