"use client";

// Guía de uso del Fantasy Mundial: normas y reglas explicadas de forma amena y
// didáctica. Es DATA-DRIVEN: lee las constantes, la tabla de puntos, los
// power-ups y las formaciones desde las mismas fuentes que usa el juego, así que
// nunca se desincroniza de las reglas reales.

import { useState } from "react";
import {
  BUDGET,
  SQUAD_SIZE,
  MAX_PER_NATION,
  FREE_TRANSFERS,
  TRANSFER_PENALTY,
  ELIM_REFUND_PER_POINT,
  ELIM_REFUND_FLOOR,
} from "@/lib/fantasy/types";
import { FORMATIONS } from "@/lib/fantasy/rules";
import { SCORING_TABLE, POWER_UPS } from "@/lib/fantasy/scoring";
import { TOTAL_GAMEWEEKS, MATCH_LOCK_HOURS } from "@/lib/fantasy/fixtures";
import { BG, BG2, BG3, GOLD, GOLD2, MID, DIM, GREEN, RED, money } from "./fx";

// Franjas del Modo Underdog (mismas que tierFromGap en fixtures.ts).
const TIERS = [
  { emoji: "🟢", label: "Estelar", mult: "×1.0", color: "#4ade80", desc: "Duelo parejo: sin bonus." },
  { emoji: "🟠", label: "Bronce", mult: "×1.25", color: "#fb923c", desc: "Eres ligero favorito o underdog." },
  { emoji: "🟡", label: "Oro", mult: "×1.5", color: "#fbbf24", desc: "Diferencia notable de nivel." },
  { emoji: "💎", label: "Diamante", mult: "×2.0", color: "#67e8f9", desc: "David contra Goliat: máxima recompensa." },
];

// Las 8 jornadas del torneo (grupos 1-3 + eliminatorias 4-8).
const CALENDAR = [
  { gw: "J1-J3", ronda: "Fase de grupos", nota: "3 partidos para arrancar y sumar." },
  { gw: "J4", ronda: "16avos de final", nota: "Empieza el todo o nada." },
  { gw: "J5", ronda: "Octavos de final", nota: "Solo siguen 16 selecciones." },
  { gw: "J6", ronda: "Cuartos de final", nota: "Los 8 mejores." },
  { gw: "J7", ronda: "Semifinales", nota: "A un paso de la gloria." },
  { gw: "J8", ronda: "3.º puesto + Final", nota: "El último cartucho." },
];

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

function Section({ id, icon, title, lead, children, open, onToggle }: {
  id: string;
  icon: string;
  title: string;
  lead: string;
  children: React.ReactNode;
  open: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <div style={{ background: BG3, border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 18, overflow: "hidden" }}>
      <button
        onClick={() => onToggle(id)}
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
        <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 17, fontWeight: 900, color: GOLD2 }}>{title}</span>
          <span style={{ display: "block", fontSize: 13, color: MID, marginTop: 2 }}>{lead}</span>
        </span>
        <span style={{ fontSize: 18, color: DIM, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>⌄</span>
      </button>
      {open && <div style={{ padding: "0 18px 20px", display: "grid", gap: 14 }}>{children}</div>}
    </div>
  );
}

export default function GuideView() {
  const [open, setOpen] = useState<string>("intro");
  const toggle = (id: string) => setOpen((cur) => (cur === id ? "" : id));

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 820, margin: "0 auto" }}>
      {/* Cabecera */}
      <div style={{ textAlign: "center", padding: "6px 8px 4px" }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, color: GOLD, textTransform: "uppercase" }}>
          Manual del entrenador
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 900, margin: "8px 0 6px" }}>Guía de uso del Fantasy</h2>
        <p style={{ color: MID, fontSize: 14, lineHeight: 1.6, maxWidth: 560, margin: "0 auto" }}>
          Todo lo que necesitas para ganar, en orden y sin tecnicismos. Toca cada sección para desplegarla.
        </p>
      </div>

      {/* 1 · El juego en 30 segundos */}
      <Section id="intro" icon="🏆" title="El juego en 30 segundos" lead="El objetivo y cómo se gana" open={open === "intro"} onToggle={toggle}>
        <Card accent>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "#dfe6f2", margin: 0 }}>
            Eres el <b>seleccionador</b>: montas un equipo con <b>jugadores reales</b> del Mundial 2026 y, jornada a
            jornada, ellos suman puntos según lo que hacen <b>de verdad</b> en el campo. Tu misión: elegir mejor que
            nadie y escalar en las <b>ligas</b>. Cuanto más listo fiches, más puntos.
          </p>
        </Card>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
          {[
            { n: "1", t: "Ficha 15 jugadores", d: `Con tu presupuesto de ${BUDGET}M €.` },
            { n: "2", t: "Elige capitán", d: "Su puntuación se duplica. Queda fijado al primer saque." },
            { n: "3", t: "Vive la jornada", d: "Tus jugadores puntúan con los partidos reales." },
            { n: "4", t: "Confirma al final", d: "Al acabar tus partidos: tus puntos suben al ranking." },
          ].map((s) => (
            <Card key={s.n}>
              <div style={{ fontSize: 22, fontWeight: 900, color: GOLD }}>{s.n}</div>
              <div style={{ fontSize: 14, fontWeight: 800, marginTop: 4 }}>{s.t}</div>
              <div style={{ fontSize: 12, color: DIM, marginTop: 2 }}>{s.d}</div>
            </Card>
          ))}
        </div>
      </Section>

      {/* 2 · Presupuesto y plantilla */}
      <Section id="plantilla" icon="💰" title="Presupuesto y plantilla" lead={`${BUDGET}M €, ${SQUAD_SIZE} jugadores, máx ${MAX_PER_NATION} por país`} open={open === "plantilla"} onToggle={toggle}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10 }}>
          {[
            { v: `${BUDGET}M €`, l: "Presupuesto" },
            { v: `${SQUAD_SIZE}`, l: "Jugadores (11 + 4 banco)" },
            { v: `${MAX_PER_NATION}`, l: "Máximo por selección" },
          ].map((x) => (
            <Card key={x.l}>
              <div style={{ fontSize: 24, fontWeight: 900, color: GOLD }}>{x.v}</div>
              <div style={{ fontSize: 12, color: DIM, marginTop: 2 }}>{x.l}</div>
            </Card>
          ))}
        </div>
        <Card>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: MID, margin: 0 }}>
            Cada jugador tiene un <b>precio</b> que sale de su valor real de mercado. No puedes pasarte del presupuesto
            ni meter más de <b>{MAX_PER_NATION} jugadores de la misma selección</b>: así nadie clona al mejor equipo del
            mundo. Los <b>4 suplentes</b> entran automáticamente si un titular no juega.
          </p>
        </Card>
      </Section>

      {/* 3 · Formaciones */}
      <Section id="formaciones" icon="📐" title="Formaciones" lead={`${FORMATIONS.length} esquemas tácticos a elegir`} open={open === "formaciones"} onToggle={toggle}>
        <p style={{ fontSize: 13, color: MID, lineHeight: 1.6, margin: 0 }}>
          Siempre juegas con <b>1 portero</b>. El resto lo repartes según el esquema. Cambia de formación cuando quieras
          (mientras la jornada no esté confirmada):
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
          {FORMATIONS.map((f) => (
            <Card key={f.code}>
              <div style={{ fontSize: 18, fontWeight: 900, color: GOLD }}>{f.code}</div>
              <div style={{ fontSize: 12, color: "#dfe6f2", marginTop: 3 }}>{f.def} DEF · {f.mid} MED · {f.fwd} DEL</div>
              <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>{f.estilo}</div>
            </Card>
          ))}
        </div>
      </Section>

      {/* 4 · Calendario */}
      <Section id="calendario" icon="🗓️" title="El calendario" lead={`${TOTAL_GAMEWEEKS} jornadas: grupos + eliminatorias`} open={open === "calendario"} onToggle={toggle}>
        <p style={{ fontSize: 13, color: MID, lineHeight: 1.6, margin: 0 }}>
          El torneo dura <b>{TOTAL_GAMEWEEKS} jornadas</b>. Ojo con las eliminatorias: si la selección de un jugador tuyo
          cae, deja de puntuar. Fichar a quien <b>llega lejos</b> es media victoria.
        </p>
        <div style={{ display: "grid", gap: 8 }}>
          {CALENDAR.map((c) => (
            <div key={c.gw} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: BG2, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: GOLD, minWidth: 56 }}>{c.gw}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{c.ronda}</span>
              <span style={{ fontSize: 12, color: DIM, textAlign: "right" }}>{c.nota}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* 5 · Capitán y vice */}
      <Section id="capitan" icon="⭐" title="Capitán y vicecapitán" lead="Tu mejor apuesta, multiplicada" open={open === "capitan"} onToggle={toggle}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Card accent>
            <div style={{ fontSize: 22, fontWeight: 900, color: GOLD }}>×2</div>
            <div style={{ fontSize: 14, fontWeight: 800, marginTop: 4 }}>Capitán</div>
            <div style={{ fontSize: 12, color: DIM, marginTop: 2 }}>Sus puntos se duplican. Elígelo bien.</div>
          </Card>
          <Card>
            <div style={{ fontSize: 22, fontWeight: 900, color: GOLD2 }}>×1.5</div>
            <div style={{ fontSize: 14, fontWeight: 800, marginTop: 4 }}>Vicecapitán</div>
            <div style={{ fontSize: 12, color: DIM, marginTop: 2 }}>Si el capitán no juega, hereda el bonus.</div>
          </Card>
        </div>
        <Card>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: MID, margin: 0 }}>
            ⏱️ <b style={{ color: GOLD2 }}>Se congelan al primer saque.</b> Desde que arranca el primer partido de tu
            jornada, el capitán, el vice y el power-up quedan <b>fijados</b> — elegir al goleador con el partido ya
            visto sería trampa. Decide antes del pitido.
          </p>
        </Card>
      </Section>

      {/* 6 · Modo Underdog */}
      <Section id="underdog" icon="💎" title="Modo Underdog" lead="El giro táctico: cuanto más difícil, más puntos" open={open === "underdog"} onToggle={toggle}>
        <Card accent>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: "#dfe6f2", margin: 0 }}>
            Cada partido reparte un <b>multiplicador</b> según la diferencia de nivel entre los dos rivales. Arriesgar
            con un jugador de una selección modesta puede <b>doblar</b> sus puntos. ¡Premiamos al valiente!
          </p>
        </Card>
        <div style={{ display: "grid", gap: 8 }}>
          {TIERS.map((t) => (
            <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: BG2, borderRadius: 12, border: `1px solid ${t.color}33` }}>
              <span style={{ fontSize: 20 }}>{t.emoji}</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: t.color, minWidth: 80 }}>{t.label}</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: "#fff", minWidth: 50 }}>{t.mult}</span>
              <span style={{ flex: 1, fontSize: 12, color: DIM, textAlign: "right" }}>{t.desc}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* 7 · Sistema de puntos */}
      <Section id="puntos" icon="📊" title="Cómo se ganan (y pierden) puntos" lead="La tabla de puntuación completa" open={open === "puntos"} onToggle={toggle}>
        <div style={{ display: "grid", gap: 6 }}>
          {SCORING_TABLE.map((r) => (
            <div key={r.accion} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 14px", background: BG2, borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{r.accion}</span>
                {r.nota && <span style={{ display: "block", fontSize: 11, color: DIM, marginTop: 1 }}>{r.nota}</span>}
              </span>
              <span style={{ fontSize: 15, fontWeight: 900, color: r.neg ? RED : GOLD, whiteSpace: "nowrap" }}>{r.puntos}</span>
            </div>
          ))}
        </div>
        <Card>
          <p style={{ fontSize: 12, lineHeight: 1.7, color: MID, margin: 0 }}>
            <b style={{ color: GOLD2 }}>Puntos de bonificación (BPS):</b> tras cada partido, los <b>3 mejores</b> en
            calidad de juego reciben <b style={{ color: GREEN }}>+3</b>, <b style={{ color: GREEN }}>+2</b> y{" "}
            <b style={{ color: GREEN }}>+1</b> extra. Marcar, asistir y dejar la portería a cero suben mucho tu BPS.
          </p>
        </Card>
      </Section>

      {/* 8 · La jornada en vivo (del saque a confirmar) */}
      <Section id="envivo" icon="🔴" title="La jornada, en vivo" lead="Del primer saque a confirmar tus puntos" open={open === "envivo"} onToggle={toggle}>
        <div style={{ display: "grid", gap: 8 }}>
          {[
            { e: "🔒", t: `Al empezar la jornada`, d: "Con el plan gratuito, tu once se congela al primer saque de la jornada (puedes fichar y armar libremente antes). Con Pro haces sustituciones en vivo, respetando el cierre de cada partido." },
            { e: "🚫", t: `${MATCH_LOCK_HOURS}h antes de CADA partido`, d: "Los jugadores de ese partido se cierran para TODOS: ni entran, ni salen, ni se mueven al banquillo hasta la próxima jornada." },
            { e: "⏱️", t: "Primer saque", d: "Capitán, vice y power-up quedan congelados para todos. Lo que elegiste, va a misa." },
            { e: "📡", t: "Durante los partidos", d: "Con Pro sigues tus puntos minuto a minuto. Con el plan gratuito aparecen al final de cada partido." },
            { e: "✅", t: "Al terminar TODOS tus partidos", d: "Pulsa Confirmar: el servidor recalcula tus puntos con los datos oficiales del Mundial — aquí no hay trampas posibles — y suben al ranking y a tus ligas." },
          ].map((x) => (
            <div key={x.t} style={{ display: "flex", gap: 12, padding: "10px 14px", background: BG2, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{x.e}</span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: 800, color: GOLD2 }}>{x.t}</span>
                <span style={{ display: "block", fontSize: 12, color: MID, lineHeight: 1.55, marginTop: 2 }}>{x.d}</span>
              </span>
            </div>
          ))}
        </div>
        <Card>
          <p style={{ fontSize: 12, lineHeight: 1.7, color: MID, margin: 0 }}>
            💰 <b style={{ color: GOLD2 }}>¿Y las Fútcoins?</b> Las Fútcoins de la jornada se abonan cuando la jornada
            completa termina (su último partido). Si confirmaste antes, tranquilo: se acreditan <b>solas</b> en tu
            próxima visita. Y el banquillo trabaja por ti: si un titular no juega, entra el suplente automáticamente.
          </p>
        </Card>
      </Section>

      {/* 9 · Power-ups */}
      <Section id="powerups" icon="🃏" title="Power-ups (comodines)" lead={`${POWER_UPS.length} cartas con un solo uso en todo el torneo`} open={open === "powerups"} onToggle={toggle}>
        <p style={{ fontSize: 13, color: MID, lineHeight: 1.6, margin: 0 }}>
          Cada power-up se <b>arma para una jornada</b>, queda <b>fijado al primer saque</b> y solo puedes usar{" "}
          <b>cada uno una vez</b> en todo el Mundial. Guárdalos para el momento perfecto:
        </p>
        <div style={{ display: "grid", gap: 8 }}>
          {POWER_UPS.map((p) => (
            <Card key={p.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>{p.emoji}</span>
                <span style={{ fontSize: 15, fontWeight: 900, color: GOLD2 }}>{p.name}</span>
              </div>
              <p style={{ fontSize: 13, color: MID, lineHeight: 1.6, margin: "6px 0 0" }}>{p.desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* 10 · Fichajes */}
      <Section id="fichajes" icon="🔁" title="Fichajes entre jornadas" lead={`${FREE_TRANSFERS} gratis · cada extra cuesta -${TRANSFER_PENALTY} pts`} open={open === "fichajes"} onToggle={toggle}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Card>
            <div style={{ fontSize: 22, fontWeight: 900, color: GREEN }}>{FREE_TRANSFERS} gratis</div>
            <div style={{ fontSize: 12, color: DIM, marginTop: 2 }}>Cambio libre cada jornada.</div>
          </Card>
          <Card>
            <div style={{ fontSize: 22, fontWeight: 900, color: RED }}>-{TRANSFER_PENALTY} pts</div>
            <div style={{ fontSize: 12, color: DIM, marginTop: 2 }}>Por cada fichaje extra.</div>
          </Card>
        </div>
        <Card>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: MID, margin: 0 }}>
            ¿Necesitas revolucionar el equipo? El power-up <b>♻️ Comodín</b> te da <b>fichajes ilimitados sin
            penalización</b> por una jornada. Úsalo cuando muchos de tus jugadores queden eliminados a la vez.
          </p>
        </Card>
      </Section>

      {/* 11 · Reembolso por eliminación */}
      <Section id="reembolso" icon="💸" title="Reembolso por eliminación" lead="Cuando una selección cae, recuperas valor" open={open === "reembolso"} onToggle={toggle}>
        <Card accent>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: "#dfe6f2", margin: 0 }}>
            Si la selección de un jugador tuyo queda <b>eliminada de verdad</b> (según el cuadro real del Mundial, no
            pronósticos), puedes darlo de baja y recibir un{" "}
            <b style={{ color: GOLD2 }}>reembolso en presupuesto extra</b> para reforzarte. La idea: al salir
            selecciones del mercado, las piezas que siguen vivas suben de valor.
          </p>
        </Card>
        <Card>
          <div style={{ fontSize: 13, color: MID, marginBottom: 8 }}>La fórmula del reembolso:</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: GOLD, textAlign: "center", padding: "6px 0" }}>
            reembolso = máx( {money(ELIM_REFUND_FLOOR)} , {ELIM_REFUND_PER_POINT} × puntos del jugador )
          </div>
          <p style={{ fontSize: 12, color: DIM, lineHeight: 1.6, margin: "8px 0 0" }}>
            Es decir, <b>{ELIM_REFUND_PER_POINT}M € por cada punto REAL</b> que haya acumulado en el torneo, con un
            suelo de <b>{money(ELIM_REFUND_FLOOR)}</b>. Solo se reembolsa <b>una vez por jugador</b>.
          </p>
        </Card>
      </Section>

      {/* 12 · Herramientas */}
      <Section id="herramientas" icon="🧰" title="Tus herramientas" lead="Coach IA, Mercado, Ligas y Logros" open={open === "herramientas"} onToggle={toggle}>
        <div style={{ display: "grid", gap: 8 }}>
          {[
            { e: "🤖", t: "Coach IA", d: "Te sugiere capitán, detecta gangas «Diamante» y arma un once válido en un clic." },
            { e: "📈", t: "Mercado", d: "Estadísticas REALES del torneo (arrancan a 0 y se rellenan partido a partido), precio fijo según valor de mercado, titularidad estimada y ruta proyectada." },
            { e: "🏟️", t: "Ligas", d: "Compite contra amigos y rivales; sube en la clasificación jornada a jornada." },
            { e: "🏅", t: "Logros", d: "Desbloquea hitos por tus decisiones y rachas." },
          ].map((x) => (
            <Card key={x.t}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{x.e}</span>
                <span style={{ fontSize: 14, fontWeight: 800 }}>{x.t}</span>
              </div>
              <p style={{ fontSize: 12, color: DIM, lineHeight: 1.6, margin: "5px 0 0" }}>{x.d}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* 13 · Consejos */}
      <Section id="consejos" icon="🧠" title="5 consejos para empezar fuerte" lead="Trucos de entrenador veterano" open={open === "consejos"} onToggle={toggle}>
        <div style={{ display: "grid", gap: 8 }}>
          {[
            "No gastes todo en estrellas: equilibra tu presupuesto entre las 4 líneas.",
            "Pon de capitán a quien tenga partido fácil Y buen multiplicador Underdog.",
            "Fija jugadores de selecciones que lleguen lejos: puntúan más jornadas.",
            "Guarda los power-ups para una jornada con doble partido o muchos goles esperados.",
            "Vigila la titularidad estimada en el Mercado: un jugador que no salta al campo da 0 puntos (aunque el banquillo te cubre).",
          ].map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "10px 14px", background: BG2, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: GOLD, flexShrink: 0 }}>{i + 1}</span>
              <span style={{ fontSize: 13, color: "#dfe6f2", lineHeight: 1.5 }}>{c}</span>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", padding: "8px 0 4px", fontSize: 13, color: MID }}>
          ¿Listo? Vuelve a <b style={{ color: GOLD2 }}>Mi Equipo</b> y monta tu selección. 🏆
        </div>
      </Section>
    </div>
  );
}
