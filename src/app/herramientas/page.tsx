"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

const BG="#060B14",BG2="#0F1D32",BG3="#0B1825",GOLD="#c9a84c",GOLD2="#e8d48b",MID="#8a94b0",DIM="#6a7a9a",DARK="#4a5570";
const flagUrl=(c,w=80)=>c?`https://flagcdn.com/w${w}/${c}.png`:null;

// ═══ TEAM DATA ═══
const TEAMS=[
  {name:"Argentina",flag:"ar",conf:"CONMEBOL",rank:1,titles:3,stars:5,att:92,mid:88,def:85,gk:84},
  {name:"Francia",flag:"fr",conf:"UEFA",rank:2,titles:2,stars:5,att:91,mid:87,def:86,gk:87},
  {name:"Brasil",flag:"br",conf:"CONMEBOL",rank:3,titles:5,stars:5,att:89,mid:86,def:82,gk:83},
  {name:"Inglaterra",flag:"gb-eng",conf:"UEFA",rank:4,titles:1,stars:4,att:88,mid:87,def:84,gk:86},
  {name:"España",flag:"es",conf:"UEFA",rank:5,titles:1,stars:4,att:86,mid:90,def:85,gk:85},
  {name:"Bélgica",flag:"be",conf:"UEFA",rank:6,titles:0,stars:3,att:85,mid:86,def:83,gk:88},
  {name:"P. Bajos",flag:"nl",conf:"UEFA",rank:7,titles:0,stars:3,att:84,mid:85,def:82,gk:84},
  {name:"Portugal",flag:"pt",conf:"UEFA",rank:8,titles:0,stars:3,att:90,mid:84,def:81,gk:83},
  {name:"Alemania",flag:"de",conf:"UEFA",rank:9,titles:4,stars:5,att:85,mid:86,def:83,gk:89},
  {name:"Colombia",flag:"co",conf:"CONMEBOL",rank:12,titles:0,stars:2,att:83,mid:82,def:79,gk:80},
  {name:"Uruguay",flag:"uy",conf:"CONMEBOL",rank:14,titles:2,stars:4,att:84,mid:80,def:81,gk:82},
  {name:"Croacia",flag:"hr",conf:"UEFA",rank:10,titles:0,stars:3,att:80,mid:88,def:82,gk:84},
  {name:"México",flag:"mx",conf:"CONCACAF",rank:15,titles:0,stars:2,att:78,mid:79,def:77,gk:80},
  {name:"EE.UU.",flag:"us",conf:"CONCACAF",rank:13,titles:0,stars:2,att:80,mid:78,def:79,gk:81},
  {name:"Japón",flag:"jp",conf:"AFC",rank:18,titles:0,stars:2,att:78,mid:80,def:76,gk:79},
  {name:"Marruecos",flag:"ma",conf:"CAF",rank:11,titles:0,stars:2,att:79,mid:81,def:83,gk:82},
];

const GROUPS_DATA={
  A:[{name:"México",flag:"mx"},{name:"Corea del Sur",flag:"kr"},{name:"Sudáfrica",flag:"za"},{name:"Rep. Checa",flag:"cz"}],
  B:[{name:"Canadá",flag:"ca"},{name:"Suiza",flag:"ch"},{name:"Qatar",flag:"qa"},{name:"Bosnia",flag:"ba"}],
  C:[{name:"Brasil",flag:"br"},{name:"Marruecos",flag:"ma"},{name:"Escocia",flag:"gb-sct"},{name:"Haití",flag:"ht"}],
  D:[{name:"EE.UU.",flag:"us"},{name:"Australia",flag:"au"},{name:"Paraguay",flag:"py"},{name:"Turquía",flag:"tr"}],
  E:[{name:"Alemania",flag:"de"},{name:"Ecuador",flag:"ec"},{name:"C. Marfil",flag:"ci"},{name:"Curazao",flag:"cw"}],
  F:[{name:"P. Bajos",flag:"nl"},{name:"Japón",flag:"jp"},{name:"Túnez",flag:"tn"},{name:"Suecia",flag:"se"}],
  G:[{name:"Bélgica",flag:"be"},{name:"Irán",flag:"ir"},{name:"Egipto",flag:"eg"},{name:"N. Zelanda",flag:"nz"}],
  H:[{name:"España",flag:"es"},{name:"Uruguay",flag:"uy"},{name:"A. Saudí",flag:"sa"},{name:"Cabo Verde",flag:"cv"}],
  I:[{name:"Francia",flag:"fr"},{name:"Senegal",flag:"sn"},{name:"Noruega",flag:"no"},{name:"Irak",flag:"iq"}],
  J:[{name:"Argentina",flag:"ar"},{name:"Austria",flag:"at"},{name:"Argelia",flag:"dz"},{name:"Jordania",flag:"jo"}],
  K:[{name:"Portugal",flag:"pt"},{name:"Colombia",flag:"co"},{name:"Uzbekistán",flag:"uz"},{name:"RD Congo",flag:"cd"}],
  L:[{name:"Inglaterra",flag:"gb-eng"},{name:"Croacia",flag:"hr"},{name:"Panamá",flag:"pa"},{name:"Ghana",flag:"gh"}],
};

function useInView(th=0.1){const ref=useRef(null);const[v,setV]=useState(false);useEffect(()=>{if(!ref.current)return;const o=new IntersectionObserver(([e])=>{if(e.isIntersecting){setV(true);o.disconnect()}},{threshold:th});o.observe(ref.current);return()=>o.disconnect()},[]);return[ref,v]}

const Flag=({code,w=28})=>code?<img src={flagUrl(code,w*2)} alt="" style={{width:w,height:Math.round(w*.67),borderRadius:3,objectFit:"cover",boxShadow:"0 2px 8px rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.08)"}} loading="lazy"/>:<div style={{width:w,height:Math.round(w*.67),borderRadius:3,background:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:8,color:DIM}}>?</span></div>;

// ═══ STAT BAR ═══
function StatBar({label,val1,val2,color1=GOLD,color2="#00d4ff"}){
  const total=val1+val2||1;
  const p1=val1/total*100;
  return(
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontSize:13,fontWeight:700,color:color1}}>{val1}</span>
        <span style={{fontSize:11,color:DIM,fontWeight:600}}>{label}</span>
        <span style={{fontSize:13,fontWeight:700,color:color2}}>{val2}</span>
      </div>
      <div style={{height:6,borderRadius:3,background:"rgba(255,255,255,0.04)",overflow:"hidden",display:"flex"}}>
        <div style={{width:`${p1}%`,height:"100%",background:`linear-gradient(90deg,${color1},${color1}80)`,borderRadius:3,transition:"width .8s ease"}}/>
        <div style={{flex:1,height:"100%",background:`linear-gradient(90deg,${color2}80,${color2})`,borderRadius:3}}/>
      </div>
    </div>
  );
}

// ═══ TOOL 1: COMPARADOR DE SELECCIONES ═══
function ComparadorTool(){
  const[team1,setTeam1]=useState(TEAMS[0]);
  const[team2,setTeam2]=useState(TEAMS[1]);
  const[showResult,setShowResult]=useState(true);

  const TeamSelector=({value,onChange,label})=>(
    <div style={{flex:1}}>
      <span style={{fontSize:10,color:DIM,fontWeight:600,marginBottom:6,display:"block"}}>{label}</span>
      <select value={value.flag} onChange={e=>onChange(TEAMS.find(t=>t.flag===e.target.value))}
        style={{width:"100%",padding:"10px 12px",borderRadius:10,background:BG3,border:"1px solid rgba(255,255,255,0.08)",color:"#fff",fontSize:14,fontWeight:600,fontFamily:"inherit",cursor:"pointer",appearance:"none",outline:"none"}}>
        {TEAMS.map(t=><option key={t.flag} value={t.flag}>{t.name}</option>)}
      </select>
    </div>
  );

  const overall1=Math.round((team1.att+team1.mid+team1.def+team1.gk)/4);
  const overall2=Math.round((team2.att+team2.mid+team2.def+team2.gk)/4);
  const winner=overall1>overall2?team1:overall2>overall1?team2:null;

  return(
    <div>
      {/* Team selectors */}
      <div style={{display:"flex",gap:12,alignItems:"flex-end",marginBottom:24}}>
        <TeamSelector value={team1} onChange={t=>{setTeam1(t);setShowResult(true)}} label="SELECCIÓN 1"/>
        <div style={{width:40,height:40,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(201,168,76,0.08)",border:"1px solid rgba(201,168,76,0.15)",flexShrink:0,marginBottom:2}}>
          <span style={{fontSize:12,fontWeight:900,color:GOLD}}>VS</span>
        </div>
        <TeamSelector value={team2} onChange={t=>{setTeam2(t);setShowResult(true)}} label="SELECCIÓN 2"/>
      </div>

      {/* Flags face-off */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:24,marginBottom:28,padding:20,borderRadius:20,background:`linear-gradient(135deg,${BG2},${BG3})`,border:"1px solid rgba(255,255,255,0.05)",position:"relative",overflow:"hidden"}}>
        {team1.flag&&<img src={flagUrl(team1.flag,240)} alt="" style={{position:"absolute",left:"-5%",top:"50%",transform:"translateY(-50%)",width:"30%",opacity:0.06,filter:"blur(3px)"}}/>}
        {team2.flag&&<img src={flagUrl(team2.flag,240)} alt="" style={{position:"absolute",right:"-5%",top:"50%",transform:"translateY(-50%)",width:"30%",opacity:0.06,filter:"blur(3px)"}}/>}
        <div style={{textAlign:"center",position:"relative"}}>
          <Flag code={team1.flag} w={52}/>
          <div style={{fontWeight:900,fontSize:18,marginTop:6}}>{team1.name}</div>
          <div style={{fontSize:11,color:DIM}}>Ranking #{team1.rank} · {team1.titles} títulos</div>
          <div style={{fontSize:28,fontWeight:900,color:GOLD,marginTop:4}}>{overall1}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,position:"relative"}}>
          <div style={{width:50,height:50,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(201,168,76,0.1)",border:"1.5px solid rgba(201,168,76,0.2)"}}>
            <span style={{fontSize:16,fontWeight:900,color:GOLD}}>VS</span>
          </div>
          {winner&&<span style={{fontSize:9,fontWeight:700,color:"#22c55e",marginTop:2}}>← {winner.name} favorita</span>}
        </div>
        <div style={{textAlign:"center",position:"relative"}}>
          <Flag code={team2.flag} w={52}/>
          <div style={{fontWeight:900,fontSize:18,marginTop:6}}>{team2.name}</div>
          <div style={{fontSize:11,color:DIM}}>Ranking #{team2.rank} · {team2.titles} títulos</div>
          <div style={{fontSize:28,fontWeight:900,color:"#00d4ff",marginTop:4}}>{overall2}</div>
        </div>
      </div>

      {/* Stats comparison */}
      <div style={{padding:20,borderRadius:18,background:BG2,border:"1px solid rgba(255,255,255,0.05)"}}>
        <StatBar label="Ataque" val1={team1.att} val2={team2.att}/>
        <StatBar label="Mediocampo" val1={team1.mid} val2={team2.mid}/>
        <StatBar label="Defensa" val1={team1.def} val2={team2.def}/>
        <StatBar label="Portería" val1={team1.gk} val2={team2.gk}/>
        <StatBar label="Títulos mundiales" val1={team1.titles} val2={team2.titles}/>
        <StatBar label="Estrellas" val1={team1.stars} val2={team2.stars}/>
      </div>

      {/* Verdict */}
      <div style={{marginTop:16,padding:16,borderRadius:14,background:"rgba(201,168,76,0.04)",border:"1px solid rgba(201,168,76,0.1)",textAlign:"center"}}>
        <span style={{fontSize:12,color:DIM}}>Veredicto de ZonaMundial</span>
        <div style={{fontWeight:800,fontSize:16,marginTop:4,color:GOLD}}>
          {winner?`${winner.name} parte como favorita con ${Math.max(overall1,overall2)} de valoración general`:"¡Están igualados! Partido impredecible"}
        </div>
      </div>
    </div>
  );
}

// ═══ TOOL 2: SIMULADOR DE BRACKET ═══
function BracketTool(){
  const[results,setResults]=useState({});
  const[step,setStep]=useState(0); // 0=groups, 1=knockout

  // Group simulation
  const simulateGroup=(group)=>{
    const teams=GROUPS_DATA[group];
    // Random points
    const pts=teams.map((_,i)=>({idx:i,pts:Math.floor(Math.random()*10),gd:Math.floor(Math.random()*6)-2}));
    pts.sort((a,b)=>b.pts-a.pts||b.gd-a.gd);
    return pts;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const[groupResults,setGroupResults]=useState<any>({});
  const[simulated,setSimulated]=useState(false);

  const simulateAll=()=>{
    const r:any={};
    Object.keys(GROUPS_DATA).forEach(g=>{
      const teams=GROUPS_DATA[g];
      const pts=teams.map((t,i)=>({...t,idx:i,pts:Math.floor(Math.random()*7)+2,gd:Math.floor(Math.random()*8)-3,gf:Math.floor(Math.random()*6)+1}));
      pts.sort((a,b)=>b.pts-a.pts||b.gd-a.gd);
      r[g]=pts;
    });
    setGroupResults(r);
    setSimulated(true);
  };

  return(
    <div>
      {!simulated?(
        <div style={{textAlign:"center",padding:40,borderRadius:20,background:`linear-gradient(135deg,rgba(201,168,76,0.04),${BG2})`,border:"1px solid rgba(201,168,76,0.1)"}}>
          <span style={{fontSize:52,display:"block",marginBottom:16}}>🏟️</span>
          <h3 style={{fontWeight:800,fontSize:20,marginBottom:8}}>Simula el Mundial completo</h3>
          <p style={{fontSize:14,color:DIM,maxWidth:400,margin:"0 auto 24px"}}>Genera resultados aleatorios para la fase de grupos y ve qué selecciones clasifican a la fase eliminatoria.</p>
          <button onClick={simulateAll} style={{padding:"14px 36px",borderRadius:14,border:"none",cursor:"pointer",background:`linear-gradient(135deg,${GOLD},${GOLD2})`,color:BG,fontWeight:700,fontSize:16,fontFamily:"inherit",transition:"all .3s",boxShadow:"0 4px 20px rgba(201,168,76,0.2)"}}
            onMouseEnter={e=>e.currentTarget.style.boxShadow="0 8px 32px rgba(201,168,76,0.4)"}
            onMouseLeave={e=>e.currentTarget.style.boxShadow="0 4px 20px rgba(201,168,76,0.2)"}
          >Simular Mundial 🎲</button>
        </div>
      ):(
        <div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <h3 style={{fontWeight:700,fontSize:16}}>Fase de grupos — Resultados</h3>
            <button onClick={simulateAll} style={{padding:"6px 14px",borderRadius:8,border:`1px solid rgba(201,168,76,0.3)`,background:"rgba(201,168,76,0.08)",color:GOLD,fontSize:12,fontWeight:600,fontFamily:"inherit",cursor:"pointer"}}>Simular otra vez 🎲</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10}}>
            {Object.keys(groupResults).map((letter)=>{const teams=groupResults[letter];return(
              <div key={letter} style={{borderRadius:16,background:BG2,border:"1px solid rgba(255,255,255,0.04)",overflow:"hidden"}}>
                <div style={{padding:"8px 12px",background:"rgba(201,168,76,0.06)",borderBottom:"1px solid rgba(201,168,76,0.08)"}}>
                  <span style={{fontSize:11,fontWeight:900,color:GOLD,letterSpacing:1}}>GRUPO {letter}</span>
                </div>
                <div style={{padding:"6px 0"}}>
                  {teams.map((t,i)=>(
                    <div key={t.name} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",background:i<2?"rgba(34,197,94,0.03)":"transparent"}}>
                      <span style={{width:16,fontSize:11,fontWeight:700,color:i<2?"#22c55e":DARK,textAlign:"center"}}>{i+1}</span>
                      <Flag code={t.flag} w={18}/>
                      <span style={{flex:1,fontSize:12,fontWeight:600,color:i<2?"#fff":DIM}}>{t.name}</span>
                      <span style={{fontSize:11,fontWeight:700,color:i<2?GOLD:DARK,minWidth:20,textAlign:"right"}}>{t.pts}</span>
                      <span style={{fontSize:10,color:DARK,minWidth:24,textAlign:"right"}}>{t.gd>0?"+":""}{t.gd}</span>
                    </div>
                  ))}
                </div>
                <div style={{padding:"4px 12px 6px",borderTop:"1px solid rgba(255,255,255,0.03)"}}>
                  <span style={{fontSize:9,color:"#22c55e"}}>✓ Clasificados: {teams[0].name}, {teams[1].name}</span>
                </div>
              </div>
            );})}

          </div>

          {/* Qualified teams summary */}
          <div style={{marginTop:24,padding:20,borderRadius:18,background:"rgba(34,197,94,0.04)",border:"1px solid rgba(34,197,94,0.12)"}}>
            <h4 style={{fontWeight:700,fontSize:14,color:"#22c55e",marginBottom:10}}>24 selecciones clasificadas a dieciseisavos</h4>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {Object.keys(groupResults).flatMap((k:string)=>groupResults[k].slice(0,2)).map((t:any)=>(
                <div key={t.name} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:8,background:BG2,border:"1px solid rgba(255,255,255,0.04)"}}>
                  <Flag code={t.flag} w={14}/>
                  <span style={{fontSize:11,fontWeight:600}}>{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══ TOOL 3: CALCULADORA DE CLASIFICACIÓN ═══
function CalculadoraTool(){
  const[group,setGroup]=useState("H");
  const teams=GROUPS_DATA[group];
  const[scores,setScores]=useState(teams.map(()=>({pts:0,gf:0,ga:0})));

  useEffect(()=>{
    setScores(GROUPS_DATA[group].map(()=>({pts:0,gf:0,ga:0})));
  },[group]);

  const updateScore=(idx,field,delta)=>{
    setScores(s=>{
      const n=[...s];
      n[idx]={...n[idx],[field]:Math.max(0,n[idx][field]+delta)};
      return n;
    });
  };

  const standings=useMemo(()=>{
    const t=GROUPS_DATA[group];
    return t.map((team,i)=>({...team,...scores[i],gd:scores[i].gf-scores[i].ga,idx:i}))
      .sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf);
  },[group,scores]);

  const Counter=({value,onDec,onInc,color=GOLD})=>(
    <div style={{display:"flex",alignItems:"center",gap:2}}>
      <button onClick={onDec} style={{width:22,height:22,borderRadius:6,border:"none",background:"rgba(255,255,255,0.04)",color:DIM,cursor:"pointer",fontSize:12,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
      <span style={{width:24,textAlign:"center",fontSize:14,fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{value}</span>
      <button onClick={onInc} style={{width:22,height:22,borderRadius:6,border:"none",background:`${color}15`,color,cursor:"pointer",fontSize:12,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
    </div>
  );

  return(
    <div>
      {/* Group selector */}
      <div style={{display:"flex",gap:5,marginBottom:20,flexWrap:"wrap"}}>
        {Object.keys(GROUPS_DATA).map(g=>(
          <button key={g} onClick={()=>setGroup(g)} style={{width:32,height:32,borderRadius:8,border:`1px solid ${group===g?"rgba(201,168,76,0.3)":"rgba(255,255,255,0.06)"}`,background:group===g?"rgba(201,168,76,0.1)":"transparent",color:group===g?GOLD:DIM,fontWeight:700,fontSize:12,fontFamily:"inherit",cursor:"pointer"}}>{g}</button>
        ))}
      </div>

      {/* Editor */}
      <div style={{borderRadius:18,background:BG2,border:"1px solid rgba(255,255,255,0.05)",overflow:"hidden",marginBottom:16}}>
        <div style={{padding:"10px 16px",background:"rgba(201,168,76,0.04)",borderBottom:"1px solid rgba(201,168,76,0.08)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontWeight:900,fontSize:13,color:GOLD}}>GRUPO {group}</span>
          <span style={{fontSize:10,color:DIM}}>Ajusta puntos y goles manualmente</span>
        </div>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",padding:"6px 16px",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
          <span style={{flex:1,fontSize:10,color:DARK,fontWeight:600}}>Selección</span>
          <span style={{width:80,textAlign:"center",fontSize:10,color:DARK,fontWeight:600}}>Puntos</span>
          <span style={{width:80,textAlign:"center",fontSize:10,color:DARK,fontWeight:600}}>GF</span>
          <span style={{width:80,textAlign:"center",fontSize:10,color:DARK,fontWeight:600}}>GC</span>
        </div>
        {GROUPS_DATA[group].map((t,i)=>(
          <div key={t.name} style={{display:"flex",alignItems:"center",padding:"8px 16px",borderBottom:"1px solid rgba(255,255,255,0.02)",background:i%2===0?"rgba(255,255,255,0.01)":"transparent"}}>
            <div style={{flex:1,display:"flex",alignItems:"center",gap:6}}>
              <Flag code={t.flag} w={20}/>
              <span style={{fontSize:13,fontWeight:600}}>{t.name}</span>
            </div>
            <div style={{width:80,display:"flex",justifyContent:"center"}}><Counter value={scores[i].pts} onDec={()=>updateScore(i,"pts",-1)} onInc={()=>updateScore(i,"pts",1)}/></div>
            <div style={{width:80,display:"flex",justifyContent:"center"}}><Counter value={scores[i].gf} onDec={()=>updateScore(i,"gf",-1)} onInc={()=>updateScore(i,"gf",1)} color="#22c55e"/></div>
            <div style={{width:80,display:"flex",justifyContent:"center"}}><Counter value={scores[i].ga} onDec={()=>updateScore(i,"ga",-1)} onInc={()=>updateScore(i,"ga",1)} color="#ef4444"/></div>
          </div>
        ))}
      </div>

      {/* Live standings */}
      <div style={{borderRadius:18,background:BG2,border:"1px solid rgba(255,255,255,0.05)",overflow:"hidden"}}>
        <div style={{padding:"10px 16px",background:"rgba(34,197,94,0.04)",borderBottom:"1px solid rgba(34,197,94,0.08)"}}>
          <span style={{fontWeight:700,fontSize:13,color:"#22c55e"}}>Clasificación en vivo</span>
        </div>
        {standings.map((t,i)=>(
          <div key={t.name} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,0.02)",background:i<2?"rgba(34,197,94,0.03)":"transparent",transition:"all .4s"}}>
            <div style={{width:24,height:24,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:12,background:i<2?"rgba(34,197,94,0.12)":"rgba(255,255,255,0.03)",color:i<2?"#22c55e":DARK}}>{i+1}</div>
            <Flag code={t.flag} w={22}/>
            <span style={{flex:1,fontWeight:700,fontSize:14,color:i<2?"#fff":DIM}}>{t.name}</span>
            <span style={{fontSize:13,fontWeight:800,color:i<2?GOLD:DIM,minWidth:24,textAlign:"right"}}>{t.pts}</span>
            <span style={{fontSize:11,color:t.gd>0?"#22c55e":t.gd<0?"#ef4444":DARK,minWidth:30,textAlign:"right"}}>{t.gd>0?"+":""}{t.gd}</span>
            <span style={{fontSize:11,color:DARK,minWidth:30,textAlign:"right"}}>{t.gf}:{t.ga}</span>
            {i<2&&<span style={{fontSize:9,fontWeight:700,color:"#22c55e",background:"rgba(34,197,94,0.1)",padding:"2px 6px",borderRadius:4}}>CLASIF.</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══ TOOL CARDS ═══
function ToolCard({ t, openTool }: { t: any; openTool: (id: string) => void }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={() => openTool(t.id)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: 28, borderRadius: 20, cursor: "pointer", position: "relative", overflow: "hidden",
        background: hov ? `linear-gradient(135deg,${t.color}10,${BG2})` : BG2,
        border: `1px solid ${hov ? `${t.color}40` : "rgba(255,255,255,0.04)"}`,
        transform: hov ? "translateY(-4px)" : "none",
        boxShadow: hov ? `0 16px 48px ${t.color}10` : "none",
        transition: "all .4s",
      }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: t.color, filter: "blur(50px)", opacity: hov ? 0.08 : 0.03, transition: "opacity .5s" }} />
      <span style={{ fontSize: 40, display: "block", marginBottom: 14 }}>{t.icon}</span>
      <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 6, color: hov ? t.color : "#fff", transition: "color .3s" }}>{t.title}</h3>
      <p style={{ fontSize: 13, color: DIM, lineHeight: 1.5, marginBottom: 14 }}>{t.desc}</p>
      <span style={{ fontSize: 12, fontWeight: 600, color: t.color }}>Abrir herramienta →</span>
    </div>
  );
}

const TOOLS=[
  {id:"comparador",icon:"⚔️",title:"Comparador de Selecciones",desc:"Compara stats, títulos y valoración entre dos selecciones",color:"#c9a84c"},
  {id:"bracket",icon:"🏟️",title:"Simulador de Bracket",desc:"Simula la fase de grupos y ve qué selecciones clasifican",color:"#00d4ff"},
  {id:"calculadora",icon:"🧮",title:"Calculadora de Clasificación",desc:"Ajusta resultados y calcula quién clasifica en cada grupo",color:"#22c55e"},
];

// ═══ MAIN PAGE ═══
export default function ViralTools(){
  const[active,setActive]=useState(null);
  const scrollRef=useRef(null);
  const { t } = useLanguage();
  const hT = t.herramientasPage;

  const openTool=(id)=>{setActive(id);if(scrollRef.current)scrollRef.current.scrollTop=0};

  const renderTool=()=>{
    const back=()=>setActive(null);
    const tool=TOOLS.find(t=>t.id===active);
    const Wrapper=({children})=>(
      <div>
        <button onClick={back} style={{background:"none",border:"none",color:GOLD,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit",marginBottom:20,display:"flex",alignItems:"center",gap:6}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Volver
        </button>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
          <span style={{fontSize:32}}>{tool.icon}</span>
          <h2 style={{fontWeight:900,fontSize:22,color:tool.color}}>{tool.title}</h2>
        </div>
        <p style={{fontSize:13,color:DIM,marginBottom:24}}>{tool.desc}</p>
        {children}
        {/* Share CTA */}
        <div style={{marginTop:32,padding:20,borderRadius:16,background:`linear-gradient(135deg,${tool.color}08,${BG2})`,border:`1px solid ${tool.color}20`,textAlign:"center"}}>
          <p style={{fontSize:13,color:MID,marginBottom:10}}>¿Te gustó esta herramienta? Compártela</p>
          <div style={{display:"flex",justifyContent:"center",gap:8}}>
            {["Twitter","WhatsApp","Copiar link"].map(s=>(
              <button key={s} style={{padding:"7px 16px",borderRadius:8,border:`1px solid ${tool.color}30`,background:`${tool.color}08`,color:tool.color,fontSize:12,fontWeight:600,fontFamily:"inherit",cursor:"pointer"}}>{s}</button>
            ))}
          </div>
        </div>
      </div>
    );
    switch(active){
      case"comparador":return<Wrapper><ComparadorTool/></Wrapper>;
      case"bracket":return<Wrapper><BracketTool/></Wrapper>;
      case"calculadora":return<Wrapper><CalculadoraTool/></Wrapper>;
    }
  };

  return(
    <div ref={scrollRef} style={{background:BG,color:"#fff",fontFamily:"'Outfit',sans-serif",height:"100vh",overflowY:"auto",overflowX:"hidden"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:${BG}}::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.2);border-radius:3px}
        ::selection{background:rgba(201,168,76,0.3)}
        select option{background:#0F1D32;color:#fff}
      `}</style>

      <div style={{maxWidth:1000,margin:"0 auto",padding:"16px 16px 80px"}}>
        {active?renderTool():(
          <>
            <div style={{marginBottom:36}}>
              <span style={{color:GOLD,fontSize:11,fontWeight:700,letterSpacing:3,textTransform:"uppercase"}}>{hT.badge}</span>
              <h1 style={{fontSize:"clamp(28px,5vw,42px)",fontWeight:900,marginTop:8,marginBottom:10,lineHeight:1.08}}>
                {hT.title1}<br/><span style={{background:`linear-gradient(135deg,${GOLD},${GOLD2})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{hT.title2}</span>
              </h1>
              <p style={{color:MID,maxWidth:480,fontSize:15,lineHeight:1.6}}>{hT.subtitle}</p>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
              {TOOLS.map(t=><ToolCard key={t.id} t={t} openTool={openTool}/>)}
            </div>

            {/* SEO / viral hint */}
            <div style={{marginTop:40,padding:24,borderRadius:20,background:BG2,border:"1px solid rgba(255,255,255,0.04)",textAlign:"center"}}>
              <p style={{fontSize:14,color:MID}}>{hT.freeHint}</p>
              <p style={{fontSize:13,color:DIM,marginTop:4}}>{hT.shareHint}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
