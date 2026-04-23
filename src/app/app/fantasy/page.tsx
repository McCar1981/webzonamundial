"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useLanguage } from "@/i18n/LanguageContext";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ICON_V3, ICON_DESCUBRE } from "@/components/icons";

gsap.registerPlugin(ScrollTrigger);

const BG="#060B14", BG2="#0F1D32", BG3="#0B1825", GOLD="#c9a84c", GOLD2="#e8d48b", MID="#8a94b0", DIM="#6a7a9a", DARK="#4a5570";

const FORMACION_CODES = ["4-3-3","4-4-2","4-2-3-1","3-5-2","3-4-3","5-3-2","5-4-1"];
const FORMACION_DESCS = [
  "4 defensas, 3 medios, 3 delanteros",
  "La clásica. Sólido en defensa y ataque",
  "Doble pivote, mediapunta y extremos",
  "3 defensas, 5 medios, 2 delanteros",
  "Máximo poder ofensivo",
  "5 defensas, 3 medios, 2 delanteros",
  "Ultra defensivo, espera al rival",
];

const PUNTOS_ICONOS = [
  ICON_V3.matchCenter,   // Gol (Delantero)
  ICON_V3.matchCenter,   // Gol (Mediocentro)
  ICON_V3.matchCenter,   // Gol (Defensa)
  ICON_V3.matchCenter,   // Gol (Portero)
  ICON_V3.microPred,     // Asistencia
  ICON_V3.fantasy,       // Portería a 0 (POR)
  ICON_V3.fantasy,       // Portería a 0 (DEF)
  ICON_V3.carrera,       // Titular (60+ min)
  ICON_V3.carrera,       // Suplente (<60 min)
  ICON_V3.trivia,        // Tarjeta amarilla
  ICON_V3.trivia,        // Tarjeta roja
  ICON_V3.predicciones,  // Autogol
  ICON_V3.predicciones,  // Penalti fallado
];
const PUNTOS_VALORES = ["+5","+6","+8","+10","+3","+5","+4","+2","+1","-1","-3","-2","-2"];

const CHIPS_ICONOS = [
  ICON_V3.predicciones,
  ICON_V3.rankings,
  ICON_V3.carrera,
  ICON_V3.iaCoach,
];

const LIST_FEAT_ICONS = [
  ICON_V3.iaCoach,
  ICON_V3.rankings,
  ICON_DESCUBRE.selecciones,
  ICON_V3.microPred,
];

const ALI_FEAT_ICONS = [
  ICON_DESCUBRE.grupos,
  ICON_V3.predicciones,
  ICON_V3.stories,
];

export default function FantasyPage() {
  const { t } = useLanguage(); const fT = t.fantasyPage;
  const containerRef = useRef<HTMLDivElement>(null);

  const formaciones = FORMACION_CODES.map((code, i) => ({
    formacion: code,
    estilo: [fT.form1Estilo, fT.form2Estilo, fT.form3Estilo, fT.form4Estilo, fT.form5Estilo, fT.form6Estilo, fT.form7Estilo][i],
    desc: FORMACION_DESCS[i],
  }));

  const puntosSistema = [
    { accion: fT.accion1, puntos: PUNTOS_VALORES[0], icono: PUNTOS_ICONOS[0] },
    { accion: fT.accion2, puntos: PUNTOS_VALORES[1], icono: PUNTOS_ICONOS[1] },
    { accion: fT.accion3, puntos: PUNTOS_VALORES[2], icono: PUNTOS_ICONOS[2] },
    { accion: fT.accion4, puntos: PUNTOS_VALORES[3], icono: PUNTOS_ICONOS[3] },
    { accion: fT.accion5, puntos: PUNTOS_VALORES[4], icono: PUNTOS_ICONOS[4] },
    { accion: fT.accion6, puntos: PUNTOS_VALORES[5], icono: PUNTOS_ICONOS[5] },
    { accion: fT.accion7, puntos: PUNTOS_VALORES[6], icono: PUNTOS_ICONOS[6] },
    { accion: fT.accion8, puntos: PUNTOS_VALORES[7], icono: PUNTOS_ICONOS[7] },
    { accion: fT.accion9, puntos: PUNTOS_VALORES[8], icono: PUNTOS_ICONOS[8] },
    { accion: fT.accion10, puntos: PUNTOS_VALORES[9], icono: PUNTOS_ICONOS[9] },
    { accion: fT.accion11, puntos: PUNTOS_VALORES[10], icono: PUNTOS_ICONOS[10] },
    { accion: fT.accion12, puntos: PUNTOS_VALORES[11], icono: PUNTOS_ICONOS[11] },
    { accion: fT.accion13, puntos: PUNTOS_VALORES[12], icono: PUNTOS_ICONOS[12] },
  ];

  const chips = [
    { icono: CHIPS_ICONOS[0], nombre: fT.chip1fNombre, usos: fT.chip1fUsos, desc: fT.chip1fDesc, cuando: fT.chip1fCuando },
    { icono: CHIPS_ICONOS[1], nombre: fT.chip2fNombre, usos: fT.chip2fUsos, desc: fT.chip2fDesc, cuando: fT.chip2fCuando },
    { icono: CHIPS_ICONOS[2], nombre: fT.chip3fNombre, usos: fT.chip3fUsos, desc: fT.chip3fDesc, cuando: fT.chip3fCuando },
    { icono: CHIPS_ICONOS[3], nombre: fT.chip4fNombre, usos: fT.chip4fUsos, desc: fT.chip4fDesc, cuando: fT.chip4fCuando },
  ];

  const aliFeatList = [
    { icon: ALI_FEAT_ICONS[0], title: fT.aliFeat1Title, desc: fT.aliFeat1Desc },
    { icon: ALI_FEAT_ICONS[1], title: fT.aliFeat2Title, desc: fT.aliFeat2Desc },
    { icon: ALI_FEAT_ICONS[2], title: fT.aliFeat3Title, desc: fT.aliFeat3Desc },
  ];

  const listFeatList = [
    { icon: LIST_FEAT_ICONS[0], title: fT.listFeat1Title, desc: fT.listFeat1Desc },
    { icon: LIST_FEAT_ICONS[1], title: fT.listFeat2Title, desc: fT.listFeat2Desc },
    { icon: LIST_FEAT_ICONS[2], title: fT.listFeat3Title, desc: fT.listFeat3Desc },
    { icon: LIST_FEAT_ICONS[3], title: fT.listFeat4Title, desc: fT.listFeat4Desc },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      const heroTl = gsap.timeline();
      heroTl.from("[data-hero-badge]", { y: -20, opacity: 0, duration: 0.6, ease: "power2.out" })
            .from("[data-hero-title]", { y: 40, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.3")
            .from("[data-hero-desc]", { y: 30, opacity: 0, duration: 0.7, ease: "power2.out" }, "-=0.5")
            .from("[data-hero-cta]", { y: 30, opacity: 0, duration: 0.6, stagger: 0.1, ease: "back.out(1.7)" }, "-=0.4")
            .from("[data-hero-decor]", { scale: 0.5, opacity: 0, duration: 1, stagger: 0.2, ease: "power2.out" }, "-=0.8");

      gsap.from("[data-ali-img]", {
        scrollTrigger: { trigger: "[data-ali-section]", start: "top 80%" },
        x: -60, opacity: 0, duration: 0.9, ease: "power3.out"
      });

      gsap.from("[data-ali-content]", {
        scrollTrigger: { trigger: "[data-ali-section]", start: "top 80%" },
        x: 60, opacity: 0, duration: 0.9, ease: "power3.out"
      });

      gsap.from("[data-ali-feature]", {
        scrollTrigger: { trigger: "[data-ali-features]", start: "top 85%" },
        y: 30, opacity: 0, duration: 0.6, stagger: 0.12, ease: "power2.out"
      });

      gsap.from("[data-formacion-item]", {
        scrollTrigger: { trigger: "[data-formaciones-grid]", start: "top 90%" },
        scale: 0.8, opacity: 0, duration: 0.5, stagger: 0.08, ease: "back.out(1.4)"
      });

      gsap.from("[data-list-content]", {
        scrollTrigger: { trigger: "[data-list-section]", start: "top 80%" },
        x: -60, opacity: 0, duration: 0.9, ease: "power3.out"
      });

      gsap.from("[data-list-img]", {
        scrollTrigger: { trigger: "[data-list-section]", start: "top 80%" },
        x: 60, opacity: 0, duration: 0.9, ease: "power3.out"
      });

      gsap.from("[data-list-feature]", {
        scrollTrigger: { trigger: "[data-list-features]", start: "top 85%" },
        y: 30, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power2.out"
      });

      gsap.from("[data-equipo-header]", {
        scrollTrigger: { trigger: "[data-equipo-section]", start: "top 80%" },
        y: 40, opacity: 0, duration: 0.8, ease: "power3.out"
      });

      gsap.from("[data-equipo-card]", {
        scrollTrigger: { trigger: "[data-equipo-card]", start: "top 85%" },
        y: 50, opacity: 0, duration: 0.9, ease: "power3.out"
      });

      gsap.from("[data-seleccion-item]", {
        scrollTrigger: { trigger: "[data-selecciones-grid]", start: "top 85%" },
        y: 20, opacity: 0, duration: 0.5, stagger: 0.06, ease: "power2.out"
      });

      gsap.from("[data-resumen-item]", {
        scrollTrigger: { trigger: "[data-resumen-row]", start: "top 90%" },
        scale: 0.8, opacity: 0, duration: 0.5, stagger: 0.1, ease: "back.out(1.4)"
      });

      gsap.from("[data-puntos-header]", {
        scrollTrigger: { trigger: "[data-puntos-section]", start: "top 80%" },
        y: 40, opacity: 0, duration: 0.8, ease: "power3.out"
      });

      gsap.from("[data-punto-item]", {
        scrollTrigger: { trigger: "[data-puntos-grid]", start: "top 85%" },
        y: 30, opacity: 0, duration: 0.6, stagger: 0.06, ease: "power2.out"
      });

      gsap.from("[data-comodines-header]", {
        scrollTrigger: { trigger: "[data-comodines-section]", start: "top 80%" },
        y: 40, opacity: 0, duration: 0.8, ease: "power3.out"
      });

      gsap.from("[data-comodin-card]", {
        scrollTrigger: { trigger: "[data-comodines-grid]", start: "top 85%" },
        y: 50, opacity: 0, duration: 0.7, stagger: 0.12, ease: "power3.out"
      });

      gsap.from("[data-duelos-card]", {
        scrollTrigger: { trigger: "[data-duelos-section]", start: "top 80%" },
        scale: 0.9, opacity: 0, duration: 0.8, ease: "power3.out"
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
      {/* HERO SECTION */}
      <section style={{padding:"20px 20px 60px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at center,rgba(201,168,76,0.08) 0%,transparent 60%)"}}/>
        <img data-hero-decor src="/img/imagenessilviu/balondefutbol.webp" alt="" role="presentation" aria-hidden="true" loading="lazy" decoding="async" style={{position:"absolute",top:"10%",left:"5%",width:120,opacity:0.03,transform:"rotate(-15deg)"}} />
        <span data-hero-decor style={{position:"absolute",bottom:"10%",right:"5%",width:100,height:100,opacity:0.03,transform:"rotate(15deg)",display:"flex",alignItems:"center",justifyContent:"center"}}><svg viewBox="0 0 24 24" fill="none" width="100" height="100">{ICON_V3.rankings.props.children}</svg></span>

        <div style={{maxWidth:800,margin:"0 auto",position:"relative"}}>
          <span data-hero-badge style={{color:GOLD,fontSize:12,fontWeight:700,letterSpacing:3,textTransform:"uppercase",display:"inline-block"}}>{fT.badge}</span>
          <h1 data-hero-title style={{fontSize:"clamp(36px,7vw,56px)",fontWeight:900,marginTop:20,lineHeight:1.1}}>
            {fT.title}
          </h1>
          <p data-hero-desc style={{color:MID,marginTop:24,maxWidth:600,margin:"24px auto 0",lineHeight:1.7,fontSize:18}}>
            {fT.subtitle}
          </p>

          <div style={{marginTop:40,display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap"}}>
            <Link href="/registro" data-hero-cta data-hover-btn style={{
              padding:"16px 36px",borderRadius:14,
              background:`linear-gradient(135deg,${GOLD},${GOLD2})`,
              color:BG,fontWeight:800,fontSize:16,textDecoration:"none",display:"inline-block",
              boxShadow:"0 8px 32px rgba(201,168,76,0.3)"
            }}>
              {fT.ctaBtn}
            </Link>
            <span data-hero-cta style={{
              padding:"16px 28px",borderRadius:14,
              background:BG2,border:`1px solid rgba(255,255,255,0.1)`,
              color:MID,fontWeight:600,fontSize:14
            }}>
              {fT.heroFreeHint}
            </span>
          </div>
        </div>
      </section>

      {/* LAYOUT 2 COLUMNAS: IMAGEN ALINEACIÓN + TEXTO */}
      <section data-ali-section style={{padding:"60px 20px",background:BG}}>
        <div style={{maxWidth:1400,margin:"0 auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(450px,1fr))",gap:60,alignItems:"center"}}>
            <div data-ali-img style={{position:"relative"}}>
              <div style={{
                borderRadius:24,overflow:"hidden",
                boxShadow:"0 30px 60px rgba(0,0,0,0.4)",
                border:"1px solid rgba(255,255,255,0.08)",
                maxWidth:400,margin:"0 auto"
              }}>
                <img
                  src="/img/zonamundial-images/imagenes/alineacion fantasy.jpeg"
                  alt="Alineación Fantasy ZonaMundial"
                  style={{width:"100%",height:"auto",display:"block"}}
                />
              </div>
            </div>

            <div data-ali-content>
              <span style={{color:GOLD,fontSize:12,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>{fT.aliSectionBadge}</span>
              <h2 style={{fontSize:"clamp(28px,4vw,40px)",fontWeight:800,marginTop:16,marginBottom:24,lineHeight:1.2}}>
                {fT.aliSectionTitle} <span style={{color:GOLD}}>{fT.aliSectionTitleHighlight}</span> {fT.aliSectionTitleEnd}
              </h2>
              <p style={{color:MID,fontSize:17,lineHeight:1.7,marginBottom:32}}>
                {fT.aliSectionDesc}
              </p>

              <div data-ali-features style={{display:"flex",flexDirection:"column",gap:16}}>
                {aliFeatList.map((feat,i)=>(
                  <div key={i} data-ali-feature data-hover-card style={{display:"flex",alignItems:"center",gap:16,padding:16,borderRadius:12,background:BG2,border:"1px solid rgba(255,255,255,0.05)",cursor:"pointer"}}>
                    <div style={{width:44,height:44,borderRadius:10,background:`${GOLD}20`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <span style={{width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center"}}>{feat.icon}</span>
                    </div>
                    <div>
                      <div style={{fontWeight:700,fontSize:15}}>{feat.title}</div>
                      <div style={{fontSize:13,color:DIM}}>{feat.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{marginTop:32}}>
                <div style={{fontWeight:700,fontSize:16,marginBottom:16,color:GOLD}}>{fT.formacionesTitle}</div>
                <div data-formaciones-grid style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:10}}>
                  {formaciones.map((f,i)=>(
                    <div key={i} data-formacion-item data-hover-card style={{padding:12,borderRadius:10,background:BG2,border:"1px solid rgba(255,255,255,0.08)",textAlign:"center",cursor:"pointer"}}>
                      <div style={{fontSize:18,fontWeight:800,color:GOLD,marginBottom:4}}>{f.formacion}</div>
                      <div style={{fontSize:11,color:DIM}}>{f.estilo}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LAYOUT 2 COLUMNAS INVERSO: TEXTO + IMAGEN LISTADO */}
      <section data-list-section style={{padding:"80px 20px",background:BG3}}>
        <div style={{maxWidth:1400,margin:"0 auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(450px,1fr))",gap:60,alignItems:"center"}}>
            <div data-list-content style={{order:1}}>
              <span style={{color:GOLD,fontSize:12,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>{fT.listSectionBadge}</span>
              <h2 style={{fontSize:"clamp(28px,4vw,40px)",fontWeight:800,marginTop:16,marginBottom:24,lineHeight:1.2}}>
                {fT.listSectionTitle} <span style={{color:GOLD}}>{fT.listSectionTitleHighlight}</span> {fT.listSectionTitleEnd}
              </h2>
              <p style={{color:MID,fontSize:17,lineHeight:1.7,marginBottom:32}}>
                {fT.listSectionDesc}
              </p>

              <div data-list-features style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
                {listFeatList.map((item,i)=>(
                  <div key={i} data-list-feature data-hover-card style={{padding:20,borderRadius:12,background:BG2,border:"1px solid rgba(255,255,255,0.05)",cursor:"pointer"}}>
                    <span style={{width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8}}>{item.icon}</span>
                    <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>{item.title}</div>
                    <div style={{fontSize:12,color:DIM}}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div data-list-img style={{order:2,position:"relative"}}>
              <div style={{
                borderRadius:24,overflow:"hidden",
                boxShadow:"0 30px 60px rgba(0,0,0,0.4)",
                border:"1px solid rgba(255,255,255,0.08)",
                maxWidth:400,margin:"0 auto"
              }}>
                <img
                  src="/img/zonamundial-images/imagenes/listado españa fantasy.jpeg"
                  alt="Listado de jugadores de España"
                  style={{width:"100%",height:"auto",display:"block"}}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EJEMPLO DE EQUIPO VÁLIDO */}
      <section data-equipo-section style={{padding:"80px 20px"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div data-equipo-header style={{textAlign:"center",marginBottom:48}}>
            <h2 style={{fontSize:"clamp(28px,5vw,40px)",fontWeight:800}}>
              {fT.equipoTitle} <span style={{color:GOLD}}>{fT.equipoTitleHighlight}</span>
            </h2>
            <p style={{color:MID,marginTop:12,fontSize:16}}>{fT.equipoSubtitle}</p>
          </div>

          <div data-equipo-card style={{
            padding:40,borderRadius:32,
            background:`linear-gradient(135deg,${BG2},${BG3})`,
            border:"1px solid rgba(255,255,255,0.08)",
            boxShadow:"0 20px 60px rgba(0,0,0,0.3)"
          }}>
            <div data-selecciones-grid style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12,marginBottom:32}}>
              {[
                {code:"ar", pais:"Argentina", jug:"Messi + Otamendi", doble:true},
                {code:"br", pais:"Brasil", jug:"Vinicius + Rodrygo", doble:true},
                {code:"es", pais:"España", jug:"Lamine Yamal", doble:false},
                {code:"fr", pais:"Francia", jug:"Kylian Mbappé", doble:false},
                {code:"gb-eng", pais:"Inglaterra", jug:"Jude Bellingham", doble:false},
                {code:"pt", pais:"Portugal", jug:"Vitinha", doble:false},
                {code:"be", pais:"Bélgica", jug:"Thibaut Courtois", doble:false},
                {code:"nl", pais:"Holanda", jug:"Virgil van Dijk", doble:false},
                {code:"uy", pais:"Uruguay", jug:"Federico Valverde", doble:false},
                {code:"ma", pais:"Marruecos", jug:"Achraf Hakimi", doble:false},
                {code:"co", pais:"Colombia", jug:"Luis Díaz", doble:false},
                {code:"de", pais:"Alemania", jug:"Jamal Musiala", doble:false},
                {code:"us", pais:"USA", jug:"Christian Pulisic", doble:false},
              ].map((item,i)=>[
                <div key={i} data-seleccion-item data-hover-card style={{
                  padding:12,borderRadius:12,
                  background:item.doble?`linear-gradient(135deg,${GOLD}20,transparent)`:'transparent',
                  border:`1px solid ${item.doble?GOLD:'rgba(255,255,255,0.1)'}`,
                  display:"flex",alignItems:"center",gap:12,minHeight:60,cursor:"pointer"
                }}>
                  <img src={`https://flagcdn.com/w40/${item.code}.png`} alt={item.pais} style={{width:32,height:20,borderRadius:3,flexShrink:0}} />
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:13,color:item.doble?GOLD:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                      {item.pais} {item.doble && <span style={{width:16,height:16,display:"inline-flex",alignItems:"center",justifyContent:"center",verticalAlign:"middle"}}>{ICON_V3.rankings}</span>}
                    </div>
                    <div style={{fontSize:11,color:DIM,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                      {item.jug}
                    </div>
                  </div>
                </div>
              ])}
            </div>

            <div data-resumen-row style={{
              display:"flex",justifyContent:"center",gap:32,flexWrap:"wrap",
              padding:"20px 0",borderTop:"1px solid rgba(255,255,255,0.05)"
            }}>
              <div data-resumen-item style={{textAlign:"center"}}>
                <div style={{fontSize:28,fontWeight:800,color:GOLD}}>15</div>
                <div style={{fontSize:12,color:DIM}}>{fT.resumenJugadores}</div>
              </div>
              <div data-resumen-item style={{textAlign:"center"}}>
                <div style={{fontSize:28,fontWeight:800,color:GOLD}}>13</div>
                <div style={{fontSize:12,color:DIM}}>{fT.resumenSelecciones}</div>
              </div>
              <div data-resumen-item style={{textAlign:"center"}}>
                <div style={{fontSize:28,fontWeight:800,color:GOLD}}>2</div>
                <div style={{fontSize:12,color:DIM}}>{fT.resumenDobles}</div>
              </div>
              <div data-resumen-item style={{textAlign:"center"}}>
                <div style={{fontSize:28,fontWeight:800,color:"#22c55e"}}>OK</div>
                <div style={{fontSize:12,color:DIM}}>{fT.resumenValido}</div>
              </div>
            </div>

            <div style={{
              marginTop:32,padding:24,borderRadius:20,
              background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",
              display:"flex",gap:16,alignItems:"flex-start"
            }}>
              <span style={{fontWeight:700,color:"#ef4444",fontSize:15}}>{fT.equipoInvalidoLabel}</span>
              <div>
                <p style={{fontSize:14,color:MID,marginTop:6,lineHeight:1.6}}>
                  {fT.equipoInvalidoDesc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SISTEMA DE PUNTOS */}
      <section data-puntos-section style={{padding:"80px 20px",background:BG3}}>
        <div style={{maxWidth:1000,margin:"0 auto"}}>
          <div data-puntos-header style={{textAlign:"center",marginBottom:50}}>
            <h2 style={{fontSize:"clamp(28px,5vw,42px)",fontWeight:800}}>
              {fT.puntosSectionTitle} <span style={{color:GOLD}}>{fT.puntosSectionTitleHighlight}</span>
            </h2>
            <p style={{color:MID,marginTop:12}}>{fT.puntosSectionDesc}</p>
          </div>

          <div data-puntos-grid style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:16}}>
            {puntosSistema.map((p,i)=>(
              <div key={i} data-punto-item data-hover-card style={{padding:20,borderRadius:16,background:BG2,border:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <span style={{width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center"}}>{p.icono}</span>
                  <span style={{fontSize:14,color:MID}}>{p.accion}</span>
                </div>
                <span style={{fontSize:18,fontWeight:800,color:p.puntos.includes("-")?"#ef4444":GOLD}}>
                  {p.puntos}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOS 4 COMODINES */}
      <section data-comodines-section style={{padding:"80px 20px"}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <div data-comodines-header style={{textAlign:"center",marginBottom:50}}>
            <span style={{color:GOLD,fontSize:11,fontWeight:700,letterSpacing:3,textTransform:"uppercase"}}>{fT.comodinesSectionBadge}</span>
            <h2 style={{fontSize:"clamp(28px,5vw,42px)",fontWeight:800,marginTop:16}}>
              {fT.comodinesSectionTitle} <span style={{color:GOLD}}>{fT.comodinesSectionTitleHighlight}</span>
            </h2>
            <p style={{color:MID,marginTop:12,maxWidth:500,margin:"12px auto 0"}}>
              {fT.comodinesSectionDesc}
            </p>
          </div>

          <div data-comodines-grid style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:24}}>
            {chips.map((chip,i)=>(
              <div key={i} data-comodin-card data-hover-card style={{padding:32,borderRadius:24,background:BG2,border:"1px solid rgba(255,255,255,0.05)",position:"relative",overflow:"hidden",cursor:"pointer"}}>
                <div style={{position:"absolute",top:16,right:16,padding:"4px 12px",borderRadius:12,background:BG3,fontSize:11,color:GOLD,fontWeight:700}}>
                  {chip.usos}
                </div>
                <span style={{width:64,height:64,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16}}><svg viewBox="0 0 24 24" fill="none" width="64" height="64">{(chip.icono as React.ReactElement).props.children}</svg></span>
                <h3 style={{fontSize:20,fontWeight:800,marginBottom:12}}>{chip.nombre}</h3>
                <p style={{fontSize:14,color:MID,lineHeight:1.7,marginBottom:16}}>{chip.desc}</p>
                <div style={{padding:12,borderRadius:8,background:BG3,fontSize:12,color:GOLD}}>
                  <span style={{width:16,height:16,display:"inline-flex",alignItems:"center",justifyContent:"center",verticalAlign:"middle",marginRight:4}}>{ICON_V3.iaCoach}</span> <strong>{fT.comodinCuando}</strong> {chip.cuando}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DUELOS HEAD-TO-HEAD */}
      <section data-duelos-section style={{padding:"60px 20px"}}>
        <div style={{maxWidth:800,margin:"0 auto",textAlign:"center"}}>
          <div data-duelos-card style={{padding:40,borderRadius:24,background:`linear-gradient(135deg,${GOLD}10,transparent)`,border:`1px solid ${GOLD}30`}}>
            <span style={{width:64,height:64,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16,margin:"0 auto 16px"}}><svg viewBox="0 0 24 24" fill="none" width="64" height="64">{ICON_V3.microPred.props.children}</svg></span>
            <h2 style={{fontSize:"clamp(24px,4vw,36px)",fontWeight:800,marginBottom:16}}>
              {fT.duelosTitle} <span style={{color:GOLD}}>1vs1</span>
            </h2>
            <p style={{color:MID,fontSize:16,lineHeight:1.7,maxWidth:600,margin:"0 auto 24px"}}>
              {fT.duelosDesc}
            </p>
            <div style={{display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap"}}>
              <span style={{padding:"10px 20px",borderRadius:20,background:BG2,fontSize:14,color:MID}}>{fT.duelosTag1}</span>
              <span style={{padding:"10px 20px",borderRadius:20,background:BG2,fontSize:14,color:MID}}>{fT.duelosTag2}</span>
              <span style={{padding:"10px 20px",borderRadius:20,background:BG2,fontSize:14,color:MID}}>{fT.duelosTag3}</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section data-cta-section style={{padding:"100px 20px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at center, rgba(201,168,76,0.1) 0%, transparent 60%)"}}/>

        <div style={{maxWidth:700,margin:"0 auto",textAlign:"center",position:"relative"}}>
          <img src="/img/imagenessilviu/balondefutbol.webp" alt="" role="presentation" aria-hidden="true" loading="lazy" decoding="async" style={{width:80,height:80,objectFit:"contain",marginBottom:24}} />
          <h2 data-cta-content style={{fontSize:"clamp(28px,5vw,44px)",fontWeight:900,marginBottom:16,lineHeight:1.1}}>
            {fT.ctaFinalTitle} <span style={{color:GOLD}}>{fT.ctaFinalTitleHighlight}</span>
          </h2>
          <p data-cta-content style={{color:MID,marginBottom:40,fontSize:18,maxWidth:500,margin:"0 auto 40px",lineHeight:1.6}}>
            {fT.ctaFinalDesc}
            <strong style={{color:"#fff"}}> {fT.ctaFinalDescStrong}</strong>
          </p>
          <div style={{display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap",marginBottom:24}}>
            <Link href="/registro" data-cta-content data-hover-btn style={{
              padding:"18px 44px",borderRadius:14,
              background:`linear-gradient(135deg,${GOLD},${GOLD2})`,
              color:BG,fontWeight:800,fontSize:18,textDecoration:"none",display:"inline-block",
              boxShadow:"0 8px 32px rgba(201,168,76,0.35)"
            }}>
              {fT.ctaFinalBtn}
            </Link>
          </div>
          <p data-cta-content style={{fontSize:14,color:DARK}}>
            {fT.ctaFinalHint}
          </p>
        </div>
      </section>
    </div>
  );
}
