"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const BG = "#060B14", BG2 = "#0F1D32", BG3 = "#0B1825", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a";

const MICRO_TYPES = [
  { icon: "/img/imagenessilviu/balondefutbol.png", title: "Próximo gol", desc: "¿Quién marcará en los próximos 10 minutos?", mult: "×2 - ×5" },
  { icon: "/img/zonamundial-images/imagenes/logos para sustuir emojis/match center.png", title: "Corners", desc: "¿Habrá más de 2 corners antes del minuto 30?", mult: "×1.5 - ×3" },
  { icon: "/img/zonamundial-images/imagenes/logos para sustuir emojis/predicciones.png", title: "Tarjetas", desc: "¿Veremos tarjeta en la siguiente jugada?", mult: "×2 - ×4" },
  { icon: "/img/zonamundial-images/imagenes/logos para sustuir emojis/micro-predicciones.png", title: "Sustitución", desc: "¿Sale Mbappé en el segundo tiempo?", mult: "×2 - ×6" },
  { icon: "/img/zonamundial-images/imagenes/logos para sustuir emojis/ia coach.png", title: "Penalti", desc: "¿Habrá penalti antes del final del partido?", mult: "×3 - ×8" },
];

const MOMENTS = [
  { time: "0'-15'", label: "Arranque", mult: "×1.5", desc: "Predicciones de primer gol y tarjetas tempranas." },
  { time: "15'-45'", label: "Primera parte", mult: "×2", desc: "Corners, goles y cambios antes del descanso." },
  { time: "45'-60'", label: "Salida del 2º tiempo", mult: "×2.5", desc: "Momento clave para sustituciones y goles." },
  { time: "60'-90'+", label: "Cierre", mult: "×3 - ×5", desc: "Todo por decidir: tarjetas, penales y remontadas." },
];

const STEPS = [
  { num: "1", title: "Entra al partido", desc: "Abre el Match Center y selecciona Micro-predicciones." },
  { num: "2", title: "Elige el momento", desc: "Cada ventana del partido tiene preguntas en vivo." },
  { num: "3", title: "Predice rápido", desc: "Tienes pocos segundos para responder. ¡Más rápido, más puntos!" },
  { num: "4", title: "Multiplica", desc: "Aciertos seguidos activan rachas y multiplicadores." },
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
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center,rgba(249,115,22,0.08) 0%,transparent 60%)" }} />
        <div style={{ maxWidth: 800, margin: "0 auto", position: "relative" }}>
          <span data-hero-badge style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", display: "inline-block" }}>En vivo</span>
          <h1 data-hero-title style={{ fontSize: "clamp(36px,7vw,56px)", fontWeight: 900, marginTop: 20, lineHeight: 1.1 }}>
            Micro-<span style={{ color: "#f97316" }}>predicciones</span>
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
              ¿Qué puedes <span style={{ color: "#f97316" }}>predecir</span>?
            </h2>
          </div>
          <div data-types-grid style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20 }}>
            {MICRO_TYPES.map((t, i) => (
              <div key={i} data-type-card data-hover-card style={{
                padding: 24, borderRadius: 18, background: BG2,
                border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <img src={t.icon} alt="" style={{ width: 40, height: 40, objectFit: "contain" }} />
                  <span style={{ padding: "4px 10px", borderRadius: 20, background: "rgba(249,115,22,0.15)", color: "#f97316", fontWeight: 700, fontSize: 12 }}>{t.mult}</span>
                </div>
                <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>{t.title}</h3>
                <p style={{ fontSize: 14, color: DIM, lineHeight: 1.6 }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Multiplicadores por momento */}
      <section style={{ padding: "80px 20px", background: BG }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 800 }}>
              Multiplicadores <span style={{ color: "#f97316" }}>por momento</span>
            </h2>
            <p style={{ color: MID, marginTop: 12, fontSize: 16 }}>Más tensión = más recompensa</p>
          </div>
          <div data-moments-grid style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
            {MOMENTS.map((m, i) => (
              <div key={i} data-moment-card data-hover-card style={{
                padding: 24, borderRadius: 16, background: BG2,
                border: "1px solid rgba(255,255,255,0.05)", textAlign: "center", cursor: "pointer"
              }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#f97316", marginBottom: 4 }}>{m.time}</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{m.label}</div>
                <div style={{ fontSize: 14, color: GOLD, fontWeight: 700, marginBottom: 10 }}>{m.mult}</div>
                <p style={{ fontSize: 13, color: DIM, lineHeight: 1.5 }}>{m.desc}</p>
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
              Cómo funciona en <span style={{ color: "#f97316" }}>4 pasos</span>
            </h2>
          </div>
          <div data-steps-grid style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 20 }}>
            {STEPS.map((s, i) => (
              <div key={i} data-step-item style={{ textAlign: "center", padding: 24 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: "linear-gradient(135deg,#f97316,#fb923c)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 24, color: "#fff", margin: "0 auto 16px"
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
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(249,115,22,0.1) 0%, transparent 60%)" }} />
        <div style={{ maxWidth: 700, margin: "0 auto", position: "relative" }}>
          <img src="/img/zonamundial-images/imagenes/logos para sustuir emojis/micro-predicciones.png" alt="" style={{ width: 72, height: 72, objectFit: "contain", marginBottom: 24, display: "inline-block" }} />
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
    </div>
  );
}
