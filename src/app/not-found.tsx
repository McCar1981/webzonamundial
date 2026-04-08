"use client";

import { useState, useEffect } from "react";

const BG="#060B14",BG2="#0F1D32",GOLD="#c9a84c",GOLD2="#e8d48b",MID="#8a94b0",DIM="#6a7a9a",DARK="#4a5570";

export default function NotFoundPreview(){
  const[cardAngle,setCardAngle]=useState(6);
  const[entered,setEntered]=useState(false);
  useEffect(()=>{setTimeout(()=>setEntered(true),100)},[]);

  // Floating red card animation
  useEffect(()=>{
    let frame;
    let t=0;
    const animate=()=>{
      t+=0.02;
      setCardAngle(6+Math.sin(t)*3);
      frame=requestAnimationFrame(animate);
    };
    frame=requestAnimationFrame(animate);
    return()=>cancelAnimationFrame(frame);
  },[]);

  return(
    <div style={{background:BG,color:"#fff",fontFamily:"'Outfit',sans-serif",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      <style>{`*{margin:0;padding:0;box-sizing:border-box}@keyframes pulse-red{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.3)}70%{box-shadow:0 0 0 10px rgba(239,68,68,0)}}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>

      {/* Background */}
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at center,rgba(239,68,68,0.05) 0%,transparent 55%)"}}/>

      {/* Field lines */}
      <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.02,pointerEvents:"none"}} viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <rect x="50" y="50" width="1100" height="700" fill="none" stroke="#c9a84c" strokeWidth="2"/>
        <line x1="600" y1="50" x2="600" y2="750" stroke="#c9a84c" strokeWidth="2"/>
        <circle cx="600" cy="400" r="91.5" fill="none" stroke="#c9a84c" strokeWidth="2"/>
        <circle cx="600" cy="400" r="3" fill="#c9a84c"/>
      </svg>

      {/* Scattered mini red cards */}
      {[{x:15,y:20,r:-15,s:0.4},{x:80,y:15,r:25,s:0.3},{x:10,y:75,r:10,s:0.35},{x:85,y:70,r:-20,s:0.3},{x:50,y:85,r:30,s:0.25}].map((c,i)=>(
        <div key={i} style={{position:"absolute",left:`${c.x}%`,top:`${c.y}%`,width:20*c.s*2,height:28*c.s*2,borderRadius:3,transform:`rotate(${c.r}deg)`,background:"linear-gradient(135deg,#ef4444,#dc2626)",opacity:0.06}}/>
      ))}

      <div style={{textAlign:"center",maxWidth:420,padding:20,position:"relative",
        opacity:entered?1:0,transform:entered?"translateY(0)":"translateY(20px)",transition:"all 0.8s ease",
      }}>
        {/* Red card */}
        <div style={{display:"inline-block",marginBottom:24,position:"relative",animation:"float 3s ease infinite"}}>
          <div style={{
            width:80,height:112,borderRadius:10,
            transform:`rotate(${cardAngle}deg)`,
            background:"linear-gradient(135deg,#ef4444,#dc2626,#b91c1c)",
            boxShadow:"0 12px 48px rgba(239,68,68,0.35), 0 0 80px rgba(239,68,68,0.08), inset 0 1px 0 rgba(255,255,255,0.15)",
            position:"relative",transition:"transform 0.1s",
          }}>
            {/* Shine */}
            <div style={{position:"absolute",top:8,left:8,right:8,bottom:"60%",borderRadius:"8px 8px 50% 50%",background:"linear-gradient(180deg,rgba(255,255,255,0.12),transparent)"}}/>
          </div>
          {/* Alert badge */}
          <div style={{
            position:"absolute",top:-8,right:-8,width:28,height:28,borderRadius:"50%",
            background:BG2,border:"2px solid rgba(239,68,68,0.4)",
            display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:"0 4px 12px rgba(0,0,0,0.4)",
          }}>
            <span style={{fontSize:12,fontWeight:900,color:"#ef4444"}}>!</span>
          </div>
        </div>

        {/* VAR badge */}
        <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"6px 16px",borderRadius:50,border:"1px solid rgba(239,68,68,0.2)",background:"rgba(239,68,68,0.05)",marginBottom:24}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:"#ef4444",animation:"pulse-red 2s infinite"}}/>
          <span style={{color:"#ef4444",fontSize:11,fontWeight:700,letterSpacing:2}}>REVISIÓN VAR</span>
        </div>

        {/* 404 number */}
        <h1 style={{fontSize:"clamp(72px,15vw,96px)",fontWeight:900,letterSpacing:-4,marginBottom:12,lineHeight:1}}>
          <span style={{color:"#ef4444",textShadow:"0 0 40px rgba(239,68,68,0.2)"}}>4</span>
          <span style={{color:"#fff"}}>0</span>
          <span style={{color:"#ef4444",textShadow:"0 0 40px rgba(239,68,68,0.2)"}}>4</span>
        </h1>

        <h2 style={{fontWeight:800,fontSize:22,marginBottom:10}}>¡Fuera de juego!</h2>
        <p style={{color:MID,fontSize:14,lineHeight:1.65,marginBottom:32}}>
          El VAR ha revisado la jugada y confirma: esta página no existe.
          Puede que se haya eliminado, cambiado de URL o nunca haya estado aquí.
        </p>

        {/* Buttons */}
        <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"center",gap:12}}>
          <button style={{
            padding:"13px 28px",borderRadius:12,border:"none",cursor:"pointer",
            background:`linear-gradient(135deg,${GOLD},${GOLD2})`,
            color:BG,fontWeight:700,fontSize:15,fontFamily:"inherit",
            transition:"all .3s",boxShadow:"0 4px 20px rgba(201,168,76,0.2)",
          }}
            onMouseEnter={e=>e.currentTarget.style.boxShadow="0 8px 32px rgba(201,168,76,0.4)"}
            onMouseLeave={e=>e.currentTarget.style.boxShadow="0 4px 20px rgba(201,168,76,0.2)"}
          >Volver al inicio</button>
          <button style={{
            padding:"13px 24px",borderRadius:12,cursor:"pointer",
            border:"1px solid rgba(201,168,76,0.3)",background:"transparent",
            color:GOLD,fontWeight:600,fontSize:14,fontFamily:"inherit",
            transition:"all .3s",
          }}>Ver partidos →</button>
        </div>

        {/* Fun fact */}
        <p style={{fontSize:11,color:DARK,marginTop:40}}>
          Dato: en el Mundial 2022 se mostraron 236 tarjetas amarillas y 4 rojas directas.
        </p>
      </div>
    </div>
  );
}
