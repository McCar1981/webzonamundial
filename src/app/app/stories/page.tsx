"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const BG = "#060B14", BG2 = "#0F1D32", BG3 = "#0B1825", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a";

const TEMPLATES = [
  { name: "Resultado épico", style: { background: "linear-gradient(135deg,#ef4444,#b91c1c)" }, icon: "⚽" },
  { name: "Predicción acertada", style: { background: "linear-gradient(135deg,#22c55e,#15803d)" }, icon: "🎯" },
  { name: "Top del ranking", style: { background: "linear-gradient(135deg,#06b6d4,#0e7490)" }, icon: "🏆" },
  { name: "Fantasy team", style: { background: "linear-gradient(135deg,#a855f7,#7e22ce)" }, icon: "👕" },
  { name: "MVP del partido", style: { background: "linear-gradient(135deg,#f59e0b,#b45309)" }, icon: "⭐" },
  { name: "Hinchada", style: { background: "linear-gradient(135deg,#3b82f6,#1d4ed8)" }, icon: "🎉" },
];

const STICKERS = ["🔥", "⚽", "🏆", "🎯", "💯", "🚀", "👑", "⚡", "🎉", "🇦🇷", "🇧🇷", "🇪🇸", "🇲🇽", "🇨🇴"];

const FEATURES = [
  { icon: "/img/zonamundial-images/imagenes/logos para sustuir emojis/predicciones.png", title: "Plantillas automáticas", desc: "Elige entre diseños pre-armados para resultados, rankings y fantasy." },
  { icon: "/img/zonamundial-images/imagenes/logos para sustuir emojis/ranking.png", title: "Stats en tiempo real", desc: "Tus predicciones, puntos y posición se actualizan solos en la story." },
  { icon: "/img/zonamundial-images/imagenes/logos para sustuir emojis/micro-predicciones.png", title: "Stickers y badges", desc: "Añade emojis, banderas y logros desbloqueados para personalizar." },
  { icon: "/img/zonamundial-images/imagenes/logos para sustuir emojis/ia coach.png", title: "Texto editable", desc: "Escribe tu frase, elige tipografía y colores del tema de tu selección." },
];

const SHARES = [
  { name: "Instagram Stories", color: "#E1306C" },
  { name: "WhatsApp Status", color: "#22c55e" },
  { name: "X / Twitter", color: "#0ea5e9" },
  { name: "TikTok", color: "#ff0050" },
  { name: "Feed ZonaMundial", color: GOLD },
];

const STEPS = [
  { num: "1", title: "Selecciona", desc: "Elige una plantilla según tu logro: predicción, ranking, fantasy o reacción." },
  { num: "2", title: "Personaliza", desc: "Añade stickers, cambia colores y escribe tu mensaje." },
  { num: "3", title: "Descarga", desc: "Genera tu imagen en alta calitud listo para compartir." },
  { num: "4", title: "Comparte", desc: "Publica en tus redes o en el feed de ZonaMundial." },
];

export default function StoriesPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [caption, setCaption] = useState("¡Gané 150 pts!");
  const [stickers, setStickers] = useState<string[]>(["🔥", "⚽"]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const heroTl = gsap.timeline();
      heroTl.from("[data-hero-badge]", { y: -20, opacity: 0, duration: 0.6, ease: "power2.out" })
            .from("[data-hero-title]", { y: 40, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.3")
            .from("[data-hero-desc]", { y: 30, opacity: 0, duration: 0.7, ease: "power2.out" }, "-=0.5")
            .from("[data-hero-cta]", { y: 30, opacity: 0, duration: 0.6, stagger: 0.1, ease: "back.out(1.7)" }, "-=0.4");

      gsap.from("[data-creator-ui]", {
        scrollTrigger: { trigger: "[data-creator-section]", start: "top 80%" },
        y: 50, opacity: 0, duration: 0.9, ease: "power3.out"
      });

      gsap.from("[data-feat-card]", {
        scrollTrigger: { trigger: "[data-feats-grid]", start: "top 85%" },
        y: 50, opacity: 0, duration: 0.7, stagger: 0.1, ease: "power3.out"
      });

      gsap.from("[data-step-item]", {
        scrollTrigger: { trigger: "[data-steps-grid]", start: "top 85%" },
        y: 40, opacity: 0, duration: 0.6, stagger: 0.12, ease: "back.out(1.4)"
      });

      gsap.from("[data-share-pill]", {
        scrollTrigger: { trigger: "[data-shares-grid]", start: "top 85%" },
        x: 30, opacity: 0, duration: 0.5, stagger: 0.08, ease: "power2.out"
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

  const toggleSticker = (s: string) => {
    setStickers(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  return (
    <div ref={containerRef} style={{ background: BG, color: "#fff", fontFamily: "'Outfit',sans-serif", minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{ padding: "20px 20px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center,rgba(20,184,166,0.08) 0%,transparent 60%)" }} />
        <div style={{ maxWidth: 800, margin: "0 auto", position: "relative" }}>
          <span data-hero-badge style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", display: "inline-block" }}>Crea y comparte</span>
          <h1 data-hero-title style={{ fontSize: "clamp(36px,7vw,56px)", fontWeight: 900, marginTop: 20, lineHeight: 1.1 }}>
            Tus propias <span style={{ color: "#14b8a6" }}>Stories</span>
          </h1>
          <p data-hero-desc style={{ color: MID, marginTop: 24, maxWidth: 600, margin: "24px auto 0", lineHeight: 1.7, fontSize: 18 }}>
            Diseña cards con tus logros, predicciones, rankings y reacciones. Compártelas en redes sociales o en el feed de ZonaMundial.
          </p>
          <div style={{ marginTop: 40, display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/registro" data-hero-cta data-hover-btn style={{
              padding: "16px 36px", borderRadius: 14,
              background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
              color: BG, fontWeight: 800, fontSize: 16, textDecoration: "none", display: "inline-block",
              boxShadow: "0 8px 32px rgba(201,168,76,0.3)"
            }}>Crear mi primera story</Link>
            <span data-hero-cta style={{ padding: "16px 28px", borderRadius: 14, background: BG2, border: "1px solid rgba(255,255,255,0.1)", color: MID, fontWeight: 600, fontSize: 14 }}>Gratis con tu cuenta</span>
          </div>
        </div>
      </section>

      {/* Creador interactivo */}
      <section data-creator-section style={{ padding: "80px 20px", background: BG3 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 800, textAlign: "center" }}>
              Prueba el <span style={{ color: "#14b8a6" }}>generador</span>
            </h2>
          </div>

          <div data-creator-ui style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 32, alignItems: "start" }}>
            {/* Preview de la story */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{
                width: 280, height: 500, borderRadius: 24,
                ...TEMPLATES[selectedTemplate].style,
                display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
                padding: 24, textAlign: "center", position: "relative", overflow: "hidden",
                boxShadow: "0 24px 60px rgba(0,0,0,0.5)", border: "3px solid rgba(255,255,255,0.15)"
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>{TEMPLATES[selectedTemplate].icon}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.4)", marginBottom: 10 }}>
                  {caption || "Tu mensaje"}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  {stickers.map((s, i) => (
                    <span key={i} style={{ fontSize: 28 }}>{s}</span>
                  ))}
                </div>
                <div style={{ position: "absolute", bottom: 16, left: 16, right: 16, padding: "8px 12px", borderRadius: 20, background: "rgba(0,0,0,0.25)", backdropFilter: "blur(4px)" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>zonamundial.app</span>
                </div>
              </div>
            </div>

            {/* Controles */}
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: GOLD }}>Plantilla</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
                {TEMPLATES.map((t, i) => (
                  <button key={i} onClick={() => setSelectedTemplate(i)} style={{
                    padding: 10, borderRadius: 10, cursor: "pointer",
                    background: selectedTemplate === i ? "rgba(20,184,166,0.2)" : BG2,
                    color: selectedTemplate === i ? "#14b8a6" : "#fff",
                    border: `1px solid ${selectedTemplate === i ? "#14b8a6" : "rgba(255,255,255,0.08)"}`,
                    fontWeight: 600, fontSize: 12
                  }}>{t.icon} {t.name}</button>
                ))}
              </div>

              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: GOLD }}>Texto</div>
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                style={{
                  width: "100%", padding: 12, borderRadius: 10, background: BG2,
                  border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 14, marginBottom: 20,
                  outline: "none"
                }}
                placeholder="Escribe tu mensaje..."
              />

              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: GOLD }}>Stickers</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {STICKERS.map((s) => (
                  <button key={s} onClick={() => toggleSticker(s)} style={{
                    width: 40, height: 40, borderRadius: 10, cursor: "pointer",
                    background: stickers.includes(s) ? "rgba(20,184,166,0.25)" : BG2,
                    fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center",
                    border: `1px solid ${stickers.includes(s) ? "#14b8a6" : "rgba(255,255,255,0.08)"}`
                  }}>{s}</button>
                ))}
              </div>

              <div style={{ marginTop: 24, padding: 14, borderRadius: 12, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", fontSize: 13, color: MID }}>
                Este es un preview del generador. Al registrarte podrás descargar tu story en alta calidad.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "80px 20px", background: BG }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Herramientas</span>
            <h2 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 800, marginTop: 16 }}>
              Todo lo que <span style={{ color: "#14b8a6" }}>incluye</span>
            </h2>
          </div>
          <div data-feats-grid style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={i} data-feat-card data-hover-card style={{ padding: 24, borderRadius: 16, background: BG2, border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
                <img src={f.icon} alt="" style={{ width: 40, height: 40, objectFit: "contain", marginBottom: 12 }} />
                <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: DIM, lineHeight: 1.5 }}>{f.desc}</p>
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
              Cómo funciona en <span style={{ color: "#14b8a6" }}>4 pasos</span>
            </h2>
          </div>
          <div data-steps-grid style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 20 }}>
            {STEPS.map((s, i) => (
              <div key={i} data-step-item style={{ textAlign: "center", padding: 24 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: "linear-gradient(135deg,#14b8a6,#0d9488)",
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

      {/* Compartir */}
      <section style={{ padding: "80px 20px", background: BG }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 800 }}>
              Comparte donde <span style={{ color: "#14b8a6" }}>quieras</span>
            </h2>
          </div>
          <div data-shares-grid style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            {SHARES.map((sh, i) => (
              <div key={i} data-share-pill data-hover-card style={{
                padding: "12px 20px", borderRadius: 30, background: BG2,
                border: `1px solid ${sh.color}40`, color: "#fff", fontWeight: 700,
                display: "flex", alignItems: "center", gap: 8, cursor: "pointer"
              }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: sh.color }} />
                {sh.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section data-cta-section style={{ padding: "100px 20px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(20,184,166,0.1) 0%, transparent 60%)" }} />
        <div style={{ maxWidth: 700, margin: "0 auto", position: "relative" }}>
          <img src="/img/zonamundial-images/imagenes/logos para sustuir emojis/stories.png" alt="" style={{ width: 72, height: 72, objectFit: "contain", marginBottom: 24, display: "inline-block" }} />
          <h2 data-cta-content style={{ fontSize: "clamp(28px,5vw,44px)", fontWeight: 900, marginBottom: 16 }}>
            Dale visibilidad a tus <span style={{ color: "#14b8a6" }}>logros</span>
          </h2>
          <p data-cta-content style={{ color: MID, marginBottom: 40, fontSize: 18, maxWidth: 500, margin: "0 auto 40px", lineHeight: 1.6 }}>
            Cada predicción acertada, cada subida de ranking y cada fantasy ganado merece su propia story. Empieza a crear la tuya.
          </p>
          <Link href="/registro" data-cta-content data-hover-btn style={{
            padding: "18px 44px", borderRadius: 14,
            background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
            color: BG, fontWeight: 800, fontSize: 18, textDecoration: "none", display: "inline-block",
            boxShadow: "0 8px 32px rgba(201,168,76,0.35)"
          }}>Crear mi cuenta</Link>
        </div>
      </section>
    </div>
  );
}
