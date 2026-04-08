'use client'

import Link from "next/link"
import { useLanguage } from "@/i18n/LanguageContext"

const BG = "#060B14", BG2 = "#0F1D32", BG3 = "#0B1825", GOLD = "#c9a84c", GOLD2 = "#e8d48b", MID = "#8a94b0", DIM = "#6a7a9a"

const CREATOR_ICONS = ["🎮","📺","🎵","📝","⚽","😂"];
const CHAT_FEAT_ICONS = ["🔥","🎯","🗳️","📊","🎁"];
const REWARD_ICONS = ["⏱️","🎁","📺","🎤"];
const WATCH_FEAT_ICONS = ["⚽","💬","🎯","📊"];

export default function StreamingPage() {
  const { t } = useLanguage(); const sT = t.streamingPage;

  const creators = [
    { icon: CREATOR_ICONS[0], title: sT.creator1Title, desc: sT.creator1Desc },
    { icon: CREATOR_ICONS[1], title: sT.creator2Title, desc: sT.creator2Desc },
    { icon: CREATOR_ICONS[2], title: sT.creator3Title, desc: sT.creator3Desc },
    { icon: CREATOR_ICONS[3], title: sT.creator4Title, desc: sT.creator4Desc },
    { icon: CREATOR_ICONS[4], title: sT.creator5Title, desc: sT.creator5Desc },
    { icon: CREATOR_ICONS[5], title: sT.creator6Title, desc: sT.creator6Desc },
  ];

  const chatFeatures = [
    { icon: CHAT_FEAT_ICONS[0], title: sT.chatFeat1Title, desc: sT.chatFeat1Desc },
    { icon: CHAT_FEAT_ICONS[1], title: sT.chatFeat2Title, desc: sT.chatFeat2Desc },
    { icon: CHAT_FEAT_ICONS[2], title: sT.chatFeat3Title, desc: sT.chatFeat3Desc },
    { icon: CHAT_FEAT_ICONS[3], title: sT.chatFeat4Title, desc: sT.chatFeat4Desc },
    { icon: CHAT_FEAT_ICONS[4], title: sT.chatFeat5Title, desc: sT.chatFeat5Desc },
  ];

  const rewards = [
    { icon: REWARD_ICONS[0], title: sT.reward1Title, desc: sT.reward1Desc },
    { icon: REWARD_ICONS[1], title: sT.reward2Title, desc: sT.reward2Desc },
    { icon: REWARD_ICONS[2], title: sT.reward3Title, desc: sT.reward3Desc },
    { icon: REWARD_ICONS[3], title: sT.reward4Title, desc: sT.reward4Desc },
  ];

  const modes = [
    { moment: sT.mode1Moment, duration: sT.mode1Duration, desc: sT.mode1Desc },
    { moment: sT.mode2Moment, duration: sT.mode2Duration, desc: sT.mode2Desc },
    { moment: sT.mode3Moment, duration: sT.mode3Duration, desc: sT.mode3Desc },
  ];

  const watchFeatures = [
    { icon: WATCH_FEAT_ICONS[0], text: sT.watchFeat1 },
    { icon: WATCH_FEAT_ICONS[1], text: sT.watchFeat2 },
    { icon: WATCH_FEAT_ICONS[2], text: sT.watchFeat3 },
    { icon: WATCH_FEAT_ICONS[3], text: sT.watchFeat4 },
  ];

  return (
    <div style={{ background: BG, color: "#fff", fontFamily: "'Outfit',sans-serif", minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{ padding: "80px 20px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center,rgba(201,168,76,0.08) 0%,transparent 60%)" }} />
        <div style={{ maxWidth: 800, margin: "0 auto", position: "relative" }}>
          <span style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>{sT.badge}</span>
          <h1 style={{ fontSize: "clamp(32px,6vw,52px)", fontWeight: 900, marginTop: 16, lineHeight: 1.1 }}>
            {sT.title1} <span style={{ color: GOLD }}>{sT.title2}</span>
          </h1>
          <p style={{ color: MID, marginTop: 20, maxWidth: 600, margin: "20px auto 0", lineHeight: 1.7, fontSize: 17 }}>
            {sT.subtitle}
          </p>
        </div>
      </section>

      {/* Watch Parties + Imagen */}
      <section style={{ padding: "80px 20px", background: BG3 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
            <div>
              <span style={{ color: GOLD, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{sT.watchSectionBadge}</span>
              <h2 style={{ fontSize: "clamp(28px,4vw,40px)", fontWeight: 800, marginTop: 16, marginBottom: 24 }}>
                {sT.watchSectionTitle} <span style={{ color: GOLD }}>{sT.watchSectionTitleHighlight}</span>
              </h2>
              <p style={{ color: MID, fontSize: 17, lineHeight: 1.7, marginBottom: 24 }}>
                {sT.watchSectionDesc}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {watchFeatures.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 15 }}>
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <img
                src="/img/zonamundial-images/imagenes/streaming zona mundial.jpeg"
                alt="Streaming Zona Mundial"
                style={{
                  borderRadius: 20, overflow: "hidden",
                  boxShadow: "0 24px 50px rgba(0,0,0,0.4)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  maxWidth: 500, width: "100%", height: "auto", display: "block"
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Creadores Oficiales */}
      <section style={{ padding: "80px 20px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 800 }}>
              🎙️ {sT.creatorsSectionTitle} <span style={{ color: GOLD }}>{sT.creatorsSectionTitleHighlight}</span>
            </h2>
            <p style={{ color: MID, marginTop: 12 }}>{sT.creatorsSectionDesc}</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
            {creators.map((creator, i) => (
              <div key={i} style={{
                padding: 24, borderRadius: 16, background: BG2,
                border: "1px solid rgba(255,255,255,0.05)",
                display: "flex", gap: 16, alignItems: "center"
              }}>
                <div style={{ fontSize: 32 }}>{creator.icon}</div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{creator.title}</h3>
                  <p style={{ fontSize: 14, color: DIM }}>{creator.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chat Comunitario */}
      <section style={{ padding: "80px 20px", background: BG3 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 800 }}>
              💬 {sT.chatSectionTitle} <span style={{ color: GOLD }}>{sT.chatSectionTitleHighlight}</span>
            </h2>
            <p style={{ color: MID, marginTop: 12 }}>{sT.chatSectionDesc}</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16 }}>
            {chatFeatures.map((feature, i) => (
              <div key={i} style={{
                padding: 24, borderRadius: 16, background: BG2,
                border: "1px solid rgba(255,255,255,0.05)", textAlign: "center"
              }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{feature.icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{feature.title}</h3>
                <p style={{ fontSize: 13, color: DIM }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rewards */}
      <section style={{ padding: "80px 20px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 800 }}>
              🎁 {sT.rewardsSectionTitle} <span style={{ color: GOLD }}>{sT.rewardsSectionTitleHighlight}</span>
            </h2>
            <p style={{ color: MID, marginTop: 12 }}>{sT.rewardsSectionDesc}</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 20 }}>
            {rewards.map((reward, i) => (
              <div key={i} style={{
                padding: 28, borderRadius: 16, background: BG2,
                border: "1px solid rgba(255,255,255,0.05)", textAlign: "center"
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{reward.icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{reward.title}</h3>
                <p style={{ fontSize: 14, color: DIM }}>{reward.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modos de Streaming */}
      <section style={{ padding: "80px 20px", background: BG3 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 800 }}>
              📅 {sT.modesSectionTitle} <span style={{ color: GOLD }}>{sT.modesSectionTitleHighlight}</span>
            </h2>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${GOLD}40` }}>
                  <th style={{ padding: "16px", textAlign: "left", color: GOLD }}>{sT.modesColMomento}</th>
                  <th style={{ padding: "16px", textAlign: "left", color: GOLD }}>{sT.modesColDuracion}</th>
                  <th style={{ padding: "16px", textAlign: "left", color: GOLD }}>{sT.modesColQuePasa}</th>
                </tr>
              </thead>
              <tbody>
                {modes.map((mode, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px", fontWeight: 600 }}>{mode.moment}</td>
                    <td style={{ padding: "16px", color: MID }}>{mode.duration}</td>
                    <td style={{ padding: "16px" }}>{mode.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section style={{ padding: "40px 20px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{
            padding: 24, borderRadius: 16, background: BG2,
            border: "1px solid rgba(255,255,255,0.1)",
            borderLeft: `4px solid ${GOLD}`
          }}>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: MID }}>
              <strong style={{ color: "#fff" }}>{sT.disclaimerStrong}</strong> ZonaMundial <strong style={{ color: "#fff" }}>{sT.disclaimerNoTransmit}</strong>. {sT.disclaimerText}
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 20px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>🎯</div>
          <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 800, marginBottom: 16 }}>
            {sT.ctaTitle} <span style={{ color: GOLD }}>{sT.ctaTitle2}</span>
          </h2>
          <p style={{ color: MID, marginBottom: 32, fontSize: 16 }}>
            {sT.ctaDesc}
          </p>
          <Link href="/registro" style={{
            padding: "16px 40px", borderRadius: 12,
            background: `linear-gradient(135deg,${GOLD},${GOLD2})`,
            color: BG, fontWeight: 700, fontSize: 16, textDecoration: "none", display: "inline-block"
          }}>
            {sT.ctaBtn}
          </Link>
        </div>
      </section>
    </div>
  )
}
