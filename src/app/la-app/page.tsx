"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { SvgIcon } from "@/components/icons";

const BG="#060B14",BG2="#0F1D32",GOLD="#c9a84c",GOLD2="#e8d48b",MID="#8a94b0",DIM="#6a7a9a";

const MODULES=[
  {id:"predicciones",icon:"predicciones",title:"Predicciones",desc:"8 tipos de predicción para cada partido",color:"#c9a84c",gradient:"linear-gradient(135deg,#c9a84c20,#060B14)"},
  {id:"fantasy",icon:"fantasy",title:"Fantasy Mundial",desc:"Arma tu 11 ideal y compite en el ranking global",color:"#00d4ff",gradient:"linear-gradient(135deg,#00d4ff15,#060B14)"},
  {id:"ia-coach",icon:"ia coach",title:"IA Coach",desc:"Tu analista personal con inteligencia artificial",color:"#22c55e",gradient:"linear-gradient(135deg,#22c55e15,#060B14)"},
  {id:"trivia",icon:"trivia",title:"Trivia Diaria",desc:"Preguntas de fútbol con puntos y ranking",color:"#f59e0b",gradient:"linear-gradient(135deg,#f59e0b15,#060B14)"},
  {id:"modo-carrera",icon:"modo carrera",title:"Modo Carrera",desc:"Dirige una selección como DT virtual",color:"#ef4444",gradient:"linear-gradient(135deg,#ef444415,#060B14)"},
  {id:"ligas",icon:"ligas privadas",title:"Ligas Privadas",desc:"Compite con amigos en tu propia liga",color:"#8b5cf6",gradient:"linear-gradient(135deg,#8b5cf615,#060B14)"},
  {id:"streaming",icon:"streaming",title:"Zona Streaming",desc:"Directos con creadores durante los partidos",color:"#e879f9",gradient:"linear-gradient(135deg,#e879f915,#060B14)"},
  {id:"rankings",icon:"ranking",title:"Rankings",desc:"Global, por país, por creador",color:"#06b6d4",gradient:"linear-gradient(135deg,#06b6d415,#060B14)"},
  {id:"micro",icon:"micro-predicciones",title:"Micro-predicciones",desc:"Predicciones en vivo durante el partido",color:"#f97316",gradient:"linear-gradient(135deg,#f9731615,#060B14)"},
  {id:"stories",icon:"stories",title:"Stories",desc:"Contenido editorial diario del Mundial",color:"#14b8a6",gradient:"linear-gradient(135deg,#14b8a615,#060B14)"},
  {id:"chat",icon:"chat en vivo",title:"Chat por Liga",desc:"Chat en tiempo real durante los partidos",color:"#3b82f6",gradient:"linear-gradient(135deg,#3b82f615,#060B14)"},
  {id:"matchcenter",icon:"match center",title:"Match Center",desc:"Cada partido en vivo con stats completas",color:"#10b981",gradient:"linear-gradient(135deg,#10b98115,#060B14)"},
];

function useInView(th=0.1): [React.RefObject<HTMLDivElement>, boolean]{
  const ref=useRef<HTMLDivElement>(null);const[v,setV]=useState(false);
  useEffect(()=>{if(!ref.current)return;const o=new IntersectionObserver(([e])=>{if(e.isIntersecting){setV(true);o.disconnect()}},{threshold:th});o.observe(ref.current);return()=>o.disconnect()},[]);
  return[ref,v];
}

function FadeIn({children,delay=0,style={}}){
  const[ref,v]=useInView(0.05);
  return<div ref={ref} style={{opacity:v?1:0,transform:v?"translateY(0)":"translateY(24px)",transition:`all 0.6s ease ${delay}s`,...style}}>{children}</div>;
}

// ═══ MODULE CARD ═══
function ModuleCard({mod,index,verDemo}){
  const[hov,setHov]=useState(false);
  return(
    <Link href={`/app/${mod.id}`} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        borderRadius:20,cursor:"pointer",position:"relative",overflow:"hidden",
        padding:"28px 22px",transition:"all .4s",
        display:"block",textDecoration:"none",
        background:hov?mod.gradient:BG2,
        border:`1px solid ${hov?mod.color+"40":"rgba(255,255,255,0.04)"}`,
        boxShadow:hov?`0 16px 40px ${mod.color}12, 0 4px 16px rgba(0,0,0,0.3)`:"none",
        transform:hov?"translateY(-4px)":"translateY(0)",
        color:"#fff",
      }}
    >
      <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,borderRadius:"50%",background:mod.color,filter:"blur(50px)",opacity:hov?0.08:0.03,transition:"opacity .5s"}} />
      <div style={{position:"relative"}}>
        <SvgIcon name={mod.icon} size={40} style={{display:"block",marginBottom:12}} />
        <h3 style={{fontWeight:800,fontSize:18,marginBottom:6,color:hov?mod.color:"#fff",transition:"color .3s"}}>{mod.title}</h3>
        <p style={{fontSize:13,color:DIM,lineHeight:1.5,marginBottom:14}}>{mod.desc}</p>
        <div style={{display:"flex",alignItems:"center",gap:4,fontSize:12,fontWeight:600,color:mod.color,opacity:hov?1:0.7,transition:"opacity .3s"}}>
          <span>{verDemo || "Ver más"}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>
    </Link>
  );
}

// ═══ MAIN APP DEMOS PAGE ═══
export default function AppDemos(){
  const{t}=useLanguage();const laT=t.laAppPage;

  return(
    <div style={{background:BG,color:"#fff",fontFamily:"'Outfit',sans-serif",minHeight:"100vh",overflowX:"hidden"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:${BG}}::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.2);border-radius:3px}
        ::selection{background:rgba(201,168,76,0.3)}
      `}</style>

      <div style={{maxWidth:1120,margin:"0 auto",padding:"16px 16px 80px"}}>
        {/* Header */}
        <div style={{marginBottom:40,position:"relative"}}>
          <div style={{position:"absolute",top:-30,right:"10%",width:250,height:250,borderRadius:"50%",background:"rgba(201,168,76,0.02)",filter:"blur(60px)",pointerEvents:"none"}} />
          <span style={{color:GOLD,fontSize:11,fontWeight:700,letterSpacing:3,textTransform:"uppercase"}}>{laT.badge}</span>
          <h1 style={{fontSize:"clamp(28px,5vw,44px)",fontWeight:900,marginTop:8,marginBottom:10,lineHeight:1.08}}>
            {laT.title1}<br/><span style={{background:`linear-gradient(135deg,${GOLD},${GOLD2})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{laT.title2}</span>
          </h1>
          <p style={{color:MID,maxWidth:520,fontSize:15,lineHeight:1.6}}>{laT.subtitle}</p>
        </div>

        {/* Module grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
          {MODULES.map((mod,i)=>[
            <FadeIn key={mod.id} delay={i*0.05}>
              <ModuleCard mod={mod} index={i} verDemo={laT.verDemo}/>
            </FadeIn>
          ])}
        </div>

        {/* CTA */}
        <div style={{marginTop:48,textAlign:"center",padding:32,borderRadius:24,background:`linear-gradient(135deg,rgba(201,168,76,0.04),${BG2})`,border:"1px solid rgba(201,168,76,0.1)"}}>
          <h3 style={{fontWeight:800,fontSize:22,marginBottom:8}}>¿Listo para jugar?</h3>
          <p style={{color:MID,fontSize:14,marginBottom:20}}>Pre-regístrate gratis y sé de los primeros en acceder a todos los módulos.</p>
          <button style={{padding:"14px 36px",borderRadius:14,border:"none",cursor:"pointer",background:`linear-gradient(135deg,${GOLD},${GOLD2})`,color:BG,fontWeight:700,fontSize:16,fontFamily:"inherit",transition:"all .3s",boxShadow:"0 4px 20px rgba(201,168,76,0.2)"}}
            onMouseEnter={e=>e.currentTarget.style.boxShadow="0 8px 32px rgba(201,168,76,0.35)"}
            onMouseLeave={e=>e.currentTarget.style.boxShadow="0 4px 20px rgba(201,168,76,0.2)"}
          >{laT.ctaBtn}</button>
        </div>
      </div>
    </div>
  );
}
