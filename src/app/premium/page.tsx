"use client";

import Link from "next/link";
import { FeatureIcon } from "@/components/FeatureIcon";
import { useLanguage } from "@/i18n/LanguageContext";

const BG = "#060B14", BG2 = "#0F1D32", BG3 = "#0B1825", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a", DARK = "#4a5570";

export default function PremiumPage() {
  const { t } = useLanguage();
  const pT = t.premium;
  const COMPARISON_DATA = pT.comparison;
  const PRICING_PLANS    = pT.plans;
  const PREMIUM_FEATURES = pT.features;
  return (
    <div style={{ background: BG, color: "#fff", fontFamily: "'Outfit',sans-serif", minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{ padding: "20px 20px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center,rgba(201,168,76,0.15) 0%,transparent 60%)" }} />
        <div style={{ maxWidth: 800, margin: "0 auto", position: "relative" }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
            <FeatureIcon title="Fantasy" size={64} />
          </div>
          <h1 style={{ fontSize: "clamp(32px,6vw,52px)", fontWeight: 900, lineHeight: 1.1 }}>
            {pT.heroTitle}
          </h1>
          <p style={{ color: GOLD, fontSize: "clamp(18px,3vw,24px)", fontWeight: 600, marginTop: 16 }}>
            {pT.heroSub}
          </p>
          <p style={{ color: MID, marginTop: 20, maxWidth: 600, margin: "20px auto 0", lineHeight: 1.7, fontSize: 17 }}>
            {pT.heroDesc}
          </p>
        </div>
      </section>

      {/* Comparison Table */}
      <section style={{ padding: "60px 20px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 800 }}>
              {pT.tableTitle.split(' vs ')[0]} vs <span style={{ color: GOLD }}>{pT.tableTitle.split(' vs ')[1]}</span>
            </h2>
          </div>

          <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", background: BG2, padding: "16px 20px", fontWeight: 700, fontSize: 14 }}>
              <span>{pT.tableHeader.feature}</span>
              <span style={{ textAlign: "center" }}>{pT.tableHeader.free}</span>
              <span style={{ textAlign: "center", color: GOLD }}>{pT.tableHeader.premium}</span>
            </div>

            {/* Rows */}
            {COMPARISON_DATA.map((row, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr",
                  padding: "14px 20px",
                  background: i % 2 === 0 ? BG3 : BG2,
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  fontSize: 14,
                }}
              >
                <span style={{ color: "#fff", fontWeight: row.highlight ? 600 : 400 }}>
                  {row.feature}
                </span>
                <span style={{ textAlign: "center", color: row.free === "✅" ? GOLD : row.free === "❌" ? DARK : DIM }}>
                  {row.free}
                </span>
                <span style={{ textAlign: "center", color: row.premium === "✅" || row.highlight ? GOLD : DIM, fontWeight: row.highlight ? 700 : 400 }}>
                  {row.premium}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: "60px 20px", background: BG3 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 800 }}>
              <span style={{ color: GOLD }}>{pT.pricingTitle}</span>
            </h2>
            <p style={{ color: MID, marginTop: 12, fontSize: 16 }}>
              {pT.pricingSub}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32, maxWidth: 900, margin: "0 auto" }}>
            {PRICING_PLANS.map((plan, index) => (
              <div
                key={index}
                style={{
                  padding: 48,
                  borderRadius: 24,
                  background: BG2,
                  border: `2px solid ${GOLD}`,
                  position: "relative",
                  textAlign: "center",
                }}
              >
                <div style={{
                  position: "absolute",
                  top: -15,
                  left: "50%",
                  transform: "translateX(-50%)",
                  padding: "8px 24px",
                  borderRadius: 20,
                  background: GOLD,
                  color: BG,
                  fontSize: 13,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}>
                  {plan.badge}
                </div>

                <p style={{ color: MID, fontSize: 14, marginBottom: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2 }}>
                  {plan.region}
                </p>
                
                <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: GOLD }}>
                  {plan.name}
                </h3>
                
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 56, fontWeight: 800 }}>{plan.price}</span>
                  <span style={{ fontSize: 16, color: MID }}>{plan.period}</span>
                </div>

                <p style={{ color: MID, fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>
                  {plan.description}
                </p>

                <Link
                  href="/registro"
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "16px 0",
                    borderRadius: 12,
                    background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
                    color: BG,
                    fontWeight: 800,
                    fontSize: 16,
                    textAlign: "center",
                    textDecoration: "none",
                  }}
                >
                  {pT.pricingCta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Features Detail */}
      <section style={{ padding: "60px 20px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 800 }}>
              {pT.featuresTitle.split("Premium")[0]}<span style={{ color: GOLD }}>Premium</span>{pT.featuresTitle.split("Premium")[1]}
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 24 }}>
            {PREMIUM_FEATURES.map((feature, i) => (
              <div
                key={i}
                style={{
                  padding: 28,
                  borderRadius: 16,
                  background: BG2,
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div style={{ marginBottom: 16 }}>
                  <FeatureIcon title={feature.iconTitle} size={48} />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 12, color: GOLD }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: 14, color: DIM, lineHeight: 1.6 }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 20px", textAlign: "center", background: BG3 }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
            <FeatureIcon title="Predicciones" size={64} />
          </div>
          <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 800, marginBottom: 16 }}>
            {pT.cta.title}
          </h2>
          <p style={{ color: MID, marginBottom: 32, fontSize: 16 }}>
            {pT.cta.desc}
          </p>
          <Link
            href="/registro"
            style={{
              padding: "18px 48px",
              borderRadius: 12,
              background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
              color: BG,
              fontWeight: 800,
              fontSize: 18,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            {pT.cta.btn}
          </Link>
          <p style={{ color: DARK, marginTop: 16, fontSize: 13 }}>
            {pT.cta.hint}
          </p>
        </div>
      </section>


    </div>
  );
}
