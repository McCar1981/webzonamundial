'use client'

import Link from "next/link"
import { useLanguage } from "@/i18n/LanguageContext"
import { SvgIcon } from '@/components/icons'

const BG = "#060B14", BG2 = "#0F1D32", BG3 = "#0B1825", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a"

const LEAGUE_TYPE_ICONS = ["predicciones","match center","ia coach"];
const FEATURE_ICONS = ["ligas privadas","ranking","chat en vivo","fantasy","ranking","micro-predicciones"];
const IDEA_ICONS = ["ligas privadas","48 selecciones","historia","match center","ligas privadas"];
const STEP_ICONS = ["formato 2026","formato 2026","formato 2026","formato 2026"];

export default function LigasPage() {
  const { t } = useLanguage(); const lT = t.ligasPage;

  const leagueTypes = [
    {
      icon: LEAGUE_TYPE_ICONS[0],
      title: lT.lt1Title,
      features: [lT.lt1Feat1, lT.lt1Feat2, lT.lt1Feat3, lT.lt1Feat4],
    },
    {
      icon: LEAGUE_TYPE_ICONS[1],
      title: lT.lt2Title,
      features: [lT.lt2Feat1, lT.lt2Feat2, lT.lt2Feat3, lT.lt2Feat4],
    },
    {
      icon: LEAGUE_TYPE_ICONS[2],
      title: lT.lt3Title,
      features: [lT.lt3Feat1, lT.lt3Feat2, lT.lt3Feat3],
    },
  ];

  const features = [
    { icon: FEATURE_ICONS[0], title: lT.feat1Title, desc: lT.feat1Desc },
    { icon: FEATURE_ICONS[1], title: lT.feat2Title, desc: lT.feat2Desc },
    { icon: FEATURE_ICONS[2], title: lT.feat3Title, desc: lT.feat3Desc },
    { icon: FEATURE_ICONS[3], title: lT.feat4Title, desc: lT.feat4Desc },
    { icon: FEATURE_ICONS[4], title: lT.feat5Title, desc: lT.feat5Desc },
    { icon: FEATURE_ICONS[5], title: lT.feat6Title, desc: lT.feat6Desc },
  ];

  const ideas = [
    { icon: IDEA_ICONS[0], title: lT.idea1Title, desc: lT.idea1Desc },
    { icon: IDEA_ICONS[1], title: lT.idea2Title, desc: lT.idea2Desc },
    { icon: IDEA_ICONS[2], title: lT.idea3Title, desc: lT.idea3Desc },
    { icon: IDEA_ICONS[3], title: lT.idea4Title, desc: lT.idea4Desc },
    { icon: IDEA_ICONS[4], title: lT.idea5Title, desc: lT.idea5Desc },
  ];

  const steps = [
    { step: STEP_ICONS[0], title: lT.step1Title, desc: lT.step1Desc },
    { step: STEP_ICONS[1], title: lT.step2Title, desc: lT.step2Desc },
    { step: STEP_ICONS[2], title: lT.step3Title, desc: lT.step3Desc },
    { step: STEP_ICONS[3], title: lT.step4Title, desc: lT.step4Desc },
  ];

  return (
    <div style={{ background: BG, color: "#fff", fontFamily: "'Outfit',sans-serif", minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{ padding: "80px 20px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center,rgba(201,168,76,0.08) 0%,transparent 60%)" }} />
        <div style={{ maxWidth: 800, margin: "0 auto", position: "relative" }}>
          <span style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>{lT.badge}</span>
          <h1 style={{ fontSize: "clamp(32px,6vw,52px)", fontWeight: 900, marginTop: 16, lineHeight: 1.1 }}>
            {lT.title1} <span style={{ color: GOLD }}>{lT.title2}</span>
          </h1>
          <p style={{ color: MID, marginTop: 20, maxWidth: 600, margin: "20px auto 0", lineHeight: 1.7, fontSize: 17 }}>
            {lT.subtitle}
          </p>
        </div>
      </section>

      {/* Tipos de Ligas */}
      <section style={{ padding: "60px 20px", background: BG3 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 800 }}>
              {lT.leagueTypesSectionTitle} <span style={{ color: GOLD }}>{lT.leagueTypesSectionTitleHighlight}</span>
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 24 }}>
            {leagueTypes.map((type, i) => (
              <div key={i} style={{
                padding: 28, borderRadius: 16, background: BG2,
                border: "1px solid rgba(255,255,255,0.05)"
              }}>
                <SvgIcon name={type.icon} size={40} style={{ marginBottom: 12 }} />
                <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 16, color: GOLD }}>{type.title}</h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {type.features.map((feature, j) => (
                    <li key={j} style={{ fontSize: 14, color: MID, display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ color: GOLD }}>•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Características */}
      <section style={{ padding: "60px 20px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 800 }}>
              <span style={{ color: GOLD }}>{lT.featuresSectionTitle}</span>
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
            {features.map((feature, i) => (
              <div key={i} style={{
                padding: 24, borderRadius: 16, background: BG2,
                border: "1px solid rgba(255,255,255,0.05)",
                display: "flex", gap: 16, alignItems: "flex-start"
              }}>
                <SvgIcon name={feature.icon} size={28} style={{ flexShrink: 0 }} />
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{feature.title}</h3>
                  <p style={{ fontSize: 14, color: DIM }}>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ideas de ligas */}
      <section style={{ padding: "60px 20px", background: BG3 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 800 }}>
              {lT.ideasSectionTitle} <span style={{ color: GOLD }}>{lT.ideasSectionTitleHighlight}</span>
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
            {ideas.map((idea, i) => (
              <div key={i} style={{
                padding: 24, borderRadius: 16, background: BG2,
                border: "1px solid rgba(255,255,255,0.05)"
              }}>
                <SvgIcon name={idea.icon} size={32} style={{ marginBottom: 12 }} />
                <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{idea.title}</h3>
                <p style={{ fontSize: 14, color: DIM, fontStyle: "italic" }}>&ldquo;{idea.desc}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section style={{ padding: "60px 20px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 800 }}>
              {lT.stepsSectionTitle} <span style={{ color: GOLD }}>{lT.stepsSectionTitleHighlight}</span>
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 20 }}>
            {steps.map((step, i) => (
              <div key={i} style={{
                padding: 28, borderRadius: 16, background: BG2,
                border: "1px solid rgba(255,255,255,0.05)",
                textAlign: "center"
              }}>
                <div style={{ position: "relative", width: 48, height: 48, margin: "0 auto 12px" }}>
                  <SvgIcon name={step.step} size={48} />
                  <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 20, color: "#fff" }}>{i + 1}</span>
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: DIM, lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 20px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <SvgIcon name="predicciones" size={64} style={{ marginBottom: 24, display: "inline-block" }} />
          <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 800, marginBottom: 16 }}>
            {lT.ctaTitle} <span style={{ color: GOLD }}>{lT.ctaTitle2}</span>
          </h2>
          <p style={{ color: MID, marginBottom: 32, fontSize: 16 }}>
            {lT.ctaDesc}
          </p>
          <Link href="/registro" style={{
            padding: "16px 40px", borderRadius: 12,
            background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
            color: BG, fontWeight: 700, fontSize: 16, textDecoration: "none", display: "inline-block"
          }}>
            {lT.ctaBtn}
          </Link>
        </div>
      </section>
    </div>
  )
}
