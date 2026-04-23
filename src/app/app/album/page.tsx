"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ICON_V3, ICON_DESCUBRE } from "@/components/icons";

gsap.registerPlugin(ScrollTrigger);

const BG = "#060B14", BG2 = "#0F1D32", BG3 = "#0B1825", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a";

const ACCENT = "#f59e0b";

const FEATURES = [
  { icon: ICON_V3.stories, title: "feat1", desc: "feat1d" },
  { icon: ICON_V3.rankings, title: "feat2", desc: "feat2d" },
  { icon: ICON_V3.microPred, title: "feat3", desc: "feat3d" },
  { icon: ICON_V3.predicciones, title: "feat4", desc: "feat4d" },
];

const SAMPLE_STICKERS = [
  { name: "Messi", team: "Argentina", flag: "ar", rarity: "Legendario", color: "#f59e0b" },
  { name: "Mbappé", team: "Francia", flag: "fr", rarity: "Oro", color: "#eab308" },
  { name: "Bellingham", team: "Inglaterra", flag: "gb-eng", rarity: "Plata", color: "#94a3b8" },
  { name: "Vinicius Jr.", team: "Brasil", flag: "br", rarity: "Legendario", color: "#f59e0b" },
  { name: "Pedri", team: "España", flag: "es", rarity: "Oro", color: "#eab308" },
  { name: "Salah", team: "Egipto", flag: "eg", rarity: "Plata", color: "#94a3b8" },
];

const COLLECTION_STATS = [
  { label: "Selecciones", value: "48", icon: ICON_DESCUBRE.selecciones },
  { label: "Cromos únicos", value: "960+", icon: ICON_V3.stories },
  { label: "Ediciones especiales", value: "104", icon: ICON_V3.rankings },
  { label: "Estadios", value: "16", icon: ICON_V3.matchCenter },
];

export default function AlbumPage() {
  const { t } = useLanguage();
  const p = t.albumPage;
  const containerRef = useRef<HTMLDivElement>(null);

  const cards = [
    { title: p.section1Title, desc: p.section1Desc },
    { title: p.section2Title, desc: p.section2Desc },
    { title: p.section3Title, desc: p.section3Desc },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      const heroTl = gsap.timeline();
      heroTl.from("[data-hero-badge]", { y: -20, opacity: 0, duration: 0.6, ease: "power2.out" })
            .from("[data-hero-title]", { y: 40, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.3")
            .from("[data-hero-desc]", { y: 30, opacity: 0, duration: 0.7, ease: "power2.out" }, "-=0.5")
            .from("[data-hero-cta]", { y: 30, opacity: 0, duration: 0.6, stagger: 0.1, ease: "back.out(1.7)" }, "-=0.4");

      gsap.from("[data-sticker-card]", {
        scrollTrigger: { trigger: "[data-stickers-grid]", start: "top 85%" },
        y: 50, opacity: 0, duration: 0.6, stagger: 0.08, ease: "power3.out"
      });

      gsap.from("[data-stat-item]", {
        scrollTrigger: { trigger: "[data-stats-row]", start: "top 85%" },
        y: 30, opacity: 0, duration: 0.5, stagger: 0.1, ease: "power2.out"
      });

      gsap.from("[data-feat-card]", {
        scrollTrigger: { trigger: "[data-feats-grid]", start: "top 85%" },
        y: 50, opacity: 0, duration: 0.7, stagger: 0.1, ease: "power3.out"
      });

      gsap.from("[data-section-card]", {
        scrollTrigger: { trigger: "[data-sections-grid]", start: "top 85%" },
        y: 40, opacity: 0, duration: 0.7, stagger: 0.12, ease: "power3.out"
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
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center,rgba(245,158,11,0.08) 0%,transparent 60%)` }} />
        <div style={{ maxWidth: 800, margin: "0 auto", position: "relative" }}>
          <span data-hero-badge style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", display: "inline-block" }}>{p.badge}</span>
          <h1 data-hero-title style={{ fontSize: "clamp(36px,7vw,56px)", fontWeight: 900, marginTop: 20, lineHeight: 1.1 }}>
            {p.title.split(".")[0]}. <span style={{ color: ACCENT }}>{p.title.split(".")[1]?.trim()}</span>
          </h1>
          <p data-hero-desc style={{ color: MID, marginTop: 24, maxWidth: 600, margin: "24px auto 0", lineHeight: 1.7, fontSize: 18 }}>
            {p.subtitle}
          </p>
          <div style={{ marginTop: 40, display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/registro" data-hero-cta data-hover-btn style={{
              padding: "16px 36px", borderRadius: 14,
              background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
              color: BG, fontWeight: 800, fontSize: 16, textDecoration: "none", display: "inline-block",
              boxShadow: "0 8px 32px rgba(201,168,76,0.3)"
            }}>
              {p.cta}
            </Link>
            <span data-hero-cta style={{
              padding: "16px 28px", borderRadius: 14,
              background: BG2, border: "1px solid rgba(255,255,255,0.1)",
              color: MID, fontWeight: 600, fontSize: 14
            }}>
              {p.coming}
            </span>
          </div>

          {/* Hero Image */}
          <div data-hero-cta style={{
            marginTop: 48,
            position: "relative",
            maxWidth: 640,
            marginLeft: "auto",
            marginRight: "auto",
          }}>
            {/* Glow detrás de la imagen */}
            <div style={{
              position: "absolute",
              inset: -20,
              background: `radial-gradient(ellipse at center, ${GOLD}25 0%, ${ACCENT}15 40%, transparent 70%)`,
              filter: "blur(40px)",
              borderRadius: 32,
              zIndex: 0,
            }} />
            {/* Marco dorado */}
            <div style={{
              position: "relative",
              zIndex: 1,
              borderRadius: 20,
              padding: 3,
              background: `linear-gradient(135deg, ${GOLD}, ${ACCENT}, ${GOLD2}, ${GOLD})`,
              boxShadow: `0 12px 48px ${GOLD}30, 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 ${GOLD2}40`,
            }}>
              <div style={{
                borderRadius: 17,
                overflow: "hidden",
                background: BG,
                padding: 4,
              }}>
                <img
                  src="/img/zonamundial-images/3ed8e8c7-8e9f-49d0-9a54-518d3f7b4dcb.webp"
                  alt="Álbum de cromos ZonaMundial 2026"
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                    borderRadius: 13,
                  }}
                />
              </div>
            </div>
            {/* Esquinas decorativas */}
            <svg style={{ position: "absolute", top: -6, left: -6, zIndex: 2 }} width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M2 12V4a2 2 0 0 1 2-2h8" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <svg style={{ position: "absolute", top: -6, right: -6, zIndex: 2 }} width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2h8a2 2 0 0 1 2 2v8" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <svg style={{ position: "absolute", bottom: -6, left: -6, zIndex: 2 }} width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M2 12v8a2 2 0 0 0 2 2h8" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <svg style={{ position: "absolute", bottom: -6, right: -6, zIndex: 2 }} width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 22h8a2 2 0 0 0 2-2v-8" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </section>

      {/* Collection Stats */}
      <section style={{ padding: "60px 20px", background: BG3 }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div data-stats-row style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
            {COLLECTION_STATS.map((s, i) => (
              <div key={i} data-stat-item style={{
                padding: 24, borderRadius: 16, background: BG2,
                border: "1px solid rgba(255,255,255,0.06)", textAlign: "center"
              }}>
                <div style={{ width: 32, height: 32, marginBottom: 8, margin: "0 auto 8px" }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: GOLD }}>{s.value}</div>
                <div style={{ fontSize: 13, color: DIM, marginTop: 4, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sticker showcase */}
      <section style={{ padding: "80px 20px", background: BG }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 800 }}>
              Cromos <span style={{ color: ACCENT }}>exclusivos</span>
            </h2>
            <p style={{ color: MID, marginTop: 12, fontSize: 16 }}>{p.section1Desc}</p>
          </div>
          <div data-stickers-grid style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16 }}>
            {SAMPLE_STICKERS.map((s, i) => (
              <div key={i} data-sticker-card data-hover-card style={{
                padding: 20, borderRadius: 16, background: BG2,
                border: `1px solid ${s.color}22`, cursor: "pointer", textAlign: "center"
              }}>
                <div style={{
                  width: 56, height: 40, borderRadius: 6, overflow: "hidden", margin: "0 auto 12px",
                  border: `2px solid ${s.color}44`, display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <img src={`https://flagcdn.com/w80/${s.flag}.png`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: DIM, marginBottom: 8 }}>{s.team}</div>
                <span style={{
                  display: "inline-block", padding: "3px 10px", borderRadius: 20,
                  fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
                  background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}33`
                }}>
                  {s.rarity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Three sections / pillars */}
      <section style={{ padding: "80px 20px", background: BG3 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div data-sections-grid style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 20 }}>
            {cards.map((c, i) => {
              const icons = [
                ICON_V3.stories,
                ICON_V3.trivia,
                ICON_DESCUBRE.unete,
              ];
              return (
                <div key={i} data-section-card data-hover-card style={{
                  padding: 28, borderRadius: 20, background: BG2,
                  border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer"
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
                    background: `${ACCENT}10`, border: `1px solid ${ACCENT}30`, marginBottom: 20
                  }}>
                    {icons[i]}
                  </div>
                  <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 8 }}>{c.title}</h3>
                  <p style={{ fontSize: 14, color: DIM, lineHeight: 1.6 }}>{c.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "80px 20px", background: BG }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 800 }}>
              Todo lo que <span style={{ color: ACCENT }}>incluye</span>
            </h2>
          </div>
          <div data-feats-grid style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20 }}>
            {FEATURES.map((f, i) => {
              const titles = [p.section1Title, p.section2Title, p.section3Title, p.section3Title];
              const descs = [p.section1Desc, p.section2Desc, p.section3Desc, p.section3Desc];
              return (
                <div key={i} data-feat-card data-hover-card style={{
                  padding: 24, borderRadius: 16, background: BG2,
                  border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer"
                }}>
                  <div style={{ width: 40, height: 40, marginBottom: 12 }}>{f.icon}</div>
                  <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{titles[i]}</h3>
                  <p style={{ fontSize: 14, color: DIM, lineHeight: 1.5 }}>{descs[i]}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section data-cta-section style={{ padding: "100px 20px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center, rgba(245,158,11,0.1) 0%, transparent 60%)` }} />
        <div style={{ maxWidth: 700, margin: "0 auto", position: "relative" }}>
          <div style={{ width: 64, height: 64, margin: "0 auto 24px" }}>{ICON_V3.stories}</div>
          <h2 data-cta-content style={{ fontSize: "clamp(28px,5vw,44px)", fontWeight: 900, marginBottom: 16 }}>
            {p.title.split(".")[0]}. <span style={{ color: ACCENT }}>{p.title.split(".")[1]?.trim()}</span>
          </h2>
          <p data-cta-content style={{ color: MID, marginBottom: 40, fontSize: 18, maxWidth: 500, margin: "0 auto 40px", lineHeight: 1.6 }}>
            {p.subtitle}
          </p>
          <Link href="/registro" data-cta-content data-hover-btn style={{
            padding: "18px 44px", borderRadius: 14,
            background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
            color: BG, fontWeight: 800, fontSize: 18, textDecoration: "none", display: "inline-block",
            boxShadow: "0 8px 32px rgba(201,168,76,0.35)"
          }}>
            {p.cta}
          </Link>
        </div>
      </section>
    </div>
  );
}
