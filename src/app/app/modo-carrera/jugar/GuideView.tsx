"use client";

// GUÍA DE USO COMPLETA del Modo Carrera: todas las reglas del juego explicadas
// en orden, de crear el DT a levantar la Copa. Es DATA-DRIVEN: lee filosofías,
// planes, sesiones, misiones, rangos, títulos y límites desde las MISMAS
// constantes que usa el motor, así nunca se desincroniza de las reglas reales.
// SVG-only, sin emojis (regla del proyecto).

import { useState } from "react";
import { BG2, BG3, GOLD, GOLD2, MID, DIM, GREEN, RED } from "./fx";
import {
  PHILOSOPHIES,
  SKILL_BRANCHES,
  MAX_SKILL_LEVEL,
  DT_RANKS,
  TITLES,
  MISSION_TEMPLATES,
  xpRequired,
} from "@/lib/modo-carrera/constants";
import { PREP_SESSIONS, SESSIONS_PER_WEEK, FRESCURA_START } from "@/lib/modo-carrera/concentracion";
import {
  TACTICAL_PLANS,
  HALFTIME_TALKS,
  EXTRA_TIME_CHOICES,
  PENALTY_STRATEGIES,
  MAX_LIVE_SUBS,
} from "@/lib/modo-carrera/match-live";
import { streakXp } from "@/lib/modo-carrera/streak";
import { DEMAND_LABEL } from "@/lib/modo-carrera/board";
import { FREE_LIMITS } from "@/lib/pro/limits";

// ─── Iconos SVG (trazo, heredan currentColor) ────────────────────────────────
function I({ children, size = 24 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

const ICONS: Record<string, React.ReactNode> = {
  intro: <I><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4z" /></I>,
  dt: <I><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" /></I>,
  temporada: <I><path d="M8 2v4M16 2v4M3 10h18" /><rect x="3" y="4" width="18" height="17" rx="2" /></I>,
  previa: <I><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></I>,
  partido: <I><circle cx="12" cy="12" r="9" /><path d="M12 3v4M12 17v4M3 12h4M17 12h4M8.5 8.5l2 2M13.5 13.5l2 2M15.5 8.5l-2 2M10.5 13.5l-2 2" /></I>,
  xp: <I><path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h7v7" /></I>,
  arbol: <I><path d="M12 2v6M12 22v-6M2 12h6M22 12h-6" /><circle cx="12" cy="12" r="3" /></I>,
  misiones: <I><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></I>,
  racha: <I><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" /></I>,
  federacion: <I><path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" /></I>,
  vestuario: <I><path d="M8 10a4 4 0 1 1 8 0c0 3-4 3-4 6" /><circle cx="12" cy="19.5" r="0.6" fill="currentColor" stroke="none" /></I>,
  plantel: <I><rect x="3" y="6" width="18" height="14" rx="3" /><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M12 10v6M9 13h6" /></I>,
  legado: <I><path d="M6 4h12v3a6 6 0 0 1-12 0V4z" /><path d="M6 6H3v2a3 3 0 0 0 3 3M18 6h3v2a3 3 0 0 1-3 3M9 17h6M8 21h8M12 13v4" /></I>,
  narrativa: <I><path d="M4 4h16v16H4z" /><path d="M8 8h8M8 12h8M8 16h5" /></I>,
  consejos: <I><path d="M9 18h6M10 21h4M12 3a6 6 0 0 1 4 10.5c-.8.7-1 1.5-1 2.5h-6c0-1-.2-1.8-1-2.5A6 6 0 0 1 12 3z" /></I>,
};

// ─── Piezas de layout ────────────────────────────────────────────────────────
function Card({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div
      style={{
        background: accent ? `linear-gradient(135deg,${GOLD}14,transparent)` : BG2,
        border: `1px solid ${accent ? GOLD + "44" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 16,
        padding: 18,
      }}
    >
      {children}
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 14, lineHeight: 1.7, color: "#dfe6f2", margin: 0 }}>{children}</p>;
}

function Row({ name, desc, value }: { name: string; desc?: string; value?: string }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ fontSize: 13.5, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{name}</span>
      {desc && <span style={{ fontSize: 13, color: MID, lineHeight: 1.5, flex: 1 }}>{desc}</span>}
      {value && <span style={{ fontSize: 13, fontWeight: 800, color: GOLD2, marginLeft: "auto", flexShrink: 0 }}>{value}</span>}
    </div>
  );
}

function Section({ id, title, lead, children, open, onToggle }: {
  id: string;
  title: string;
  lead: string;
  children: React.ReactNode;
  open: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <div style={{ background: BG3, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: 18,
          background: "transparent",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ flexShrink: 0, width: 42, height: 42, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", background: `${GOLD}1a`, color: GOLD2 }}>
          {ICONS[id]}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 17, fontWeight: 900, color: GOLD2 }}>{title}</span>
          <span style={{ display: "block", fontSize: 13, color: MID, marginTop: 2 }}>{lead}</span>
        </span>
        <span aria-hidden style={{ color: DIM, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", display: "inline-flex" }}>
          <I size={18}><path d="M6 9l6 6 6-6" /></I>
        </span>
      </button>
      {open && <div style={{ padding: "0 18px 20px", display: "grid", gap: 14 }}>{children}</div>}
    </div>
  );
}

// ─── La guía ─────────────────────────────────────────────────────────────────
export default function GuideView({ paseDT = false }: { paseDT?: boolean }) {
  const [open, setOpen] = useState<string>("intro");
  const toggle = (id: string) => setOpen((cur) => (cur === id ? "" : id));

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 820, margin: "0 auto" }}>
      {/* Cabecera */}
      <div style={{ textAlign: "center", padding: "6px 8px 4px" }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, color: GOLD, textTransform: "uppercase" }}>
          Manual del director técnico
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 900, margin: "8px 0 6px", color: "#fff" }}>Guía completa del Modo Carrera</h2>
        <p style={{ color: MID, fontSize: 14, lineHeight: 1.6, maxWidth: 560, margin: "0 auto" }}>
          Todas las reglas del juego, en orden: de tu primer día en el banquillo a levantar la Copa.
          Toca cada sección para desplegarla.
        </p>
      </div>

      {/* 1 · El juego en 30 segundos */}
      <Section id="intro" title="El juego en 30 segundos" lead="Qué es el Modo Carrera y cómo se gana" open={open === "intro"} onToggle={toggle}>
        <Card accent>
          <P>
            Eres el <b>director técnico de una selección nacional</b>. Cada temporada es un ciclo mundialista completo:
            preparas al equipo, clasificas, juegas el Mundial y respondes ante la federación. Tu carta de DT
            (overall 0-99) <b>sube de nivel con la experiencia</b> que ganas dirigiendo, y tu <b>legado</b> — trofeos,
            récords e insignias — se construye a lo largo de muchas temporadas. Se gana dirigiendo bien los partidos,
            gestionando el vestuario y tomando decisiones que un seleccionador real tomaría.
          </P>
        </Card>
        <Card>
          <P>
            Hay <b>dos modalidades</b>: el <b>Modo Libre</b> (un Mundial simulado que juegas a tu ritmo) y el{" "}
            <b>Mundial en Vivo</b> con Pase DT: tu carrera avanza al ritmo del Mundial real, con los rivales y
            horarios reales — cada partido se desbloquea a la hora del saque de verdad.
          </P>
        </Card>
      </Section>

      {/* 2 · Crear tu DT */}
      <Section id="dt" title="Crear tu DT" lead="Nombre, filosofía táctica y selección" open={open === "dt"} onToggle={toggle}>
        <Card>
          <P>
            Al empezar eliges <b>nombre</b>, <b>filosofía táctica</b> y una de las <b>48 selecciones</b> del Mundial.
            La filosofía define tu identidad y potencia una rama del árbol de habilidades desde el inicio. Dirigir a una
            potencia es más cómodo, pero la federación exige más; con una cenicienta, cada gesta vale doble.
          </P>
        </Card>
        <Card>
          {PHILOSOPHIES.map((p) => (
            <Row key={p.id} name={p.name} desc={`${p.description} Potencia la rama ${SKILL_BRANCHES.find((b) => b.id === p.boosts)?.name ?? p.boosts}.`} />
          ))}
        </Card>
      </Section>

      {/* 3 · La temporada */}
      <Section id="temporada" title="La temporada" lead="Calendario, clasificación, grupos y eliminatorias" open={open === "temporada"} onToggle={toggle}>
        <Card>
          <Row name="1 · Amistosos" desc="2 partidos de preparación. No eliminan: sirven para rodar el once, coger forma y sumar algo de XP (la mitad que un oficial)." />
          <Row name="2 · Clasificación" desc="4 jornadas. Necesitas sumar al menos 4 puntos para clasificar al Mundial; si no, la temporada acaba sin torneo (como en el fútbol real)." />
          <Row name="3 · Fase de grupos" desc="3 partidos. Se construye la tabla real del grupo (puntos, diferencia de goles, goles a favor) y pasan los DOS primeros." />
          <Row name="4 · Eliminatorias" desc="Octavos, cuartos, semifinal y final, con rivales de dificultad creciente. Aquí no existe el empate: prórroga y penaltis." />
        </Card>
        <Card>
          <P>
            En tu <b>primera temporada</b> juegas contra tu grupo real del Mundial 2026. A partir de la segunda, cada
            torneo tiene un <b>sorteo nuevo</b>: un rival del bombo alto, uno del medio y uno del bajo — nunca repites
            el mismo grupo dos Mundiales seguidos. Todas las fases del Mundial se juegan en <b>sede neutral</b>; la
            ventaja de campo solo existe en amistosos y clasificación.
          </P>
        </Card>
        <Card>
          <P>
            <b>Cupo del plan Free:</b> {FREE_LIMITS.carrera.maxSeasonsPerDay} temporadas al día; al agotarlas hay una
            espera de {FREE_LIMITS.carrera.cooldownHours} horas para continuar. Con <b>Pro</b>, temporadas ilimitadas.
            Como invitado tu partida vive en el dispositivo; con cuenta se guarda en la nube y entras al ranking global.
          </P>
        </Card>
      </Section>

      {/* 4 · La previa */}
      <Section id="previa" title="La previa del partido" lead="Concentración, frescura, alineación y capitán" open={open === "previa"} onToggle={toggle}>
        <Card>
          <P>
            Antes de cada partido puedes preparar la <b>Concentración</b>: eliges {SESSIONS_PER_WEEK} sesiones de
            entrenamiento que ajustan tu ataque, tu defensa y la <b>frescura</b> del grupo (0-100, arranca en{" "}
            {FRESCURA_START}). La frescura se arrastra de un partido al siguiente: llegar fundido resta rendimiento,
            llegar fresco lo mejora. Las sesiones físicas exigen más y pueden costar una lesión en el entrenamiento.
          </P>
        </Card>
        <Card>
          {PREP_SESSIONS.map((s) => (
            <Row key={s.id} name={s.name} desc={s.hint} />
          ))}
        </Card>
        <Card>
          <P>
            También controlas el <b>dibujo táctico y el once titular</b> (editable antes del saque, se guarda para los
            siguientes partidos) y designas <b>capitán</b>. El brazalete no rinde solo: su plus de liderazgo escala con
            la <b>moral del vestuario</b> — con el grupo entregado aporta mucho; con el vestuario roto, casi nada. Los
            lesionados y sancionados no pueden entrar en el once ni en el banquillo.
          </P>
        </Card>
      </Section>

      {/* 5 · El partido en vivo */}
      <Section id="partido" title="El partido en vivo" lead="Plan, decisiones, cambios, balón parado, prórroga y penaltis" open={open === "partido"} onToggle={toggle}>
        <Card>
          <P>
            El marcador <b>no se revela de golpe</b>: el reloj corre y los goles caen minuto a minuto. Antes del saque
            eliges un <b>plan táctico</b> que multiplica de verdad tu ataque y tu exposición defensiva:
          </P>
          <div style={{ marginTop: 8 }}>
            {TACTICAL_PLANS.map((p) => (
              <Row key={p.id} name={p.name} desc={p.description} />
            ))}
          </div>
        </Card>
        <Card>
          <P>
            <b>Decisiones en vivo (min 60 y min 75):</b> el banquillo te mira y tienes <b>10 segundos</b> para dar la
            orden según el marcador; si no decides, el cuerpo técnico mantiene el plan. Desde ahí también abres el{" "}
            <b>banquillo</b> (hasta {MAX_LIVE_SUBS} cambios por partido) y la <b>pizarra</b> (cambio de sistema). Ojo:
            el efecto real de cada cambio pasa por una evaluación — cuenta la calidad de tu equipo, lo idóneo del
            movimiento para el marcador y la <b>reacción del rival</b>, que se adapta y castiga si te abres.
          </P>
        </Card>
        <Card>
          <P>
            <b>Al descanso (45&#39;)</b>, si vas perdiendo, das la <b>charla técnica</b> — modula el resto del partido y
            deja huella en la moral:
          </P>
          <div style={{ marginTop: 8 }}>
            {HALFTIME_TALKS.map((t) => (
              <Row key={t.id} name={t.name} desc={t.description} />
            ))}
          </div>
        </Card>
        <Card>
          <P>
            <b>Incidencias:</b> puede caer una <b>lesión en pleno partido</b> (eliges el recambio y su perfil), una{" "}
            <b>tarjeta roja</b> (tuya o del rival, condiciona los minutos restantes) o un <b>balón parado a favor</b>:
            penalti o falta peligrosa. En el balón parado primero eliges al <b>lanzador</b> entre los que están en el
            campo — el capitán es el especialista de confianza y los delanteros afinan la puntería; un defensa, menos —
            y después cómo ejecutarla (a lo seguro, con potencia o con descaro: a más espectáculo, más riesgo).
          </P>
        </Card>
        <Card>
          <P>
            <b>Eliminatorias igualadas a los 90&#39;:</b> hay <b>prórroga</b> de 30 minutos con enfoque a tu elección
            ({EXTRA_TIME_CHOICES.map((c) => c.name).join(" · ")}) y, si persiste el empate, <b>tanda de penaltis</b>{" "}
            con tu estrategia ({PENALTY_STRATEGIES.map((s) => s.name).join(" · ")}). El resultado final del partido es
            exactamente el que viste caer en el campo.
          </P>
        </Card>
      </Section>

      {/* 6 · XP, niveles y rangos */}
      <Section id="xp" title="XP, niveles y rangos" lead="Cómo sube tu overall y qué desbloquea" open={open === "xp"} onToggle={toggle}>
        <Card accent>
          <P>
            La regla de oro: <b>ganar partidos sube tu nivel</b>. Una victoria reparte unos 130-170 XP (más por cada
            gol y por ganar un desempate), un empate 60 y una derrota 35; los amistosos pagan la mitad. Al llenar la
            barra subes de nivel: <b>+1 al overall</b> (tope 99) y <b>+1 punto de habilidad</b> para el árbol.
          </P>
        </Card>
        <Card>
          <Row name="Overall 50 (inicio)" desc="XP para el siguiente nivel" value={`${xpRequired(50)} XP · ~3 victorias`} />
          <Row name="Overall 60" desc="XP para el siguiente nivel" value={`${xpRequired(60)} XP`} />
          <Row name="Overall 75" desc="XP para el siguiente nivel" value={`${xpRequired(75)} XP`} />
          <Row name="Overall 90" desc="XP para el siguiente nivel" value={`${xpRequired(90)} XP`} />
          <P>
            La curva crece suave: al principio subes cada pocos partidos y llegar a la élite es un proyecto de varias
            temporadas. Tu overall además <b>mejora al equipo en el campo</b>: un DT consolidado suma fuerza real.
          </P>
        </Card>
        <Card>
          {DT_RANKS.map((r) => (
            <Row key={r.name} name={r.name} value={`overall ${r.min}+`} />
          ))}
        </Card>
      </Section>

      {/* 7 · Árbol de habilidades */}
      <Section id="arbol" title="Árbol de habilidades" lead="4 ramas, 5 niveles: dónde invertir tus puntos" open={open === "arbol"} onToggle={toggle}>
        <Card>
          <P>
            Cada punto de habilidad sube una rama (máximo {MAX_SKILL_LEVEL} niveles). <b>Ataque</b> refuerza solo tu
            ataque y <b>Defensa</b> solo tu defensa; <b>Mental</b> y <b>Gestión</b> suman al rendimiento global del
            equipo. Cada subida mejora además un stat de tu reputación (+4): prestigio, disciplina, táctica o cantera.
          </P>
        </Card>
        <Card>
          {SKILL_BRANCHES.map((b) => (
            <Row key={b.id} name={b.name} desc={`${b.description} Niveles: ${b.levels.join(" → ")}.`} />
          ))}
        </Card>
      </Section>

      {/* 8 · Misiones */}
      <Section id="misiones" title="Misiones" lead="Retos diarios, semanales, de torneo y flash" open={open === "misiones"} onToggle={toggle}>
        <Card>
          <P>
            Las misiones reparten <b>XP y reputación</b> al reclamarlas, y con sesión iniciada el servidor abona además{" "}
            <b>Fútcoins</b> a tu billetera (una sola vez por misión). La de entrenamiento se completa con un botón; el
            resto, jugando. Las diarias y flash caducan en el día; las semanales, el domingo; las de torneo duran el
            Mundial.
          </P>
        </Card>
        <Card>
          {MISSION_TEMPLATES.map((m) => (
            <Row key={m.key} name={m.title} desc={m.description} value={`+${m.rewardXp} XP · +${m.rewardReputation} REP`} />
          ))}
        </Card>
      </Section>

      {/* 9 · Racha diaria */}
      <Section id="racha" title="Racha diaria" lead="Vuelve cada día y no rompas la cadena" open={open === "racha"} onToggle={toggle}>
        <Card>
          <P>
            Cada día que entras y reclamas, la racha crece y paga más XP: {streakXp(1)} XP el día 1, hasta{" "}
            {streakXp(7)} XP el día 7 — y desde ahí sigue subiendo poco a poco hasta {streakXp(40)} XP. Cada{" "}
            <b>7 días seguidos</b> cae además un <b>punto de habilidad</b> extra. Si fallas un día, la cadena vuelve a
            empezar.
          </P>
        </Card>
      </Section>

      {/* 10 · La federación */}
      <Section id="federacion" title="La federación" lead="Objetivo de temporada y confianza en tu puesto" open={open === "federacion"} onToggle={toggle}>
        <Card>
          <P>
            Cada temporada la junta fija un <b>objetivo realista</b> según la fuerza real de tu selección (
            {Object.values(DEMAND_LABEL).join(" · ")}) que crece con tu overall: a mejor DT, más exigencia. Al cerrar
            la temporada se dicta veredicto: superarlo dispara la <b>confianza</b> (0-100); fallarlo la hunde — y
            fallar por mucho, más. Por debajo de <b>25 de confianza tu puesto peligra</b> y necesitas resultados ya.
          </P>
        </Card>
      </Section>

      {/* 11 · Moral y vestuario */}
      <Section id="vestuario" title="Moral, prensa y vestuario" lead="Las decisiones humanas también puntúan" open={open === "vestuario"} onToggle={toggle}>
        <Card>
          <P>
            La <b>moral del vestuario</b> (0-100) afecta el rendimiento en el campo y el plus de tu capitán. La mueven
            tus decisiones: <b>ruedas de prensa</b> post-partido (humildad, euforia, polémica…), <b>eventos de
            vestuario</b> entre partidos (diálogo o autoridad, proteger o señalar) y la charla del descanso. Cada
            opción tiene efectos reales sobre la moral, la confianza de la federación y tus stats de reputación — la
            polémica enciende al grupo pero incomoda a la junta; señalar a un jugador en público marca autoridad y
            rompe el vestuario.
          </P>
        </Card>
      </Section>

      {/* 12 · El plantel: lesiones y sanciones */}
      <Section id="plantel" title="Lesiones y sanciones" lead="Las bajas que te obligan a rotar" open={open === "plantel"} onToggle={toggle}>
        <Card>
          <P>
            Tras un partido puede caer una <b>lesión</b> (1-3 partidos de baja) o una <b>sanción</b> por tarjetas
            (roja directa: 2 fechas; ciclo de amarillas: 1). Mientras dure la baja, el jugador no puede jugar y tu
            equipo pierde fuerza en su zona (los atacantes restan al ataque; defensas y portero, a la defensa). Cada
            partido jugado descuenta una fecha. Al arrancar una <b>temporada nueva el plantel vuelve sano</b> y con la
            frescura restablecida.
          </P>
        </Card>
      </Section>

      {/* 13 · Reputación, ranking y legado */}
      <Section id="legado" title="Reputación, ranking y legado" lead="Tu huella: stats, trofeos, récords e insignias" open={open === "legado"} onToggle={toggle}>
        <Card>
          <P>
            Tu <b>reputación</b> son 6 stats (prestigio, carisma, táctica, disciplina, mediático y cantera, 0-100 cada
            uno; total 0-600) que crecen con resultados, misiones y decisiones. El <b>Ranking DT global</b> ordena a
            todos los entrenadores por reputación (desempate por overall) — se entra jugando con sesión iniciada.
          </P>
        </Card>
        <Card>
          <P>
            En el <b>Legado</b> guardas la vitrina de trofeos de cada Mundial conquistado, tus récords permanentes
            (partidos, victorias, goles…) y las <b>insignias</b> que se desbloquean por hitos:
          </P>
          <div style={{ marginTop: 8 }}>
            {TITLES.map((t) => (
              <Row key={t.id} name={t.name} desc={t.description} />
            ))}
          </div>
        </Card>
      </Section>

      {/* 14 · Narrativa con IA */}
      <Section id="narrativa" title="Narrativa con IA" lead="Briefings, titulares y ruedas de prensa generados para tu carrera" open={open === "narrativa"} onToggle={toggle}>
        <Card>
          <P>
            La pestaña Narrativa genera <b>briefings semanales, titulares de prensa y ruedas de prensa</b> únicos para
            tu historia. Con <b>Pase DT</b> la generación con IA es ilimitada; los usuarios gratis con sesión tienen un
            cupo diario (ampliable con recargas de Fútcoins) y los invitados comparten un cupo común. Al agotarse el
            cupo el contenido no se corta: se sirve la versión por plantilla, sin IA.
          </P>
        </Card>
      </Section>

      {/* 15 · Consejos */}
      <Section id="consejos" title="Consejos del cuerpo técnico" lead="Cinco hábitos de DT campeón" open={open === "consejos"} onToggle={toggle}>
        <Card>
          <Row name="1" desc="Concentra SIEMPRE antes de jugar: tres sesiones bien elegidas y la frescura controlada valen más que cualquier arenga." />
          <Row name="2" desc="Lee el marcador antes de decidir en el 60' y el 75': cerrar un partido ganado suele pagar más que ir a la épica." />
          <Row name="3" desc="No quemes los 3 cambios pronto: una lesión tardía o una roja te pueden dejar vendido." />
          <Row name="4" desc="Cuida la moral entre partidos: el capitán y el vestuario rinden lo que el grupo está de entregado." />
          <Row name="5" desc="Vuelve a diario aunque no juegues: racha + misión de entrenamiento son XP y puntos de habilidad gratis." />
        </Card>
        {!paseDT && (
          <Card accent>
            <P>
              <b>Pase DT:</b> Mundial en Vivo al ritmo real, narrativa IA sin límite y tu legado completo. Disponible
              en la sección Premium.
            </P>
          </Card>
        )}
      </Section>
    </div>
  );
}
