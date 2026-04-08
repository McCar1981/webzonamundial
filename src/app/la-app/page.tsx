"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

const BG="#060B14",BG2="#0F1D32",BG3="#0B1825",GOLD="#c9a84c",GOLD2="#e8d48b",MID="#8a94b0",DIM="#6a7a9a",DARK="#4a5570";
const flagUrl=(c,w=80)=>c?`https://flagcdn.com/w${w}/${c}.png`:null;

const MODULES=[
  {id:"predicciones",icon:"/img/zonamundial-images/imagenes/logos para sustuir emojis/predicciones.png",title:"Predicciones",desc:"8 tipos de predicción para cada partido",color:"#c9a84c",gradient:"linear-gradient(135deg,#c9a84c20,#060B14)"},
  {id:"fantasy",icon:"/img/zonamundial-images/imagenes/logos para sustuir emojis/fantasy.png",title:"Fantasy Mundial",desc:"Arma tu 11 ideal y compite en el ranking global",color:"#00d4ff",gradient:"linear-gradient(135deg,#00d4ff15,#060B14)"},
  {id:"ia-coach",icon:"/img/zonamundial-images/imagenes/logos para sustuir emojis/ia coach.png",title:"IA Coach",desc:"Tu analista personal con inteligencia artificial",color:"#22c55e",gradient:"linear-gradient(135deg,#22c55e15,#060B14)"},
  {id:"trivia",icon:"/img/zonamundial-images/imagenes/logos para sustuir emojis/trivia.png",title:"Trivia Diaria",desc:"Preguntas de fútbol con puntos y ranking",color:"#f59e0b",gradient:"linear-gradient(135deg,#f59e0b15,#060B14)"},
  {id:"modo-carrera",icon:"/img/zonamundial-images/imagenes/logos para sustuir emojis/modo carrera.png",title:"Modo Carrera",desc:"Dirige una selección como DT virtual",color:"#ef4444",gradient:"linear-gradient(135deg,#ef444415,#060B14)"},
  {id:"ligas",icon:"/img/zonamundial-images/imagenes/logos para sustuir emojis/ligas privadas.png",title:"Ligas Privadas",desc:"Compite con amigos en tu propia liga",color:"#8b5cf6",gradient:"linear-gradient(135deg,#8b5cf615,#060B14)"},
  {id:"streaming",icon:"/img/zonamundial-images/imagenes/logos para sustuir emojis/streaming.png",title:"Zona Streaming",desc:"Directos con creadores durante los partidos",color:"#e879f9",gradient:"linear-gradient(135deg,#e879f915,#060B14)"},
  {id:"rankings",icon:"/img/zonamundial-images/imagenes/logos para sustuir emojis/ranking.png",title:"Rankings",desc:"Global, por país, por creador",color:"#06b6d4",gradient:"linear-gradient(135deg,#06b6d415,#060B14)"},
  {id:"micro",icon:"/img/zonamundial-images/imagenes/logos para sustuir emojis/micro-predicciones.png",title:"Micro-predicciones",desc:"Predicciones en vivo durante el partido",color:"#f97316",gradient:"linear-gradient(135deg,#f9731615,#060B14)"},
  {id:"stories",icon:"/img/zonamundial-images/imagenes/logos para sustuir emojis/stories.png",title:"Stories",desc:"Contenido editorial diario del Mundial",color:"#14b8a6",gradient:"linear-gradient(135deg,#14b8a615,#060B14)"},
  {id:"chat",icon:"/img/zonamundial-images/imagenes/logos para sustuir emojis/chat en vivo.png",title:"Chat por Liga",desc:"Chat en tiempo real durante los partidos",color:"#3b82f6",gradient:"linear-gradient(135deg,#3b82f615,#060B14)"},
  {id:"matchcenter",icon:"/img/zonamundial-images/imagenes/logos para sustuir emojis/match center.png",title:"Match Center",desc:"Cada partido en vivo con stats completas",color:"#10b981",gradient:"linear-gradient(135deg,#10b98115,#060B14)"},
];

// ═══ PREDICTION TYPES ═══
const PRED_TYPES=[
  {icon:"📊",name:"Resultado exacto",desc:"Acierta el marcador final",pts:"10 pts",ex:"Argentina 2 - 1 Francia"},
  {icon:"🏆",name:"Ganador / Empate",desc:"¿Quién gana o empatan?",pts:"5 pts",ex:"Victoria local"},
  {icon:"⚽",name:"Goleador",desc:"¿Quién marca primero?",pts:"8 pts",ex:"Mbappé marca 1º"},
  {icon:"🟡",name:"Tarjetas",desc:"Total de tarjetas en el partido",pts:"6 pts",ex:"Más de 4 tarjetas"},
  {icon:"📐",name:"Corners",desc:"Total de corners del partido",pts:"6 pts",ex:"Más de 9 corners"},
  {icon:"⏱️",name:"Primer gol",desc:"¿En qué mitad cae el primer gol?",pts:"4 pts",ex:"Primera mitad"},
  {icon:"👤",name:"MVP",desc:"¿Quién será el mejor jugador?",pts:"7 pts",ex:"Messi MVP"},
  {icon:"🔢",name:"Total goles",desc:"¿Cuántos goles habrá?",pts:"5 pts",ex:"Más de 2.5 goles"},
];

// ═══ FAKE PLAYERS FOR FANTASY ═══
const PLAYERS=[
  {name:"Mbappé",pos:"DEL",team:"fr",pts:142,price:"12.5M",owned:"78%"},
  {name:"Messi",pos:"DEL",team:"ar",pts:138,price:"11.0M",owned:"82%"},
  {name:"Bellingham",pos:"MED",team:"gb-eng",pts:127,price:"10.5M",owned:"65%"},
  {name:"Vinícius Jr.",pos:"DEL",team:"br",pts:131,price:"11.5M",owned:"71%"},
  {name:"Pedri",pos:"MED",team:"es",pts:118,price:"9.0M",owned:"54%"},
  {name:"Haaland",pos:"DEL",team:"no",pts:135,price:"12.0M",owned:"68%"},
  {name:"Salah",pos:"DEL",team:"eg",pts:110,price:"8.5M",owned:"42%"},
  {name:"De Bruyne",pos:"MED",team:"be",pts:122,price:"10.0M",owned:"58%"},
];

// ═══ TRIVIA QUESTIONS ═══
const TRIVIA_Q=[
  {q:"¿Qué país ganó el primer Mundial en 1930?",opts:["Brasil","Argentina","Uruguay","Italia"],correct:2},
  {q:"¿Cuántos goles marcó Miroslav Klose en Mundiales?",opts:["14","16","18","12"],correct:1},
  {q:"¿En qué país se jugó el Mundial 2010?",opts:["Brasil","Alemania","Sudáfrica","Japón"],correct:2},
];

// ═══ RANKINGS DATA ═══
const RANK_DATA=[
  {pos:1,name:"ProPredictor_99",pts:2847,flag:"ar",streak:12},
  {pos:2,name:"FútbolMaster_MX",pts:2793,flag:"mx",streak:8},
  {pos:3,name:"LaRoja_Fan",pts:2681,flag:"es",streak:15},
  {pos:4,name:"SambaKing",pts:2654,flag:"br",streak:6},
  {pos:5,name:"GoalHunter_CO",pts:2598,flag:"co",streak:9},
  {pos:6,name:"TotalFootball",pts:2567,flag:"nl",streak:4},
  {pos:7,name:"Die_Mannschaft",pts:2534,flag:"de",streak:7},
  {pos:8,name:"BleuBlanc",pts:2501,flag:"fr",streak:11},
];

function useInView(th=0.1){
  const ref=useRef(null);const[v,setV]=useState(false);
  useEffect(()=>{if(!ref.current)return;const o=new IntersectionObserver(([e])=>{if(e.isIntersecting){setV(true);o.disconnect()}},{threshold:th});o.observe(ref.current);return()=>o.disconnect()},[]);
  return[ref,v];
}

function FadeIn({children,delay=0,style={}}){
  const[ref,v]=useInView(0.05);
  return<div ref={ref} style={{opacity:v?1:0,transform:v?"translateY(0)":"translateY(24px)",transition:`all 0.6s ease ${delay}s`,...style}}>{children}</div>;
}

// ═══ MODULE CARD ═══
function ModuleCard({mod,onClick,index,verDemo}){
  const[hov,setHov]=useState(false);
  return(
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        borderRadius:20,cursor:"pointer",position:"relative",overflow:"hidden",
        padding:"28px 22px",transition:"all .4s",
        background:hov?mod.gradient:BG2,
        border:`1px solid ${hov?mod.color+"40":"rgba(255,255,255,0.04)"}`,
        boxShadow:hov?`0 16px 40px ${mod.color}12, 0 4px 16px rgba(0,0,0,0.3)`:"none",
        transform:hov?"translateY(-4px)":"translateY(0)",
      }}
    >
      <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,borderRadius:"50%",background:mod.color,filter:"blur(50px)",opacity:hov?0.08:0.03,transition:"opacity .5s"}}/>
      <div style={{position:"relative"}}>
        <img src={mod.icon} alt="" style={{width:40,height:40,objectFit:"contain",display:"block",marginBottom:12}} />
        <h3 style={{fontWeight:800,fontSize:18,marginBottom:6,color:hov?mod.color:"#fff",transition:"color .3s"}}>{mod.title}</h3>
        <p style={{fontSize:13,color:DIM,lineHeight:1.5,marginBottom:14}}>{mod.desc}</p>
        <div style={{display:"flex",alignItems:"center",gap:4,fontSize:12,fontWeight:600,color:mod.color,opacity:hov?1:0.7,transition:"opacity .3s"}}>
          <span>{verDemo}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>
    </div>
  );
}

// ═══ PREDICCIONES DEMO ═══
function PrediccionesDemo({onBack}){
  const[selected,setSelected]=useState(null);
  const[confirmed,setConfirmed]=useState(false);
  return(
    <DemoWrapper title="Predicciones" icon="🎯" color="#c9a84c" desc="8 tipos de predicción para cada uno de los 104 partidos. Acumula puntos y escala en el ranking global." onBack={onBack}>
      {/* Sample match */}
      <div style={{padding:20,borderRadius:18,background:BG2,border:"1px solid rgba(255,255,255,0.05)",marginBottom:24}}>
        <div style={{textAlign:"center",marginBottom:16}}>
          <span style={{fontSize:10,fontWeight:800,color:GOLD,background:"rgba(201,168,76,0.1)",padding:"3px 10px",borderRadius:6}}>GRUPO H · JORNADA 1</span>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:20}}>
          <div style={{textAlign:"center"}}>
            <img src={flagUrl("es",120)} alt="" style={{width:56,height:38,borderRadius:6,objectFit:"cover",boxShadow:"0 4px 16px rgba(0,0,0,0.4)",border:"2px solid rgba(255,255,255,0.08)"}}/>
            <div style={{fontWeight:800,fontSize:16,marginTop:8}}>España</div>
          </div>
          <div style={{width:48,height:48,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(201,168,76,0.08)",border:"1px solid rgba(201,168,76,0.15)"}}>
            <span style={{fontWeight:900,fontSize:14,color:GOLD}}>VS</span>
          </div>
          <div style={{textAlign:"center"}}>
            <img src={flagUrl("uy",120)} alt="" style={{width:56,height:38,borderRadius:6,objectFit:"cover",boxShadow:"0 4px 16px rgba(0,0,0,0.4)",border:"2px solid rgba(255,255,255,0.08)"}}/>
            <div style={{fontWeight:800,fontSize:16,marginTop:8}}>Uruguay</div>
          </div>
        </div>
      </div>

      {/* 8 prediction types */}
      <h3 style={{fontWeight:700,fontSize:15,marginBottom:12,color:GOLD}}>Elige tu predicción</h3>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:8,marginBottom:20}}>
        {PRED_TYPES.map((p,i)=>(
          <div key={p.name} onClick={()=>{setSelected(i);setConfirmed(false)}}
            style={{
              padding:14,borderRadius:14,cursor:"pointer",transition:"all .3s",
              background:selected===i?"rgba(201,168,76,0.06)":BG3,
              border:`1px solid ${selected===i?"rgba(201,168,76,0.3)":"rgba(255,255,255,0.04)"}`,
              boxShadow:selected===i?`0 0 20px rgba(201,168,76,0.06)`:"none",
            }}
          >
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <span style={{fontSize:18}}>{p.icon}</span>
              <span style={{fontWeight:700,fontSize:13,color:selected===i?GOLD:"#fff"}}>{p.name}</span>
              <span style={{marginLeft:"auto",fontSize:10,fontWeight:700,color:GOLD,background:"rgba(201,168,76,0.1)",padding:"1px 6px",borderRadius:4}}>{p.pts}</span>
            </div>
            <p style={{fontSize:11,color:DIM,marginBottom:4}}>{p.desc}</p>
            <p style={{fontSize:10,color:DARK,fontStyle:"italic"}}>Ej: {p.ex}</p>
          </div>
        ))}
      </div>

      {selected!==null&&!confirmed&&(
        <button onClick={()=>setConfirmed(true)} style={{width:"100%",padding:"14px 0",borderRadius:14,border:"none",cursor:"pointer",background:`linear-gradient(135deg,${GOLD},${GOLD2})`,color:BG,fontWeight:700,fontSize:15,fontFamily:"inherit",transition:"all .3s",boxShadow:"0 4px 20px rgba(201,168,76,0.2)"}}>
          Confirmar predicción: {PRED_TYPES[selected].name}
        </button>
      )}
      {confirmed&&(
        <div style={{textAlign:"center",padding:20,borderRadius:14,background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.2)"}}>
          <span style={{fontSize:32}}>✅</span>
          <p style={{fontWeight:700,fontSize:15,marginTop:8,color:"#22c55e"}}>Predicción registrada</p>
          <p style={{fontSize:12,color:DIM,marginTop:4}}>Ganarás {PRED_TYPES[selected].pts} si aciertas. ¡Buena suerte!</p>
        </div>
      )}
    </DemoWrapper>
  );
}

// ═══ FANTASY DEMO ═══
function FantasyDemo({onBack}){
  const[squad,setSquad]=useState([]);
  const budget=100-squad.reduce((s,p)=>s+parseFloat(p.price),0);
  return(
    <DemoWrapper title="Fantasy Mundial" icon="🏆" color="#00d4ff" desc="Arma tu equipo de 11 jugadores con un presupuesto de 100M. Los puntos se calculan con datos reales de cada partido." onBack={onBack}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,padding:"10px 16px",borderRadius:12,background:BG3,border:"1px solid rgba(0,212,255,0.1)"}}>
        <div><span style={{fontSize:12,color:DIM}}>Presupuesto</span><div style={{fontSize:20,fontWeight:900,color:budget<0?"#ef4444":"#00d4ff"}}>{budget.toFixed(1)}M</div></div>
        <div><span style={{fontSize:12,color:DIM}}>Jugadores</span><div style={{fontSize:20,fontWeight:900,color:"#00d4ff"}}>{squad.length}/11</div></div>
        <div><span style={{fontSize:12,color:DIM}}>Puntos est.</span><div style={{fontSize:20,fontWeight:900,color:GOLD}}>{squad.reduce((s,p)=>s+p.pts,0)}</div></div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {PLAYERS.map(p=>{
          const inSquad=squad.some(s=>s.name===p.name);
          return(
            <div key={p.name} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:14,background:inSquad?"rgba(0,212,255,0.05)":BG2,border:`1px solid ${inSquad?"rgba(0,212,255,0.2)":"rgba(255,255,255,0.04)"}`,transition:"all .3s"}}>
              <img src={flagUrl(p.team,40)} alt="" style={{width:24,height:16,borderRadius:2,objectFit:"cover"}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14}}>{p.name}</div>
                <div style={{fontSize:11,color:DIM}}>{p.pos} · {p.owned} owners</div>
              </div>
              <div style={{textAlign:"right",marginRight:8}}>
                <div style={{fontSize:13,fontWeight:700,color:GOLD}}>{p.pts} pts</div>
                <div style={{fontSize:11,color:DIM}}>{p.price}</div>
              </div>
              <button onClick={()=>{
                if(inSquad)setSquad(squad.filter(s=>s.name!==p.name));
                else if(squad.length<11)setSquad([...squad,p]);
              }} style={{
                padding:"6px 14px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:11,transition:"all .3s",
                background:inSquad?"rgba(239,68,68,0.15)":"rgba(0,212,255,0.12)",
                color:inSquad?"#ef4444":"#00d4ff",
              }}>{inSquad?"Quitar":"Fichar"}</button>
            </div>
          );
        })}
      </div>
    </DemoWrapper>
  );
}

// ═══ TRIVIA DEMO ═══
function TriviaDemo({onBack}){
  const[qi,setQi]=useState(0);
  const[ans,setAns]=useState(null);
  const[score,setScore]=useState(0);
  const q=TRIVIA_Q[qi];
  return(
    <DemoWrapper title="Trivia Diaria" icon="⚡" color="#f59e0b" desc="3 preguntas al día sobre historia del fútbol y el Mundial. Cada respuesta correcta suma puntos a tu ranking." onBack={onBack}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <span style={{fontSize:12,fontWeight:700,color:"#f59e0b"}}>Pregunta {qi+1}/{TRIVIA_Q.length}</span>
        <span style={{fontSize:14,fontWeight:800,color:GOLD}}>{score} pts</span>
      </div>
      <div style={{padding:24,borderRadius:18,background:BG2,border:"1px solid rgba(245,158,11,0.1)",marginBottom:16}}>
        <h3 style={{fontWeight:700,fontSize:17,marginBottom:20,lineHeight:1.4}}>{q.q}</h3>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {q.opts.map((o,i)=>{
            const isCorrect=ans!==null&&i===q.correct;
            const isWrong=ans===i&&i!==q.correct;
            return(
              <button key={o} onClick={()=>{if(ans!==null)return;setAns(i);if(i===q.correct)setScore(s=>s+10)}}
                style={{
                  padding:"12px 16px",borderRadius:12,border:"none",cursor:ans!==null?"default":"pointer",
                  background:isCorrect?"rgba(34,197,94,0.1)":isWrong?"rgba(239,68,68,0.1)":ans!==null?"rgba(255,255,255,0.02)":"rgba(255,255,255,0.04)",
                  color:isCorrect?"#22c55e":isWrong?"#ef4444":"#fff",
                  fontWeight:600,fontSize:14,fontFamily:"inherit",textAlign:"left",
                  border:`1px solid ${isCorrect?"rgba(34,197,94,0.3)":isWrong?"rgba(239,68,68,0.3)":"rgba(255,255,255,0.06)"}`,
                  transition:"all .3s",
                }}>
                <span style={{marginRight:8,opacity:0.5}}>{String.fromCharCode(65+i)}</span>{o}
              </button>
            );
          })}
        </div>
      </div>
      {ans!==null&&qi<TRIVIA_Q.length-1&&(
        <button onClick={()=>{setQi(qi+1);setAns(null)}} style={{width:"100%",padding:"12px 0",borderRadius:12,border:"none",cursor:"pointer",background:"rgba(245,158,11,0.15)",color:"#f59e0b",fontWeight:700,fontSize:14,fontFamily:"inherit"}}>Siguiente pregunta →</button>
      )}
      {ans!==null&&qi===TRIVIA_Q.length-1&&(
        <div style={{textAlign:"center",padding:20,borderRadius:14,background:"rgba(201,168,76,0.06)",border:"1px solid rgba(201,168,76,0.15)"}}>
          <span style={{fontSize:36}}>🎉</span>
          <p style={{fontWeight:800,fontSize:18,marginTop:8}}>Trivia completada</p>
          <p style={{fontSize:14,color:GOLD,fontWeight:700,marginTop:4}}>{score} puntos ganados</p>
        </div>
      )}
    </DemoWrapper>
  );
}

// ═══ RANKINGS DEMO ═══
function RankingsDemo({onBack}){
  const[tab,setTab]=useState("global");
  return(
    <DemoWrapper title="Rankings" icon="📊" color="#06b6d4" desc="Ranking global, por país, por creador y por liga. Demuestra quién sabe más de fútbol." onBack={onBack}>
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {[{id:"global",l:"🌍 Global"},{id:"pais",l:"🇪🇸 Por país"},{id:"creador",l:"👤 Por creador"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"7px 14px",borderRadius:8,border:`1px solid ${tab===t.id?"rgba(6,182,212,0.3)":"rgba(255,255,255,0.05)"}`,background:tab===t.id?"rgba(6,182,212,0.1)":"transparent",color:tab===t.id?"#06b6d4":DIM,fontSize:12,fontWeight:600,fontFamily:"inherit",cursor:"pointer"}}>{t.l}</button>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        {RANK_DATA.map((r,i)=>(
          <div key={r.name} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:14,background:i<3?`rgba(201,168,76,${0.06-i*0.015})`:BG2,border:`1px solid ${i<3?"rgba(201,168,76,0.12)":"rgba(255,255,255,0.04)"}`,transition:"all .3s"}}>
            <div style={{width:28,height:28,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,background:i===0?"rgba(201,168,76,0.15)":i===1?"rgba(192,192,192,0.1)":i===2?"rgba(205,127,50,0.1)":"rgba(255,255,255,0.03)",color:i===0?GOLD:i===1?"#c0c0c0":i===2?"#cd7f32":DIM}}>{r.pos}</div>
            <img src={flagUrl(r.flag,40)} alt="" style={{width:22,height:15,borderRadius:2,objectFit:"cover"}}/>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:14}}>{r.name}</div>
              <div style={{fontSize:11,color:DIM}}>Racha: {r.streak} aciertos seguidos 🔥</div>
            </div>
            <div style={{fontWeight:800,fontSize:16,color:i===0?GOLD:"#fff"}}>{r.pts.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </DemoWrapper>
  );
}

// ═══ GENERIC DEMO WRAPPER ═══
function DemoWrapper({title,icon,color,desc,onBack,children}){
  const[entered,setEntered]=useState(false);
  useEffect(()=>{setTimeout(()=>setEntered(true),30)},[]);
  return(
    <div style={{opacity:entered?1:0,transform:entered?"translateY(0)":"translateY(16px)",transition:"all .5s ease"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:GOLD,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit",marginBottom:20,display:"flex",alignItems:"center",gap:6}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Volver a módulos
      </button>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
        <span style={{fontSize:36}}>{icon}</span>
        <div>
          <h2 style={{fontWeight:900,fontSize:24,color}}>{title}</h2>
          <p style={{fontSize:13,color:DIM,marginTop:2}}>{desc}</p>
        </div>
      </div>
      <div style={{height:2,background:`linear-gradient(90deg,${color},transparent)`,borderRadius:1,marginBottom:24,opacity:0.3}}/>
      {/* Free/Premium badges */}
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        <span style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:6,background:"rgba(34,197,94,0.1)",color:"#22c55e",border:"1px solid rgba(34,197,94,0.15)"}}>GRATIS</span>
        <span style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:6,background:"rgba(201,168,76,0.1)",color:GOLD,border:"1px solid rgba(201,168,76,0.15)"}}>+ PREMIUM</span>
      </div>
      {children}
    </div>
  );
}

// ═══ GENERIC MODULE PLACEHOLDER ═══
function GenericDemo({mod,onBack}){
  const features=[
    "Acceso gratuito con funciones básicas",
    "Premium desbloquea estadísticas avanzadas",
    "Puntos se suman al ranking global",
    "Disponible para los 104 partidos del torneo",
    "Compatible con ligas privadas",
  ];
  return(
    <DemoWrapper title={mod.title} icon={mod.icon} color={mod.color} desc={mod.desc} onBack={onBack}>
      <div style={{padding:32,borderRadius:20,background:`linear-gradient(135deg,${mod.color}08,${BG2})`,border:`1px solid ${mod.color}20`,textAlign:"center",marginBottom:24}}>
        <span style={{fontSize:64,display:"block",marginBottom:16}}>{mod.icon}</span>
        <h3 style={{fontWeight:800,fontSize:20,marginBottom:8}}>Demo interactiva próximamente</h3>
        <p style={{fontSize:14,color:DIM,maxWidth:400,margin:"0 auto"}}>Este módulo estará disponible en la app desde junio 2026. Pre-regístrate para ser de los primeros.</p>
      </div>
      <h4 style={{fontWeight:700,fontSize:14,marginBottom:12}}>Características</h4>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {features.map(f=>(
          <div key={f} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:10,background:BG2,border:"1px solid rgba(255,255,255,0.04)"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:mod.color,flexShrink:0}}/>
            <span style={{fontSize:13,color:MID}}>{f}</span>
          </div>
        ))}
      </div>
    </DemoWrapper>
  );
}

// ═══ MAIN APP DEMOS PAGE ═══
export default function AppDemos(){
  const{t}=useLanguage();const laT=t.laAppPage;
  const[activeModule,setActiveModule]=useState(null);
  const scrollRef=useRef(null);

  const openModule=(id)=>{
    setActiveModule(id);
    if(scrollRef.current)scrollRef.current.scrollTop=0;
  };

  const renderDemo=()=>{
    const mod=MODULES.find(m=>m.id===activeModule);
    const back=()=>setActiveModule(null);
    switch(activeModule){
      case"predicciones":return<PrediccionesDemo onBack={back}/>;
      case"fantasy":return<FantasyDemo onBack={back}/>;
      case"trivia":return<TriviaDemo onBack={back}/>;
      case"rankings":return<RankingsDemo onBack={back}/>;
      default:return<GenericDemo mod={mod} onBack={back}/>;
    }
  };

  return(
    <div ref={scrollRef} style={{background:BG,color:"#fff",fontFamily:"'Outfit',sans-serif",height:"100vh",overflowY:"auto",overflowX:"hidden"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:${BG}}::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.2);border-radius:3px}
        ::selection{background:rgba(201,168,76,0.3)}
      `}</style>

      <div style={{maxWidth:1120,margin:"0 auto",padding:"16px 16px 80px"}}>
        {activeModule?renderDemo():(
          <>
            {/* Header */}
            <div style={{marginBottom:40,position:"relative"}}>
              <div style={{position:"absolute",top:-30,right:"10%",width:250,height:250,borderRadius:"50%",background:"rgba(201,168,76,0.02)",filter:"blur(60px)",pointerEvents:"none"}}/>
              <span style={{color:GOLD,fontSize:11,fontWeight:700,letterSpacing:3,textTransform:"uppercase"}}>{laT.badge}</span>
              <h1 style={{fontSize:"clamp(28px,5vw,44px)",fontWeight:900,marginTop:8,marginBottom:10,lineHeight:1.08}}>
                {laT.title1}<br/><span style={{background:`linear-gradient(135deg,${GOLD},${GOLD2})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{laT.title2}</span>
              </h1>
              <p style={{color:MID,maxWidth:520,fontSize:15,lineHeight:1.6}}>{laT.subtitle}</p>
            </div>

            {/* Module grid */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
              {MODULES.map((mod,i)=>(
                <FadeIn key={mod.id} delay={i*0.05}>
                  <ModuleCard mod={mod} onClick={()=>openModule(mod.id)} index={i} verDemo={laT.verDemo}/>
                </FadeIn>
              ))}
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
          </>
        )}
      </div>
    </div>
  );
}
