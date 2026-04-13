"use client"

import Link from "next/link"
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useLanguage } from "@/i18n/LanguageContext";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SvgIcon } from '@/components/icons';

gsap.registerPlugin(ScrollTrigger);

const BG = "#060B14", BG2 = "#0F1D32", BG3 = "#0B1825", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a"

const FORMATION_CODES = ["4-3-3","4-4-2","3-5-2","5-3-2","4-2-3-1","3-4-3"];

const ACHIEVEMENT_ICONS = [
  "match center",
  "ranking",
  "micro-predicciones",
  "48 selecciones",
];

const ImgStyle = {
  borderRadius: 20,
  overflow: "hidden",
  boxShadow: "0 24px 50px rgba(0,0,0,0.4)",
  border: "1px solid rgba(255,255,255,0.08)",
  maxWidth: 500,
  width: "100%",
  height: "auto",
  display: "block"
}

const NIVEL_COLORS = ["#22c55e","#3b82f6","#f59e0b","#f97316"];

export default function ModoCarreraPage() {
  const { t } = useLanguage(); const mcT = t.modoCarreraPage;
  const containerRef = useRef<HTMLDivElement>(null);

  const formations = FORMATION_CODES.map((code, i) => ({
    form: code,
    style: [mcT.form1Style, mcT.form2Style, mcT.form3Style, mcT.form4Style, mcT.form5Style, mcT.form6Style][i],
  }));

  const tactics = [
    { name: mcT.tactic1Name, use: mcT.tactic1Use },
    { name: mcT.tactic2Name, use: mcT.tactic2Use },
    { name: mcT.tactic3Name, use: mcT.tactic3Use },
    { name: mcT.tactic4Name, use: mcT.tactic4Use },
    { name: mcT.tactic5Name, use: mcT.tactic5Use },
  ];

  const achievements = [
    { icon: ACHIEVEMENT_ICONS[0], name: mcT.logro1Name, rarity: mcT.logro1Rarity },
    { icon: ACHIEVEMENT_ICONS[1], name: mcT.logro2Name, rarity: mcT.logro2Rarity },
    { icon: ACHIEVEMENT_ICONS[2], name: mcT.logro3Name, rarity: mcT.logro3Rarity },
    { icon: ACHIEVEMENT_ICONS[3], name: mcT.logro4Name, rarity: mcT.logro4Rarity },
  ];

  const niveles = [
    { level: "5", name: mcT.nivel1Name, color: NIVEL_COLORS[0] },
    { level: "4", name: mcT.nivel2Name, color: NIVEL_COLORS[1] },
    { level: "3", name: mcT.nivel3Name, color: NIVEL_COLORS[2] },
    { level: "2", name: mcT.nivel4Name, color: NIVEL_COLORS[3] },
  ];

  const plantillaStats = [
    { label: mcT.statPlantilla, value: "36" },
    { label: mcT.statConvocatoria, value: "23-26" },
    { label: mcT.statPorteros, value: "Min 2" },
    { label: mcT.statOverall, value: "0-99" },
  ];

  const fases = [
    { phase: mcT.phaseGrupos, teams: "48", color: "#3b82f6" },
    { phase: mcT.phase16, teams: "32", color: "#8b5cf6" },
    { phase: mcT.phaseOctavos, teams: "16", color: "#ec4899" },
    { phase: mcT.phaseCuartos, teams: "8", color: "#f59e0b" },
    { phase: mcT.phaseSemis, teams: "4", color: "#ef4444" },
    { phase: mcT.phaseFinal, teams: "2", color: GOLD },
  ];

  const partidoFeatures = [
    { icon: "formato 2026", text: mcT.partidoFeat1 },
    { icon: "micro-predicciones", text: mcT.partidoFeat2 },
    { icon: "predicciones", text: mcT.partidoFeat3 },
    { icon: "match center", text: mcT.partidoFeat4 },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      const heroTl = gsap.timeline();
      heroTl.from("[data-hero-badge]", { y: -20, opacity: 0, duration: 0.6, ease: "power2.out" })
            .from("[data-hero-title]", { y: 40, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.3")
            .from("[data-hero-desc]", { y: 30, opacity: 0, duration: 0.7, ease: "power2.out" }, "-=0.5")
            .from("[data-hero-cta]", { y: 30, opacity: 0, duration: 0.6, ease: "back.out(1.7)" }, "-=0.4");

      gsap.from("[data-nacion-content]", {
        scrollTrigger: { trigger: "[data-nacion-section]", start: "top 80%" },
        x: -60, opacity: 0, duration: 0.9, ease: "power3.out"
      });
      gsap.from("[data-nacion-img]", {
        scrollTrigger: { trigger: "[data-nacion-section]", start: "top 80%" },
        x: 60, opacity: 0, duration: 0.9, ease: "power3.out"
      });
      gsap.from("[data-nivel-item]", {
        scrollTrigger: { trigger: "[data-niveles-list]", start: "top 90%" },
        y: 30, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power2.out"
      });

      gsap.from("[data-plantilla-img]", {
        scrollTrigger: { trigger: "[data-plantilla-section]", start: "top 80%" },
        x: -60, opacity: 0, duration: 0.9, ease: "power3.out"
      });
      gsap.from("[data-plantilla-content]", {
        scrollTrigger: { trigger: "[data-plantilla-section]", start: "top 80%" },
        x: 60, opacity: 0, duration: 0.9, ease: "power3.out"
      });
      gsap.from("[data-plantilla-stat]", {
        scrollTrigger: { trigger: "[data-plantilla-stats]", start: "top 90%" },
        scale: 0.8, opacity: 0, duration: 0.6, stagger: 0.1, ease: "back.out(1.4)"
      });

      gsap.from("[data-tactica-header]", {
        scrollTrigger: { trigger: "[data-tactica-section]", start: "top 80%" },
        y: 30, opacity: 0, duration: 0.7, ease: "power3.out"
      });
      gsap.from("[data-tactica-card]", {
        scrollTrigger: { trigger: "[data-tactica-grid]", start: "top 80%" },
        y: 50, opacity: 0, duration: 0.8, stagger: 0.15, ease: "power3.out"
      });
      gsap.from("[data-formacion-item]", {
        scrollTrigger: { trigger: "[data-formaciones-grid]", start: "top 90%" },
        scale: 0.8, opacity: 0, duration: 0.5, stagger: 0.08, ease: "back.out(1.4)"
      });
      gsap.from("[data-tactica-item]", {
        scrollTrigger: { trigger: "[data-tacticas-list]", start: "top 90%" },
        x: 30, opacity: 0, duration: 0.5, stagger: 0.08, ease: "power2.out"
      });

      gsap.from("[data-torneo-content]", {
        scrollTrigger: { trigger: "[data-torneo-section]", start: "top 80%" },
        x: -60, opacity: 0, duration: 0.9, ease: "power3.out"
      });
      gsap.from("[data-torneo-img]", {
        scrollTrigger: { trigger: "[data-torneo-section]", start: "top 80%" },
        x: 60, opacity: 0, duration: 0.9, ease: "power3.out"
      });
      gsap.from("[data-fase-item]", {
        scrollTrigger: { trigger: "[data-fases-grid]", start: "top 90%" },
        scale: 0.8, opacity: 0, duration: 0.5, stagger: 0.08, ease: "back.out(1.4)"
      });
      gsap.from("[data-puntos-item]", {
        scrollTrigger: { trigger: "[data-puntos-grid]", start: "top 95%" },
        scale: 0.8, opacity: 0, duration: 0.5, stagger: 0.1, ease: "back.out(1.4)"
      });

      gsap.from("[data-partidos-content]", {
        scrollTrigger: { trigger: "[data-partidos-section]", start: "top 80%" },
        x: -60, opacity: 0, duration: 0.9, ease: "power3.out"
      });
      gsap.from("[data-partidos-img]", {
        scrollTrigger: { trigger: "[data-partidos-section]", start: "top 80%" },
        x: 60, opacity: 0, duration: 0.9, ease: "power3.out"
      });
      gsap.from("[data-partido-feature]", {
        scrollTrigger: { trigger: "[data-partido-features]", start: "top 90%" },
        y: 20, opacity: 0, duration: 0.5, stagger: 0.1, ease: "power2.out"
      });

      gsap.from("[data-logros-header]", {
        scrollTrigger: { trigger: "[data-logros-section]", start: "top 80%" },
        y: 30, opacity: 0, duration: 0.7, ease: "power3.out"
      });
      gsap.from("[data-logro-card]", {
        scrollTrigger: { trigger: "[data-logros-grid]", start: "top 85%" },
        y: 50, opacity: 0, duration: 0.7, stagger: 0.1, ease: "power3.out"
      });

      gsap.from("[data-cta-content]", {
        scrollTrigger: { trigger: "[data-cta-section]", start: "top 80%" },
        y: 40, opacity: 0, duration: 0.8, stagger: 0.15, ease: "power3.out"
      });

      gsap.utils.toArray<HTMLElement>("[data-hover-card]").forEach((card) => {
        card.addEventListener("mouseenter", () => {
          gsap.to(card, { y: -8, duration: 0.3, ease: "power2.out" });
        });
        card.addEventListener("mouseleave", () => {
          gsap.to(card, { y: 0, duration: 0.3, ease: "power2.out" });
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-hover-btn]").forEach((btn) => {
        btn.addEventListener("mouseenter", () => {
          gsap.to(btn, { scale: 1.05, duration: 0.2, ease: "power2.out" });
        });
        btn.addEventListener("mouseleave", () => {
          gsap.to(btn, { scale: 1, duration: 0.2, ease: "power2.out" });
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} style={{ background: BG, color: "#fff", fontFamily: "'Outfit',sans-serif", minHeight: "100vh" }}>
      {/* HERO */}
      <section style={{ padding: "100px 20px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center,rgba(201,168,76,0.1) 0%,transparent 60%)" }} />
        <div style={{ maxWidth: 900, margin: "0 auto", position: "relative" }}>
          <span data-hero-badge style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", display: "inline-block" }}>{mcT.badge}</span>
          <h1 data-hero-title style={{ fontSize: "clamp(36px,7vw,56px)", fontWeight: 900, marginTop: 20, lineHeight: 1.1 }}>
            {mcT.title}
          </h1>
          <p data-hero-desc style={{ color: MID, marginTop: 24, maxWidth: 600, margin: "24px auto 0", lineHeight: 1.7, fontSize: 18 }}>
            {mcT.subtitle}
          </p>
          <div style={{ marginTop: 40, display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/registro" data-hero-cta data-hover-btn style={{
              padding: "16px 36px", borderRadius: 14,
              background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
              color: BG, fontWeight: 800, fontSize: 16, textDecoration: "none", display: "inline-block",
              boxShadow: "0 8px 32px rgba(201,168,76,0.3)"
            }}>
              {mcT.ctaBtn}
            </Link>
          </div>
        </div>
      </section>

      {/* SELECCIÓN DE NACIÓN */}
      <section data-nacion-section style={{ padding: "80px 20px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
            <div data-nacion-content>
              <span style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{mcT.step1Label}</span>
              <h2 style={{ fontSize: "clamp(28px,4vw,40px)", fontWeight: 800, marginTop: 16, marginBottom: 24 }}>
                {mcT.nacionTitle} <span style={{ color: GOLD }}>{mcT.nacionTitleHighlight}</span>
              </h2>
              <p style={{ color: MID, fontSize: 17, lineHeight: 1.7, marginBottom: 32 }}>
                {mcT.nacionDesc}
              </p>
              <div data-niveles-list style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {niveles.map((d, i) => (
                  <div key={i} data-nivel-item data-hover-card style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, background: BG2, cursor: "pointer" }}>
                    <span style={{ width: 24, height: 24, borderRadius: "50%", background: GOLD, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: BG }}>{d.level}</span>
                    <span style={{ fontWeight: 600, color: d.color }}>{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div data-nacion-img>
              <img src="/img/zonamundial-images/imagenes/elige nacion modo carrera.jpeg" alt="Selección de nación" style={ImgStyle} />
            </div>
          </div>
        </div>
      </section>

      {/* PLANTILLA */}
      <section data-plantilla-section style={{ padding: "80px 20px", background: BG3 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
            <div data-plantilla-img>
              <img src="/img/zonamundial-images/imagenes/alineacion modo carrera.jpeg" alt="Plantilla" style={ImgStyle} />
            </div>
            <div data-plantilla-content>
              <span style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{mcT.step2Label}</span>
              <h2 style={{ fontSize: "clamp(28px,4vw,40px)", fontWeight: 800, marginTop: 16, marginBottom: 24 }}>
                {mcT.plantillaTitle} <span style={{ color: GOLD }}>{mcT.plantillaTitleHighlight}</span>
              </h2>
              <p style={{ color: MID, fontSize: 17, lineHeight: 1.7, marginBottom: 32 }}>
                {mcT.plantillaDesc}
              </p>
              <div data-plantilla-stats style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
                {plantillaStats.map((item, i) => (
                  <div key={i} data-plantilla-stat data-hover-card style={{ padding: 20, borderRadius: 12, background: BG2, textAlign: "center", cursor: "pointer" }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: GOLD }}>{item.value}</div>
                    <div style={{ fontSize: 12, color: DIM }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FORMACIONES Y TACTICAS */}
      <section data-tactica-section style={{ padding: "80px 20px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <span data-tactica-header style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{mcT.step3Label}</span>
          <h2 data-tactica-header style={{ fontSize: "clamp(28px,4vw,40px)", fontWeight: 800, marginTop: 16, marginBottom: 32 }}>
            {mcT.tacticasTitle} <span style={{ color: GOLD }}>{mcT.tacticasTitleHighlight}</span>
          </h2>

          <div data-tactica-grid style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 32 }}>
            {/* Formaciones */}
            <div data-tactica-card data-hover-card style={{ padding: 28, borderRadius: 20, background: BG2, border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
              <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 20, color: GOLD, display: "flex", alignItems: "center", gap: 8 }}><SvgIcon name="modo carrera" size={24} /> {mcT.formacionesSectionTitle}</h3>
              <div data-formaciones-grid style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
                {formations.map((f, i) => (
                  <div key={i} data-formacion-item data-hover-card style={{ padding: 16, borderRadius: 12, background: BG3, textAlign: "center", cursor: "pointer" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: GOLD, marginBottom: 4 }}>{f.form}</div>
                    <div style={{ fontSize: 12, color: DIM }}>{f.style}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tácticas */}
            <div data-tactica-card data-hover-card style={{ padding: 28, borderRadius: 20, background: BG2, border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
              <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 20, color: GOLD, display: "flex", alignItems: "center", gap: 8 }}><SvgIcon name="modo carrera" size={24} /> {mcT.tacticasSectionTitle}</h3>
              <div data-tacticas-list style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {tactics.map((tac, i) => (
                  <div key={i} data-tactica-item data-hover-card style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14, borderRadius: 10, background: BG3, cursor: "pointer" }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{tac.name}</span>
                    <span style={{ fontSize: 12, color: DIM }}>{tac.use}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TORNEO */}
      <section data-torneo-section style={{ padding: "80px 20px", background: BG3 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
            <div data-torneo-content>
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 800, marginBottom: 24 }}>
                  <SvgIcon name="match center" size={32} style={{ display: "inline-block", verticalAlign: "middle" }} /> {mcT.torneoTitle}
                </h2>
              </div>

              <div data-fases-grid style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
                {fases.map((p, i) => (
                  <div key={i} data-fase-item data-hover-card style={{ padding: "12px 18px", borderRadius: 10, background: BG2, border: `1px solid ${p.color}40`, textAlign: "center", minWidth: 75, cursor: "pointer" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: p.color }}>{p.teams}</div>
                    <div style={{ fontSize: 11, color: DIM }}>{p.phase}</div>
                  </div>
                ))}
              </div>

              <div data-puntos-grid style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div data-puntos-item style={{ padding: "12px 24px", borderRadius: 10, background: BG2, border: "1px solid #22c55e40", textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#22c55e" }}>3 pts</div>
                  <div style={{ fontSize: 11, color: DIM }}>{mcT.puntosVictoria}</div>
                </div>
                <div data-puntos-item style={{ padding: "12px 24px", borderRadius: 10, background: BG2, border: "1px solid #f59e0b40", textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#f59e0b" }}>1 pt</div>
                  <div style={{ fontSize: 11, color: DIM }}>{mcT.puntosEmpate}</div>
                </div>
                <div data-puntos-item style={{ padding: "12px 24px", borderRadius: 10, background: BG2, border: "1px solid rgba(255,255,255,0.1)", textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>0 pts</div>
                  <div style={{ fontSize: 11, color: DIM }}>{mcT.puntosDerrota}</div>
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <span style={{ fontSize: 13, color: DIM }}>{mcT.torneoNote}</span>
              </div>
            </div>

            <div data-torneo-img>
              <img src="/img/zonamundial-images/imagenes/grupos modo carrera.jpeg" alt="Fase de grupos" style={ImgStyle} />
            </div>
          </div>
        </div>
      </section>

      {/* PARTIDOS */}
      <section data-partidos-section style={{ padding: "80px 20px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
            <div data-partidos-content>
              <span style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{mcT.step4Label}</span>
              <h2 style={{ fontSize: "clamp(28px,4vw,40px)", fontWeight: 800, marginTop: 16, marginBottom: 24 }}>
                <SvgIcon name="match center" size={32} style={{ display: "inline-block", verticalAlign: "middle" }} /> {mcT.partidosTitle} <span style={{ color: GOLD }}>{mcT.partidosTitleHighlight}</span>
              </h2>
              <p style={{ color: MID, fontSize: 17, lineHeight: 1.7, marginBottom: 32 }}>
                {mcT.partidosDesc}
              </p>
              <div data-partido-features style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {partidoFeatures.map((item, i) => (
                  <div key={i} data-partido-feature style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 15 }}>
                    <SvgIcon name={item.icon} size={20} style={{ flexShrink: 0 }} />
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
            <div data-partidos-img>
              <img src="/img/zonamundial-images/imagenes/gol messi modo carrera.jpeg" alt="Partido en vivo" style={ImgStyle} />
            </div>
          </div>
        </div>
      </section>

      {/* LOGROS */}
      <section data-logros-section style={{ padding: "80px 20px", background: BG3 }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div data-logros-header style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 800 }}>
              <SvgIcon name="ranking" size={32} style={{ display: "inline-block", verticalAlign: "middle" }} /> {mcT.logrosSectionTitle}
            </h2>
            <p style={{ color: MID, marginTop: 12 }}>{mcT.logrosDesc}</p>
          </div>

          <div data-logros-grid style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
            {achievements.map((a, i) => (
              <div key={i} data-logro-card data-hover-card style={{ padding: 24, borderRadius: 16, background: BG2, border: "1px solid rgba(255,255,255,0.05)", textAlign: "center", cursor: "pointer" }}>
                <SvgIcon name={a.icon} size={48} style={{ marginBottom: 12 }} />
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{a.name}</div>
                <div style={{ fontSize: 11, color: DIM, textTransform: "uppercase", letterSpacing: 1 }}>{a.rarity}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section data-cta-section style={{ padding: "100px 20px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(201,168,76,0.1) 0%, transparent 60%)" }} />
        <div style={{ maxWidth: 600, margin: "0 auto", position: "relative" }}>
          <SvgIcon name="ranking" size={64} style={{ marginBottom: 24 }} />
          <h2 data-cta-content style={{ fontSize: "clamp(28px,5vw,44px)", fontWeight: 900, marginBottom: 16 }}>
            {mcT.ctaFinalTitle}
          </h2>
          <p data-cta-content style={{ color: MID, marginBottom: 40, fontSize: 18 }}>
            {mcT.ctaFinalDesc}
          </p>
          <Link href="/registro" data-cta-content data-hover-btn style={{
            padding: "18px 44px", borderRadius: 14,
            background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
            color: BG, fontWeight: 800, fontSize: 18, textDecoration: "none", display: "inline-block",
            boxShadow: "0 8px 32px rgba(201,168,76,0.35)"
          }}>
            {mcT.ctaBtn}
          </Link>
        </div>
      </section>
    </div>
  )
}
