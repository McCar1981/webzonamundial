"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useLanguage } from "@/i18n/LanguageContext";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const BG="#060B14",BG2="#0F1D32",BG3="#0B1825",GOLD="#c9a84c",GOLD2="#e8d48b",MID="#8a94b0",DIM="#6a7a9a";

const GAME_MODE_ICONS = [
  "/img/zonamundial-images/imagenes/logos para sustuir emojis/trivia.png",
  "/img/zonamundial-images/imagenes/logos para sustuir emojis/micro-predicciones.png",
  "/img/zonamundial-images/imagenes/logos para sustuir emojis/ranking.png",
  "/img/zonamundial-images/imagenes/logos para sustuir emojis/modo carrera.png",
  "/img/zonamundial-images/imagenes/logos para sustuir emojis/predicciones.png",
];

const CATEGORY_ICONS = [
  "/img/zonamundial-images/imagenes/logos para sustuir emojis/historia.png",
  "/img/zonamundial-images/imagenes/logos para sustuir emojis/48 selecciones.png",
  "/img/zonamundial-images/imagenes/logos para sustuir emojis/stories.png",
  "/img/zonamundial-images/imagenes/logos para sustuir emojis/trivia.png",
  "/img/zonamundial-images/imagenes/logos para sustuir emojis/predicciones.png",
];

const DIFFICULTY_POINTS = ["5 pts","10 pts","15 pts","25 pts"];
const DIFFICULTY_COLORS = ["#22c55e", GOLD, "#f97316", "#ef4444"];

const BONUS_MULTIPLIERS = ["×2","×1.5","×2","×3"];

const BADGE_ICONS = [
  "/img/zonamundial-images/imagenes/logos para sustuir emojis/historia.png",
  "/img/zonamundial-images/imagenes/logos para sustuir emojis/stories.png",
  "/img/zonamundial-images/imagenes/logos para sustuir emojis/micro-predicciones.png",
  "/img/zonamundial-images/imagenes/logos para sustuir emojis/modo carrera.png",
  "/img/zonamundial-images/imagenes/logos para sustuir emojis/ranking.png",
];

const TITLE_ICONS = [
  "/img/zonamundial-images/imagenes/logos para sustuir emojis/ia coach.png",
  "/img/zonamundial-images/imagenes/logos para sustuir emojis/ranking.png",
  "/img/imagenessilviu/balondefutbol.png",
];

const EXAMPLE_FEATURE_ICONS = [
  "/img/zonamundial-images/imagenes/logos para sustuir emojis/match center.png",
  "/img/zonamundial-images/imagenes/logos para sustuir emojis/predicciones.png",
  "/img/zonamundial-images/imagenes/logos para sustuir emojis/ranking.png",
  "/img/zonamundial-images/imagenes/logos para sustuir emojis/micro-predicciones.png",
  "/img/zonamundial-images/imagenes/logos para sustuir emojis/fantasy.png",
];

export default function TriviaPage() {
  const { t } = useLanguage(); const trT = t.triviaPage;
  const containerRef = useRef<HTMLDivElement>(null);

  const gameModes = [
    { icon: GAME_MODE_ICONS[0], title: trT.mode1Title, desc: trT.mode1Desc, highlight: trT.mode1Highlight },
    { icon: GAME_MODE_ICONS[1], title: trT.mode2Title, desc: trT.mode2Desc, highlight: trT.mode2Highlight },
    { icon: GAME_MODE_ICONS[2], title: trT.mode3Title, desc: trT.mode3Desc, highlight: trT.mode3Highlight },
    { icon: GAME_MODE_ICONS[3], title: trT.mode4Title, desc: trT.mode4Desc, highlight: trT.mode4Highlight },
    { icon: GAME_MODE_ICONS[4], title: trT.mode5Title, desc: trT.mode5Desc, highlight: trT.mode5Highlight },
  ];

  const categories = [
    { name: trT.cat1Name, icon: CATEGORY_ICONS[0], desc: trT.cat1Desc, color: GOLD },
    { name: trT.cat2Name, icon: CATEGORY_ICONS[1], desc: trT.cat2Desc, color: GOLD },
    { name: trT.cat3Name, icon: CATEGORY_ICONS[2], desc: trT.cat3Desc, color: GOLD },
    { name: trT.cat4Name, icon: CATEGORY_ICONS[3], desc: trT.cat4Desc, color: GOLD },
    { name: trT.cat5Name, icon: CATEGORY_ICONS[4], desc: trT.cat5Desc, color: GOLD },
  ];

  const difficultyPoints = [
    { level: trT.diff1Level, points: DIFFICULTY_POINTS[0], color: DIFFICULTY_COLORS[0] },
    { level: trT.diff2Level, points: DIFFICULTY_POINTS[1], color: DIFFICULTY_COLORS[1] },
    { level: trT.diff3Level, points: DIFFICULTY_POINTS[2], color: DIFFICULTY_COLORS[2] },
    { level: trT.diff4Level, points: DIFFICULTY_POINTS[3], color: DIFFICULTY_COLORS[3] },
  ];

  const bonusMultipliers = [
    { name: trT.bonus1Name, multiplier: BONUS_MULTIPLIERS[0], desc: trT.bonus1Desc },
    { name: trT.bonus2Name, multiplier: BONUS_MULTIPLIERS[1], desc: trT.bonus2Desc },
    { name: trT.bonus3Name, multiplier: BONUS_MULTIPLIERS[2], desc: trT.bonus3Desc },
    { name: trT.bonus4Name, multiplier: BONUS_MULTIPLIERS[3], desc: trT.bonus4Desc },
  ];

  const badges = [
    { icon: BADGE_ICONS[0], name: trT.badge1Name, desc: trT.badge1Desc, rarity: trT.badge1Rarity },
    { icon: BADGE_ICONS[1], name: trT.badge2Name, desc: trT.badge2Desc, rarity: trT.badge2Rarity },
    { icon: BADGE_ICONS[2], name: trT.badge3Name, desc: trT.badge3Desc, rarity: trT.badge3Rarity },
    { icon: BADGE_ICONS[3], name: trT.badge4Name, desc: trT.badge4Desc, rarity: trT.badge4Rarity },
    { icon: BADGE_ICONS[4], name: trT.badge5Name, desc: trT.badge5Desc, rarity: trT.badge5Rarity },
  ];

  const rankTitles = [
    { rank: trT.title1Rank, title: trT.title1Title, icon: TITLE_ICONS[0], desc: trT.title1Desc },
    { rank: trT.title2Rank, title: trT.title2Title, icon: TITLE_ICONS[1], desc: trT.title2Desc },
    { rank: trT.title3Rank, title: trT.title3Title, icon: TITLE_ICONS[2], desc: trT.title3Desc },
  ];

  const exFeatures = [
    { icon: EXAMPLE_FEATURE_ICONS[0], text: trT.exFeat1Text },
    { icon: EXAMPLE_FEATURE_ICONS[1], text: trT.exFeat2Text },
    { icon: EXAMPLE_FEATURE_ICONS[2], text: trT.exFeat3Text },
    { icon: EXAMPLE_FEATURE_ICONS[3], text: trT.exFeat4Text },
    { icon: EXAMPLE_FEATURE_ICONS[4], text: trT.exFeat5Text },
  ];

  const stats = [
    { value: trT.stat1Value, label: trT.stat1Label },
    { value: trT.stat2Value, label: trT.stat2Label },
    { value: trT.stat3Value, label: trT.stat3Label },
    { value: trT.stat4Value, label: trT.stat4Label },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      const heroTl = gsap.timeline();
      heroTl.from("[data-hero-badge]", { y: -20, opacity: 0, duration: 0.6, ease: "power2.out" })
            .from("[data-hero-title]", { y: 40, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.3")
            .from("[data-hero-desc]", { y: 30, opacity: 0, duration: 0.7, ease: "power2.out" }, "-=0.5")
            .from("[data-hero-cta]", { y: 30, opacity: 0, duration: 0.6, ease: "back.out(1.7)" }, "-=0.4");

      gsap.from("[data-stat]", {
        scrollTrigger: { trigger: "[data-stats-section]", start: "top 80%", toggleActions: "play none none none" },
        y: 30, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power2.out"
      });

      gsap.from("[data-section-header]", {
        scrollTrigger: { trigger: "[data-game-modes-section]", start: "top 80%" },
        y: 40, opacity: 0, duration: 0.8, ease: "power3.out"
      });

      gsap.from("[data-mode-feature]", {
        scrollTrigger: { trigger: "[data-modes-list]", start: "top 80%" },
        x: -30, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power2.out"
      });

      gsap.from("[data-mode-card]", {
        scrollTrigger: { trigger: "[data-modes-grid]", start: "top 80%" },
        y: 50, opacity: 0, duration: 0.7, stagger: 0.15, ease: "power3.out"
      });

      gsap.from("[data-categories-header]", {
        scrollTrigger: { trigger: "[data-categories-section]", start: "top 80%" },
        y: 30, opacity: 0, duration: 0.7, ease: "power2.out"
      });

      gsap.from("[data-categories-table]", {
        scrollTrigger: { trigger: "[data-categories-table]", start: "top 80%" },
        y: 40, opacity: 0, duration: 0.8, ease: "power3.out"
      });

      gsap.from("[data-category-row]", {
        scrollTrigger: { trigger: "[data-categories-rows]", start: "top 85%" },
        x: -20, opacity: 0, duration: 0.5, stagger: 0.08, ease: "power2.out"
      });

      gsap.from("[data-example-img]", {
        scrollTrigger: { trigger: "[data-example-section]", start: "top 80%" },
        x: -50, opacity: 0, duration: 0.8, ease: "power3.out"
      });

      gsap.from("[data-example-text]", {
        scrollTrigger: { trigger: "[data-example-section]", start: "top 80%" },
        x: 50, opacity: 0, duration: 0.8, ease: "power3.out"
      });

      gsap.from("[data-feature-item]", {
        scrollTrigger: { trigger: "[data-features-list]", start: "top 85%" },
        y: 20, opacity: 0, duration: 0.5, stagger: 0.1, ease: "power2.out"
      });

      gsap.from("[data-points-header]", {
        scrollTrigger: { trigger: "[data-points-section]", start: "top 80%" },
        y: 30, opacity: 0, duration: 0.7, ease: "power2.out"
      });

      gsap.from("[data-points-card]", {
        scrollTrigger: { trigger: "[data-points-grid]", start: "top 80%" },
        y: 60, opacity: 0, duration: 0.8, stagger: 0.2, ease: "power3.out"
      });

      gsap.from("[data-difficulty-item]", {
        scrollTrigger: { trigger: "[data-difficulty-list]", start: "top 85%" },
        x: -30, opacity: 0, duration: 0.5, stagger: 0.08, ease: "power2.out"
      });

      gsap.from("[data-bonus-item]", {
        scrollTrigger: { trigger: "[data-bonus-list]", start: "top 85%" },
        x: 30, opacity: 0, duration: 0.5, stagger: 0.08, ease: "power2.out"
      });

      gsap.from("[data-badges-header]", {
        scrollTrigger: { trigger: "[data-badges-section]", start: "top 80%" },
        y: 30, opacity: 0, duration: 0.7, ease: "power2.out"
      });

      gsap.from("[data-badge-card]", {
        scrollTrigger: { trigger: "[data-badges-grid]", start: "top 80%" },
        y: 50, opacity: 0, duration: 0.7, stagger: 0.1, ease: "power3.out"
      });

      gsap.from("[data-title-card]", {
        scrollTrigger: { trigger: "[data-titles-grid]", start: "top 85%" },
        y: 40, opacity: 0, duration: 0.6, stagger: 0.15, ease: "power2.out"
      });

      gsap.from("[data-cta-icon]", {
        scrollTrigger: { trigger: "[data-cta-section]", start: "top 80%" },
        scale: 0, opacity: 0, duration: 0.6, ease: "back.out(1.7)"
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
    <div ref={containerRef} style={{background:BG,color:"#fff",fontFamily:"'Outfit',sans-serif",minHeight:"100vh"}}>
      {/* Hero */}
      <section style={{padding:"20px 20px 60px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at center,rgba(201,168,76,0.08) 0%,transparent 60%)"}}/>
        <div style={{maxWidth:800,margin:"0 auto",position:"relative"}}>
          <span data-hero-badge style={{color:GOLD,fontSize:12,fontWeight:700,letterSpacing:3,textTransform:"uppercase",display:"inline-block"}}>{trT.badge}</span>
          <h1 data-hero-title style={{fontSize:"clamp(32px,6vw,52px)",fontWeight:900,marginTop:16,lineHeight:1.1}}>
            {trT.title1} <span style={{color:GOLD}}>{trT.title2}</span>
          </h1>
          <p data-hero-desc style={{color:MID,marginTop:20,maxWidth:600,margin:"20px auto 0",lineHeight:1.7,fontSize:17}}>
            {trT.subtitle}
          </p>
          <div data-hero-cta style={{marginTop:32,display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
            <Link href="/registro" data-hover-btn style={{
              padding:"14px 32px",borderRadius:12,
              background:`linear-gradient(135deg,${GOLD},${GOLD2})`,
              color:BG,fontWeight:700,fontSize:15,textDecoration:"none",display:"inline-block"
            }}>
              {trT.ctaBtn}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section data-stats-section style={{padding:"40px 20px",background:BG3,borderTop:"1px solid rgba(255,255,255,0.05)",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{maxWidth:1000,margin:"0 auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:24,textAlign:"center"}}>
            {stats.map((stat,i)=>
              <div key={i} data-stat>
                <div style={{fontSize:"32px",fontWeight:800,color:GOLD}}>{stat.value}</div>
                <div style={{fontSize:13,color:DIM,marginTop:4}}>{stat.label}</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Game Modes */}
      <section data-game-modes-section style={{padding:"80px 20px"}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <div data-section-header style={{textAlign:"center",marginBottom:48}}>
            <span style={{color:GOLD,fontSize:12,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>{trT.modesSectionBadge}</span>
            <h2 style={{fontSize:"clamp(28px,5vw,42px)",fontWeight:800,marginTop:12}}>
              🎮 {trT.modesSectionTitle} <span style={{color:GOLD}}>{trT.modesSectionTitleHighlight}</span>
            </h2>
            <p style={{color:MID,marginTop:12,fontSize:15}}>{trT.modesSectionDesc}</p>
          </div>

          <div data-modes-list style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:60,alignItems:"center",marginBottom:48}}>
            <div>
              <p style={{color:MID,fontSize:17,lineHeight:1.7,marginBottom:24}}>
                {trT.modesIntroText}
              </p>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {gameModes.map((mode,i)=>[
                  <div key={i} data-mode-feature data-hover-card style={{
                    padding:16,borderRadius:12,background:BG2,
                    border:"1px solid rgba(255,255,255,0.05)",
                    display:"flex",alignItems:"center",gap:12,cursor:"pointer"
                  }}>
                    <img src={mode.icon} alt="" style={{width:32,height:32,objectFit:"contain"}} />
                    <div>
                      <div style={{fontWeight:700,fontSize:15}}>{mode.title}</div>
                      <div style={{fontSize:12,color:DIM}}>{mode.highlight}</div>
                    </div>
                  </div>
                ])}
              </div>
            </div>
            <div>
              <img
                src="/img/zonamundial-images/imagenes/trivia zona mundial.jpeg"
                alt="Trivia Zona Mundial"
                style={{
                  borderRadius:16,overflow:"hidden",
                  boxShadow:"0 20px 40px rgba(0,0,0,0.3)",
                  border:"1px solid rgba(255,255,255,0.08)",
                  maxWidth:450,width:"100%",height:"auto",display:"block"
                }}
              />
            </div>
          </div>

          <div data-modes-grid style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:24}}>
            {gameModes.map((mode,i)=>[
              <div key={i} data-mode-card data-hover-card style={{
                padding:28,borderRadius:20,background:BG2,
                border:"1px solid rgba(255,255,255,0.05)",
                position:"relative",overflow:"hidden",cursor:"pointer"
              }}>
                <div style={{
                  position:"absolute",top:0,right:0,
                  padding:"6px 14px",background:`rgba(201,168,76,0.15)`,
                  borderBottomLeftRadius:16,color:GOLD,
                  fontSize:11,fontWeight:700,textTransform:"uppercase"
                }}>
                  {mode.highlight}
                </div>
                <div style={{display:"flex",alignItems:"flex-start",gap:16}}>
                  <img src={mode.icon} alt="" style={{width:48,height:48,objectFit:"contain"}} />
                  <div style={{flex:1}}>
                    <h3 style={{fontWeight:800,fontSize:20,marginBottom:8}}>{mode.title}</h3>
                    <p style={{fontSize:14,color:DIM,lineHeight:1.7}}>{mode.desc}</p>
                  </div>
                </div>
              </div>
            ])}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section data-categories-section style={{padding:"80px 20px",background:BG3}}>
        <div style={{maxWidth:1000,margin:"0 auto"}}>
          <div data-categories-header style={{textAlign:"center",marginBottom:48}}>
            <span style={{color:GOLD,fontSize:12,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>{trT.catSectionBadge}</span>
            <h2 style={{fontSize:"clamp(28px,5vw,42px)",fontWeight:800,marginTop:12}}>
              📚 {trT.catSectionTitle} <span style={{color:GOLD}}>{trT.catSectionTitleHighlight}</span>
            </h2>
          </div>

          <div data-categories-table style={{background:BG2,borderRadius:20,overflow:"hidden",border:"1px solid rgba(255,255,255,0.05)"}}>
            <div style={{
              display:"grid",gridTemplateColumns:"60px 1fr 2fr 80px",
              padding:"16px 24px",background:"rgba(201,168,76,0.1)",
              fontSize:12,fontWeight:700,color:GOLD,textTransform:"uppercase",letterSpacing:1
            }}>
              <span></span>
              <span>{trT.catColCategoria}</span>
              <span>{trT.catColDesc}</span>
              <span style={{textAlign:"center"}}>{trT.catColPreguntas}</span>
            </div>
            <div data-categories-rows>
            {categories.map((cat,i)=>[
              <div key={i} data-category-row data-hover-card style={{
                display:"grid",gridTemplateColumns:"60px 1fr 2fr 80px",
                padding:"20px 24px",borderBottom:"1px solid rgba(255,255,255,0.05)",
                alignItems:"center",cursor:"pointer"
              }}>
                <img src={cat.icon} alt="" style={{width:28,height:28,objectFit:"contain"}} />
                <span style={{fontWeight:700,fontSize:16}}>{cat.name}</span>
                <span style={{fontSize:14,color:DIM}}>{cat.desc}</span>
                <span style={{textAlign:"center",fontWeight:700,color:GOLD}}>2,000+</span>
              </div>
            ])}
            </div>
          </div>
        </div>
      </section>

      {/* Example Question */}
      <section data-example-section style={{padding:"80px 20px"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <h2 style={{fontSize:"clamp(28px,5vw,42px)",fontWeight:800}}>
              📝 {trT.exampleTitle} <span style={{color:GOLD}}>{trT.exampleTitleHighlight}</span>
            </h2>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:60,alignItems:"center"}}>
            <div data-example-img>
              <img
                src="/img/zonamundial-images/imagenes/pregunta trivia zonamundial.jpeg"
                alt="Ejemplo de pregunta trivia"
                style={{
                  borderRadius:16,overflow:"hidden",
                  boxShadow:"0 20px 40px rgba(0,0,0,0.3)",
                  border:"1px solid rgba(255,255,255,0.08)",
                  maxWidth:450,width:"100%",height:"auto",display:"block"
                }}
              />
            </div>
            <div data-example-text>
              <h3 style={{fontSize:"clamp(20px,3vw,28px)",fontWeight:800,marginBottom:20}}>
                {trT.exampleIntuitTitle} <span style={{color:GOLD}}>{trT.exampleIntuitTitleHighlight}</span>
              </h3>
              <div data-features-list style={{display:"flex",flexDirection:"column",gap:14}}>
                {exFeatures.map((item,i)=>(
                  <div key={i} data-feature-item style={{display:"flex",alignItems:"center",gap:12,fontSize:15}}>
                    <img src={item.icon} alt="" style={{width:24,height:24,objectFit:"contain"}} />
                    {item.text}
                  </div>
                ))}
              </div>
              <div style={{marginTop:24,padding:"16px 20px",borderRadius:12,background:BG2,border:"1px solid rgba(255,255,255,0.05)"}}>
                <span style={{fontSize:13,color:MID}}>{trT.exTimerNote}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Points System */}
      <section data-points-section style={{padding:"80px 20px"}}>
        <div style={{maxWidth:1000,margin:"0 auto"}}>
          <div data-points-header style={{textAlign:"center",marginBottom:48}}>
            <span style={{color:GOLD,fontSize:12,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>{trT.pointsSectionBadge}</span>
            <h2 style={{fontSize:"clamp(28px,5vw,42px)",fontWeight:800,marginTop:12}}>
              🏅 {trT.pointsSectionTitle} <span style={{color:GOLD}}>{trT.pointsSectionTitleHighlight}</span>
            </h2>
          </div>

          <div data-points-grid style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:32}}>
            {/* Difficulty Points */}
            <div data-points-card data-hover-card style={{padding:28,borderRadius:20,background:BG2,border:"1px solid rgba(255,255,255,0.05)",cursor:"pointer"}}>
              <h3 style={{fontWeight:800,fontSize:18,marginBottom:24,textAlign:"center"}}>{trT.diffSectionTitle}</h3>
              <div data-difficulty-list style={{display:"flex",flexDirection:"column",gap:12}}>
                {difficultyPoints.map((diff,i)=>[
                  <div key={i} data-difficulty-item style={{
                    display:"flex",justifyContent:"space-between",alignItems:"center",
                    padding:"14px 18px",borderRadius:12,background:"rgba(255,255,255,0.03)"
                  }}>
                    <span style={{fontWeight:600}}>{diff.level}</span>
                    <span style={{fontWeight:800,color:diff.color,fontSize:18}}>{diff.points}</span>
                  </div>
                ])}
              </div>
            </div>

            {/* Bonus Multipliers */}
            <div data-points-card data-hover-card style={{padding:28,borderRadius:20,background:BG2,border:"1px solid rgba(255,255,255,0.05)",cursor:"pointer"}}>
              <h3 style={{fontWeight:800,fontSize:18,marginBottom:24,textAlign:"center"}}>{trT.bonusSectionTitle}</h3>
              <div data-bonus-list style={{display:"flex",flexDirection:"column",gap:12}}>
                {bonusMultipliers.map((bonus,i)=>[
                  <div key={i} data-bonus-item style={{
                    display:"flex",justifyContent:"space-between",alignItems:"center",
                    padding:"14px 18px",borderRadius:12,background:"rgba(201,168,76,0.08)"
                  }}>
                    <div>
                      <div style={{fontWeight:700,color:GOLD}}>{bonus.name}</div>
                      <div style={{fontSize:12,color:DIM,marginTop:2}}>{bonus.desc}</div>
                    </div>
                    <span style={{fontWeight:800,color:GOLD2,fontSize:20}}>{bonus.multiplier}</span>
                  </div>
                ])}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Badges & Titles */}
      <section data-badges-section style={{padding:"80px 20px",background:BG3}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <div data-badges-header style={{textAlign:"center",marginBottom:48}}>
            <span style={{color:GOLD,fontSize:12,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>{trT.badgesSectionBadge}</span>
            <h2 style={{fontSize:"clamp(28px,5vw,42px)",fontWeight:800,marginTop:12}}>
              🎖️ {trT.badgesSectionTitle} <span style={{color:GOLD}}>{trT.badgesSectionTitleHighlight}</span>
            </h2>
          </div>

          {/* Badges Grid */}
          <div data-badges-grid style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:20,marginBottom:60}}>
            {badges.map((badge,i)=>[
              <div key={i} data-badge-card data-hover-card style={{
                padding:24,borderRadius:16,background:BG2,
                border:"1px solid rgba(255,255,255,0.05)",
                textAlign:"center",cursor:"pointer"
              }}>
                <img src={badge.icon} alt="" style={{width:48,height:48,objectFit:"contain",marginBottom:12}} />
                <h4 style={{fontWeight:700,fontSize:16,marginBottom:4}}>{badge.name}</h4>
                <p style={{fontSize:13,color:DIM,marginBottom:12,lineHeight:1.5}}>{badge.desc}</p>
                <span style={{
                  display:"inline-block",padding:"4px 12px",borderRadius:20,
                  background:badge.rarity===trT.badge5Rarity?"rgba(239,68,68,0.2)":
                           badge.rarity===trT.badge4Rarity?"rgba(168,85,247,0.2)":
                           badge.rarity===trT.badge2Rarity?"rgba(59,130,246,0.2)":"rgba(107,114,128,0.2)",
                  color:badge.rarity===trT.badge5Rarity?"#ef4444":
                       badge.rarity===trT.badge4Rarity?"#a855f7":
                       badge.rarity===trT.badge2Rarity?"#3b82f6":"#9ca3af",
                  fontSize:11,fontWeight:700
                }}>
                  {badge.rarity}
                </span>
              </div>
            ])}
          </div>

          {/* Titles Section */}
          <div style={{textAlign:"center",marginBottom:32}}>
            <h3 style={{fontSize:"clamp(20px,3vw,28px)",fontWeight:700}}>
              🏆 {trT.titlesSectionTitle} <span style={{color:GOLD}}>{trT.titlesSectionTitleHighlight}</span>
            </h3>
          </div>
          <div data-titles-grid style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:20}}>
            {rankTitles.map((title,i)=>[
              <div key={i} data-title-card data-hover-card style={{
                padding:24,borderRadius:16,
                background:`linear-gradient(135deg,rgba(201,168,76,0.15),rgba(201,168,76,0.05))`,
                border:`1px solid ${GOLD}`,textAlign:"center",cursor:"pointer"
              }}>
                <img src={title.icon} alt="" style={{width:40,height:40,objectFit:"contain",marginBottom:12}} />
                <div style={{fontSize:14,color:GOLD,fontWeight:700,marginBottom:4}}>{title.rank}</div>
                <h4 style={{fontWeight:800,fontSize:22,marginBottom:8,color:GOLD2}}>{title.title}</h4>
                <p style={{fontSize:13,color:MID,lineHeight:1.5}}>{title.desc}</p>
              </div>
            ])}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section data-cta-section style={{padding:"80px 20px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at center,rgba(201,168,76,0.1) 0%,transparent 60%)"}}/>
        <div style={{maxWidth:600,margin:"0 auto",position:"relative"}}>
          <div data-cta-icon style={{fontSize:72,marginBottom:24}}>🧠</div>
          <h2 data-cta-content style={{fontSize:"clamp(28px,5vw,42px)",fontWeight:800,marginBottom:16}}>
            {trT.ctaFinalTitle1} <span style={{color:GOLD}}>{trT.ctaFinalTitle2}</span>
          </h2>
          <p data-cta-content style={{color:MID,marginBottom:32,fontSize:17,lineHeight:1.7}}>
            {trT.ctaFinalDesc}
          </p>
          <Link href="/registro" data-cta-content data-hover-btn style={{
            padding:"18px 48px",borderRadius:12,
            background:`linear-gradient(135deg,${GOLD},${GOLD2})`,
            color:BG,fontWeight:800,fontSize:17,textDecoration:"none",display:"inline-block"
          }}>
            {trT.ctaBtn}
          </Link>
        </div>
      </section>
    </div>
  );
}
