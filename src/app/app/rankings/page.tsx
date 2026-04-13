"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const BG = "#060B14", BG2 = "#0F1D32", BG3 = "#0B1825", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a";

const RANK_DATA = [
  { pos: 1, name: "ProPredictor_99", pts: 2847, flag: "ar", streak: 12 },
  { pos: 2, name: "FútbolMaster_MX", pts: 2793, flag: "mx", streak: 8 },
  { pos: 3, name: "LaRoja_Fan", pts: 2681, flag: "es", streak: 15 },
  { pos: 4, name: "SambaKing", pts: 2654, flag: "br", streak: 6 },
  { pos: 5, name: "GoalHunter_CO", pts: 2598, flag: "co", streak: 9 },
  { pos: 6, name: "TotalFootball", pts: 2567, flag: "nl", streak: 4 },
];

const RANK_TYPES = [
  { icon: "/img/zonamundial-images/imagenes/logos para sustuir emojis/ranking.png", title: "Global", desc: "Compite contra todos los usuarios de ZonaMundial en el ranking mundial." },
  { icon: "/img/zonamundial-images/imagenes/logos para sustuir emojis/48 selecciones.png", title: "Por País", desc: "Representa a tu selección y sube en el ranking nacional de tu país." },
  { icon: "/img/zonamundial-images/imagenes/logos para sustuir emojis/creadores.png", title: "Por Creador", desc: "Rankings exclusivos dentro de la comunidad de cada creador oficial." },
  { icon: "/img/zonamundial-images/imagenes/logos para sustuir emojis/ligas privadas.png", title: "Por Liga", desc: "Mide tu nivel frente a amigos en tus ligas privadas personalizadas." },
];

const SEASONS = [
  { name: "Fase de Grupos", dates: "11 jun - 25 jun" },
  { name: "Dieciseisavos", dates: "26 jun - 29 jun" },
  { name: "Octavos", dates: "30 jun - 3 jul" },
  { name: "Cuartos", dates: "4 jul - 7 jul" },
  { name: "Semifinales", dates: "8 jul - 11 jul" },
  { name: "Final", dates: "12 jul - 19 jul" },
];

export default function RankingsPage() {
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
        y: 50, opacity: 0, duration: 0.7, stagger: 0.12, ease: "power3.out"
      });

      gsap.from("[data-rank-row]", {
        scrollTrigger: { trigger: "[data-rank-list]", start: "top 85%" },
        x: -30, opacity: 0, duration: 0.5, stagger: 0.08, ease: "power2.out"
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
                <img src={t.icon} alt="" style={{ width: 48, height: 48, objectFit: "contain", marginBottom: 16 }} />
                <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 8 }}>{t.title}</h3>
                <p style={{ fontSize: 14, color: DIM, lineHeight: 1.6 }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ejemplo Top Global */}
      <section style={{ padding: "80px 20px", background: BG }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 800 }}>
              Top <span style={{ color: GOLD }}>Global</span>
            </h2>
            <p style={{ color: MID, marginTop: 12, fontSize: 16 }}>Así se ve la élite de ZonaMundial</p>
          </div>

          <div data-rank-list style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 800, margin: "0 auto" }}>
            {RANK_DATA.map((r, i) => (
              <div key={r.name} data-rank-row data-hover-card style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 14,
                background: i < 3 ? `rgba(201,168,76,${0.08 - i * 0.02})` : BG2,
                border: `1px solid ${i < 3 ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.05)"}`,
                cursor: "pointer", transition: "all .3s"
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 900, fontSize: 14,
                  background: i === 0 ? "rgba(201,168,76,0.18)" : i === 1 ? "rgba(192,192,192,0.12)" : i === 2 ? "rgba(205,127,50,0.12)" : "rgba(255,255,255,0.04)",
                  color: i === 0 ? GOLD : i === 1 ? "#d1d5db" : i === 2 ? "#d97706" : DIM
                }}>{r.pos}</div>
                <img src={`https://flagcdn.com/w40/${r.flag}.png`} alt="" style={{ width: 26, height: 18, borderRadius: 2, objectFit: "cover" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: DIM }}>Racha: {r.streak} aciertos seguidos</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 18, color: i === 0 ? GOLD : "#fff" }}>{r.pts.toLocaleString()}</div>
              </div>
            ))}
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
            <p style={{ color: MID, marginTop: 12, fontSize: 16 }}>Cada fase tiene su propia clasificación y premios</p>
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
          <img src="/img/zonamundial-images/imagenes/logos para sustuir emojis/ranking.png" alt="" style={{ width: 64, height: 64, objectFit: "contain", marginBottom: 24, display: "inline-block" }} />
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
    </div>
  );
}
