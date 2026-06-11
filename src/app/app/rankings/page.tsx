"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SvgIcon } from "@/components/icons";
import ModuleLandingExtras from "@/components/app-modules/ModuleLandingExtras";

gsap.registerPlugin(ScrollTrigger);

const BG = "#060B14", BG2 = "#0F1D32", BG3 = "#0B1825", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a";

// Ranking global REAL por Fútcoins (la moneda única de la app). Lo sirve
// /api/ranking leyendo profiles. Mientras carga se muestra un placeholder breve.
interface RankEntry {
  rank: number;
  userId: string;
  name: string | null;
  avatarUrl: string | null;
  country: string | null;
  coins: number;
  level: number;
}
interface MyRank {
  userId: string;
  rank: number;
  coins: number;
  level: number;
  country: string | null;
  total: number;
}

// Banderita por código ISO-3166 alpha-2 (lo que guarda profiles.country). Solo
// renderiza si parece un código válido de 2 letras, para no pedir imágenes rotas.
function Flag({ code }: { code: string | null }) {
  if (!code || !/^[a-z]{2}$/i.test(code)) return null;
  return (
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      alt=""
      width={24}
      height={16}
      style={{ borderRadius: 3, objectFit: "cover", flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
    />
  );
}

const RANK_TYPES = [
  { icon: "ranking", title: "Global", desc: "Compite contra todos los usuarios de ZonaMundial en el ranking mundial." },
  { icon: "48 selecciones", title: "Por País", desc: "Representa a tu selección y sube en el ranking nacional de tu país." },
  { icon: "creadores", title: "Por Creador", desc: "Rankings exclusivos dentro de la comunidad de cada creador oficial." },
  { icon: "ligas privadas", title: "Por Liga", desc: "Mide tu nivel frente a amigos en tus ligas privadas personalizadas." },
];

const SEASONS = [
  { name: "Fase de Grupos", dates: "11 jun - 25 jun" },
  { name: "Dieciseisavos", dates: "26 jun - 29 jun" },
  { name: "Octavos", dates: "30 jun - 3 jul" },
  { name: "Cuartos", dates: "4 jul - 7 jul" },
  { name: "Semifinales", dates: "8 jul - 11 jul" },
  { name: "Final", dates: "12 jul - 19 jul" },
];

// Pestañas del ranking: el global (por saldo total) + uno por cada módulo (por
// Fútcoins generadas en él). value=null → global; value=slug → /api/ranking?module=.
const RANK_TABS: { value: string | null; label: string }[] = [
  { value: null, label: "Global" },
  { value: "predicciones", label: "Predicciones" },
  { value: "trivia", label: "Trivia" },
  { value: "fantasy", label: "Fantasy" },
  { value: "modo-carrera", label: "Modo Carrera" },
  { value: "micro", label: "Micro" },
];

export default function RankingsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<RankEntry[] | null>(null);
  const [me, setMe] = useState<MyRank | null>(null);
  // Módulo activo: null = ranking global; slug = competencia de ese módulo.
  const [tab, setTab] = useState<string | null>(null);

  // Carga el ranking del módulo activo (o el global) por Fútcoins, en vivo:
  // top + mi posición si hay sesión. Se reejecuta al cambiar de pestaña.
  useEffect(() => {
    let on = true;
    setEntries(null); // estado de carga al cambiar de pestaña
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
  }, [tab]);

  // ¿Mi posición queda fuera del top mostrado? Entonces vale la pena el resumen.
  const meOutsideTop = !!me && !(entries ?? []).some((e) => e.userId === me.userId);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const heroTl = gsap.timeline();
      heroTl.from("[data-hero-badge]", { y: -20, opacity: 0, duration: 0.6, ease: "power2.out" })
            .from("[data-hero-title]", { y: 40, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.3")
            .from("[data-hero-desc]", { y: 30, opacity: 0, duration: 0.7, ease: "power2.out" }, "-=0.5")
            .from("[data-hero-cta]", { y: 30, opacity: 0, duration: 0.6, stagger: 0.1, ease: "back.out(1.7)" }, "-=0.4");

      gsap.from("[data-type-card]", {
        scrollTrigger: { trigger: "[data-types-grid]", start: "top 85%" },
        y: 50, opacity: 0, duration: 0.7, stagger: 0.12, ease: "power3.out"
      });

      gsap.from("[data-season-card]", {
        scrollTrigger: { trigger: "[data-seasons-grid]", start: "top 85%" },
        y: 40, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power2.out"
      });

      gsap.from("[data-cta-content]", {
        scrollTrigger: { trigger: "[data-cta-section]", start: "top 80%" },
        y: 40, opacity: 0, duration: 0.8, stagger: 0.15, ease: "power3.out"
      });

      gsap.utils.toArray<HTMLElement>("[data-hover-card]").forEach((card) => {
        card.addEventListener("mouseenter", () => { gsap.to(card, { y: -8, duration: 0.3, ease: "power2.out" }); });
        card.addEventListener("mouseleave", () => { gsap.to(card, { y: 0, duration: 0.3, ease: "power2.out" }); });
      });

      gsap.utils.toArray<HTMLElement>("[data-hover-btn]").forEach((btn) => {
        btn.addEventListener("mouseenter", () => { gsap.to(btn, { scale: 1.05, duration: 0.2, ease: "power2.out" }); });
        btn.addEventListener("mouseleave", () => { gsap.to(btn, { scale: 1, duration: 0.2, ease: "power2.out" }); });
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} style={{ background: BG, color: "#fff", fontFamily: "'Outfit',sans-serif", minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{ padding: "20px 20px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center,rgba(201,168,76,0.08) 0%,transparent 60%)" }} />
        <div style={{ maxWidth: 800, margin: "0 auto", position: "relative" }}>
          <span data-hero-badge style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", display: "inline-block" }}>Plataforma</span>
          <h1 data-hero-title style={{ fontSize: "clamp(36px,7vw,56px)", fontWeight: 900, marginTop: 20, lineHeight: 1.1 }}>
            Los <span style={{ color: GOLD }}>Rankings</span>
          </h1>
          <p data-hero-desc style={{ color: MID, marginTop: 24, maxWidth: 600, margin: "24px auto 0", lineHeight: 1.7, fontSize: 18 }}>
            Demuestra quién sabe más de fútbol. Compite a nivel global, representa a tu país, apoya a tu creador favorito o gana en tu liga privada.
          </p>
          <div style={{ marginTop: 40, display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/registro" data-hero-cta data-hover-btn style={{
              padding: "16px 36px", borderRadius: 14,
              background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
              color: BG, fontWeight: 800, fontSize: 16, textDecoration: "none", display: "inline-block",
              boxShadow: "0 8px 32px rgba(201,168,76,0.3)"
            }}>
              Ir al Registro
            </Link>
            <span data-hero-cta style={{
              padding: "16px 28px", borderRadius: 14,
              background: BG2, border: "1px solid rgba(255,255,255,0.1)",
              color: MID, fontWeight: 600, fontSize: 14
            }}>
              Actualizados en vivo
            </span>
          </div>
        </div>
      </section>

      {/* Tipos de Rankings */}
      <section style={{ padding: "80px 20px", background: BG3 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Competición</span>
            <h2 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 800, marginTop: 16 }}>
              4 tipos de <span style={{ color: GOLD }}>ranking</span>
            </h2>
          </div>
          <div data-types-grid style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 24 }}>
            {RANK_TYPES.map((t, i) => (
              <div key={i} data-type-card data-hover-card style={{
                padding: 28, borderRadius: 20, background: BG2,
                border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer"
              }}>
                <SvgIcon name={t.icon} size={48} style={{ marginBottom: 16 }} />
                <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 8 }}>{t.title}</h3>
                <p style={{ fontSize: 14, color: DIM, lineHeight: 1.6 }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top REAL por Fútcoins (global o por módulo, según pestaña) */}
      <section style={{ padding: "80px 20px", background: BG }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h2 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 800 }}>
              Top <span style={{ color: GOLD }}>{tab ? RANK_TABS.find((t) => t.value === tab)?.label : "Global"}</span>
            </h2>
            <p style={{ color: MID, marginTop: 12, fontSize: 16 }}>
              {tab
                ? "Clasificación por Fútcoins ganadas en este módulo"
                : "Clasificación por Fútcoins acumuladas en toda ZonaMundial"}
            </p>
          </div>

          {/* Selector de módulo: global + una competencia por módulo */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 36 }}>
            {RANK_TABS.map((t) => {
              const active = t.value === tab;
              return (
                <button
                  key={t.value ?? "global"}
                  onClick={() => setTab(t.value)}
                  style={{
                    padding: "9px 18px", borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: "pointer",
                    color: active ? BG : MID,
                    background: active ? `linear-gradient(135deg,${GOLD},${GOLD2})` : BG2,
                    border: `1px solid ${active ? "transparent" : "rgba(255,255,255,0.08)"}`,
                    transition: "all .2s",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Mi posición (si estoy logueado y fuera del top visible) */}
          {meOutsideTop && me && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 14,
              maxWidth: 800, margin: "0 auto 16px",
              background: "rgba(201,168,76,0.10)", border: "1px solid rgba(201,168,76,0.25)",
            }}>
              <div style={{
                minWidth: 40, height: 32, padding: "0 8px", borderRadius: 8, display: "flex", alignItems: "center",
                justifyContent: "center", fontWeight: 900, fontSize: 14, background: "rgba(201,168,76,0.18)", color: GOLD,
              }}>#{me.rank}</div>
              <Flag code={me.country} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Tu posición</div>
                <div style={{ fontSize: 12, color: DIM }}>Nivel {me.level} · de {me.total.toLocaleString()} jugadores</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: 18, color: GOLD }}>{me.coins.toLocaleString()} 🪙</div>
            </div>
          )}

          <div data-rank-list style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 800, margin: "0 auto" }}>
            {entries === null && (
              <div style={{ textAlign: "center", color: DIM, padding: "32px 0", fontSize: 14 }}>Cargando ranking…</div>
            )}
            {entries !== null && entries.length === 0 && (
              <div style={{ textAlign: "center", color: DIM, padding: "32px 0", fontSize: 14 }}>
                Aún no hay nadie en el ranking. ¡Juega y gana las primeras Fútcoins!
              </div>
            )}
            {(entries ?? []).map((r, i) => {
              const isMe = !!me && r.userId === me.userId;
              const name = r.name || "Jugador anónimo";
              const initial = name.charAt(0).toUpperCase();
              return (
                <div key={r.userId} data-hover-card style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 14,
                  background: isMe ? "rgba(201,168,76,0.14)" : i < 3 ? `rgba(201,168,76,${0.08 - i * 0.02})` : BG2,
                  border: `1px solid ${isMe ? "rgba(201,168,76,0.4)" : i < 3 ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.05)"}`,
                  transition: "all .3s"
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 900, fontSize: 14, flexShrink: 0,
                    background: i === 0 ? "rgba(201,168,76,0.18)" : i === 1 ? "rgba(192,192,192,0.12)" : i === 2 ? "rgba(205,127,50,0.12)" : "rgba(255,255,255,0.04)",
                    color: i === 0 ? GOLD : i === 1 ? "#d1d5db" : i === 2 ? "#d97706" : DIM
                  }}>{r.rank}</div>
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                    background: r.avatarUrl ? `url(${r.avatarUrl}) center/cover no-repeat` : `linear-gradient(135deg,${GOLD},${GOLD2})`,
                    color: BG, fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
                  }} aria-hidden>{!r.avatarUrl && initial}</div>
                  <Flag code={r.country} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {name}{isMe && <span style={{ color: GOLD, fontWeight: 600 }}> · tú</span>}
                    </div>
                    <div style={{ fontSize: 12, color: DIM }}>Nivel {r.level}</div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: i === 0 || isMe ? GOLD : "#fff" }}>{r.coins.toLocaleString()} 🪙</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Temporadas */}
      <section style={{ padding: "80px 20px", background: BG3 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 800 }}>
              Rankings por <span style={{ color: GOLD }}>fase del torneo</span>
            </h2>
            <p style={{ color: MID, marginTop: 12, fontSize: 16 }}>Cada fase tiene su propia clasificación</p>
          </div>
          <div data-seasons-grid style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 16 }}>
            {SEASONS.map((s, i) => (
              <div key={i} data-season-card data-hover-card style={{
                padding: 20, borderRadius: 14, background: BG2,
                border: "1px solid rgba(255,255,255,0.05)", textAlign: "center", cursor: "pointer"
              }}>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: GOLD }}>{s.dates}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section data-cta-section style={{ padding: "100px 20px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(201,168,76,0.1) 0%, transparent 60%)" }} />
        <div style={{ maxWidth: 700, margin: "0 auto", position: "relative" }}>
          <SvgIcon name="ranking" size={64} style={{ marginBottom: 24, display: "inline-block" }} />
          <h2 data-cta-content style={{ fontSize: "clamp(28px,5vw,44px)", fontWeight: 900, marginBottom: 16 }}>
            ¿Serás el <span style={{ color: GOLD }}>número 1</span>?
          </h2>
          <p data-cta-content style={{ color: MID, marginBottom: 40, fontSize: 18, maxWidth: 500, margin: "0 auto 40px", lineHeight: 1.6 }}>
            Cada acierto suma. Cada racha multiplica. Entra ahora y empieza a escalar posiciones.
          </p>
          <Link href="/registro" data-cta-content data-hover-btn style={{
            padding: "18px 44px", borderRadius: 14,
            background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
            color: BG, fontWeight: 800, fontSize: 18, textDecoration: "none", display: "inline-block",
            boxShadow: "0 8px 32px rgba(201,168,76,0.35)"
          }}>
            Registrarme gratis
          </Link>
        </div>
      </section>

      <ModuleLandingExtras slug="rankings" />
    </div>
  );
}
