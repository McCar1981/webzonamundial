"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SvgIcon } from "@/components/icons";
import ModuleLandingExtras from "@/components/app-modules/ModuleLandingExtras";

gsap.registerPlugin(ScrollTrigger);

const BG = "#000000", BG2 = "#14110a", BG3 = "#0a0906", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#a69a82", DIM = "#6e6552";

// Preguntas reales que emite el motor en vivo (catálogo de micro.ts).
const MICRO_TYPES = [
  { emoji: "⚡", title: "Penalti", desc: "¡Penalti! ¿Gol o fallo? Tienes 15 segundos.", pts: "20 pts" },
  { emoji: "🎯", title: "Próximo gol", desc: "Tras cada gol: ¿quién marca el siguiente? Local, visitante o ninguno.", pts: "15 pts" },
  { emoji: "🟥", title: "Roja", desc: "¿Marcará el equipo en inferioridad antes del final?", pts: "25 pts" },
  { emoji: "🔄", title: "Cambio ofensivo", desc: "¿El sustituto que acaba de entrar marcará o asistirá?", pts: "30 pts" },
  { emoji: "📺", title: "VAR", desc: "Gol anulado: ¿llegará un gol válido en los próximos 15'?", pts: "20 pts" },
  { emoji: "🔚", title: "Descuento", desc: "¿Habrá gol en el tiempo añadido?", pts: "25 pts" },
];

// El multiplicador real NO depende del tipo: lo da la Cadena de Fuego (racha de
// aciertos seguidos), igual que en el motor (FIRE_TIERS).
const FIRE = [
  { chain: "2 seguidos", label: "Calentando ✨", mult: "×1.5" },
  { chain: "3 seguidos", label: "En llamas 🔥", mult: "×2" },
  { chain: "4 seguidos", label: "Llamarada 🔥🔥", mult: "×3" },
  { chain: "5+ seguidos", label: "Infierno 🌋", mult: "×5" },
];

// Modos de juego de la Fase 2.
const MODES = [
  { emoji: "🤖", title: "Micros con IA", desc: "Cuando no hay un disparo claro, la IA redacta una micro contextual atada al partido en directo." },
  { emoji: "⚔️", title: "Duelo en Vivo", desc: "Reta a un amigo 1v1. Gana quien sume más micro-puntos cuando el partido termina." },
  { emoji: "👻", title: "Modo Fantasma", desc: "¿Se te escapó una micro? Rejuégala durante los 5 minutos tras resolverse. Solo XP a ×0.5, sin monedas y sin afectar tu racha." },
];

const STEPS = [
  { num: "1", title: "Entra al partido", desc: "Abre el Match Center de un partido en vivo." },
  { num: "2", title: "Salta la micro", desc: "Cuando pasa algo (gol, penalti, roja…) aparece una pregunta con cuenta atrás." },
  { num: "3", title: "Predice rápido", desc: "Tienes 15 segundos. Decide con instinto." },
  { num: "4", title: "Encadena", desc: "Aciertos seguidos suben tu Cadena de Fuego y multiplican los puntos." },
];

export default function MicroPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const heroTl = gsap.timeline();
      heroTl.from("[data-hero-badge]", { y: -20, opacity: 0, duration: 0.6, ease: "power2.out" })
            .from("[data-hero-title]", { y: 40, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.3")
            .from("[data-hero-desc]", { y: 30, opacity: 0, duration: 0.7, ease: "power2.out" }, "-=0.5")
            .from("[data-hero-cta]", { y: 30, opacity: 0, duration: 0.6, stagger: 0.1, ease: "back.out(1.7)" }, "-=0.4");

      gsap.from("[data-type-card]", {
        scrollTrigger: { trigger: "[data-types-grid]", start: "top 85%" },
        y: 50, opacity: 0, duration: 0.7, stagger: 0.1, ease: "power3.out"
      });

      gsap.from("[data-moment-card]", {
        scrollTrigger: { trigger: "[data-moments-grid]", start: "top 85%" },
        x: -30, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power2.out"
      });

      gsap.from("[data-step-item]", {
        scrollTrigger: { trigger: "[data-steps-grid]", start: "top 85%" },
        y: 40, opacity: 0, duration: 0.6, stagger: 0.12, ease: "back.out(1.4)"
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
          <span data-hero-badge style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", display: "inline-block" }}>En vivo</span>
          <h1 data-hero-title style={{ fontSize: "clamp(36px,7vw,56px)", fontWeight: 900, marginTop: 20, lineHeight: 1.1 }}>
            Micro-<span style={{ color: GOLD }}>predicciones</span>
          </h1>
          <p data-hero-desc style={{ color: MID, marginTop: 24, maxWidth: 600, margin: "24px auto 0", lineHeight: 1.7, fontSize: 18 }}>
            Predice en tiempo real durante el partido. Cada minuto cuenta y cada acierto puede multiplicar tus puntos al instante.
          </p>
          <div style={{ marginTop: 40, display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/registro" data-hero-cta data-hover-btn style={{
              padding: "16px 36px", borderRadius: 14,
              background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
              color: BG, fontWeight: 800, fontSize: 16, textDecoration: "none", display: "inline-block",
              boxShadow: "0 8px 32px rgba(201,168,76,0.3)"
            }}>
              Registrarme
            </Link>
            <span data-hero-cta style={{
              padding: "16px 28px", borderRadius: 14,
              background: BG2, border: "1px solid rgba(255,255,255,0.1)",
              color: MID, fontWeight: 600, fontSize: 14
            }}>
              104 partidos
            </span>
          </div>
        </div>
      </section>

      {/* Tipos de micro-predicciones */}
      <section style={{ padding: "80px 20px", background: BG3 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Preguntas</span>
            <h2 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 800, marginTop: 16 }}>
              ¿Qué puedes <span style={{ color: GOLD }}>predecir</span>?
            </h2>
          </div>
          <div data-types-grid style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20 }}>
            {MICRO_TYPES.map((t, i) => (
              <div key={i} data-type-card data-hover-card style={{
                padding: 24, borderRadius: 18, background: BG2,
                border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 36 }}>{t.emoji}</span>
                  <span style={{ padding: "4px 10px", borderRadius: 20, background: "rgba(201,168,76,0.15)", color: GOLD, fontWeight: 700, fontSize: 12 }}>{t.pts}</span>
                </div>
                <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>{t.title}</h3>
                <p style={{ fontSize: 14, color: DIM, lineHeight: 1.6 }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cadena de Fuego: el multiplicador real por racha de aciertos */}
      <section style={{ padding: "80px 20px", background: BG }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 800 }}>
              Cadena de <span style={{ color: "#f97316" }}>Fuego 🔥</span>
            </h2>
            <p style={{ color: MID, marginTop: 12, fontSize: 16 }}>Aciertos seguidos = multiplicador creciente. Un fallo reinicia la racha.</p>
          </div>
          <div data-moments-grid style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
            {FIRE.map((m, i) => (
              <div key={i} data-moment-card data-hover-card style={{
                padding: 24, borderRadius: 16, background: BG2,
                border: "1px solid rgba(255,255,255,0.05)", textAlign: "center", cursor: "pointer"
              }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#f97316", marginBottom: 4 }}>{m.mult}</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{m.label}</div>
                <p style={{ fontSize: 13, color: DIM, lineHeight: 1.5 }}>{m.chain}</p>
              </div>
            ))}
          </div>
          <p style={{ color: DIM, marginTop: 24, fontSize: 13, textAlign: "center", maxWidth: 620, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
            Además, los partidos más importantes del Mundial aplican su propio multiplicador encima de tu racha.
          </p>
        </div>
      </section>

      {/* Modos de juego (Fase 2) */}
      <section style={{ padding: "80px 20px", background: BG3 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Más formas de jugar</span>
            <h2 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 800, marginTop: 16 }}>
              Modos de <span style={{ color: GOLD }}>juego</span>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20 }}>
            {MODES.map((m, i) => (
              <div key={i} data-hover-card style={{
                padding: 28, borderRadius: 18, background: BG2,
                border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer"
              }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>{m.emoji}</div>
                <h3 style={{ fontWeight: 800, fontSize: 19, marginBottom: 8 }}>{m.title}</h3>
                <p style={{ fontSize: 14, color: DIM, lineHeight: 1.6 }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section style={{ padding: "80px 20px", background: BG3 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 800 }}>
              Cómo funciona en <span style={{ color: GOLD }}>4 pasos</span>
            </h2>
          </div>
          <div data-steps-grid style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 20 }}>
            {STEPS.map((s, i) => (
              <div key={i} data-step-item style={{ textAlign: "center", padding: 24 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 24, color: BG, margin: "0 auto 16px"
                }}>{s.num}</div>
                <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: DIM, lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section data-cta-section style={{ padding: "100px 20px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(201,168,76,0.1) 0%, transparent 60%)" }} />
        <div style={{ maxWidth: 700, margin: "0 auto", position: "relative" }}>
          <SvgIcon name="micro-predicciones" size={72} style={{marginBottom:24}} />
          <h2 data-cta-content style={{ fontSize: "clamp(28px,5vw,44px)", fontWeight: 900, marginBottom: 16 }}>
            ¡El partido no espera!
          </h2>
          <p data-cta-content style={{ color: MID, marginBottom: 40, fontSize: 18, maxWidth: 500, margin: "0 auto 40px", lineHeight: 1.6 }}>
            Las micro-predicciones se abren y cierran en segundos. Entrena tu instinto y gana puntos extra en cada partido.
          </p>
          <Link href="/registro" data-cta-content data-hover-btn style={{
            padding: "18px 44px", borderRadius: 14,
            background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
            color: BG, fontWeight: 800, fontSize: 18, textDecoration: "none", display: "inline-block",
            boxShadow: "0 8px 32px rgba(201,168,76,0.35)"
          }}>
            Empezar a jugar
          </Link>
        </div>
      </section>

      <ModuleLandingExtras slug="micro" />
    </div>
  );
}
