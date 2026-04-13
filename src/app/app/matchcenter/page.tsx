"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const BG = "#060B14", BG2 = "#0F1D32", BG3 = "#0B1825", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a";

const STATS = [
  { label: "Posesión", home: "58%", away: "42%", homeWidth: "58%", awayWidth: "42%", color: "#3b82f6" },
  { label: "Tiros (a puerta)", home: "14 (8)", away: "9 (4)", homeWidth: "60%", awayWidth: "40%", color: "#22c55e" },
  { label: "Pases completados", home: "412", away: "310", homeWidth: "57%", awayWidth: "43%", color: "#f59e0b" },
  { label: "Faltas", home: "8", away: "12", homeWidth: "40%", awayWidth: "60%", color: "#ef4444" },
  { label: "Córneres", home: "7", away: "3", homeWidth: "70%", awayWidth: "30%", color: "#a855f7" },
  { label: "Paradas", home: "3", away: "6", homeWidth: "33%", awayWidth: "67%", color: "#06b6d4" },
];

const EVENTS = [
  { min: "23'", text: "Gol de Messi", icon: "⚽", side: "home" },
  { min: "36'", text: "Tarjeta amarilla", icon: "🟡", side: "away" },
  { min: "41'", text: "Gol de Di María", icon: "⚽", side: "home" },
  { min: "HT", text: "Descanso", icon: "⏸️", side: "neutral" },
  { min: "68'", text: "Sustitución", icon: "🔄", side: "away" },
  { min: "80'", text: "Gol de Mbappé", icon: "⚽", side: "away" },
];

const LIVE_FEATURES = [
  { icon: "/img/zonamundial-images/imagenes/logos para sustuir emojis/match center.png", title: "Alineaciones confirmadas", desc: "Once titular, suplentes y formación táctica." },
  { icon: "/img/zonamundial-images/imagenes/logos para sustuir emojis/predicciones.png", title: "Eventos en vivo", desc: "Goles, tarjetas, sustituciones y VAR en tiempo real." },
  { icon: "/img/zonamundial-images/imagenes/logos para sustuir emojis/micro-predicciones.png", title: "Stats avanzados", desc: "xG, posesión, pases progresivos y más métricas." },
  { icon: "/img/zonamundial-images/imagenes/logos para sustuir emojis/ia coach.png", title: "Análisis IA", desc: "Resumen automático del rendimiento de cada equipo." },
];

export default function MatchCenterPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const heroTl = gsap.timeline();
      heroTl.from("[data-hero-badge]", { y: -20, opacity: 0, duration: 0.6, ease: "power2.out" })
            .from("[data-hero-title]", { y: 40, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.3")
            .from("[data-hero-desc]", { y: 30, opacity: 0, duration: 0.7, ease: "power2.out" }, "-=0.5")
            .from("[data-hero-cta]", { y: 30, opacity: 0, duration: 0.6, stagger: 0.1, ease: "back.out(1.7)" }, "-=0.4");

      gsap.from("[data-scoreboard]", {
        scrollTrigger: { trigger: "[data-live-section]", start: "top 80%" },
        y: 40, opacity: 0, duration: 0.9, ease: "power3.out"
      });

      gsap.from("[data-stat-row]", {
        scrollTrigger: { trigger: "[data-stats-list]", start: "top 85%" },
        x: -20, opacity: 0, duration: 0.5, stagger: 0.08, ease: "power2.out"
      });

      gsap.from("[data-event-item]", {
        scrollTrigger: { trigger: "[data-timeline]", start: "top 85%" },
        y: 20, opacity: 0, duration: 0.5, stagger: 0.08, ease: "power2.out"
      });

      gsap.from("[data-feat-card]", {
        scrollTrigger: { trigger: "[data-feats-grid]", start: "top 85%" },
        y: 50, opacity: 0, duration: 0.7, stagger: 0.1, ease: "power3.out"
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
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center,rgba(16,185,129,0.08) 0%,transparent 60%)" }} />
        <div style={{ maxWidth: 800, margin: "0 auto", position: "relative" }}>
          <span data-hero-badge style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", display: "inline-block" }}>En vivo</span>
          <h1 data-hero-title style={{ fontSize: "clamp(36px,7vw,56px)", fontWeight: 900, marginTop: 20, lineHeight: 1.1 }}>
            <span style={{ color: "#10b981" }}>Match</span> Center
          </h1>
          <p data-hero-desc style={{ color: MID, marginTop: 24, maxWidth: 600, margin: "24px auto 0", lineHeight: 1.7, fontSize: 18 }}>
            Todo lo que pasa en el partido, en un solo lugar. Stats, alineaciones, timeline y análisis en tiempo real.
          </p>
          <div style={{ marginTop: 40, display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/registro" data-hero-cta data-hover-btn style={{
              padding: "16px 36px", borderRadius: 14,
              background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
              color: BG, fontWeight: 800, fontSize: 16, textDecoration: "none", display: "inline-block",
              boxShadow: "0 8px 32px rgba(201,168,76,0.3)"
            }}>
              Probar ahora
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

      {/* Live view */}
      <section data-live-section style={{ padding: "60px 20px", background: BG3 }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div data-scoreboard style={{
            padding: 24, borderRadius: 24, background: BG2,
            border: "1px solid rgba(255,255,255,0.08)", marginBottom: 32
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ textAlign: "center", flex: 1 }}>
                <img src="https://flagcdn.com/w80/ar.png" alt="" style={{ width: 64, height: 44, borderRadius: 6, objectFit: "cover", margin: "0 auto 8px" }} />
                <div style={{ fontWeight: 800, fontSize: 18 }}>Argentina</div>
              </div>
              <div style={{ textAlign: "center", padding: "0 24px" }}>
                <div style={{ fontSize: 42, fontWeight: 900, color: GOLD }}>2 - 1</div>
                <div style={{ fontSize: 12, color: "#22c55e", fontWeight: 700 }}>84'</div>
              </div>
              <div style={{ textAlign: "center", flex: 1 }}>
                <img src="https://flagcdn.com/w80/fr.png" alt="" style={{ width: 64, height: 44, borderRadius: 6, objectFit: "cover", margin: "0 auto 8px" }} />
                <div style={{ fontWeight: 800, fontSize: 18 }}>Francia</div>
              </div>
            </div>

            <div data-stats-list style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {STATS.map((s, i) => (
                <div key={i} data-stat-row>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: MID, marginBottom: 4 }}>
                    <span>{s.home}</span>
                    <span style={{ fontWeight: 700, color: "#fff" }}>{s.label}</span>
                    <span>{s.away}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, height: 8 }}>
                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <div style={{ width: s.homeWidth, height: "100%", background: s.color }} />
                    </div>
                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <div style={{ width: s.awayWidth, height: "100%", background: s.color, marginLeft: "auto" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section style={{ padding: "60px 20px", background: BG }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 800, marginBottom: 32, textAlign: "center" }}>
            Timeline del <span style={{ color: "#10b981" }}>partido</span>
          </h2>
          <div data-timeline style={{ position: "relative", paddingLeft: 24 }}>
            <div style={{ position: "absolute", left: 8, top: 0, bottom: 0, width: 2, background: "rgba(255,255,255,0.08)" }} />
              {EVENTS.map((e, i) => (
                <div key={i} data-event-item style={{ position: "relative", marginBottom: 20, paddingLeft: 24 }}>
                  <div style={{
                    position: "absolute", left: -18, top: 2, width: 20, height: 20, borderRadius: "50%",
                    background: e.side === "home" ? "#22c55e" : e.side === "away" ? "#ef4444" : "#f59e0b",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10
                  }}>{e.icon}</div>
                  <div style={{ fontSize: 12, color: DIM, marginBottom: 2 }}>{e.min}</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{e.text}</div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "80px 20px", background: BG3 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 800 }}>
              Todo lo que <span style={{ color: "#10b981" }}>incluye</span>
            </h2>
          </div>
          <div data-feats-grid style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20 }}>
            {LIVE_FEATURES.map((f, i) => (
              <div key={i} data-feat-card data-hover-card style={{
                padding: 24, borderRadius: 16, background: BG2,
                border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer"
              }}>
                <img src={f.icon} alt="" style={{ width: 40, height: 40, objectFit: "contain", marginBottom: 12 }} />
                <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: DIM, lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section data-cta-section style={{ padding: "100px 20px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(16,185,129,0.1) 0%, transparent 60%)" }} />
        <div style={{ maxWidth: 700, margin: "0 auto", position: "relative" }}>
          <img src="/img/zonamundial-images/imagenes/logos para sustuir emojis/match center.png" alt="" style={{ width: 72, height: 72, objectFit: "contain", marginBottom: 24, display: "inline-block" }} />
          <h2 data-cta-content style={{ fontSize: "clamp(28px,5vw,44px)", fontWeight: 900, marginBottom: 16 }}>
            Vive cada partido al <span style={{ color: "#10b981" }}>máximo</span>
          </h2>
          <p data-cta-content style={{ color: MID, marginBottom: 40, fontSize: 18, maxWidth: 500, margin: "0 auto 40px", lineHeight: 1.6 }}>
            El Match Center es tu compañero indispensable durante los 104 partidos del Mundial. No te pierdas ni un dato.
          </p>
          <Link href="/registro" data-cta-content data-hover-btn style={{
            padding: "18px 44px", borderRadius: 14,
            background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
            color: BG, fontWeight: 800, fontSize: 18, textDecoration: "none", display: "inline-block",
            boxShadow: "0 8px 32px rgba(201,168,76,0.35)"
          }}>
            Activar Match Center
          </Link>
        </div>
      </section>
    </div>
  );
}
