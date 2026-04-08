"use client";

import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";

const BG = "#060B14", BG2 = "#0F1D32", BG3 = "#0B1825", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a";

export default function IACoachPage() {
  const { t } = useLanguage(); const iT = t.iaCoachPage;

  const howItWorksSteps = [
    {
      num: "1️⃣",
      title: iT.step1Title,
      items: [
        iT.step1Item1,
        iT.step1Item2,
        iT.step1Item3,
        iT.step1Item4,
        iT.step1Item5,
        iT.step1Item6,
      ]
    },
    {
      num: "2️⃣",
      title: iT.step2Title,
      desc: iT.step2Desc,
      example: [
        { label: iT.step2Ex1Label, value: "65%" },
        { label: iT.step2Ex2Label, value: "20%" },
        { label: iT.step2Ex3Label, value: "15%" }
      ]
    },
    {
      num: "3️⃣",
      title: iT.step3Title,
      desc: iT.step3Desc,
      example: [
        { type: iT.step3ExType1, text: iT.step3Ex1Text },
        { type: iT.step3ExType2, text: iT.step3Ex2Text }
      ]
    }
  ];

  const iaFeatures = [
    { icon: "🔮", title: iT.feat1Title, desc: iT.feat1Desc },
    { icon: "📊", title: iT.feat2Title, desc: iT.feat2Desc },
    { icon: "⚠️", title: iT.feat3Title, desc: iT.feat3Desc },
    { icon: "🎯", title: iT.feat4Title, desc: iT.feat4Desc },
    { icon: "📈", title: iT.feat5Title, desc: iT.feat5Desc },
    { icon: "💡", title: iT.feat6Title, desc: iT.feat6Desc },
  ];

  return (
    <div style={{ background: BG, color: "#fff", fontFamily: "'Outfit',sans-serif", minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{ padding: "80px 20px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center,rgba(201,168,76,0.08) 0%,transparent 60%)" }} />
        <div style={{ maxWidth: 800, margin: "0 auto", position: "relative" }}>
          <span style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>{iT.badge}</span>
          <h1 style={{ fontSize: "clamp(32px,6vw,52px)", fontWeight: 900, marginTop: 16, lineHeight: 1.1 }}>
            {iT.title}
          </h1>
          <p style={{ color: MID, marginTop: 20, maxWidth: 600, margin: "20px auto 0", lineHeight: 1.7, fontSize: 17 }}>
            {iT.subtitle}
          </p>
          <div style={{ marginTop: 32 }}>
            <Link href="/registro" style={{
              padding: "14px 32px", borderRadius: 12,
              background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
              color: BG, fontWeight: 700, fontSize: 15, textDecoration: "none", display: "inline-block"
            }}>
              {iT.ctaBtn}
            </Link>
          </div>
        </div>
      </section>

      {/* IA Image Section */}
      <section style={{ padding: "60px 20px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
            <div>
              <span style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{iT.iaSectionBadge}</span>
              <h2 style={{ fontSize: "clamp(28px,4vw,40px)", fontWeight: 800, marginTop: 16, marginBottom: 24 }}>
                {iT.iaSectionTitle} <span style={{ color: GOLD }}>{iT.iaSectionTitleHighlight}</span>
              </h2>
              <p style={{ color: MID, fontSize: 17, lineHeight: 1.7, marginBottom: 24 }}>
                {iT.iaSectionDesc}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { icon: "🔮", text: iT.iaBullet1 },
                  { icon: "📊", text: iT.iaBullet2 },
                  { icon: "⚠️", text: iT.iaBullet3 },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 15 }}>
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <img
                src="/img/zonamundial-images/imagenes/ia mundial.jpeg"
                alt="IA Coach - Inteligencia Artificial"
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  maxWidth: 350,
                  width: "100%",
                  height: "auto",
                  display: "block",
                  margin: "0 auto"
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section style={{ padding: "60px 20px", background: BG3 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 800 }}>
              🧠 {iT.howTitle} <span style={{ color: GOLD }}>{iT.howTitleHighlight}</span>
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* Step 1 - Analiza */}
            <div style={{
              padding: 32, borderRadius: 20, background: BG2,
              border: "1px solid rgba(255,255,255,0.05)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                <span style={{ fontSize: 40 }}>{howItWorksSteps[0].num}</span>
                <h3 style={{ fontWeight: 700, fontSize: 24, color: GOLD }}>{howItWorksSteps[0].title}</h3>
              </div>
              <p style={{ color: MID, marginBottom: 16, fontSize: 15 }}>{iT.step1Intro}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12 }}>
                {howItWorksSteps[0].items.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#fff" }}>
                    <span style={{ color: GOLD }}>•</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2 - Predice */}
            <div style={{
              padding: 32, borderRadius: 20, background: BG2,
              border: "1px solid rgba(255,255,255,0.05)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                <span style={{ fontSize: 40 }}>{howItWorksSteps[1].num}</span>
                <h3 style={{ fontWeight: 700, fontSize: 24, color: GOLD }}>{howItWorksSteps[1].title}</h3>
              </div>
              <p style={{ color: MID, marginBottom: 16, fontSize: 15 }}>{howItWorksSteps[1].desc}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                {howItWorksSteps[1].example.map((ex, i) => (
                  <div key={i} style={{
                    padding: "12px 20px", borderRadius: 12,
                    background: "rgba(201,168,76,0.15)",
                    border: "1px solid rgba(201,168,76,0.3)"
                  }}>
                    <span style={{ color: MID, fontSize: 13 }}>{ex.label}: </span>
                    <span style={{ color: GOLD, fontWeight: 700, fontSize: 18 }}>{ex.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3 - Te asesora */}
            <div style={{
              padding: 32, borderRadius: 20, background: BG2,
              border: "1px solid rgba(255,255,255,0.05)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                <span style={{ fontSize: 40 }}>{howItWorksSteps[2].num}</span>
                <h3 style={{ fontWeight: 700, fontSize: 24, color: GOLD }}>{howItWorksSteps[2].title}</h3>
              </div>
              <p style={{ color: MID, marginBottom: 16, fontSize: 15 }}>{howItWorksSteps[2].desc}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {howItWorksSteps[2].example.map((ex, i) => (
                  <div key={i} style={{
                    padding: "14px 20px", borderRadius: 12,
                    background: ex.type === iT.step3ExType1 ? "rgba(74,222,128,0.1)" : "rgba(251,146,60,0.1)",
                    border: `1px solid ${ex.type === iT.step3ExType1 ? "rgba(74,222,128,0.3)" : "rgba(251,146,60,0.3)"}`,
                    display: "flex", alignItems: "center", gap: 12
                  }}>
                    <span style={{
                      padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: "uppercase",
                      background: ex.type === iT.step3ExType1 ? "rgba(74,222,128,0.2)" : "rgba(251,146,60,0.2)",
                      color: ex.type === iT.step3ExType1 ? "#4ade80" : "#fb923c"
                    }}>
                      {ex.type}
                    </span>
                    <span style={{ fontSize: 14, fontStyle: "italic" }}>&ldquo;{ex.text}&rdquo;</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "60px 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 800 }}>
              ✨ {iT.featSectionTitle} <span style={{ color: GOLD }}>{iT.featSectionTitleHighlight}</span>
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 24 }}>
            {iaFeatures.map((feature, i) => (
              <div key={i} style={{
                padding: 28, borderRadius: 20, background: BG2,
                border: "1px solid rgba(255,255,255,0.05)",
                display: "flex", flexDirection: "column"
              }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>{feature.icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{feature.title}</h3>
                <p style={{ fontSize: 14, color: DIM, lineHeight: 1.6, flex: 1 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Interaction */}
      <section style={{ padding: "60px 20px", background: BG3 }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 800 }}>
              💬 {iT.exampleTitle} <span style={{ color: GOLD }}>{iT.exampleTitleHighlight}</span>
            </h2>
          </div>

          <div style={{
            padding: 32, borderRadius: 20, background: BG2,
            border: "1px solid rgba(255,255,255,0.05)"
          }}>
            {/* User Message */}
            <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0
              }}>
                👤
              </div>
              <div style={{
                padding: "16px 20px", borderRadius: 16,
                background: "rgba(59,130,246,0.15)",
                border: "1px solid rgba(59,130,246,0.3)",
                maxWidth: "80%"
              }}>
                <p style={{ fontSize: 15, lineHeight: 1.5 }}>
                  <strong style={{ color: "#60a5fa" }}>{iT.exampleUserLabel}</strong> {iT.exampleUserMsg}
                </p>
              </div>
            </div>

            {/* IA Message */}
            <div style={{ display: "flex", gap: 16, flexDirection: "row-reverse" }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: `linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0
              }}>
                🤖
              </div>
              <div style={{
                padding: "20px 24px", borderRadius: 16,
                background: "rgba(201,168,76,0.1)",
                border: `1px solid rgba(201,168,76,0.3)`,
                maxWidth: "85%"
              }}>
                <p style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 12 }}>
                  <strong style={{ color: GOLD }}>{iT.exampleIALabel}</strong> {iT.exampleIAIntro}
                </p>
                <ul style={{ color: MID, fontSize: 14, lineHeight: 1.8, marginBottom: 16, paddingLeft: 20 }}>
                  <li>{iT.exampleIABullet1}</li>
                  <li>{iT.exampleIABullet2}</li>
                  <li>{iT.exampleIABullet3}</li>
                  <li>{iT.exampleIABullet4}</li>
                  <li>{iT.exampleIABullet5}</li>
                </ul>
                <div style={{
                  padding: "14px 18px", borderRadius: 12,
                  background: "rgba(201,168,76,0.15)",
                  border: "1px solid rgba(201,168,76,0.4)"
                }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: GOLD, marginBottom: 4 }}>{iT.exampleIARecTitle}</p>
                  <p style={{ fontSize: 14, color: "#fff", lineHeight: 1.5 }}>
                    {iT.exampleIARec}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section style={{ padding: "40px 20px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{
            padding: "24px 28px", borderRadius: 16,
            background: "rgba(251,191,36,0.1)",
            border: "1px solid rgba(251,191,36,0.3)",
            display: "flex", gap: 16, alignItems: "flex-start"
          }}>
            <span style={{ fontSize: 28 }}>⚠️</span>
            <div>
              <h4 style={{ fontWeight: 700, fontSize: 15, color: "#fbbf24", marginBottom: 8 }}>{iT.disclaimerTitle}</h4>
              <p style={{ fontSize: 14, color: MID, lineHeight: 1.6, fontStyle: "italic" }}>
                &ldquo;{iT.disclaimerText}&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 20px", textAlign: "center", background: BG3 }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>🎯</div>
          <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 800, marginBottom: 16 }}>
            {iT.ctaFinalTitle} <span style={{ color: GOLD }}>{iT.ctaFinalTitleHighlight}</span>
          </h2>
          <p style={{ color: MID, marginBottom: 32, fontSize: 16 }}>
            {iT.ctaFinalDesc}
          </p>
          <Link href="/registro" style={{
            padding: "16px 40px", borderRadius: 12,
            background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
            color: BG, fontWeight: 700, fontSize: 16, textDecoration: "none", display: "inline-block"
          }}>
            {iT.ctaFinalBtn}
          </Link>
        </div>
      </section>
    </div>
  );
}
